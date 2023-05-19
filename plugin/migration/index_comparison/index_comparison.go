package index_comparison

import (
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
)

type processor struct {
	Elasticsearch string
	IndexName     string
	scheduler     migration_model.Scheduler
}

func NewProcessor(elasticsearch, indexName string, scheduler migration_model.Scheduler) migration_model.Processor {
	return &processor{
		Elasticsearch: elasticsearch,
		IndexName:     indexName,
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

func (p *processor) handleReadySubTask(taskItem *task.Task) error {
	if ok, _ := util.ExtractBool(taskItem.Metadata.Labels["is_split"]); !ok {
		return p.handleSplitSubTask(taskItem)
	}

	return p.handleScheduleSubTask(taskItem)
}

// split task to two dump_hash and on index_diff pipeline and then persistent
func (p *processor) handleSplitSubTask(taskItem *task.Task) error {
	cfg := migration_model.IndexComparisonTaskConfig{}
	err := migration_util.GetTaskConfig(taskItem, &cfg)
	if err != nil {
		return fmt.Errorf("got wrong config [%v] with task [%s], err: %v", taskItem.ConfigString, taskItem.ID, err)
	}

	if len(taskItem.ParentId) == 0 {
		return fmt.Errorf("got wrong parent id of task [%v]", *taskItem)
	}

	var pids []string
	pids = append(pids, taskItem.ParentId...)
	pids = append(pids, taskItem.ID)
	sourceClusterID := cfg.Source.ClusterId
	targetClusterID := cfg.Target.ClusterId

	sourceDumpID := util.GetUUID()
	sourceDumpTask := &task.Task{
		ParentId:    pids,
		Runnable:    true,
		Cancellable: true,
		Metadata: task.Metadata{
			Type: "pipeline",
			Labels: util.MapStr{
				"cluster_id":        sourceClusterID,
				"pipeline_id":       "dump_hash",
				"index_name":        cfg.Source.Indices,
				"unique_index_name": taskItem.Metadata.Labels["unique_index_name"],
			},
		},
		Status:     task.StatusInit,
		RetryTimes: taskItem.RetryTimes,
		ConfigString: util.MustToJSON(migration_model.PipelineTaskConfig{
			Name: sourceDumpID,
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
					"dump_hash": util.MapStr{
						"slice_size":      cfg.Source.SliceSize,
						"batch_size":      cfg.Source.BatchSize,
						"indices":         cfg.Source.Indices,
						"elasticsearch":   sourceClusterID,
						"output_queue":    sourceDumpID,
						"clean_old_files": true,
						"partition_size":  cfg.Source.PartitionSize,
						"scroll_time":     cfg.Source.ScrollTime,
						"query_dsl": util.MustToJSON(util.MapStr{
							"query": cfg.Source.QueryDSL,
						}),
					},
				},
			},
		}),
	}
	sourceDumpTask.ID = sourceDumpID

	targetDumpID := util.GetUUID()
	targetDumpTask := &task.Task{
		ParentId:    pids,
		Runnable:    true,
		Cancellable: true,
		Metadata: task.Metadata{
			Type: "pipeline",
			Labels: util.MapStr{
				"cluster_id":        targetClusterID,
				"pipeline_id":       "dump_hash",
				"index_name":        cfg.Target.Indices,
				"unique_index_name": taskItem.Metadata.Labels["unique_index_name"],
			},
		},
		Status:     task.StatusInit,
		RetryTimes: taskItem.RetryTimes,
		ConfigString: util.MustToJSON(migration_model.PipelineTaskConfig{
			Name: targetDumpID,
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
					"dump_hash": util.MapStr{
						"slice_size":      cfg.Target.SliceSize,
						"batch_size":      cfg.Target.BatchSize,
						"indices":         cfg.Target.Indices,
						"elasticsearch":   targetClusterID,
						"output_queue":    targetDumpID,
						"clean_old_files": true,
						"partition_size":  cfg.Target.PartitionSize,
						"scroll_time":     cfg.Target.ScrollTime,
						"query_dsl": util.MustToJSON(util.MapStr{
							"query": cfg.Target.QueryDSL,
						}),
					},
				},
			},
		}),
	}
	targetDumpTask.ID = targetDumpID

	diffID := util.GetUUID()
	diffTask := &task.Task{
		ParentId:    pids,
		Runnable:    true,
		Cancellable: true,
		Metadata: task.Metadata{
			Type: "pipeline",
			Labels: util.MapStr{
				"pipeline_id": "index_diff",
			},
		},
		Status:     task.StatusInit,
		RetryTimes: taskItem.RetryTimes,
		ConfigString: util.MustToJSON(migration_model.PipelineTaskConfig{
			Name: diffID,
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
					"index_diff": util.MapStr{
						"text_report":     false,
						"keep_source":     false,
						"buffer_size":     1,
						"clean_old_files": true,
						// NOTE: source & target must have same partition_size
						"partition_size": cfg.Source.PartitionSize,
						"source_queue":   sourceDumpID,
						"target_queue":   targetDumpID,
						"output_queue": util.MapStr{
							"name": diffID,
							"labels": util.MapStr{
								"comparison_task_id": taskItem.ID,
							},
						},
					},
				},
			},
		}),
	}
	diffTask.ID = diffID

	err = orm.Create(nil, sourceDumpTask)
	if err != nil {
		return fmt.Errorf("create source dump pipeline task error: %w", err)
	}
	err = orm.Create(nil, targetDumpTask)
	if err != nil {
		return fmt.Errorf("create target dump pipeline task error: %w", err)
	}
	err = orm.Create(nil, diffTask)
	if err != nil {
		return fmt.Errorf("create diff pipeline task error: %w", err)
	}

	taskItem.Metadata.Labels["is_split"] = true
	taskItem.Status = task.StatusReady

	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: true,
	}, fmt.Sprintf("comparison task [%s] splitted", taskItem.ID))
	return nil
}

