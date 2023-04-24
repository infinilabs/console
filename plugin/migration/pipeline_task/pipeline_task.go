package pipeline_task

import (
	"errors"
	"fmt"
	"strings"
	"time"

	log "github.com/cihub/seelog"

	"infini.sh/console/model"
	migration_model "infini.sh/console/plugin/migration/model"
	migration_util "infini.sh/console/plugin/migration/util"

	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

type processor struct {
	Elasticsearch string
	IndexName     string
	LogIndexName  string
}

func NewProcessor(elasticsearch, indexName, logIndexName string) migration_model.Processor {
	return &processor{
		Elasticsearch: elasticsearch,
		IndexName:     indexName,
		LogIndexName:  logIndexName,
	}
}

func (p *processor) Process(t *task.Task) (err error) {
	switch t.Status {
	case task.StatusReady:
		// schedule pipeline task & create pipeline
		err = p.handleReadyPipelineTask(t)
	case task.StatusRunning:
		// check pipeline log
		err = p.handleRunningPipelineTask(t)
	case task.StatusPendingStop:
		// stop pipeline
		err = p.handlePendingStopPipelineTask(t)
	}
	return err
}

func (p *processor) handleReadyPipelineTask(taskItem *task.Task) error {
	switch taskItem.Metadata.Labels["pipeline_id"] {
	case "es_scroll":
	case "bulk_indexing":
	default:
		return fmt.Errorf("task [%s] has unknown pipeline_id [%s]", taskItem.ID, taskItem.Metadata.Labels["pipeline_id"])
	}

	instance, err := p.cleanGatewayPipeline(taskItem)
	if err != nil {
		log.Errorf("failed to prepare instance before running pipeline, err: %v", err)
		return nil
	}

	taskItem.RetryTimes++

	cfg := migration_model.PipelineTaskConfig{}
	err = migration_util.GetTaskConfig(taskItem, &cfg)
	if err != nil {
		log.Errorf("failed to get task config, err: %v", err)
		return err
	}

	cfg.Labels["retry_times"] = taskItem.RetryTimes

	// call instance api to create pipeline task
	err = instance.CreatePipeline(util.MustToJSONBytes(cfg))
	if err != nil {
		log.Errorf("create pipeline task [%s] failed, err: %+v", taskItem.ID, err)
		return err
	}

	// TODO: find a better way to handle this
	taskItem.Metadata.Labels["index_docs"] = 0
	taskItem.Metadata.Labels["success_docs"] = 0
	taskItem.Metadata.Labels["invalid_docs"] = ""
	taskItem.Metadata.Labels["invalid_reasons"] = ""
	taskItem.Metadata.Labels["failure_docs"] = ""
	taskItem.Metadata.Labels["failure_reasons"] = ""
	taskItem.Metadata.Labels["scrolled_docs"] = 0

	taskItem.Status = task.StatusRunning
	taskItem.StartTimeInMillis = time.Now().UnixMilli()
	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: true,
	}, fmt.Sprintf("pipeline task [%s] started", taskItem.ID))

	return nil
}

func (p *processor) handleRunningPipelineTask(taskItem *task.Task) error {
	switch taskItem.Metadata.Labels["pipeline_id"] {
	case "es_scroll":
		return p.handleRunningEsScrollPipelineTask(taskItem)
	case "bulk_indexing":
		return p.handleRunningBulkIndexingPipelineTask(taskItem)
	default:
		return fmt.Errorf("task [%s] has unknown pipeline_id [%s]", taskItem.ID, taskItem.Metadata.Labels["pipeline_id"])
	}
	return nil
}

func (p *processor) handleRunningEsScrollPipelineTask(taskItem *task.Task) error {
	scrolledDocs, totalHits, scrolled, err := p.getEsScrollTaskState(taskItem)

	if !scrolled {
		return nil
	}

	var errMsg string
	if err != nil {
		errMsg = err.Error()
	}
	if errMsg == "" {
		if scrolledDocs < totalHits {
			errMsg = fmt.Sprintf("scrolled finished but docs count unmatch: %d / %d", scrolledDocs, totalHits)
		}
	}

	now := time.Now()
	taskItem.CompletedTime = &now
	taskItem.Metadata.Labels["scrolled_docs"] = scrolledDocs
	if errMsg != "" {
		taskItem.Status = task.StatusError
	} else {
		taskItem.Status = task.StatusComplete
	}

	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: errMsg == "",
		Error:   errMsg,
	}, fmt.Sprintf("pipeline task [%s] completed", taskItem.ID))
	p.cleanGatewayPipeline(taskItem)
	return nil
}

