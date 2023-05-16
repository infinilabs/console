package index_migration

import (
	"errors"
	"fmt"
	"time"

	log "github.com/cihub/seelog"

	"infini.sh/console/model"
	migration_model "infini.sh/console/plugin/migration/model"
	migration_util "infini.sh/console/plugin/migration/util"

	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
)

type processor struct {
	Elasticsearch string
	IndexName     string
	LogIndexName  string
	scheduler     migration_model.Scheduler
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
		// split & schedule pipline tasks
		err = p.handleReadySubTask(t)
	case task.StatusRunning:
		// check pipeline tasks status
		err = p.handleRunningSubTask(t)
	case task.StatusPendingStop:
		// mark pipeline tasks as pending_stop
		err = p.handlePendingStopSubTask(t)
	}
	return err
}

func (p *processor) handlePendingStopSubTask(taskItem *task.Task) error {
	err := migration_util.UpdatePendingChildTasksToPendingStop(taskItem, "pipeline")
	if err != nil {
		log.Errorf("failed to update sub task status, err: %v", err)
		return nil
	}

	tasks, err := migration_util.GetPendingChildTasks(p.Elasticsearch, p.IndexName, taskItem.ID, "pipeline")
	if err != nil {
		log.Errorf("failed to get sub tasks, err: %v", err)
		return nil
	}

	// all subtask stopped or error or complete
	if len(tasks) == 0 {
		taskItem.Status = task.StatusStopped
		p.saveTaskAndWriteLog(taskItem, nil, fmt.Sprintf("index migration task [%s] stopped", taskItem.ID))
	}
	return nil
}

func (p *processor) handleReadySubTask(taskItem *task.Task) error {
	if ok, _ := util.ExtractBool(taskItem.Metadata.Labels["is_split"]); !ok {
		return p.handleSplitSubTask(taskItem)
	}

	return p.handleScheduleSubTask(taskItem)
}

