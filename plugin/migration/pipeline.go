/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package migration

import (
	"errors"
	"fmt"
	"math"
	"time"

	log "github.com/cihub/seelog"

	"infini.sh/console/model"
	migration_model "infini.sh/console/plugin/migration/model"
	"infini.sh/console/plugin/migration/pipeline_task"
	migration_util "infini.sh/console/plugin/migration/util"

	"infini.sh/framework/core/config"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/pipeline"
	task2 "infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
)

type DispatcherProcessor struct {
	id     string
	config *DispatcherConfig

	state map[string]DispatcherState

	pipelineTaskProcessor migration_model.Processor
}

type DispatcherConfig struct {
	Elasticsearch          string `config:"elasticsearch,omitempty"`
	IndexName              string `config:"index_name"`
	LogIndexName           string `config:"log_index_name"`
	MaxTasksPerInstance    int    `config:"max_tasks_per_instance"`
	CheckInstanceAvailable bool   `config:"check_instance_available"`
	TaskBatchSize          int    `config:"task_batch_size"`
}

type DispatcherState struct {
	Total int
}

func init() {
	pipeline.RegisterProcessorPlugin("migration_dispatcher", newMigrationDispatcherProcessor)
}

func newMigrationDispatcherProcessor(c *config.Config) (pipeline.Processor, error) {

	cfg := DispatcherConfig{}
	if err := c.Unpack(&cfg); err != nil {
		log.Errorf("failed to unpack config, err: %v", err)
		return nil, fmt.Errorf("failed to unpack the configuration of migration dispatcher processor: %s", err)
	}
	if cfg.IndexName == "" || cfg.LogIndexName == "" {
		ormConfig := common.ORMConfig{}
		ok, err := env.ParseConfig("elastic.orm", &ormConfig)
		if ok && err == nil {
			if cfg.IndexName == "" {
				cfg.IndexName = fmt.Sprintf("%stask", ormConfig.IndexPrefix)
			}
			if cfg.LogIndexName == "" {
				cfg.LogIndexName = fmt.Sprintf("%slogs", ormConfig.IndexPrefix)
			}
		} else {
			err = fmt.Errorf("parse config elastic.orm error: %w", err)
			log.Errorf("failed to parse elastic.orm, err: %v", err)
			return nil, err
		}
	}
	global.Register("cluster_migration_config", &cfg)
	if cfg.MaxTasksPerInstance <= 0 {
		cfg.MaxTasksPerInstance = 10
	}
	if cfg.TaskBatchSize <= 0 {
		cfg.TaskBatchSize = 50
	}

	//query and then init dispatcher state
	processor := DispatcherProcessor{
		id:     util.GetUUID(),
		config: &cfg,
		state:  map[string]DispatcherState{},
	}
	state, err := processor.getInstanceTaskState()
	if err != nil {
		log.Errorf("failed to get instance task state, err: %v", err)
		return nil, err
	}
	processor.state = state
	processor.pipelineTaskProcessor = pipeline_task.NewProcessor(cfg.Elasticsearch, cfg.IndexName, cfg.LogIndexName)

	return &processor, nil
}

func (p *DispatcherProcessor) Name() string {
	return "migration_dispatcher"
}

