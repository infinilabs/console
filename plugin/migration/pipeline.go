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
				log.Error("got migration task with empty labels, skip handling: %v", t)
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
				p.saveTaskAndWriteLog(&t, &task2.Log{
					ID:     util.GetUUID(),
					TaskId: t.ID,
					Status: task2.StatusError,
					Type:   t.Metadata.Type,
					Config: t.Config,
					Result: &task2.LogResult{
						Success: false,
						Error:   err.Error(),
					},
					Message:   fmt.Sprintf("failed to handling task [%s]: [%v]", t.ID, err),
					Timestamp: time.Now().UTC(),
				}, "")
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

	esClient := elastic.GetClient(p.config.Elasticsearch)
	_, err := esClient.UpdateByQuery(p.config.IndexName, util.MustToJSONBytes(queryDsl))
	if err != nil {
		return err
	}
	taskLog := &task2.Log{
		ID:     util.GetUUID(),
		TaskId: taskItem.ID,
		Status: task2.StatusRunning,
		Type:   taskItem.Metadata.Type,
		Config: taskItem.Config,
		Result: &task2.LogResult{
			Success: true,
		},
		Message:   fmt.Sprintf("success to start task [%s]", taskItem.ID),
		Timestamp: time.Now().UTC(),
	}
	taskItem.Status = task2.StatusRunning
	p.saveTaskAndWriteLog(taskItem, taskLog, "")
	return nil
}

func (p *DispatcherProcessor) handlePendingStopMajorTask(taskItem *task2.Task) error {
	//check whether all pipeline task is stopped or not, then update task status
	q := util.MapStr{
		"size": 200,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.business_id": "index_migration",
						},
					},
					{
						"terms": util.MapStr{
							"status": []string{task2.StatusRunning, task2.StatusPendingStop},
						},
					},
				},
			},
		},
	}
	tasks, err := p.getTasks(q)
	if err != nil {
		return err
	}
	// all subtask stopped or error or complete
	if len(tasks) == 0 {
		taskItem.Status = task2.StatusStopped
		p.saveTaskAndWriteLog(taskItem, &task2.Log{
			ID:        util.GetUUID(),
			TaskId:    taskItem.ID,
			Status:    task2.StatusStopped,
			Type:      taskItem.Metadata.Type,
			Config:    taskItem.Config,
			Message:   fmt.Sprintf("task [%s] is stopped", taskItem.ID),
			Timestamp: time.Now().UTC(),
		}, "")
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
		p.saveTaskAndWriteLog(taskItem, &task2.Log{
			ID:        util.GetUUID(),
			TaskId:    taskItem.ID,
			Status:    taskItem.Status,
			Type:      taskItem.Metadata.Type,
			Config:    taskItem.Config,
			Message:   fmt.Sprintf("task [%s] is complete", taskItem.ID),
			Timestamp: time.Now().UTC(),
		}, "")
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
			if instanceID, ok := taskItem.Metadata.Labels["execution_instance_id"].(string); ok {
				inst := model.Instance{}
				inst.ID = instanceID
				_, err = orm.Get(&inst)
				if err == nil {
					for _, pipelineID := range state.PipelineIds {
						err = inst.DeletePipeline(pipelineID)
						if err != nil {
							log.Error(err)
							continue
						}
						selector := util.MapStr{
							"labels": util.MapStr{
								"migration_task_id": taskItem.ID,
							},
						}
						//clear queue
						err = inst.DeleteQueueBySelector(selector)
						if err != nil {
							log.Error(err)
						}
					}
				}
				if st, ok := p.state[instanceID]; ok {
					st.Total -= 1
					p.state[instanceID] = st
				}
			}

		}
		if state.Error != "" && state.TotalDocs != state.SuccessDocs {
			taskItem.Status = task2.StatusError
		} else {
			taskItem.Status = task2.StatusComplete
		}

		tn := time.Now()
		taskItem.CompletedTime = &tn
		p.saveTaskAndWriteLog(taskItem, &task2.Log{
			ID:     util.GetUUID(),
			TaskId: taskItem.ID,
			Status: taskItem.Status,
			Type:   taskItem.Metadata.Type,
			Config: taskItem.Config,
			Result: &task2.LogResult{
				Success: state.Error == "",
				Error:   state.Error,
			},
			Message:   fmt.Sprintf("task [%s] is complete", taskItem.ID),
			Timestamp: time.Now().UTC(),
		}, "")
	} else {
		if state.RunningPhase == 1 && taskItem.Metadata.Labels["running_phase"] == float64(1) {
			ptasks, err := p.getPipelineTasks(taskItem.ID)
			if err != nil {
				return err
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
						return err
					}
					err = inst.CreatePipeline(util.MustToJSONBytes(bulkTask.Config))
					if err != nil {
						return err
					}
					taskItem.Metadata.Labels["running_phase"] = 2
				}
			}
			p.saveTaskAndWriteLog(taskItem, nil, "wait_for")
		}
	}
	return nil
}