func (p *processor) handleSplitSubTask(taskItem *task.Task) error {
	//split task to scroll/bulk_indexing pipeline and then persistent
	var pids []string
	pids = append(pids, taskItem.ParentId...)
	pids = append(pids, taskItem.ID)
	scrollID := util.GetUUID()
	cfg := migration_model.IndexMigrationTaskConfig{}
	err := migration_util.GetTaskConfig(taskItem, &cfg)
	if err != nil {
		return fmt.Errorf("got wrong config [%v] with task [%s], err: %v", taskItem.ConfigString, taskItem.ID, err)
	}
	sourceClusterID := cfg.Source.ClusterId
	targetClusterID := cfg.Target.ClusterId
	docType := common.GetClusterDocType(targetClusterID)
	if len(taskItem.ParentId) == 0 {
		return fmt.Errorf("got wrong parent id of task [%v]", *taskItem)
	}
	queryDsl := cfg.Source.QueryDSL
	scrollQueryDsl := util.MustToJSON(util.MapStr{
		"query": queryDsl,
	})
	indexName := cfg.Source.Indices
	scrollTask := &task.Task{
		ParentId:    pids,
		Runnable:    true,
		Cancellable: true,
		Metadata: task.Metadata{
			Type: "pipeline",
			Labels: util.MapStr{
				"cluster_id":        sourceClusterID,
				"pipeline_id":       "es_scroll",
				"index_name":        indexName,
				"unique_index_name": taskItem.Metadata.Labels["unique_index_name"],
			},
		},
		Status:     task.StatusInit,
		RetryTimes: taskItem.RetryTimes,
		ConfigString: util.MustToJSON(migration_model.PipelineTaskConfig{
			Name: scrollID,
			Logging: migration_model.PipelineTaskLoggingConfig{
				Enabled: true,
			},
			Labels: util.MapStr{
				"parent_task_id":    pids,
				"unique_index_name": taskItem.Metadata.Labels["unique_index_name"],
			},
			AutoStart:   true,
			KeepRunning: false,
			Processor: []util.MapStr{
				{
					"es_scroll": util.MapStr{
						"remove_type":   docType == "",
						"slice_size":    cfg.Source.SliceSize,
						"batch_size":    cfg.Source.BatchSize,
						"indices":       indexName,
						"elasticsearch": sourceClusterID,
						"queue": util.MapStr{
							"name": scrollID,
							"labels": util.MapStr{
								"migration_task_id": taskItem.ID,
							},
						},
						"partition_size": 1,
						"scroll_time":    cfg.Source.ScrollTime,
						"query_dsl":      scrollQueryDsl,
						"index_rename":   cfg.Source.IndexRename,
						"type_rename":    cfg.Source.TypeRename,
					},
				},
			},
		}),
	}
	scrollTask.ID = scrollID

	bulkID := util.GetUUID()
	bulkTask := &task.Task{
		ParentId:    pids,
		Runnable:    true,
		Cancellable: true,
		Metadata: task.Metadata{
			Type: "pipeline",
			Labels: util.MapStr{
				"cluster_id":        targetClusterID,
				"pipeline_id":       "bulk_indexing",
				"index_name":        indexName,
				"unique_index_name": taskItem.Metadata.Labels["unique_index_name"],
			},
		},
		Status:     task.StatusInit,
		RetryTimes: taskItem.RetryTimes,
		ConfigString: util.MustToJSON(migration_model.PipelineTaskConfig{
			Name: bulkID,
			Logging: migration_model.PipelineTaskLoggingConfig{
				Enabled: true,
			},
			Labels: util.MapStr{
				"parent_task_id":    pids,
				"unique_index_name": taskItem.Metadata.Labels["unique_index_name"],
			},
			AutoStart:   true,
			KeepRunning: false,
			Processor: []util.MapStr{
				{
					"bulk_indexing": util.MapStr{
						"detect_active_queue": false,
						"bulk": util.MapStr{
							"batch_size_in_mb":   cfg.Target.Bulk.BatchSizeInMB,
							"batch_size_in_docs": cfg.Target.Bulk.BatchSizeInDocs,
							"invalid_queue":      "bulk_indexing_400",
							"compress":           cfg.Target.Bulk.Compress,
						},
						"max_worker_size":         cfg.Target.Bulk.MaxWorkerSize,
						"num_of_slices":           cfg.Target.Bulk.SliceSize,
						"idle_timeout_in_seconds": cfg.Target.Bulk.IdleTimeoutInSeconds,
						"elasticsearch":           targetClusterID,
						"queues": util.MapStr{
							"type":              "scroll_docs",
							"migration_task_id": taskItem.ID,
						},
					},
				},
			},
		}),
	}
	bulkTask.ID = bulkID

	err = orm.Create(nil, scrollTask)
	if err != nil {
		return fmt.Errorf("create scroll pipeline task error: %w", err)
	}
	err = orm.Create(nil, bulkTask)
	if err != nil {
		return fmt.Errorf("create bulk_indexing pipeline task error: %w", err)
	}

	taskItem.Metadata.Labels["is_split"] = true
	taskItem.Status = task.StatusReady

	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: true,
	}, fmt.Sprintf("task [%s] splitted", taskItem.ID))
	return nil
}

