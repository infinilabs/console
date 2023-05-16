package pipeline_task

import (
	"errors"
	"fmt"
	"strconv"
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

	cfg := migration_model.PipelineTaskConfig{}
	err = migration_util.GetTaskConfig(taskItem, &cfg)
	if err != nil {
		log.Errorf("failed to get task config, err: %v", err)
		return err
	}

	err = p.fillDynamicESConfig(taskItem, &cfg)
	if err != nil {
		log.Errorf("failed to update task config, err: %v", err)
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
	}, fmt.Sprintf("[%v] pipeline task [%s] started", taskItem.Metadata.Labels["pipeline_id"], taskItem.ID))

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
	}, fmt.Sprintf("[es_scroll] pipeline task [%s] completed", taskItem.ID))
	p.cleanGatewayPipeline(taskItem)
	return nil
}

func (p *processor) handleRunningBulkIndexingPipelineTask(taskItem *task.Task) error {
	successDocs, indexDocs, bulked, totalInvalidDocs, totalInvalidReasons, totalFailureDocs, totalFailureReasons, errs := p.getBulkIndexingTaskState(taskItem)
	if !bulked {
		return nil
	}

	var errMsg string
	if len(errs) > 0 {
		errMsg = fmt.Sprintf("bulk finished with error(s): %v", errs)
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
	}, fmt.Sprintf("[bulk_indexing] pipeline task [%s] completed", taskItem.ID))
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

	// we only check STOPPED log after the last task status update
	hits, err := p.getPipelineLogs(taskItem, []string{"STOPPED"}, taskItem.Updated.UnixMilli())
	if err != nil {
		log.Errorf("failed to get pipeline logs for task [%s], err: %v", taskItem.ID, err)
		return nil
	}

	stopped := len(hits) > 0

	if stopped {
		taskItem.Status = task.StatusStopped
		p.saveTaskAndWriteLog(taskItem, nil, fmt.Sprintf("[%v] task [%s] stopped", taskItem.Metadata.Labels["pipeline_id"], taskItem.ID))
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
		if strings.Contains(err.Error(), "task not found") {
			taskItem.Status = task.StatusStopped
			p.saveTaskAndWriteLog(taskItem, nil, fmt.Sprintf("[%v] task [%s] not found on remote node, mark as stopped", taskItem.Metadata.Labels["pipeline_id"], taskItem.ID))
			p.cleanGatewayPipeline(taskItem)
			return nil
		}
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
	hits, err := p.getPipelineLogs(taskItem, []string{"FINISHED", "FAILED"}, taskItem.Updated.UnixMilli())
	if err != nil {
		log.Errorf("failed to get pipeline logs for task [%s], err: %v", taskItem.ID, err)
		err = nil
		return
	}
	if len(hits) == 0 {
		log.Debugf("scroll task [%s] not finished yet since last start", taskItem.ID)
		return
	}
	// NOTE: we only check the last run of es_scroll
	for _, m := range hits {
		scrolled = true

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

func (p *processor) getBulkIndexingTaskState(taskItem *task.Task) (successDocs int64, indexDocs int64, bulked bool, totalInvalidDocs []string, totalInvalidReasons []string, totalFailureDocs []string, totalFailureReasons []string, errs []string) {
	newHits, err := p.getPipelineLogs(taskItem, []string{"FINISHED", "FAILED"}, taskItem.Updated.UnixMilli())
	if err != nil {
		log.Errorf("failed to get latest pipeline logs for task [%s], err: %v", taskItem.ID, err)
		return
	}
	if len(newHits) == 0 {
		log.Debugf("bulk task [%s] not finished yet since last start", taskItem.ID)
		return
	}

	hits, err := p.getPipelineLogs(taskItem, []string{"FINISHED", "FAILED"}, 0)
	if err != nil {
		log.Errorf("failed to get all pipeline logs for task [%s], err: %v", taskItem.ID, err)
		return
	}

	for _, m := range hits {
		bulked = true

		errStr := migration_util.GetMapStringValue(m, "payload.pipeline.logging.result.error")
		if errStr != "" {
			errs = append(errs, errStr)
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

func (p *processor) getPipelineLogs(taskItem *task.Task, status []string, timestampGte int64) ([]util.MapStr, error) {
	query := util.MapStr{
		"size": 999,
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
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"gte": timestampGte,
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
	var ret []util.MapStr
	dups := map[string]struct{}{}
	for _, hit := range res.Hits.Hits {
		m := util.MapStr(hit.Source)
		ctxID := migration_util.GetMapStringValue(m, "metadata.labels.context_id")
		step := migration_util.GetMapIntValue(m, "payload.pipeline.logging.steps")
		// NOTE: gateway <= 1.13.0 will not generate context_id, skip duplicate checks
		if ctxID != "" {
			dupKey := ctxID + "-" + strconv.Itoa(int(step))
			if _, ok := dups[dupKey]; ok {
				continue
			}
			dups[dupKey] = struct{}{}
		}
		ret = append(ret, m)
	}
	return ret, nil
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

// TODO: remove after implementing dynamic register elasticsearch configs at gateway
func (p *processor) fillDynamicESConfig(taskItem *task.Task, pipelineTaskConfig *migration_model.PipelineTaskConfig) error {
	for _, p := range pipelineTaskConfig.Processor {
		for k, v := range p {
			v, ok := v.(map[string]interface{})
			if !ok {
				return errors.New("invalid processor config")
			}
			processorConfig := util.MapStr(v)
			if k == "bulk_indexing" || k == "es_scroll" {
				elasticsearchID := migration_util.GetMapStringValue(processorConfig, "elasticsearch")
				if elasticsearchID == "" {
					return fmt.Errorf("invalid task config found for task [%s]", taskItem.ID)
				}
				esConfig := elastic.GetConfigNoPanic(elasticsearchID)
				if esConfig == nil {
					return fmt.Errorf("can't load elasticsearch config of [%s] for task task [%s]", elasticsearchID, taskItem.ID)
				}
				processorConfig["elasticsearch_config"] = util.MapStr{
					"name":       elasticsearchID,
					"enabled":    true,
					"endpoint":   esConfig.Endpoint,
					"basic_auth": esConfig.BasicAuth,
				}
			}
		}
	}
	return nil
}