func (p *processor) handleRunningBulkIndexingPipelineTask(taskItem *task.Task) error {
	successDocs, indexDocs, bulked, totalInvalidDocs, totalInvalidReasons, totalFailureDocs, totalFailureReasons, err := p.getBulkIndexingTaskState(taskItem)
	if !bulked {
		return nil
	}

	var errMsg string
	if err != nil {
		errMsg = err.Error()
	}
	// TODO: handle multiple run bulk_indexing pipeline tasks and total_docs from index_migration
	now := time.Now()
	taskItem.CompletedTime = &now
	taskItem.Metadata.Labels["index_docs"] = indexDocs
	taskItem.Metadata.Labels["success_docs"] = successDocs
	taskItem.Metadata.Labels["invalid_docs"] = strings.Join(totalInvalidDocs, ",")
	taskItem.Metadata.Labels["invalid_reasons"] = strings.Join(totalInvalidReasons, ",")
	taskItem.Metadata.Labels["failure_docs"] = strings.Join(totalFailureDocs, ",")
	taskItem.Metadata.Labels["failure_reasons"] = strings.Join(totalFailureReasons, ",")
	if errMsg != "" {
		taskItem.Status = task.StatusError
	} else {
		taskItem.Status = task.StatusComplete
	}

	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: errMsg == "",
		Error:   errMsg,
	}, fmt.Sprintf("pipeline task [%s] completed", taskItem.ID))
	p.cleanGatewayPipeline(taskItem)
	return nil
}

func (p *processor) handlePendingStopPipelineTask(taskItem *task.Task) error {
	switch taskItem.Metadata.Labels["pipeline_id"] {
	case "es_scroll":
	case "bulk_indexing":
	default:
		return fmt.Errorf("task [%s] has unknown pipeline_id [%s]", taskItem.ID, taskItem.Metadata.Labels["pipeline_id"])
	}

	hits, err := p.getPipelineLogs(taskItem, []string{"STOPPED"})
	if err != nil {
		log.Errorf("failed to get pipeline logs for task [%s], err: %v", taskItem.ID, err)
		return nil
	}

	stopped := len(hits) > 0

	if stopped {
		taskItem.Status = task.StatusStopped
		p.saveTaskAndWriteLog(taskItem, nil, fmt.Sprintf("task [%s] stopped", taskItem.ID))
		p.cleanGatewayPipeline(taskItem)
		return nil
	}

	instance, err := p.getPipelineExecutionInstance(taskItem)
	if err != nil {
		log.Errorf("failed to get execution instance for task [%s], err: %v", taskItem.ID, err)
		return nil
	}

	err = instance.StopPipelineWithTimeout(taskItem.ID, time.Second)
	if err != nil {
		log.Errorf("failed to stop pipeline, err: %v", err)
	}
	return nil
}

func (p *processor) cleanGatewayPipeline(taskItem *task.Task) (instance model.Instance, err error) {
	instance, err = p.getPipelineExecutionInstance(taskItem)
	if err != nil {
		return
	}
	err = instance.DeletePipeline(taskItem.ID)
	if err != nil && !strings.Contains(err.Error(), "task not found") {
		log.Errorf("delete pipeline failed, err: %v", err)
		return
	}

	return instance, nil
}

func (p *processor) getPipelineExecutionInstance(taskItem *task.Task) (instance model.Instance, err error) {
	parentTask, err := p.getParentTask(taskItem, "index_migration")
	if err != nil {
		return
	}
	// Use sub task's execution instance
	instanceID := parentTask.Metadata.Labels["execution_instance_id"]
	instance.ID, _ = util.ExtractString(instanceID)
	_, err = orm.Get(&instance)
	if err != nil {
		log.Errorf("failed to get instance, err: %v", err)
		return
	}
	return
}

func (p *processor) getParentTask(taskItem *task.Task, taskType string) (*task.Task, error) {
	queryDsl := util.MapStr{
		"size": 1,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"terms": util.MapStr{
							"_id": taskItem.ParentId,
						},
					},
					{
						"term": util.MapStr{
							"metadata.type": taskType,
						},
					},
				},
			},
		},
	}

	esClient := elastic.GetClient(p.Elasticsearch)
	res, err := esClient.SearchWithRawQueryDSL(p.IndexName, util.MustToJSONBytes(queryDsl))
	if err != nil {
		log.Errorf("query tasks from es failed, err: %v", err)
		return nil, err
	}
	if res.GetTotal() == 0 {
		return nil, errors.New("no parent task found")
	}
	for _, hit := range res.Hits.Hits {
		buf, err := util.ToJSONBytes(hit.Source)
		if err != nil {
			log.Errorf("marshal task json failed, err: %v", err)
			return nil, err
		}
		tk := task.Task{}
		err = util.FromJSONBytes(buf, &tk)
		if err != nil {
			log.Errorf("unmarshal task json failed, err: %v", err)
			return nil, err
		}
		return &tk, nil
	}
	return nil, errors.New("not reachable")
}