func (p *processor) handleScheduleSubTask(taskItem *task.Task) error {
	cfg := migration_model.IndexMigrationTaskConfig{}
	err := migration_util.GetTaskConfig(taskItem, &cfg)
	if err != nil {
		log.Errorf("failed to get task config, err: %v", err)
		return fmt.Errorf("got wrong config of task [%s]", taskItem.ID)
	}

	scrollTask, bulkTask, err := p.getScrollBulkPipelineTasks(taskItem)
	if err != nil {
		log.Errorf("failed to get pipeline tasks, err: %v", err)
		return nil
	}
	if scrollTask == nil || bulkTask == nil {
		// ES might not synced yet
		log.Warnf("task [%s] es_scroll or bulk_indexing pipeline task not found", taskItem.ID)
		return nil
	}

	taskItem.RetryTimes++

	instanceID, _ := util.ExtractString(taskItem.Metadata.Labels["execution_instance_id"])
	totalDocs := cfg.Source.DocCount
	scrolled, _, err := p.checkScrollPipelineTaskStatus(scrollTask, totalDocs)

	redoScroll := true
	if cfg.Version >= migration_model.IndexMigrationV1 {
		// skip scroll if possible
		if scrolled && err == nil {
			redoScroll = false
			// reset queue consumer offset
			// NOTE: we only trigger this flow when restart index_migration
			// Restart bulk task will not reset queue offset
			err = p.resetGatewayQueue(taskItem)
			if err != nil {
				log.Infof("task [%s] failed to reset gateway queue, redo scroll", taskItem.ID)
				redoScroll = true
			}
		}
	}
	if !redoScroll {
		migration_util.WriteLog(taskItem, nil, fmt.Sprintf("task [%s] skiping scroll", taskItem.ID))
	} else {
		var executionConfig migration_model.ExecutionConfig
		if cfg.Version >= migration_model.IndexMigrationV1 {
			executionConfig = cfg.Execution
		} else {
			executionConfig, err = p.getExecutionConfigFromMajorTask(taskItem)
			if err != nil {
				return fmt.Errorf("get execution config from parent task failed, err: %v", err)
			}
		}

		// get a new instanceID
		instance, err := p.scheduler.GetPreferenceInstance(executionConfig)
		if err != nil {
			if err == migration_model.ErrHitMax {
				log.Debug("hit max tasks per instance, skip dispatch")
				return nil

			}
			return fmt.Errorf("get preference intance error: %w", err)
		}
		instanceID = instance.ID

		scrollTask.RetryTimes = taskItem.RetryTimes
		// update instance info first
		scrollTask.Metadata.Labels["execution_instance_id"] = instanceID
		// try to clear disk queue before running es_scroll
		p.cleanGatewayQueue(taskItem)
		// update scroll task to ready
		scrollTask.Status = task.StatusReady
		err = orm.Update(nil, scrollTask)
		if err != nil {
			return fmt.Errorf("update scroll pipeline task error: %w", err)
		}
	}

	// update bulk task to init
	bulkTask.RetryTimes = taskItem.RetryTimes
	bulkTask.Metadata.Labels["execution_instance_id"] = instanceID
	bulkTask.Status = task.StatusInit
	err = orm.Update(nil, bulkTask)
	if err != nil {
		return fmt.Errorf("update bulk_indexing pipeline task error: %w", err)
	}

	// update sub migration task status to running and save task log
	taskItem.Metadata.Labels["execution_instance_id"] = instanceID
	taskItem.Metadata.Labels["index_docs"] = 0
	taskItem.Metadata.Labels["scrolled_docs"] = 0
	taskItem.Status = task.StatusRunning
	taskItem.StartTimeInMillis = time.Now().UnixMilli()

	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: true,
	}, fmt.Sprintf("task [%s] started", taskItem.ID))
	// update dispatcher state
	p.scheduler.IncrInstanceJobs(instanceID)
	return nil
}

