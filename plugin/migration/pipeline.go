/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package migration

import (
	"errors"
	"fmt"
	"math"
	"strings"
	"syscall"
	"time"

	log "github.com/cihub/seelog"

	"infini.sh/console/model"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/event"
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
	state  map[string]DispatcherState
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
			return err
		}
		if len(tasks) == 0 {
			log.Debug("got zero cluster migration task from es")
			return nil
		}
		for _, t := range tasks {
			if ctx.IsCanceled() {
				return nil
			}
			if t.Metadata.Labels == nil {
				log.Errorf("got migration task with empty labels, skip handling: %v", t)
				continue
			}
			if t.Metadata.Labels["business_id"] == "cluster_migration" {
				//handle major task
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
			} else if t.Metadata.Labels["business_id"] == "index_migration" {
				//handle sub migration task
				switch t.Status {
				case task2.StatusReady:
					err = p.handleReadySubTask(&t)
				case task2.StatusRunning:
					err = p.handleRunningSubTask(&t)
				case task2.StatusPendingStop:
					err = p.handlePendingStopSubTask(&t)
					if err != nil {
						log.Errorf("failed to handling sub task [%s]: [%v]", t.ID, err)
					}
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
}

func (p *DispatcherProcessor) handleReadyMajorTask(taskItem *task2.Task) error {
	if taskItem.Metadata.Labels == nil {
		return fmt.Errorf("got migration task with empty labels, skip handling: %v", taskItem)
	}
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
						"metadata.labels.business_id": util.MapStr{
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
	//update status of subtask to pending stop
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
						"metadata.labels.business_id": util.MapStr{
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
			"source": fmt.Sprintf("ctx._source['status'] = '%s'", task2.StatusPendingStop),
		},
	}

	err := orm.UpdateBy(taskItem, util.MustToJSONBytes(queryDsl))
	if err != nil {
		log.Errorf("failed to update sub task status, err: %v", err)
		return nil
	}
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
							"metadata.labels.business_id": "index_migration",
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
	tasks, err := p.getTasks(q)
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
	state, err := p.getTaskCompleteState(taskItem)
	if err != nil {
		return err
	}
	if state.IsComplete {
		if taskItem.Metadata.Labels != nil {
			taskItem.Metadata.Labels["index_docs"] = state.SuccessDocs
			taskItem.Metadata.Labels["scrolled_docs"] = state.ScrolledDocs
		}
		if state.Error != "" && state.TotalDocs != state.SuccessDocs {
			taskItem.Status = task2.StatusError
		} else {
			taskItem.Status = task2.StatusComplete
		}

		tn := time.Now()
		taskItem.CompletedTime = &tn
		p.saveTaskAndWriteLog(taskItem, "", &task2.TaskResult{
			Success: state.Error == "",
			Error:   state.Error,
		}, fmt.Sprintf("task [%s] finished with status [%s]", taskItem.ID, taskItem.Status))
		p.cleanGatewayPipelines(taskItem, state.PipelineIds)
	} else {
		if state.RunningPhase == 1 && taskItem.Metadata.Labels["running_phase"] == float64(1) {
			ptasks, err := p.getPipelineTasks(taskItem.ID)
			if err != nil {
				log.Errorf("failed to get pipeline tasks, err: %v", err)
				return nil
			}
			var bulkTask *task2.Task
			for i, t := range ptasks {
				if t.Metadata.Labels != nil {
					if t.Metadata.Labels["pipeline_id"] == "bulk_indexing" {
						bulkTask = &ptasks[i]
					}
				}
			}
			if bulkTask == nil {
				return fmt.Errorf("can not found bulk_indexing pipeline of sub task [%s]", taskItem.ID)
			}
			if bulkTask.Metadata.Labels != nil {
				if instID, ok := bulkTask.Metadata.Labels["execution_instance_id"].(string); ok {
					inst := &model.Instance{}
					inst.ID = instID
					_, err = orm.Get(inst)
					if err != nil {
						log.Errorf("failed to get instance, err: %v", err)
						return err
					}
					err = inst.CreatePipeline([]byte(bulkTask.ConfigString))
					if err != nil {
						log.Errorf("failed to create bulk_indexing pipeline, err: %v", err)
						return err
					}
					taskItem.Metadata.Labels["running_phase"] = 2
					p.saveTaskAndWriteLog(taskItem, "wait_for", nil, fmt.Sprintf("task [%s] started phase 2", taskItem.ID))
				}
			}
		}
	}
	return nil
}

func (p *DispatcherProcessor) handlePendingStopSubTask(taskItem *task2.Task) error {
	//check whether all pipeline task is stopped or not, then update task status
	ptasks, err := p.getPipelineTasks(taskItem.ID)
	if err != nil {
		log.Errorf("failed to get pipeline tasks, err: %v", err)
		return err
	}
	var taskIDs []string
	for _, t := range ptasks {
		taskIDs = append(taskIDs, t.ID)
	}
	esClient := elastic.GetClient(p.config.Elasticsearch)
	q := util.MapStr{
		"size": len(taskIDs),
		"sort": []util.MapStr{
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
			"terms": util.MapStr{
				"metadata.labels.task_id": taskIDs,
			},
		},
	}
	searchRes, err := esClient.SearchWithRawQueryDSL(p.config.LogIndexName, util.MustToJSONBytes(q))
	if err != nil {
		log.Errorf("failed to get latest pipeline status, err: %v", err)
		return nil
	}
MainLoop:
	for _, hit := range searchRes.Hits.Hits {
		status, _ := util.MapStr(hit.Source).GetValue("payload.pipeline.logging.status")
		if status != "STOPPED" {
			//call instance api to stop scroll/bulk_indexing pipeline task
			if instID, ok := taskItem.Metadata.Labels["execution_instance_id"].(string); ok {
				inst := model.Instance{}
				inst.ID = instID
				_, err = orm.Get(&inst)
				if err != nil {
					log.Errorf("failed to get instance, err: %v", err)
					return nil
				}
				hasStopped := true
				for _, pipelineID := range taskIDs {
					err = inst.StopPipelineWithTimeout(pipelineID, time.Second)
					if err != nil {
						if !errors.Is(err, syscall.ECONNREFUSED) && !strings.Contains(err.Error(), "task not found") {
							hasStopped = false
							break
						}
						log.Errorf("failed to stop pipeline, err: %v", err)
					}
				}
				if hasStopped {
					break MainLoop
				}
			}
			return nil
		}
	}
	taskItem.Status = task2.StatusStopped

	p.saveTaskAndWriteLog(taskItem, "", nil, fmt.Sprintf("task [%s] stopped", taskItem.ID))
	p.cleanGatewayPipelines(taskItem, taskIDs)
	return nil
}

func (p *DispatcherProcessor) cleanGatewayPipelines(taskItem *task2.Task, pipelineIDs []string) {
	var err error
	//delete pipeline and clear queue
	instanceID, ok := taskItem.Metadata.Labels["execution_instance_id"].(string)
	if !ok {
		log.Debugf("task %s not scheduled, skip cleaning gateway stuffs", taskItem.ID)
		return
	}

	inst := model.Instance{}
	inst.ID = instanceID
	_, err = orm.Get(&inst)
	if err != nil {
		log.Errorf("failed to get instance, err: %v", err)
		return
	}

	for _, pipelineID := range pipelineIDs {
		err = inst.DeletePipeline(pipelineID)
		if err != nil {
			log.Errorf("delete pipeline failed, err: %v", err)
		}
		selector := util.MapStr{
			"labels": util.MapStr{
				"migration_task_id": taskItem.ID,
			},
		}
		//clear queue
		err = inst.DeleteQueueBySelector(selector)
		if err != nil {
			log.Errorf("failed to delete queue, err: %v", err)
		}
	}
	if st, ok := p.state[instanceID]; ok {
		st.Total -= 1
		p.state[instanceID] = st
	}
}

func (p *DispatcherProcessor) handleReadySubTask(taskItem *task2.Task) error {
	if taskItem.Metadata.Labels == nil {
		return fmt.Errorf("empty labels")
	}
	var (
		scrollTask *task2.Task
		bulkTask   *task2.Task
	)
	if taskItem.Metadata.Labels["is_split"] == true {
		//query split pipeline task
		ptasks, err := p.getPipelineTasks(taskItem.ID)
		if err != nil {
			log.Errorf("getPipelineTasks failed, err: %+v", err)
			return nil
		}
		for i, t := range ptasks {
			ptasks[i].RetryTimes = taskItem.RetryTimes + 1
			if t.Metadata.Labels != nil {
				if t.Metadata.Labels["pipeline_id"] == "es_scroll" {
					scrollTask = &ptasks[i]
				} else if t.Metadata.Labels["pipeline_id"] == "bulk_indexing" {
					bulkTask = &ptasks[i]
				}
			}
		}
		if scrollTask == nil || bulkTask == nil {
			return fmt.Errorf("es_scroll or bulk_indexing pipeline task not found")
		}
		taskItem.RetryTimes++
	} else {
		//split task to scroll/bulk_indexing pipeline and then persistent
		var pids []string
		pids = append(pids, taskItem.ParentId...)
		pids = append(pids, taskItem.ID)
		scrollID := util.GetUUID()
		cfg := IndexMigrationTaskConfig{}
		err := getTaskConfig(taskItem, &cfg)
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
		scrollTask = &task2.Task{
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
			RetryTimes: taskItem.RetryTimes,
			ConfigString: util.MustToJSON(PipelineTaskConfig{
				Name: scrollID,
				Logging: PipelineTaskLoggingConfig{
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
		bulkTask = &task2.Task{
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
			RetryTimes: taskItem.RetryTimes,
			ConfigString: util.MustToJSON(PipelineTaskConfig{
				Name: bulkID,
				Logging: PipelineTaskLoggingConfig{
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
	}
	instance, err := p.getPreferenceInstance(taskItem.ParentId[0])
	if err != nil {
		return fmt.Errorf("get preference intance error: %w", err)
	}
	if p.state[instance.ID].Total >= p.config.MaxTasksPerInstance {
		log.Infof("hit max tasks per instance with %d, skip dispatch", p.config.MaxTasksPerInstance)
		return nil
	}
	scrollTask.Metadata.Labels["execution_instance_id"] = instance.ID
	bulkTask.Metadata.Labels["execution_instance_id"] = instance.ID

	//try to clear queue when tasks are retried
	if taskItem.RetryTimes > 0 {
		selector := util.MapStr{
			"labels": util.MapStr{
				"migration_task_id": taskItem.ID,
			},
		}
		_ = instance.DeleteQueueBySelector(selector)
	}

	//call instance api to create pipeline task
	err = instance.CreatePipeline([]byte(scrollTask.ConfigString))
	if err != nil {
		log.Errorf("create scroll pipeline failed, err: %+v", err)
		return err
	}
	//err = instance.CreatePipeline(util.MustToJSONBytes(bulkTask.Config))
	//if err != nil {
	//	return err
	//}
	//save task info
	if taskItem.Metadata.Labels["is_split"] != true {
		err = orm.Create(nil, scrollTask)
		if err != nil {
			return fmt.Errorf("create scroll pipeline task error: %w", err)
		}
		err = orm.Create(nil, bulkTask)
		if err != nil {
			return fmt.Errorf("create bulk_indexing pipeline task error: %w", err)
		}
	} else {
		err = orm.Update(nil, scrollTask)
		if err != nil {
			return fmt.Errorf("update scroll pipeline task error: %w", err)
		}
		err = orm.Update(nil, bulkTask)
		if err != nil {
			return fmt.Errorf("update bulk_indexing pipeline task error: %w", err)
		}
	}
	taskItem.Metadata.Labels["is_split"] = true
	taskItem.Metadata.Labels["running_phase"] = 1
	//update dispatcher state
	instanceState := p.state[instance.ID]
	instanceState.Total = instanceState.Total + 1
	p.state[instance.ID] = instanceState
	//update sub migration task status to ready and save task log
	taskItem.Metadata.Labels["execution_instance_id"] = instance.ID
	taskItem.Metadata.Labels["index_docs"] = 0
	taskItem.Metadata.Labels["scrolled_docs"] = 0
	taskItem.Status = task2.StatusRunning
	taskItem.StartTimeInMillis = time.Now().UnixMilli()

	p.saveTaskAndWriteLog(taskItem, "wait_for", &task2.TaskResult{
		Success: true,
	}, fmt.Sprintf("task [%s] started", taskItem.ID))
	return nil
}

func getMapValue(m util.MapStr, key string) interface{} {
	v, _ := m.GetValue(key)
	return v
}

func (p *DispatcherProcessor) getPreferenceInstance(majorTaskID string) (instance model.Instance, err error) {
	majorTask := task2.Task{}
	majorTask.ID = majorTaskID
	_, err = orm.Get(&majorTask)
	if err != nil {
		log.Errorf("failed to get major task, err: %v", err)
		return
	}
	cfg := ClusterMigrationTaskConfig{}
	err = getTaskConfig(&majorTask, &cfg)
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
	majorTaskQ := util.MapStr{
		"bool": util.MapStr{
			"must": []util.MapStr{
				{
					"term": util.MapStr{
						"metadata.labels.business_id": "cluster_migration",
					},
				},
				{
					"terms": util.MapStr{
						"status": []string{task2.StatusReady, task2.StatusRunning, task2.StatusPendingStop},
					},
				},
			},
		},
	}
	subTaskQ := util.MapStr{
		"bool": util.MapStr{
			"must": []util.MapStr{
				{
					"term": util.MapStr{
						"metadata.labels.business_id": "index_migration",
					},
				},
				{
					"terms": util.MapStr{
						"status": []string{task2.StatusReady, task2.StatusRunning, task2.StatusPendingStop},
					},
				},
			},
		},
	}

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
				"should": []util.MapStr{
					majorTaskQ, subTaskQ,
				},
				"minimum_should_match": 1,
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
		writeLog(taskItem, taskResult, message)
	}
}

func writeLog(taskItem *task2.Task, taskResult *task2.TaskResult, message string) {
	labels := util.MapStr{}
	labels.Update(util.MapStr(taskItem.Metadata.Labels))
	labels["task_type"] = taskItem.Metadata.Type
	labels["task_id"] = taskItem.ID
	labels["parent_task_id"] = taskItem.ParentId
	labels["retry_no"] = taskItem.RetryTimes
	event.SaveLog(event.Event{
		Metadata: event.EventMetadata{
			Category: "task",
			Name:     "logging",
			Datatype: "event",
			Labels:   labels,
		},
		Fields: util.MapStr{
			"task": util.MapStr{
				"logging": util.MapStr{
					"config":  taskItem.ConfigString,
					"status":  taskItem.Status,
					"message": message,
					"result":  taskResult,
				},
			},
		},
	})
}

func (p *DispatcherProcessor) splitMajorMigrationTask(taskItem *task2.Task) error {
	if taskItem.Metadata.Labels == nil {
		return fmt.Errorf("empty metadata labels, unexpected cluster migration task: %s", util.MustToJSON(taskItem))
	}
	if taskItem.Metadata.Labels["is_split"] == true {
		return nil
	}
	if taskItem.Metadata.Labels["business_id"] != "cluster_migration" {
		log.Tracef("got unexpect task type of %s with task id [%s] in cluster migration processor", taskItem.Metadata.Type, taskItem.ID)
		return nil
	}

	clusterMigrationTask := ClusterMigrationTaskConfig{}
	err := getTaskConfig(taskItem, &clusterMigrationTask)
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
		source := IndexMigrationSourceConfig{
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

		target := IndexMigrationTargetConfig{
			ClusterId: clusterMigrationTask.Cluster.Target.Id,
			Bulk: IndexMigrationBulkConfig{
				BatchSizeInMB:        clusterMigrationTask.Settings.Bulk.StoreSizeInMB,
				BatchSizeInDocs:      clusterMigrationTask.Settings.Bulk.Docs,
				MaxWorkerSize:        clusterMigrationTask.Settings.Bulk.MaxWorkerSize,
				IdleTimeoutInSeconds: clusterMigrationTask.Settings.Bulk.IdleTimeoutInSeconds,
				SliceSize:            clusterMigrationTask.Settings.Bulk.SliceSize,
				Compress:             clusterMigrationTask.Settings.Bulk.Compress,
			},
		}
		indexParameters := IndexMigrationTaskConfig{
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

		if index.Partition != nil {
			partitionQ := &elastic.PartitionQuery{
				IndexName: index.Source.Name,
				FieldName: index.Partition.FieldName,
				FieldType: index.Partition.FieldType,
				Step:      index.Partition.Step,
				//Filter: index.RawFilter,
				Filter: source.QueryDSL,
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
				var must []interface{}

				if partition.Other {
					must = append(must, partition.Filter)
				} else {
					must = append(must, util.MapStr{
						"range": util.MapStr{
							index.Partition.FieldName: util.MapStr{
								"gte": partition.Start,
								"lt":  partition.End,
							},
						},
					})
				}

				if targetMust != nil {
					must = append(must, targetMust...)
				}
				partitionTarget := target
				if len(must) > 0 {
					partitionTarget.QueryDSL = util.MapStr{
						"query": util.MapStr{
							"bool": util.MapStr{
								"must": must,
							},
						},
					}
				}

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
					ConfigString: util.MustToJSON(IndexMigrationTaskConfig{
						Source:    partitionSource,
						Target:    partitionTarget,
						Execution: clusterMigrationTask.Settings.Execution,
					}),
				}
				partitionMigrationTask.ID = util.GetUUID()
				err = orm.Create(nil, &partitionMigrationTask)
				target.QueryDSL = nil
				if err != nil {
					return fmt.Errorf("store index migration task(partition) error: %w", err)
				}

			}
		} else {
			source.DocCount = index.Source.Docs
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

func (p *DispatcherProcessor) getTaskCompleteState(subTask *task2.Task) (*TaskCompleteState, error) {
	ptasks, err := p.getPipelineTasks(subTask.ID)
	if err != nil {
		log.Errorf("failed to get pipeline tasks, err: %v", err)
		return nil, err
	}
	var pids []string
	for _, t := range ptasks {
		pids = append(pids, t.ID)
	}

	if len(pids) == 0 {
		return nil, fmt.Errorf("pipeline task not found")
	}
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
						"terms": util.MapStr{
							"metadata.labels.task_id": pids,
						},
					},
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"gt": subTask.StartTimeInMillis - 30*1000,
							},
						},
					},
				},
			},
		},
	}
	esClient := elastic.GetClient(p.config.Elasticsearch)
	res, err := esClient.SearchWithRawQueryDSL(p.config.LogIndexName, util.MustToJSONBytes(query))
	if err != nil {
		log.Errorf("search task log from es failed, err: %v", err)
		return nil, err
	}
	cfg := IndexMigrationTaskConfig{}
	err = getTaskConfig(subTask, &cfg)
	if err != nil {
		log.Errorf("failed to get task config, err: %v", err)
		return nil, fmt.Errorf("got wrong config of task %v", *subTask)
	}
	totalDocs := cfg.Source.DocCount

	var (
		indexDocs    int64
		successDocs  int64
		scrolledDocs int64
		state        TaskCompleteState
	)
	state.TotalDocs = totalDocs
	state.PipelineIds = pids
	var bulked, scrolled bool
	for _, hit := range res.Hits.Hits {
		if bulked && scrolled {
			break
		}
		resultErr, _ := util.MapStr(hit.Source).GetValue("payload.pipeline.logging.result.error")
		if errStr, ok := resultErr.(string); ok && errStr != "" {
			state.Error = errStr
			state.IsComplete = true
		}
		if !bulked {
			for _, key := range []string{"payload.pipeline.logging.context.bulk_indexing.success.count", "payload.pipeline.logging.context.bulk_indexing.failure.count", "payload.pipeline.logging.context.bulk_indexing.invalid.count"} {
				v, err := util.MapStr(hit.Source).GetValue(key)
				if err == nil {
					bulked = true
					if fv, err := util.ExtractInt(v); err == nil {
						indexDocs += fv
						if key == "payload.pipeline.logging.context.bulk_indexing.success.count" {
							successDocs = fv
							state.SuccessDocs = successDocs
						}
					} else {
						log.Errorf("got %s but failed to extract, err: %v", key, err)
					}
				}
			}
		}

		if !scrolled {
			v, err := util.MapStr(hit.Source).GetValue("payload.pipeline.logging.context.es_scroll.scrolled_docs")
			if err == nil {
				scrolled = true
				if vv, err := util.ExtractInt(v); err == nil {
					scrolledDocs = vv
					state.ScrolledDocs = vv
				} else {
					log.Errorf("got payload.pipeline.logging.context.es_scroll.scrolled_docs but failed to extract, err: %v", err)
				}
			}
		}
	}
	if totalDocs == scrolledDocs {
		state.RunningPhase = 1
	}
	if (totalDocs == indexDocs || successDocs == totalDocs) && totalDocs == scrolledDocs {
		if successDocs != totalDocs {
			if state.Error == "" {
				if successDocs > 0 {
					state.Error = "partial complete"
				} else {
					state.Error = "invalid request"
				}
			}
		}
		state.IsComplete = true
		return &state, nil
	}
	//check instance is available
	if subTask.Metadata.Labels != nil {
		if instID, ok := subTask.Metadata.Labels["execution_instance_id"].(string); ok {
			inst := model.Instance{}
			inst.ID = instID
			_, err = orm.Get(&inst)
			if err != nil {
				log.Errorf("get instance failed, err: %v", err)
				return nil, err
			}
			err = inst.TryConnectWithTimeout(time.Second * 3)
			if err != nil && errors.Is(err, syscall.ECONNREFUSED) {
				state.Error = fmt.Errorf("instance [%s] is unavailable: %w", instID, err).Error()
				state.IsComplete = true
			}
		}
	}
	return &state, nil
}

func (p *DispatcherProcessor) getMajorTaskState(majorTask *task2.Task) (taskState MajorTaskState, err error) {
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
							"metadata.labels.business_id": util.MapStr{
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
	var (
		hasError bool
	)
	for _, bk := range res.Aggregations["grp"].Buckets {
		if bk["key"] == task2.StatusReady || bk["key"] == task2.StatusRunning {
			taskState.Status = task2.StatusRunning
			return taskState, nil
		}
		if bk["key"] == task2.StatusError {
			hasError = true
		}
	}
	if hasError {
		taskState.Status = task2.StatusError
	} else {
		taskState.Status = task2.StatusComplete
	}
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
							"metadata.labels.business_id": util.MapStr{
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
	config := ClusterMigrationTaskConfig{}
	err := getTaskConfig(taskItem, &config)
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
