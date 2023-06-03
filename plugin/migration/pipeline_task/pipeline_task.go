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
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

type processor struct {
	Elasticsearch string
	IndexName     string
	LogIndexName  string

	scheduler migration_model.Scheduler
}

func NewProcessor(elasticsearch, indexName, logIndexName string, scheduler migration_model.Scheduler) migration_model.Processor {
	return &processor{
		Elasticsearch: elasticsearch,
		IndexName:     indexName,
		LogIndexName:  logIndexName,
		scheduler:     scheduler,
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
	case "dump_hash":
	case "index_diff":
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

	switch taskItem.Metadata.Labels["pipeline_id"] {
	case "es_scroll":
		p.clearEsScrollLabels(taskItem.Metadata.Labels)
	case "bulk_indexing":
		p.clearBulkIndexLabels(taskItem.Metadata.Labels)
	case "dump_hash":
		p.clearDumpHashLabels(taskItem.Metadata.Labels)
	case "index_diff":
		p.clearIndexDiffLabels(taskItem.Metadata.Labels)
	}

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
	case "dump_hash":
		return p.handleRunningDumpHashPipelineTask(taskItem)
	case "index_diff":
		return p.handleRunningIndexDiffPipelineTask(taskItem)
	default:
		return fmt.Errorf("task [%s] has unknown pipeline_id [%s]", taskItem.ID, taskItem.Metadata.Labels["pipeline_id"])
	}
	return nil
}

func (p *processor) handlePendingStopPipelineTask(taskItem *task.Task) error {
	switch taskItem.Metadata.Labels["pipeline_id"] {
	case "es_scroll":
	case "bulk_indexing":
	case "dump_hash":
	case "index_diff":
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

func (p *processor) cleanGatewayPipeline(taskItem *task.Task) (instance *model.Instance, err error) {
	instance, err = p.getPipelineExecutionInstance(taskItem)
	if err != nil {
		log.Errorf("failed to get execution instance for task [%s], err: %v", taskItem.ID, err)
		return
	}
	err = instance.DeletePipeline(taskItem.ID)
	if err != nil && !strings.Contains(err.Error(), "task not found") {
		log.Errorf("delete pipeline failed, err: %v", err)
		return
	}

	return instance, nil
}

func (p *processor) getPipelineExecutionInstance(taskItem *task.Task) (*model.Instance, error) {
	instanceID, _ := util.ExtractString(taskItem.Metadata.Labels["execution_instance_id"])
	instance, err := p.scheduler.GetInstance(instanceID)
	if err != nil {
		return nil, err
	}
	return instance, nil
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
			if k == "bulk_indexing" || k == "es_scroll" || k == "dump_hash" {
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