func (p *DispatcherProcessor) Process(ctx *pipeline.Context) error {
	for {
		if ctx.IsCanceled() {
			return nil
		}
		tasks, err := p.getMigrationTasks(p.config.TaskBatchSize)
		if err != nil {
			log.Errorf("failed to get migration tasks, err: %v", err)
			return err
		}
		if len(tasks) == 0 {
			return nil
		}
		for _, t := range tasks {
			if ctx.IsCanceled() {
				return nil
			}
			if t.Metadata.Labels == nil {
				log.Errorf("got migration task [%s] with empty labels, skip handling", t.ID)
				continue
			}
			log.Debugf("start handling task [%s] (type: %s, status: %s)", t.ID, t.Metadata.Type, t.Status)
			switch t.Metadata.Type {
			case "cluster_migration":
				// handle major task
				switch t.Status {
				case task2.StatusReady:
					err = p.handleReadyMajorTask(&t)
				case task2.StatusRunning:
					err = p.handleRunningMajorTask(&t)
				case task2.StatusPendingStop:
					err = p.handlePendingStopMajorTask(&t)
				}
				if err != nil {
					log.Errorf("failed to handling major task [%s]: [%v]", t.ID, err)
				}
			case "index_migration":
				// handle sub migration task
				switch t.Status {
				case task2.StatusReady:
					// split sub task
					err = p.handleReadySubTask(&t)
				case task2.StatusRunning:
					// check pipeline tasks status
					err = p.handleRunningSubTask(&t)
				case task2.StatusPendingStop:
					// mark pipeline tasks as pending_stop
					err = p.handlePendingStopSubTask(&t)
				}
				if err != nil {
					log.Errorf("failed to handling sub task [%s]: [%v]", t.ID, err)
				}
			case "pipeline":
				// handle pipeline task
				err = p.pipelineTaskProcessor.Process(&t)
				if err != nil {
					log.Errorf("failed to handling pipeline task [%s]: [%v]", t.ID, err)
				}
			}
			if err != nil {
				t.Status = task2.StatusError
				tn := time.Now()
				t.CompletedTime = &tn
				p.saveTaskAndWriteLog(&t, "", &task2.TaskResult{
					Success: false,
					Error:   err.Error(),
				}, fmt.Sprintf("error handling task [%s]", t.ID))
			}
		}
		//es index refresh
		time.Sleep(time.Millisecond * 1200)
	}
	return nil
}

func (p *DispatcherProcessor) handleReadyMajorTask(taskItem *task2.Task) error {
	if taskItem.Metadata.Labels["is_split"] != true {
		err := p.splitMajorMigrationTask(taskItem)
		if err != nil {
			return err
		}
		taskItem.Metadata.Labels["is_split"] = true
	} else {
		taskItem.RetryTimes++
	}
	//update status of subtask to ready
	query := util.MapStr{
		"bool": util.MapStr{
			"must": []util.MapStr{
				{
					"term": util.MapStr{
						"parent_id": util.MapStr{
							"value": taskItem.ID,
						},
					},
				},
				{
					"terms": util.MapStr{
						"status": []string{task2.StatusError, task2.StatusStopped},
					},
				},
				{
					"term": util.MapStr{
						"metadata.type": util.MapStr{
							"value": "index_migration",
						},
					},
				},
			},
		},
	}
	queryDsl := util.MapStr{
		"query": query,
		"script": util.MapStr{
			"source": fmt.Sprintf("ctx._source['status'] = '%s'", task2.StatusReady),
		},
	}

	// saved is_split if the following steps failed
	defer func() {
		p.sendMajorTaskNotification(taskItem)
		p.saveTaskAndWriteLog(taskItem, "", &task2.TaskResult{
			Success: true,
		}, fmt.Sprintf("task [%s] started", taskItem.ID))
	}()

	esClient := elastic.GetClient(p.config.Elasticsearch)
	_, err := esClient.UpdateByQuery(p.config.IndexName, util.MustToJSONBytes(queryDsl))
	if err != nil {
		log.Errorf("failed to update sub task status, err: %v", err)
		return nil
	}
	taskItem.Status = task2.StatusRunning
	return nil
}

func (p *DispatcherProcessor) handlePendingStopMajorTask(taskItem *task2.Task) error {
	err := p.updatePendingChildTasksToPendingStop(taskItem, "index_migration")
	if err != nil {
		log.Errorf("failed to update sub task status, err: %v", err)
		return nil
	}

	tasks, err := p.getPendingChildTasks(taskItem, "index_migration")
	if err != nil {
		log.Errorf("failed to get sub tasks, err: %v", err)
		return nil
	}

	// all subtask stopped or error or complete
	if len(tasks) == 0 {
		taskItem.Status = task2.StatusStopped
		p.sendMajorTaskNotification(taskItem)
		p.saveTaskAndWriteLog(taskItem, "", nil, fmt.Sprintf("task [%s] stopped", taskItem.ID))
	}
	return nil
}
func (p *DispatcherProcessor) handleRunningMajorTask(taskItem *task2.Task) error {
	ts, err := p.getMajorTaskState(taskItem)
	if err != nil {
		return err
	}
	if ts.Status == task2.StatusComplete || ts.Status == task2.StatusError {
		taskItem.Metadata.Labels["target_total_docs"] = ts.IndexDocs
		taskItem.Status = ts.Status
		tn := time.Now()
		taskItem.CompletedTime = &tn
		p.sendMajorTaskNotification(taskItem)
		p.saveTaskAndWriteLog(taskItem, "", nil, fmt.Sprintf("task [%s] finished with status [%s]", taskItem.ID, ts.Status))
	}
	return nil
}