func (p *processor) handleScheduleSubTask(taskItem *task.Task) error {
	cfg := migration_model.IndexComparisonTaskConfig{}
	err := migration_util.GetTaskConfig(taskItem, &cfg)
	if err != nil {
		log.Errorf("failed to get task config, err: %v", err)
		return fmt.Errorf("got wrong config of task [%s]", taskItem.ID)
	}

	sourceDumpTask, targetDumpTask, diffTask, err := p.getPipelineTasks(taskItem, &cfg)
	if err != nil {
		log.Errorf("failed to get pipeline tasks, err: %v", err)
		return nil
	}
	if sourceDumpTask == nil || targetDumpTask == nil || diffTask == nil {
		// ES might not synced yet
		log.Warnf("task [%s] pipeline task(s) not found", taskItem.ID)
		return nil
	}

	taskItem.RetryTimes++

	// get a new instanceID
	executionConfig := cfg.Execution
	instance, err := p.scheduler.GetPreferenceInstance(executionConfig)
	if err != nil {
		if err == migration_model.ErrHitMax {
			log.Debug("hit max tasks per instance, skip dispatch")
			return nil
		}
		return fmt.Errorf("get preference intance error: %w", err)
	}
	instanceID := instance.ID

	// try to clear disk queue before running dump_hash
	p.cleanGatewayQueue(taskItem)

	sourceDumpTask.RetryTimes = taskItem.RetryTimes
	sourceDumpTask.Metadata.Labels["execution_instance_id"] = instanceID
	sourceDumpTask.Status = task.StatusReady
	err = orm.Update(nil, sourceDumpTask)
	if err != nil {
		return fmt.Errorf("update source dump pipeline task error: %w", err)
	}
	targetDumpTask.RetryTimes = taskItem.RetryTimes
	targetDumpTask.Metadata.Labels["execution_instance_id"] = instanceID
	targetDumpTask.Status = task.StatusReady
	err = orm.Update(nil, targetDumpTask)
	if err != nil {
		return fmt.Errorf("update target dump pipeline task error: %w", err)
	}
	diffTask.RetryTimes = taskItem.RetryTimes
	diffTask.Metadata.Labels["execution_instance_id"] = instanceID
	diffTask.Status = task.StatusInit
	err = orm.Update(nil, diffTask)
	if err != nil {
		return fmt.Errorf("update diff pipeline task error: %w", err)
	}

	// update sub migration task status to running and save task log
	taskItem.Metadata.Labels["execution_instance_id"] = instanceID
	p.clearTaskState(taskItem)
	taskItem.Status = task.StatusRunning
	taskItem.StartTimeInMillis = time.Now().UnixMilli()

	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: true,
	}, fmt.Sprintf("index comparison task [%s] started", taskItem.ID))
	// update dispatcher state
	p.scheduler.IncrInstanceJobs(instanceID)
	return nil
}