func (p *processor) handleRunningSubTask(taskItem *task.Task) error {
	cfg := migration_model.IndexMigrationTaskConfig{}
	err := migration_util.GetTaskConfig(taskItem, &cfg)
	if err != nil {
		log.Errorf("failed to get task config, err: %v", err)
		return fmt.Errorf("got wrong config of task [%s]", taskItem.ID)
	}
	totalDocs := cfg.Source.DocCount
	instanceID, _ := util.ExtractString(taskItem.Metadata.Labels["execution_instance_id"])

	if totalDocs == 0 {
		taskItem.Status = task.StatusComplete
		taskItem.Metadata.Labels["scrolled_docs"] = 0
		taskItem.Metadata.Labels["index_docs"] = 0
		now := time.Now()
		taskItem.CompletedTime = &now

		p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
			Success: true,
		}, "empty index migration completed")
		p.cleanGatewayQueue(taskItem)
		p.scheduler.DecrInstanceJobs(instanceID)
		return nil
	}

	scrollTask, bulkTask, err := p.getScrollBulkPipelineTasks(taskItem)
	if err != nil {
		log.Errorf("failed to get pipeline tasks, err: %v", err)
		return nil
	}
	if scrollTask == nil || bulkTask == nil {
		return errors.New("scroll/bulk pipeline task missing")
	}

	scrolled, scrolledDocs, err := p.checkScrollPipelineTaskStatus(scrollTask, totalDocs)
	if !scrolled {
		return nil
	}
	if err != nil {
		now := time.Now()
		taskItem.CompletedTime = &now
		taskItem.Status = task.StatusError
		p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
			Success: false,
			Error:   err.Error(),
		}, "index scroll failed")
		p.scheduler.DecrInstanceJobs(instanceID)
		// clean disk queue if scroll failed
		p.cleanGatewayQueue(taskItem)
		return nil
	}

	if migration_util.GetMapIntValue(util.MapStr(taskItem.Metadata.Labels), "scrolled_docs") == 0 {
		taskItem.Metadata.Labels["scrolled_docs"] = scrolledDocs
		p.saveTaskAndWriteLog(taskItem, nil, "")
	}

	bulked, successDocs, err := p.checkBulkPipelineTaskStatus(bulkTask, totalDocs)
	if !bulked {
		return nil
	}
	now := time.Now()
	taskItem.CompletedTime = &now
	taskItem.Metadata.Labels["scrolled_docs"] = scrolledDocs
	taskItem.Metadata.Labels["index_docs"] = successDocs
	if err != nil {
		taskItem.Status = task.StatusError
		p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
			Success: false,
			Error:   err.Error(),
		}, "index bulk failed")
	} else {
		taskItem.Status = task.StatusComplete
		p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
			Success: true,
		}, "index migration completed")
		// clean disk queue if bulk completed
		p.cleanGatewayQueue(taskItem)
	}
	p.scheduler.DecrInstanceJobs(instanceID)
	return nil
}

func (p *processor) checkScrollPipelineTaskStatus(scrollTask *task.Task, totalDocs int64) (scrolled bool, scrolledDocs int64, err error) {
	if scrollTask.Status == task.StatusError {
		return true, 0, errors.New("scroll pipeline failed")
	}
	// NOTE: old-version pipeline tasks has empty status
	if scrollTask.Status == "" {
		return true, 0, errors.New("task was started by an old-version console, need to manually restart it")
	}

	// scroll not finished yet
	if scrollTask.Status != task.StatusComplete {
		return false, 0, nil
	}

	var (
		scrollLabels = util.MapStr(scrollTask.Metadata.Labels)
	)
	scrolledDocs = migration_util.GetMapIntValue(scrollLabels, "scrolled_docs")

	if scrolledDocs != totalDocs {
		return true, scrolledDocs, fmt.Errorf("scroll complete but docs count unmatch: %d / %d", scrolledDocs, totalDocs)
	}

	return true, scrolledDocs, nil
}

func (p *processor) checkBulkPipelineTaskStatus(bulkTask *task.Task, totalDocs int64) (bulked bool, successDocs int64, err error) {
	// NOTE: old-version pipeline tasks has empty status
	if bulkTask.Status == "" {
		return true, 0, errors.New("task was started by an old-version console, need to manually restart it")
	}

	// start bulk as needed
	if bulkTask.Status == task.StatusInit {
		bulkTask.Status = task.StatusReady
		p.saveTaskAndWriteLog(bulkTask, &task.TaskResult{
			Success: true,
		}, fmt.Sprintf("scroll completed, bulk pipeline started"))
		return false, 0, nil
	}

	// bulk not finished yet
	if bulkTask.Status != task.StatusComplete && bulkTask.Status != task.StatusError {
		return false, 0, nil
	}

	var (
		bulkLabels     = util.MapStr(bulkTask.Metadata.Labels)
		invalidDocs    = migration_util.GetMapStringValue(bulkLabels, "invalid_docs")
		invalidReasons = migration_util.GetMapStringValue(bulkLabels, "invalid_reasons")
		failureDocs    = migration_util.GetMapStringValue(bulkLabels, "failure_docs")
		failureReasons = migration_util.GetMapStringValue(bulkLabels, "failure_reasons")
	)
	successDocs = migration_util.GetMapIntValue(bulkLabels, "success_docs")

	if successDocs != totalDocs {
		return true, successDocs, fmt.Errorf("bulk complete but docs count unmatch: %d / %d, invalid docs: [%s] (reasons: [%s]), failure docs: [%s] (reasons: [%s])", successDocs, totalDocs, invalidDocs, invalidReasons, failureDocs, failureReasons)
	}

	// successDocs matched but has errors
	if bulkTask.Status == task.StatusError {
		return true, successDocs, nil
	}

	return true, successDocs, nil
}