func (p *DispatcherProcessor) handlePendingStopSubTask(taskItem *task2.Task) error {
	//check whether all pipeline task is stopped or not, then update task status
	ptasks, err := p.getPipelineTasks(taskItem.ID)
	if err != nil {
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
		return err
	}
	if len(searchRes.Hits.Hits) == 0 {
		//check instance available
		if instID, ok := taskItem.Metadata.Labels["execution_instance_id"].(string); ok {
			inst := model.Instance{}
			inst.ID = instID
			_, err = orm.Get(&inst)
			if err != nil {
				return err
			}
			err = inst.TryConnectWithTimeout(time.Second)
			if err != nil {
				if errors.Is(err, syscall.ECONNREFUSED) {
					return fmt.Errorf("stoping task [%s] error: %w", taskItem.ID, err)
				}
			}
		}
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
					return err
				}
				hasStopped := true
				for _, pipelineID := range taskIDs {
					err = inst.StopPipelineWithTimeout(pipelineID, time.Second)
					if err != nil {
						if !errors.Is(err, syscall.ECONNREFUSED) && !strings.Contains(err.Error(), "task not found") {
							hasStopped = false
							break
						}
						log.Error(err)
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

	//delete pipeline and clear queue
	if instanceID, ok := taskItem.Metadata.Labels["execution_instance_id"].(string); ok {
		inst := model.Instance{}
		inst.ID = instanceID
		_, err = orm.Get(&inst)
		if err != nil {
			return err
		}
		for _, pipelineID := range taskIDs {
			err = inst.DeletePipeline(pipelineID)
			if err != nil {
				log.Error(err)
				continue
			}
			selector := util.MapStr{
				"labels": util.MapStr{
					"migration_task_id": taskItem.ID,
				},
			}
			//clear queue
			err = inst.DeleteQueueBySelector(selector)
			if err != nil {
				log.Error(err)
			}
		}
		if st, ok := p.state[instanceID]; ok {
			st.Total -= 1
			p.state[instanceID] = st
		}
	}
	p.saveTaskAndWriteLog(taskItem, &task2.Log{
		ID:        util.GetUUID(),
		TaskId:    taskItem.ID,
		Status:    task2.StatusStopped,
		Type:      taskItem.Metadata.Type,
		Config:    taskItem.Config,
		Message:   fmt.Sprintf("task [%s] is stopped", taskItem.ID),
		Timestamp: time.Now().UTC(),
	}, "")
	return nil
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
			return err
		}
		for i, t := range ptasks {
			if t.Metadata.Labels != nil {
				if cfg, ok := ptasks[i].Config.(map[string]interface{}); ok {
					util.MapStr(cfg).Put("labels.retry_no", taskItem.RetryTimes+1)
				}
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
		var (
			cfg map[string]interface{}
			ok  bool
		)
		if cfg, ok = taskItem.Config.(map[string]interface{}); !ok {
			return fmt.Errorf("got wrong config [%v] with task [%s]", taskItem.Config, taskItem.ID)
		}
		cfgm := util.MapStr(cfg)
		var (
			sourceClusterID string
			targetClusterID string
		)
		if sourceClusterID, ok = getMapValue(cfgm, "source.cluster_id").(string); !ok {
			return fmt.Errorf("got wrong source cluster id of task [%v]", *taskItem)
		}
		if targetClusterID, ok = getMapValue(cfgm, "target.cluster_id").(string); !ok {
			return fmt.Errorf("got wrong target cluster id of task [%v]", *taskItem)
		}
		esConfig := elastic.GetConfig(sourceClusterID)
		esTargetConfig := elastic.GetConfig(targetClusterID)
		docType := common.GetClusterDocType(targetClusterID)
		if len(taskItem.ParentId) == 0 {
			return fmt.Errorf("got wrong parent id of task [%v]", *taskItem)
		}
		queryDsl := getMapValue(cfgm, "source.query_dsl")
		scrollQueryDsl := util.MustToJSON(util.MapStr{
			"query": queryDsl,
		})
		indexName := getMapValue(cfgm, "source.indices")
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
			Config: util.MapStr{
				"name": scrollID,
				"logging": util.MapStr{
					"enabled": true,
				},
				"labels": util.MapStr{
					"parent_task_id":    pids,
					"unique_index_name": taskItem.Metadata.Labels["unique_index_name"],
					"retry_no":          taskItem.RetryTimes,
				},
				"auto_start":   true,
				"keep_running": false,
				"processor": []util.MapStr{
					{
						"es_scroll": util.MapStr{
							"remove_type":   docType == "",
							"slice_size":    getMapValue(cfgm, "source.slice_size"),
							"batch_size":    getMapValue(cfgm, "source.batch_size"),
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
							"scroll_time":    getMapValue(cfgm, "source.scroll_time"),
							"query_dsl":      scrollQueryDsl,
							"index_rename":   getMapValue(cfgm, "source.index_rename"),
							"type_rename":    getMapValue(cfgm, "source.type_rename"),
						},
					},
				},
			},
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
			Config: util.MapStr{
				"name": bulkID,
				"logging": util.MapStr{
					"enabled": true,
				},
				"labels": util.MapStr{
					"parent_task_id":    pids,
					"unique_index_name": taskItem.Metadata.Labels["unique_index_name"],
					"retry_no":          taskItem.RetryTimes,
				},
				"auto_start":   true,
				"keep_running": false,
				"processor": []util.MapStr{
					{
						"bulk_indexing": util.MapStr{
							"detect_active_queue": false,
							"bulk": util.MapStr{
								"batch_size_in_mb":   getMapValue(cfgm, "target.bulk.batch_size_in_mb"),
								"batch_size_in_docs": getMapValue(cfgm, "target.bulk.batch_size_in_docs"),
								"invalid_queue":      "bulk_indexing_400",
								//"retry_rules": util.MapStr{
								//	"default": false,
								//	"retry_4xx": false,
								//	"retry_429": true,
								//},
							},
							"max_worker_size":         getMapValue(cfgm, "target.bulk.max_worker_size"),
							"num_of_slices":           getMapValue(cfgm, "target.bulk.slice_size"),
							"idle_timeout_in_seconds": getMapValue(cfgm, "target.bulk.idle_timeout_in_seconds"),
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
			},
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
	err = instance.CreatePipeline(util.MustToJSONBytes(scrollTask.Config))
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

	taskLog := &task2.Log{
		ID:     util.GetUUID(),
		TaskId: taskItem.ID,
		Status: task2.StatusRunning,
		Type:   taskItem.Metadata.Type,
		Config: taskItem.Config,
		Result: &task2.LogResult{
			Success: true,
		},
		Message:   fmt.Sprintf("dispatch task [%s] to instance ", taskItem.ID),
		Timestamp: time.Now().UTC(),
	}
	p.saveTaskAndWriteLog(taskItem, taskLog, "wait_for")
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
		return
	}
	cfg := ElasticDataConfig{}
	buf, err := util.ToJSONBytes(majorTask.Config)
	if err != nil {
		return
	}
	err = util.FromJSONBytes(buf, &cfg)
	if err != nil {
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
					log.Error(err)
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

func (p *DispatcherProcessor) saveTaskAndWriteLog(taskItem *task2.Task, logItem *task2.Log, refresh string) {
	esClient := elastic.GetClient(p.config.Elasticsearch)
	_, err := esClient.Index(p.config.IndexName, "", taskItem.ID, taskItem, refresh)
	if err != nil {
		log.Error(err)
	}
	if logItem != nil {
		event.SaveLog(event.Event{
			Metadata: event.EventMetadata{
				Category: "migration",
				Name:     "logging",
				Datatype: "event",
				Labels: util.MapStr{
					"task_id":        logItem.TaskId,
					"parent_task_id": taskItem.ParentId,
					"retry_no":       taskItem.RetryTimes,
				},
			},
			Fields: util.MapStr{
				"migration": util.MapStr{
					"logging": util.MapStr{
						"config":  logItem.Config,
						"context": logItem.Context,
						"status":  logItem.Status,
						"message": logItem.Message,
						"result":  logItem.Result,
					},
				},
			},
		})
	}
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

	buf := util.MustToJSONBytes(taskItem.Config)
	clusterMigrationTask := ElasticDataConfig{}
	err := util.FromJSONBytes(buf, &clusterMigrationTask)
	if err != nil {
		return err
	}
	defer func() {
		taskItem.Config = clusterMigrationTask
	}()
	esSourceClient := elastic.GetClient(clusterMigrationTask.Cluster.Source.Id)
	targetType := common.GetClusterDocType(clusterMigrationTask.Cluster.Target.Id)

	for _, index := range clusterMigrationTask.Indices {
		source := util.MapStr{
			"cluster_id":  clusterMigrationTask.Cluster.Source.Id,
			"indices":     index.Source.Name,
			"slice_size":  clusterMigrationTask.Settings.Scroll.SliceSize,
			"batch_size":  clusterMigrationTask.Settings.Scroll.Docs,
			"scroll_time": clusterMigrationTask.Settings.Scroll.Timeout,
		}
		if index.IndexRename != nil {
			source["index_rename"] = index.IndexRename
		}
		if index.Target.Name != "" {
			source["index_rename"] = util.MapStr{
				index.Source.Name: index.Target.Name,
			}
		}
		if index.TypeRename != nil {
			source["type_rename"] = index.TypeRename
		}

		if v, ok := index.RawFilter.(string); ok {
			source["query_string"] = v
		} else {
			var must []interface{}
			if index.RawFilter != nil {
				must = append(must, index.RawFilter)
			}
			if index.Source.DocType != "" {
				if index.Target.DocType != "" {
					source["type_rename"] = util.MapStr{
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
					source["type_rename"] = util.MapStr{
						"*": index.Target.DocType,
					}
				}
			}
			if len(must) > 0 {
				source["query_dsl"] = util.MapStr{
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

		target := util.MapStr{
			"cluster_id": clusterMigrationTask.Cluster.Target.Id,
			"bulk": util.MapStr{
				"batch_size_in_mb":        clusterMigrationTask.Settings.Bulk.StoreSizeInMB,
				"batch_size_in_docs":      clusterMigrationTask.Settings.Bulk.Docs,
				"max_worker_size":         clusterMigrationTask.Settings.Bulk.MaxWorkerSize,
				"idle_timeout_in_seconds": clusterMigrationTask.Settings.Bulk.IdleTimeoutInSeconds,
				"slice_size":              clusterMigrationTask.Settings.Bulk.SliceSize,
			},
		}
		indexParameters := util.MapStr{
			"source": source,
			"target": target,
		}
		indexMigrationTask := task2.Task{
			ParentId:          []string{taskItem.ID},
			Cancellable:       true,
			Runnable:          false,
			Status:            task2.StatusReady,
			StartTimeInMillis: time.Now().UnixMilli(),
			Metadata: task2.Metadata{
				Type: "pipeline",
				Labels: util.MapStr{
					"business_id":       "index_migration",
					"source_cluster_id": clusterMigrationTask.Cluster.Source.Id,
					"target_cluster_id": clusterMigrationTask.Cluster.Target.Id,
					"partition_count":   1,
					"index_name":        index.Source.Name,
					"unique_index_name": index.Source.GetUniqueIndexName(),
				},
			},
			Config: indexParameters,
		}

		indexMigrationTask.ID = util.GetUUID()

		if index.Partition != nil {
			partitionQ := &elastic.PartitionQuery{
				IndexName: index.Source.Name,
				FieldName: index.Partition.FieldName,
				FieldType: index.Partition.FieldType,
				Step:      index.Partition.Step,
				//Filter: index.RawFilter,
				Filter: source["query_dsl"],
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
				partitionSource := util.MapStr{
					"start":        partition.Start,
					"end":          partition.End,
					"doc_count":    partition.Docs,
					"step":         index.Partition.Step,
					"partition_id": partitionID,
				}
				for k, v := range source {
					if k == "query_string" {
						continue
					}
					partitionSource[k] = v
				}
				partitionSource["query_dsl"] = partition.Filter
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
				if len(must) > 0 {
					target["query_dsl"] = util.MapStr{
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
						Type: "pipeline",
						Labels: util.MapStr{
							"business_id":       "index_migration",
							"source_cluster_id": clusterMigrationTask.Cluster.Source.Id,
							"target_cluster_id": clusterMigrationTask.Cluster.Target.Id,
							"index_name":        index.Source.Name,
							"unique_index_name": index.Source.GetUniqueIndexName(),
						},
					},
					Config: util.MapStr{
						"source":    partitionSource,
						"target":    target,
						"execution": clusterMigrationTask.Settings.Execution,
					},
				}
				partitionMigrationTask.ID = util.GetUUID()
				err = orm.Create(nil, &partitionMigrationTask)
				delete(target, "query_dsl")
				if err != nil {
					return fmt.Errorf("store index migration task(partition) error: %w", err)
				}

			}
		} else {
			source["doc_count"] = index.Source.Docs
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
	var (
		cfg map[string]interface{}
		ok  bool
	)
	if cfg, ok = subTask.Config.(map[string]interface{}); !ok {
		return nil, fmt.Errorf("got wrong config of task %v", *subTask)
	}
	totalDocs, err := util.MapStr(cfg).GetValue("source.doc_count")
	if err != nil {
		log.Errorf("failed to get source.doc_count, err: %v", err)
		return nil, err
	}

	var (
		indexDocs    float64
		successDocs  float64
		scrolledDocs interface{}
		state        TaskCompleteState
	)
	state.TotalDocs = totalDocs
	state.PipelineIds = pids
	for _, hit := range res.Hits.Hits {
		resultErr, _ := util.MapStr(hit.Source).GetValue("payload.pipeline.logging.result.error")
		if errStr, ok := resultErr.(string); ok && errStr != "" {
			state.Error = errStr
			state.IsComplete = true
			state.ClearPipeline = true
		}
		for _, key := range []string{"payload.pipeline.logging.context.bulk_indexing.success.count", "payload.pipeline.logging.context.bulk_indexing.failure.count", "payload.pipeline.logging.context.bulk_indexing.invalid.count"} {
			v, err := util.MapStr(hit.Source).GetValue(key)
			if err == nil {
				if fv, ok := v.(float64); ok {
					indexDocs += fv
					if key == "payload.pipeline.logging.context.bulk_indexing.success.count" {
						successDocs = fv
						state.SuccessDocs = successDocs
					}
				}
			} else {
				break
			}
		}
		v, err := util.MapStr(hit.Source).GetValue("payload.pipeline.logging.context.es_scroll.scrolled_docs")
		if err == nil {
			scrolledDocs = v
			if vv, ok := v.(float64); ok {
				state.ScrolledDocs = vv
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
		return taskState, err
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