func (p *DispatcherProcessor) handleRunningSubTask(taskItem *task2.Task) error {
	cfg := migration_model.IndexMigrationTaskConfig{}
	err := migration_util.GetTaskConfig(taskItem, &cfg)
	if err != nil {
		log.Errorf("failed to get task config, err: %v", err)
		return fmt.Errorf("got wrong config of task [%s]", taskItem.ID)
	}
	totalDocs := cfg.Source.DocCount
	instanceID, _ := util.ExtractString(taskItem.Metadata.Labels["execution_instance_id"])

	if totalDocs == 0 {
		taskItem.Status = task2.StatusComplete
		taskItem.Metadata.Labels["scrolled_docs"] = 0
		taskItem.Metadata.Labels["index_docs"] = 0
		now := time.Now()
		taskItem.CompletedTime = &now

		p.saveTaskAndWriteLog(taskItem, "wait_for", &task2.TaskResult{
			Success: true,
		}, "empty index migration completed")
		p.decrInstanceJobs(instanceID)
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
		taskItem.Status = task2.StatusError
		p.saveTaskAndWriteLog(taskItem, "wait_for", &task2.TaskResult{
			Success: false,
			Error:   err.Error(),
		}, "index scroll failed")
		p.decrInstanceJobs(instanceID)
		return nil
	}

	if migration_util.GetMapIntValue(util.MapStr(taskItem.Metadata.Labels), "scrolled_docs") == 0 {
		taskItem.Metadata.Labels["scrolled_docs"] = scrolledDocs
		p.saveTaskAndWriteLog(taskItem, "wait_for", nil, "")
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
		taskItem.Status = task2.StatusError
		p.saveTaskAndWriteLog(taskItem, "wait_for", &task2.TaskResult{
			Success: false,
			Error:   err.Error(),
		}, "index bulk failed")
	} else {
		taskItem.Status = task2.StatusComplete
		p.saveTaskAndWriteLog(taskItem, "wait_for", &task2.TaskResult{
			Success: true,
		}, "index migration completed")
	}
	p.decrInstanceJobs(instanceID)
	return nil

}