func (p *processor) getExecutionConfigFromMajorTask(taskItem *task.Task) (config migration_model.ExecutionConfig, err error) {
	majorTaskID := taskItem.ParentId[0]
	majorTask := task.Task{}
	majorTask.ID = majorTaskID
	_, err = orm.Get(&majorTask)
	if err != nil {
		log.Errorf("failed to get major task, err: %v", err)
		return
	}
	cfg := migration_model.ClusterMigrationTaskConfig{}
	err = migration_util.GetTaskConfig(&majorTask, &cfg)
	if err != nil {
		log.Errorf("failed to get task config, err: %v", err)
		return
	}
	config = cfg.Settings.Execution
	return
}

func (p *processor) getScrollBulkPipelineTasks(taskItem *task.Task) (scrollTask *task.Task, bulkTask *task.Task, err error) {
	ptasks, err := p.getPipelineTasks(taskItem.ID)
	if err != nil {
		log.Errorf("failed to get pipeline tasks, err: %v", err)
		return
	}
	for i, ptask := range ptasks {
		if ptask.Metadata.Labels["pipeline_id"] == "bulk_indexing" {
			bulkTask = &ptasks[i]
		} else if ptask.Metadata.Labels["pipeline_id"] == "es_scroll" {
			scrollTask = &ptasks[i]
		}
	}
	return
}

func (p *processor) getPipelineTasks(subTaskID string) ([]task.Task, error) {
	queryDsl := util.MapStr{
		"size": 2,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"parent_id": util.MapStr{
								"value": subTaskID,
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.type": util.MapStr{
								"value": "pipeline",
							},
						},
					},
				},
			},
		},
	}
	return migration_util.GetTasks(p.Elasticsearch, p.IndexName, queryDsl)
}

func (p *processor) cleanGatewayQueue(taskItem *task.Task) {
	log.Debugf("cleaning gateway queue for task [%s]", taskItem.ID)

	var err error
	instance := model.Instance{}
	instance.ID, _ = util.ExtractString(taskItem.Metadata.Labels["execution_instance_id"])
	if instance.ID == "" {
		log.Debugf("task [%s] not scheduled yet, skip cleaning queue", taskItem.ID)
		return
	}
	_, err = orm.Get(&instance)
	if err != nil {
		log.Errorf("failed to get instance, err: %v", err)
		return
	}

	selector := util.MapStr{
		"labels": util.MapStr{
			"migration_task_id": taskItem.ID,
		},
	}
	err = instance.DeleteQueueBySelector(selector)
	if err != nil {
		log.Errorf("failed to delete queue, err: %v", err)
	}
}

func (p *processor) resetGatewayQueue(taskItem *task.Task) error {
	log.Debugf("resetting gateway queue offset for task [%s]", taskItem.ID)

	var err error
	instance := model.Instance{}
	instance.ID, _ = util.ExtractString(taskItem.Metadata.Labels["execution_instance_id"])
	_, err = orm.Get(&instance)
	if err != nil {
		log.Errorf("failed to get instance, err: %v", err)
		return err
	}

	selector := util.MapStr{
		"labels": util.MapStr{
			"migration_task_id": taskItem.ID,
		},
	}
	err = instance.DeleteQueueConsumersBySelector(selector)
	if err != nil {
		log.Errorf("failed to delete queue consumers, err: %v", err)
		return err
	}

	return nil
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