func (p *processor) handleRunningSubTask(taskItem *task.Task) error {
	cfg := migration_model.IndexComparisonTaskConfig{}
	err := migration_util.GetTaskConfig(taskItem, &cfg)
	if err != nil {
		log.Errorf("failed to get task config, err: %v", err)
		return fmt.Errorf("got wrong config of task [%s]", taskItem.ID)
	}
	instanceID, _ := util.ExtractString(taskItem.Metadata.Labels["execution_instance_id"])

	sourceDumpTask, targetDumpTask, diffTask, err := p.getPipelineTasks(taskItem, &cfg)
	if err != nil {
		log.Errorf("failed to get pipeline tasks, err: %v", err)
		return nil
	}
	if sourceDumpTask == nil || targetDumpTask == nil || diffTask == nil {
		// ES might not synced yet
		log.Warnf("task [%s] pipeline task(s) not found", taskItem.ID)
		return nil
	}

	if migration_util.IsRunningState(sourceDumpTask.Status) || migration_util.IsRunningState(targetDumpTask.Status) || migration_util.IsRunningState(diffTask.Status) {
		return nil
	}
	if sourceDumpTask.Status == task.StatusComplete && targetDumpTask.Status == task.StatusComplete {
		sourceDocs := migration_util.GetMapIntValue(util.MapStr(sourceDumpTask.Metadata.Labels), "scrolled_docs")
		targetDocs := migration_util.GetMapIntValue(util.MapStr(targetDumpTask.Metadata.Labels), "scrolled_docs")

		taskItem.Metadata.Labels["source_scrolled"] = sourceDocs
		taskItem.Metadata.Labels["target_scrolled"] = targetDocs
		if sourceDocs != targetDocs {
			now := time.Now()
			taskItem.CompletedTime = &now
			taskItem.Status = task.StatusError
			p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
				Success: false,
			}, fmt.Sprintf("index comparison failed, source/target doc count unmatch: %d / %d", sourceDocs, targetDocs))
			p.cleanGatewayQueue(taskItem)
			p.scheduler.DecrInstanceJobs(instanceID)
			return nil
		}
		if diffTask.Status == task.StatusInit {
			diffTask.Status = task.StatusReady
			p.saveTaskAndWriteLog(diffTask, &task.TaskResult{
				Success: true,
			}, fmt.Sprintf("source/target dump completed, diff pipeline started"))
			return nil
		}
		if diffTask.Status == task.StatusComplete {
			m := util.MapStr(diffTask.Metadata.Labels)
			var (
				onlyInSource     = migration_util.GetMapIntValue(m, "only_in_source_count")
				onlyInSourceKeys = migration_util.GetMapStringValue(m, "only_in_source_keys")
				onlyInTarget     = migration_util.GetMapIntValue(m, "only_in_target_count")
				onlyInTargetKeys = migration_util.GetMapStringValue(m, "only_in_target_keys")
				diffBoth         = migration_util.GetMapIntValue(m, "diff_both_count")
				diffBothKeys     = migration_util.GetMapStringValue(m, "diff_both_keys")
			)
			if onlyInSource > 0 || onlyInTarget > 0 || diffBoth > 0 {
				now := time.Now()
				taskItem.CompletedTime = &now
				taskItem.Status = task.StatusError
				p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
					Success: false,
					Error:   "data unmatch",
				}, fmt.Sprintf("index comparison failed, only in source: %d, only in target: %d, diff in both: %d (sample doc ids: [%s], [%s] [%s])", onlyInSource, onlyInTarget, diffBoth, onlyInSourceKeys, onlyInTargetKeys, diffBothKeys))
				p.cleanGatewayQueue(taskItem)
				p.scheduler.DecrInstanceJobs(instanceID)
				return nil
			}
		}
	}
	if sourceDumpTask.Status == task.StatusError || targetDumpTask.Status == task.StatusError || diffTask.Status == task.StatusError {
		now := time.Now()
		taskItem.CompletedTime = &now
		taskItem.Status = task.StatusError
		p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
			Success: false,
			Error:   "pipeline task failed",
		}, "index comparison failed")
		p.cleanGatewayQueue(taskItem)
		p.scheduler.DecrInstanceJobs(instanceID)
		return nil
	}

	now := time.Now()
	taskItem.CompletedTime = &now
	taskItem.Status = task.StatusComplete
	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: true,
	}, "index comparison completed")
	p.cleanGatewayQueue(taskItem)
	p.scheduler.DecrInstanceJobs(instanceID)

	return nil
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
		p.saveTaskAndWriteLog(taskItem, nil, fmt.Sprintf("index comparison task [%s] stopped", taskItem.ID))
	}
	return nil
}

func (p *processor) getPipelineTasks(taskItem *task.Task, cfg *migration_model.IndexComparisonTaskConfig) (sourceDumpTask *task.Task, targetDumpTask *task.Task, diffTask *task.Task, err error) {
	ptasks, err := migration_util.GetChildTasks(p.Elasticsearch, p.IndexName, taskItem.ID, "pipeline", nil)
	if err != nil {
		log.Errorf("failed to get pipeline tasks, err: %v", err)
		return
	}
	if len(ptasks) != 3 {
		err = fmt.Errorf("invalid pipeline task count: %d", len(ptasks))
		return
	}
	sourceDumpTask, targetDumpTask, diffTask = migration_util.SplitIndexComparisonTasks(ptasks, cfg)
	return
}

// NOTE: only index_diff have an output queue, others are local files
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
			"comparison_task_id": taskItem.ID,
		},
	}
	err = instance.DeleteQueueBySelector(selector)
	if err != nil {
		log.Errorf("failed to delete queue, err: %v", err)
	}
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

func (p *processor) clearTaskState(taskItem *task.Task) {
	delete(taskItem.Metadata.Labels, "source_scrolled")
	delete(taskItem.Metadata.Labels, "target_scrolled")
}