func (p *DispatcherProcessor) checkScrollPipelineTaskStatus(scrollTask *task2.Task, totalDocs int64) (scrolled bool, scrolledDocs int64, err error) {
	// NOTE: old-version pipeline tasks has empty status
	if scrollTask.Status == task2.StatusError || scrollTask.Status == "" {
		return true, 0, errors.New("scroll pipeline failed")
	}

	// scroll not finished yet
	if scrollTask.Status != task2.StatusComplete {
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

func (p *DispatcherProcessor) checkBulkPipelineTaskStatus(bulkTask *task2.Task, totalDocs int64) (bulked bool, successDocs int64, err error) {
	if bulkTask.Status == task2.StatusError || bulkTask.Status == "" {
		return true, 0, errors.New("bulk pipeline failed")
	}

	// start bulk as needed
	if bulkTask.Status == task2.StatusInit {
		bulkTask.Status = task2.StatusReady
		p.saveTaskAndWriteLog(bulkTask, "", &task2.TaskResult{
			Success: true,
		}, fmt.Sprintf("scroll completed, bulk pipeline started"))
		return false, 0, nil
	}

	// bulk not finished yet
	if bulkTask.Status != task2.StatusComplete {
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

	return true, successDocs, nil
}

func (p *DispatcherProcessor) handlePendingStopSubTask(taskItem *task2.Task) error {
	err := p.updatePendingChildTasksToPendingStop(taskItem, "pipeline")
	if err != nil {
		log.Errorf("failed to update sub task status, err: %v", err)
		return nil
	}

	tasks, err := p.getPendingChildTasks(taskItem, "pipeline")
	if err != nil {
		log.Errorf("failed to get sub tasks, err: %v", err)
		return nil
	}

	// all subtask stopped or error or complete
	if len(tasks) == 0 {
		taskItem.Status = task2.StatusStopped
		p.sendMajorTaskNotification(taskItem)
		p.saveTaskAndWriteLog(taskItem, "", nil, fmt.Sprintf("task [%s] stopped", taskItem.ID))
	}
	return nil
}

func (p *DispatcherProcessor) handleReadySubTask(taskItem *task2.Task) error {
	if taskItem.Metadata.Labels["is_split"] == true {
		return p.handleScheduleSubTask(taskItem)
	}

	return p.handleSplitSubTask(taskItem)
}

func (p *DispatcherProcessor) handleSplitSubTask(taskItem *task2.Task) error {
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
	esConfig := elastic.GetConfig(sourceClusterID)
	esTargetConfig := elastic.GetConfig(targetClusterID)
	docType := common.GetClusterDocType(targetClusterID)
	if len(taskItem.ParentId) == 0 {
		return fmt.Errorf("got wrong parent id of task [%v]", *taskItem)
	}
	queryDsl := cfg.Source.QueryDSL
	scrollQueryDsl := util.MustToJSON(util.MapStr{
		"query": queryDsl,
	})
	indexName := cfg.Source.Indices
	scrollTask := &task2.Task{
		ParentId:    pids,
		Runnable:    true,
		Cancellable: true,
		Metadata: task2.Metadata{
			Type: "pipeline",
			Labels: util.MapStr{
				"cluster_id":        sourceClusterID,
				"pipeline_id":       "es_scroll",
				"index_name":        indexName,
				"unique_index_name": taskItem.Metadata.Labels["unique_index_name"],
			},
		},
		Status:     task2.StatusInit,
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
						"elasticsearch_config": util.MapStr{
							"name":       sourceClusterID,
							"enabled":    true,
							"endpoint":   esConfig.Endpoint,
							"basic_auth": esConfig.BasicAuth,
						},
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
	bulkTask := &task2.Task{
		ParentId:    pids,
		Runnable:    true,
		Cancellable: true,
		Metadata: task2.Metadata{
			Type: "pipeline",
			Labels: util.MapStr{
				"cluster_id":        targetClusterID,
				"pipeline_id":       "bulk_indexing",
				"index_name":        indexName,
				"unique_index_name": taskItem.Metadata.Labels["unique_index_name"],
			},
		},
		Status:     task2.StatusInit,
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
						"elasticsearch_config": util.MapStr{
							"name":       targetClusterID,
							"enabled":    true,
							"endpoint":   esTargetConfig.Endpoint,
							"basic_auth": esTargetConfig.BasicAuth,
						},
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
	taskItem.Status = task2.StatusReady

	p.saveTaskAndWriteLog(taskItem, "wait_for", &task2.TaskResult{
		Success: true,
	}, fmt.Sprintf("task [%s] splitted", taskItem.ID))
	return nil
}

func (p *DispatcherProcessor) handleScheduleSubTask(taskItem *task2.Task) error {
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

	instance, err := p.getPreferenceInstance(taskItem.ParentId[0])
	if err != nil {
		return fmt.Errorf("get preference intance error: %w", err)
	}
	if p.state[instance.ID].Total >= p.config.MaxTasksPerInstance {
		log.Infof("hit max tasks per instance with %d, skip dispatch", p.config.MaxTasksPerInstance)
		return nil
	}

	// update scroll task to ready
	scrollTask.Metadata.Labels["execution_instance_id"] = instance.ID
	scrollTask.Status = task2.StatusReady
	err = orm.Update(nil, scrollTask)
	if err != nil {
		return fmt.Errorf("update scroll pipeline task error: %w", err)
	}

	// update bulk task to init
	bulkTask.Metadata.Labels["execution_instance_id"] = instance.ID
	bulkTask.Status = task2.StatusInit
	err = orm.Update(nil, bulkTask)
	if err != nil {
		return fmt.Errorf("update bulk_indexing pipeline task error: %w", err)
	}

	// update sub migration task status to running and save task log
	taskItem.RetryTimes++
	taskItem.Metadata.Labels["execution_instance_id"] = instance.ID
	taskItem.Metadata.Labels["index_docs"] = 0
	taskItem.Metadata.Labels["scrolled_docs"] = 0
	taskItem.Status = task2.StatusRunning
	taskItem.StartTimeInMillis = time.Now().UnixMilli()

	p.saveTaskAndWriteLog(taskItem, "wait_for", &task2.TaskResult{
		Success: true,
	}, fmt.Sprintf("task [%s] started", taskItem.ID))
	// update dispatcher state
	p.incrInstanceJobs(instance.ID)
	return nil
}

func (p *DispatcherProcessor) getPreferenceInstance(majorTaskID string) (instance model.Instance, err error) {
	majorTask := task2.Task{}
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
	var (
		total    = math.MaxInt
		tempInst = model.Instance{}
	)
	for _, node := range cfg.Settings.Execution.Nodes.Permit {
		if p.state[node.ID].Total < total {
			if p.config.CheckInstanceAvailable {
				tempInst.ID = node.ID
				_, err = orm.Get(&tempInst)
				if err != nil {
					log.Errorf("failed to get instance, err: %v", err)
					continue
				}
				err = tempInst.TryConnectWithTimeout(time.Second)
				if err != nil {
					log.Debugf("instance [%s] is not available, caused by: %v", tempInst.ID, err)
					continue
				}
			}
			instance.ID = node.ID
			total = p.state[node.ID].Total
		}
	}
	if instance.ID == "" && p.config.CheckInstanceAvailable {
		return instance, fmt.Errorf("no available instance")
	}
	if instance.ID == tempInst.ID {
		return tempInst, nil
	}
	_, err = orm.Get(&instance)
	return
}

func (p *DispatcherProcessor) getMigrationTasks(size int) ([]task2.Task, error) {
	queryDsl := util.MapStr{
		"size": size,
		"sort": []util.MapStr{
			{
				"created": util.MapStr{
					"order": "asc",
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"terms": util.MapStr{
							"status": []string{task2.StatusReady, task2.StatusRunning, task2.StatusPendingStop},
						},
					},
				},
			},
		},
	}
	return p.getTasks(queryDsl)
}

func (p *DispatcherProcessor) saveTaskAndWriteLog(taskItem *task2.Task, refresh string, taskResult *task2.TaskResult, message string) {
	esClient := elastic.GetClient(p.config.Elasticsearch)
	_, err := esClient.Index(p.config.IndexName, "", taskItem.ID, taskItem, refresh)
	if err != nil {
		log.Errorf("failed to update task, err: %v", err)
	}
	if message != "" {
		migration_util.WriteLog(taskItem, taskResult, message)
	}
}

func (p *DispatcherProcessor) splitMajorMigrationTask(taskItem *task2.Task) error {
	if taskItem.Metadata.Labels["is_split"] == true {
		return nil
	}

	clusterMigrationTask := migration_model.ClusterMigrationTaskConfig{}
	err := migration_util.GetTaskConfig(taskItem, &clusterMigrationTask)
	if err != nil {
		log.Errorf("failed to get task config, err: %v", err)
		return err
	}
	defer func() {
		taskItem.ConfigString = util.MustToJSON(clusterMigrationTask)
	}()
	esSourceClient := elastic.GetClient(clusterMigrationTask.Cluster.Source.Id)
	targetType := common.GetClusterDocType(clusterMigrationTask.Cluster.Target.Id)

	for _, index := range clusterMigrationTask.Indices {
		source := migration_model.IndexMigrationSourceConfig{
			ClusterId:  clusterMigrationTask.Cluster.Source.Id,
			Indices:    index.Source.Name,
			SliceSize:  clusterMigrationTask.Settings.Scroll.SliceSize,
			BatchSize:  clusterMigrationTask.Settings.Scroll.Docs,
			ScrollTime: clusterMigrationTask.Settings.Scroll.Timeout,
		}
		if index.IndexRename != nil {
			source.IndexRename = index.IndexRename
		}
		if index.Target.Name != "" {
			source.IndexRename = util.MapStr{
				index.Source.Name: index.Target.Name,
			}
		}
		if index.TypeRename != nil {
			source.TypeRename = index.TypeRename
		}

		if v, ok := index.RawFilter.(string); ok {
			source.QueryString = v
		} else {
			var must []interface{}
			if index.RawFilter != nil {
				must = append(must, index.RawFilter)
			}
			if index.Source.DocType != "" {
				if index.Target.DocType != "" {
					source.TypeRename = util.MapStr{
						index.Source.DocType: index.Target.DocType,
					}
				}
				must = append(must, util.MapStr{
					"terms": util.MapStr{
						"_type": []string{index.Source.DocType},
					},
				})
			} else {
				if targetType != "" {
					source.TypeRename = util.MapStr{
						"*": index.Target.DocType,
					}
				}
			}
			if len(must) > 0 {
				source.QueryDSL = util.MapStr{
					"bool": util.MapStr{
						"must": must,
					},
				}
			}
		}
		var targetMust []interface{}
		if index.RawFilter != nil {
			targetMust = append(targetMust, index.RawFilter)
		}
		if index.Target.DocType != "" && targetType != "" {
			targetMust = append(targetMust, util.MapStr{
				"terms": util.MapStr{
					"_type": []string{index.Target.DocType},
				},
			})
		}

		target := migration_model.IndexMigrationTargetConfig{
			ClusterId: clusterMigrationTask.Cluster.Target.Id,
			Bulk: migration_model.IndexMigrationBulkConfig{
				BatchSizeInMB:        clusterMigrationTask.Settings.Bulk.StoreSizeInMB,
				BatchSizeInDocs:      clusterMigrationTask.Settings.Bulk.Docs,
				MaxWorkerSize:        clusterMigrationTask.Settings.Bulk.MaxWorkerSize,
				IdleTimeoutInSeconds: clusterMigrationTask.Settings.Bulk.IdleTimeoutInSeconds,
				SliceSize:            clusterMigrationTask.Settings.Bulk.SliceSize,
				Compress:             clusterMigrationTask.Settings.Bulk.Compress,
			},
		}

		if index.Partition != nil {
			partitionQ := &elastic.PartitionQuery{
				IndexName: index.Source.Name,
				FieldName: index.Partition.FieldName,
				FieldType: index.Partition.FieldType,
				Step:      index.Partition.Step,
			}
			if source.QueryDSL != nil {
				partitionQ.Filter = source.QueryDSL
			}
			partitions, err := elastic.GetPartitions(partitionQ, esSourceClient)
			if err != nil {
				return err
			}
			if partitions == nil || len(partitions) == 0 {
				return fmt.Errorf("empty data with filter: %s", util.MustToJSON(index.RawFilter))
			}
			var (
				partitionID int
			)
			for _, partition := range partitions {
				//skip empty partition
				if partition.Docs <= 0 {
					continue
				}
				partitionID++
				partitionSource := source
				partitionSource.Start = partition.Start
				partitionSource.End = partition.End
				partitionSource.DocCount = partition.Docs
				partitionSource.Step = index.Partition.Step
				partitionSource.PartitionId = partitionID
				partitionSource.QueryDSL = partition.Filter
				partitionSource.QueryString = ""

				partitionMigrationTask := task2.Task{
					ParentId:    []string{taskItem.ID},
					Cancellable: false,
					Runnable:    true,
					Status:      task2.StatusReady,
					Metadata: task2.Metadata{
						Type: "index_migration",
						Labels: util.MapStr{
							"business_id":       "index_migration",
							"source_cluster_id": clusterMigrationTask.Cluster.Source.Id,
							"target_cluster_id": clusterMigrationTask.Cluster.Target.Id,
							"index_name":        index.Source.Name,
							"unique_index_name": index.Source.GetUniqueIndexName(),
						},
					},
					ConfigString: util.MustToJSON(migration_model.IndexMigrationTaskConfig{
						Source:    partitionSource,
						Target:    target,
						Execution: clusterMigrationTask.Settings.Execution,
					}),
				}
				partitionMigrationTask.ID = util.GetUUID()
				err = orm.Create(nil, &partitionMigrationTask)
				if err != nil {
					return fmt.Errorf("store index migration task(partition) error: %w", err)
				}

			}
		} else {
			source.DocCount = index.Source.Docs

			indexParameters := migration_model.IndexMigrationTaskConfig{
				Source: source,
				Target: target,
			}
			indexMigrationTask := task2.Task{
				ParentId:          []string{taskItem.ID},
				Cancellable:       true,
				Runnable:          false,
				Status:            task2.StatusReady,
				StartTimeInMillis: time.Now().UnixMilli(),
				Metadata: task2.Metadata{
					Type: "index_migration",
					Labels: util.MapStr{
						"business_id":       "index_migration",
						"source_cluster_id": clusterMigrationTask.Cluster.Source.Id,
						"target_cluster_id": clusterMigrationTask.Cluster.Target.Id,
						"partition_count":   1,
						"index_name":        index.Source.Name,
						"unique_index_name": index.Source.GetUniqueIndexName(),
					},
				},
				ConfigString: util.MustToJSON(indexParameters),
			}

			indexMigrationTask.ID = util.GetUUID()

			err = orm.Create(nil, &indexMigrationTask)
			if err != nil {
				return fmt.Errorf("store index migration task error: %w", err)
			}
		}
	}
	return nil
}

func (p *DispatcherProcessor) getPipelineTasks(subTaskID string) ([]task2.Task, error) {
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
	return p.getTasks(queryDsl)
}

func (p *DispatcherProcessor) getTasks(query interface{}) ([]task2.Task, error) {
	esClient := elastic.GetClient(p.config.Elasticsearch)
	res, err := esClient.SearchWithRawQueryDSL(p.config.IndexName, util.MustToJSONBytes(query))
	if err != nil {
		log.Errorf("query tasks from es failed, err: %v", err)
		return nil, err
	}
	if res.GetTotal() == 0 {
		return nil, nil
	}
	var migrationTasks []task2.Task
	for _, hit := range res.Hits.Hits {
		buf, err := util.ToJSONBytes(hit.Source)
		if err != nil {
			log.Errorf("marshal task json failed, err: %v", err)
			return nil, err
		}
		tk := task2.Task{}
		err = util.FromJSONBytes(buf, &tk)
		if err != nil {
			log.Errorf("unmarshal task json failed, err: %v", err)
			return nil, err
		}
		migrationTasks = append(migrationTasks, tk)
	}
	return migrationTasks, nil
}

func (p *DispatcherProcessor) getMajorTaskState(majorTask *task2.Task) (taskState migration_model.MajorTaskState, err error) {
	query := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"total_docs": util.MapStr{
				"sum": util.MapStr{
					"field": "metadata.labels.index_docs",
				},
			},
			"grp": util.MapStr{
				"terms": util.MapStr{
					"field": "status",
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"parent_id": util.MapStr{
								"value": majorTask.ID,
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.type": util.MapStr{
								"value": "index_migration",
							},
						},
					},
				},
			},
		},
	}
	esClient := elastic.GetClient(p.config.Elasticsearch)
	res, err := esClient.SearchWithRawQueryDSL(p.config.IndexName, util.MustToJSONBytes(query))
	if err != nil {
		log.Errorf("search es failed, err: %v", err)
		return taskState, nil
	}
	if v, ok := res.Aggregations["total_docs"].Value.(float64); ok {
		taskState.IndexDocs = v
	}
	for _, bk := range res.Aggregations["grp"].Buckets {
		status, _ := util.ExtractString(bk["key"])
		if migration_util.IsRunningState(status) {
			taskState.Status = task2.StatusRunning
			return taskState, nil
		}
		if status == task2.StatusError {
			taskState.Status = task2.StatusError
			return taskState, nil
		}
	}
	taskState.Status = task2.StatusComplete
	return taskState, nil
}