func (p *processor) getEsScrollTaskState(taskItem *task.Task) (scrolledDocs int64, totalHits int64, scrolled bool, err error) {
	hits, err := p.getPipelineLogs(taskItem, []string{"FINISHED", "FAILED"})
	if err != nil {
		log.Errorf("failed to get pipeline logs for task [%s], err: %v", taskItem.ID, err)
		err = nil
		return
	}
	for _, hit := range hits {
		scrolled = true
		m := util.MapStr(hit.Source)

		errStr := migration_util.GetMapStringValue(m, "payload.pipeline.logging.result.error")
		if errStr != "" {
			err = errors.New(errStr)
			return
		}

		var (
			scroll = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.es_scroll.scrolled_docs")
			total  = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.es_scroll.total_hits")
		)

		scrolledDocs += scroll
		totalHits += total
	}
	return
}

func (p *processor) getBulkIndexingTaskState(taskItem *task.Task) (successDocs int64, indexDocs int64, bulked bool, totalInvalidDocs []string, totalInvalidReasons []string, totalFailureDocs []string, totalFailureReasons []string, err error) {
	hits, err := p.getPipelineLogs(taskItem, []string{"FINISHED", "FAILED"})
	if err != nil {
		log.Errorf("failed to get pipeline logs for task [%s], err: %v", taskItem.ID, err)
		err = nil
		return
	}

	for _, hit := range hits {
		bulked = true
		m := util.MapStr(hit.Source)

		errStr := migration_util.GetMapStringValue(m, "payload.pipeline.logging.result.error")
		if errStr != "" {
			err = errors.New(errStr)
			return
		}

		var (
			success = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.bulk_indexing.success.count")
			failure = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.bulk_indexing.failure.count")
			invalid = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.bulk_indexing.invalid.count")
		)
		successDocs += success
		indexDocs += success + invalid + failure

		var (
			invalidDocs    = migration_util.GetMapStringSliceValue(m, "payload.pipeline.logging.context.bulk_indexing.detail.invalid.documents")
			invalidReasons = migration_util.GetMapStringSliceValue(m, "payload.pipeline.logging.context.bulk_indexing.detail.invalid.reasons")
			failureDocs    = migration_util.GetMapStringSliceValue(m, "payload.pipeline.logging.context.bulk_indexing.detail.failure.documents")
			failureReasons = migration_util.GetMapStringSliceValue(m, "payload.pipeline.logging.context.bulk_indexing.detail.failure.reasons")
		)
		totalInvalidDocs = append(totalInvalidDocs, invalidDocs...)
		totalInvalidReasons = append(invalidReasons, invalidReasons...)
		totalFailureDocs = append(totalFailureDocs, failureDocs...)
		totalFailureReasons = append(totalFailureReasons, failureReasons...)
	}
	return
}

func (p *processor) getPipelineLogs(taskItem *task.Task, status []string) ([]elastic.IndexDocument, error) {
	query := util.MapStr{
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
			{
				"payload.pipeline.logging.steps": util.MapStr{
					"order": "desc",
				},
			},
		},
		"collapse": util.MapStr{
			"field": "metadata.labels.task_id",
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.task_id": taskItem.ID,
						},
					},
					{
						"terms": util.MapStr{
							"payload.pipeline.logging.status": status,
						},
					},
					{
						"range": util.MapStr{
							"metadata.labels.retry_times": util.MapStr{
								"gte": taskItem.RetryTimes,
							},
						},
					},
				},
			},
		},
	}
	esClient := elastic.GetClient(p.Elasticsearch)
	res, err := esClient.SearchWithRawQueryDSL(p.LogIndexName, util.MustToJSONBytes(query))
	if err != nil {
		log.Errorf("search task log from es failed, err: %v", err)
		return nil, err
	}
	return res.Hits.Hits, nil
}

func (p *processor) saveTaskAndWriteLog(taskItem *task.Task, taskResult *task.TaskResult, message string) {
	esClient := elastic.GetClient(p.Elasticsearch)
	_, err := esClient.Index(p.IndexName, "", taskItem.ID, taskItem, "")
	if err != nil {
		log.Errorf("failed to update task, err: %v", err)
	}
	if message != "" {
		migration_util.WriteLog(taskItem, taskResult, message)
	}
}