func (p *DispatcherProcessor) getInstanceTaskState() (map[string]DispatcherState, error) {
	query := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"grp": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.execution_instance_id",
					"size":  1000,
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.type": util.MapStr{
								"value": "index_migration",
							},
						},
					},
					{
						"term": util.MapStr{
							"status": util.MapStr{
								"value": task2.StatusRunning,
							},
						},
					},
				},
			},
		},
	}
	esClient := elastic.GetClient(p.config.Elasticsearch)
	res, err := esClient.SearchWithRawQueryDSL(p.config.IndexName, util.MustToJSONBytes(query))
	if err != nil {
		log.Errorf("search es failed, err: %v", err)
		return nil, err
	}
	state := map[string]DispatcherState{}
	for _, bk := range res.Aggregations["grp"].Buckets {
		if key, ok := bk["key"].(string); ok {
			if v, ok := bk["doc_count"].(float64); ok {
				state[key] = DispatcherState{
					Total: int(v),
				}
			}
		}
	}
	return state, nil
}

func (p *DispatcherProcessor) sendMajorTaskNotification(taskItem *task2.Task) {
	config := migration_model.ClusterMigrationTaskConfig{}
	err := migration_util.GetTaskConfig(taskItem, &config)
	if err != nil {
		log.Errorf("failed to parse config info from major task, id: %s, err: %v", taskItem.ID, err)
		return
	}

	creatorID := config.Creator.Id

	var title, body string
	body = fmt.Sprintf("From Cluster: [%s (%s)], To Cluster: [%s (%s)]", config.Cluster.Source.Id, config.Cluster.Source.Name, config.Cluster.Target.Id, config.Cluster.Target.Name)
	link := fmt.Sprintf("/#/data_tools/migration/%s/detail", taskItem.ID)
	switch taskItem.Status {
	case task2.StatusReady:
		log.Debugf("skip sending notification for ready task, id: %s", taskItem.ID)
		return
	case task2.StatusStopped:
		title = fmt.Sprintf("Data Migration Stopped")
	case task2.StatusComplete:
		title = fmt.Sprintf("Data Migration Completed")
	case task2.StatusError:
		title = fmt.Sprintf("Data Migration Failed")
	case task2.StatusRunning:
		title = fmt.Sprintf("Data Migration Started")
	default:
		log.Warnf("skip sending notification for invalid task status, id: %s", taskItem.ID)
		return
	}
	notification := &model.Notification{
		UserId:      util.ToString(creatorID),
		Type:        model.NotificationTypeNotification,
		MessageType: model.MessageTypeMigration,
		Status:      model.NotificationStatusNew,
		Title:       title,
		Body:        body,
		Link:        link,
	}
	err = orm.Create(nil, notification)
	if err != nil {
		log.Errorf("failed to create notification, err: %v", err)
		return
	}
	return
}

// update status of subtask to pending stop
func (p *DispatcherProcessor) updatePendingChildTasksToPendingStop(taskItem *task2.Task, taskType string) error {
	query := util.MapStr{
		"bool": util.MapStr{
			"must": []util.MapStr{
				{
					"term": util.MapStr{
						"parent_id": util.MapStr{
							"value": taskItem.ID,
						},
					},
				},
				{
					"terms": util.MapStr{
						"status": []string{task2.StatusRunning, task2.StatusReady},
					},
				},
				{
					"term": util.MapStr{
						"metadata.type": util.MapStr{
							"value": taskType,
						},
					},
				},
			},
		},
	}
	queryDsl := util.MapStr{
		"query": query,
		"script": util.MapStr{
			"source": fmt.Sprintf("ctx._source['status'] = '%s'", task2.StatusPendingStop),
		},
	}

	err := orm.UpdateBy(taskItem, util.MustToJSONBytes(queryDsl))
	if err != nil {
		return err
	}
	return nil
}

func (p *DispatcherProcessor) getPendingChildTasks(taskItem *task2.Task, taskType string) ([]task2.Task, error) {

	//check whether all pipeline task is stopped or not, then update task status
	q := util.MapStr{
		"size": 200,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"parent_id": util.MapStr{
								"value": taskItem.ID,
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.type": taskType,
						},
					},
					{
						"terms": util.MapStr{
							"status": []string{task2.StatusRunning, task2.StatusPendingStop, task2.StatusReady},
						},
					},
				},
			},
		},
	}
	return p.getTasks(q)
}

func (p *DispatcherProcessor) getScrollBulkPipelineTasks(taskItem *task2.Task) (scrollTask *task2.Task, bulkTask *task2.Task, err error) {
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

func (p *DispatcherProcessor) decrInstanceJobs(instanceID string) {
	if st, ok := p.state[instanceID]; ok {
		st.Total -= 1
		p.state[instanceID] = st
	}
}

func (p *DispatcherProcessor) incrInstanceJobs(instanceID string) {
	instanceState := p.state[instanceID]
	instanceState.Total = instanceState.Total + 1
	p.state[instanceID] = instanceState
}
