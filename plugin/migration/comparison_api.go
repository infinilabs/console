package migration

import (
	"fmt"
	"net/http"
	"time"

	log "github.com/cihub/seelog"

	migration_model "infini.sh/console/plugin/migration/model"
	migration_util "infini.sh/console/plugin/migration/util"

	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

func (h *APIHandler) createDataComparisonTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterTaskConfig := &migration_model.ClusterComparisonTaskConfig{}
	err := h.DecodeJSON(req, clusterTaskConfig)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(clusterTaskConfig.Indices) == 0 {
		h.WriteError(w, "indices must not be empty", http.StatusInternalServerError)
		return
	}
	user, err := rbac.FromUserContext(req.Context())
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user != nil {
		clusterTaskConfig.Creator.Name = user.Username
		clusterTaskConfig.Creator.Id = user.UserId
	}

	var sourceTotalDocs int64
	var targetTotalDocs int64
	for _, index := range clusterTaskConfig.Indices {
		sourceTotalDocs += index.Source.Docs
		targetTotalDocs += index.Target.Docs
	}

	srcClusterCfg := elastic.GetConfig(clusterTaskConfig.Cluster.Source.Id)
	clusterTaskConfig.Cluster.Source.Distribution = srcClusterCfg.Distribution
	dstClusterCfg := elastic.GetConfig(clusterTaskConfig.Cluster.Target.Id)
	clusterTaskConfig.Cluster.Target.Distribution = dstClusterCfg.Distribution
	t := task.Task{
		Metadata: task.Metadata{
			Type: "cluster_comparison",
			Labels: util.MapStr{
				"business_id":       "cluster_comparison",
				"source_cluster_id": clusterTaskConfig.Cluster.Source.Id,
				"target_cluster_id": clusterTaskConfig.Cluster.Target.Id,
				"source_total_docs": sourceTotalDocs,
				"target_total_docs": targetTotalDocs,
			},
		},
		Cancellable:  true,
		Runnable:     false,
		Status:       task.StatusInit,
		ConfigString: util.MustToJSON(clusterTaskConfig),
	}
	t.ID = util.GetUUID()
	err = orm.Create(nil, &t)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	h.WriteCreatedOKJSON(w, t.ID)
}

func (h *APIHandler) getDataComparisonTaskInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("task_id")

	obj := task.Task{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	taskConfig := &migration_model.ClusterComparisonTaskConfig{}
	err = migration_util.GetTaskConfig(&obj, taskConfig)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, indexState, err := h.getComparisonMajorTaskInfo(id)
	if err != nil {
		log.Errorf("failed to get major task info, err: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var completedIndices int
	for i, index := range taskConfig.Indices {
		indexName := index.Source.GetUniqueIndexName()
		count := indexState[indexName].SourceScrollDocs + indexState[indexName].TargetScrollDocs
		percent := float64(count) / float64(index.Source.Docs+index.Target.Docs) * 100
		if percent > 100 {
			percent = 100
		}
		taskConfig.Indices[i].ScrollPercent = util.ToFixed(percent, 2)
		taskConfig.Indices[i].ErrorPartitions = indexState[indexName].ErrorPartitions
		if count == index.Source.Docs+index.Target.Docs {
			completedIndices++
		}
	}
	cfg := global.MustLookup("cluster_migration_config")
	if migrationConfig, ok := cfg.(*DispatcherConfig); ok {
		if obj.Metadata.Labels == nil {
			obj.Metadata.Labels = util.MapStr{}
		}
		obj.Metadata.Labels["log_info"] = util.MapStr{
			"cluster_id": migrationConfig.Elasticsearch,
			"index_name": migrationConfig.LogIndexName,
		}
	}
	obj.ConfigString = util.MustToJSON(taskConfig)
	obj.Metadata.Labels["completed_indices"] = completedIndices
	h.WriteJSON(w, obj, http.StatusOK)
}

type ComparisonIndexStateInfo struct {
	ErrorPartitions  int
	SourceScrollDocs int64
	TargetScrollDocs int64
}

// TODO: calc realtime info from instance
func (h *APIHandler) getComparisonMajorTaskInfo(majorTaskID string) (taskStats migration_model.ClusterComparisonTaskState, indexState map[string]ComparisonIndexStateInfo, err error) {
	taskQuery := util.MapStr{
		"size": 500,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"parent_id": util.MapStr{
								"value": majorTaskID,
							},
						},
					},
					{
						"bool": util.MapStr{
							"minimum_should_match": 1,
							"should": []util.MapStr{
								{
									"term": util.MapStr{
										"metadata.labels.pipeline_id": util.MapStr{
											"value": "dump_hash",
										},
									},
								},
								{
									"bool": util.MapStr{
										"must": []util.MapStr{
											{
												"term": util.MapStr{
													"metadata.type": util.MapStr{
														"value": "index_comparison",
													},
												},
											},
											{
												"terms": util.MapStr{
													"status": []string{task.StatusComplete, task.StatusError},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}
	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(taskQuery),
	}
	err, result := orm.Search(task.Task{}, q)
	if err != nil {
		return taskStats, indexState, err
	}

	var pipelineIndexNames = map[string]string{}
	indexState = map[string]ComparisonIndexStateInfo{}
	for _, row := range result.Result {
		buf := util.MustToJSONBytes(row)
		subTask := task.Task{}
		err := util.FromJSONBytes(buf, &subTask)
		if err != nil {
			log.Errorf("failed to unmarshal task, err: %v", err)
			continue
		}
		if subTask.Metadata.Labels == nil {
			continue
		}
		taskLabels := util.MapStr(subTask.Metadata.Labels)
		indexName := migration_util.GetMapStringValue(taskLabels, "unique_index_name")
		if indexName == "" {
			continue
		}

		// add indexDocs of already complete/error
		if subTask.Metadata.Type == "index_comparison" {
			sourceDocs := migration_util.GetMapIntValue(taskLabels, "source_scrolled")
			targetDocs := migration_util.GetMapIntValue(taskLabels, "target_scrolled")
			taskStats.SourceScrollDocs += sourceDocs
			taskStats.TargetScrollDocs += targetDocs
			st := indexState[indexName]
			st.SourceScrollDocs += sourceDocs
			st.TargetScrollDocs += targetDocs
			if subTask.Status == task.StatusError {
				st.ErrorPartitions += 1
			}
			indexState[indexName] = st
			continue
		}
		pipelineIndexNames[subTask.ID] = indexName
	}

	return taskStats, indexState, nil
}

func (h *APIHandler) getDataComparisonTaskOfIndex(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("task_id")
	uniqueIndexName := ps.MustGetParameter("index")
	majorTask := task.Task{}
	majorTask.ID = id
	exists, err := orm.Get(&majorTask)
	if !exists || err != nil {
		h.WriteError(w, fmt.Sprintf("task [%s] not found", id), http.StatusInternalServerError)
		return
	}

	taskInfo := &TaskInfoResponse{
		TaskID:    id,
		StartTime: majorTask.StartTimeInMillis,
	}

	subTasks, pipelineTaskIDs, _, parentIDPipelineTasks, err := h.getChildTaskInfosByIndex(&majorTask, uniqueIndexName)

	taskInfo.DataPartition = len(subTasks)
	if len(subTasks) == 0 {
		h.WriteJSON(w, taskInfo, http.StatusOK)
		return
	}

	pipelineContexts := h.getChildPipelineInfosFromGateway(pipelineTaskIDs)
	startTime, completedTime, duration, completedPartitions := h.calcMajorTaskInfo(subTasks)

	var partitionTaskInfos []util.MapStr

	for i, subTask := range subTasks {
		cfg := migration_model.IndexComparisonTaskConfig{}
		err := migration_util.GetTaskConfig(&subTask, &cfg)
		if err != nil {
			log.Errorf("failed to get task config, err: %v", err)
			continue
		}
		if i == 0 {
			taskInfo.Step = cfg.Source.Step
		}

		var durationInMS int64
		var subCompletedTime int64
		if subTask.StartTimeInMillis > 0 {
			if migration_util.IsPendingState(subTask.Status) {
				durationInMS = time.Now().UnixMilli() - subTask.StartTimeInMillis
			} else if subTask.CompletedTime != nil {
				subCompletedTime = subTask.CompletedTime.UnixMilli()
				durationInMS = subCompletedTime - subTask.StartTimeInMillis
			}
		}
		subTaskLabels := util.MapStr(subTask.Metadata.Labels)
		sourceScrollDocs := migration_util.GetMapIntValue(subTaskLabels, "source_scrolled")
		targetScrollDocs := migration_util.GetMapIntValue(subTaskLabels, "target_scrolled")

		partitionTaskInfo := util.MapStr{
			"task_id":           subTask.ID,
			"status":            subTask.Status,
			"start_time":        subTask.StartTimeInMillis,
			"completed_time":    subCompletedTime,
			"start":             cfg.Source.Start,
			"end":               cfg.Source.End,
			"duration":          durationInMS,
			"source_total_docs": cfg.Source.DocCount,
			"target_total_docs": cfg.Target.DocCount,
		}
		sourceDumpTask, targetDumpTask, _ := migration_util.SplitIndexComparisonTasks(parentIDPipelineTasks[subTask.ID], &cfg)
		if sourceDumpTask != nil {
			partitionTaskInfo["source_scroll_task"] = util.MapStr{
				"id":     sourceDumpTask.ID,
				"status": sourceDumpTask.Status,
			}
			pipelineID := sourceDumpTask.ID
			pipelineContext, ok := pipelineContexts[pipelineID]
			if ok {
				if vv := migration_util.GetMapIntValue(pipelineContext, "dump_hash.scrolled_docs"); vv > 0 {
					sourceScrollDocs = vv
				}
			}
		}
		if targetDumpTask != nil {
			partitionTaskInfo["target_scroll_task"] = util.MapStr{
				"id":     targetDumpTask.ID,
				"status": targetDumpTask.Status,
			}
			pipelineID := targetDumpTask.ID
			pipelineContext, ok := pipelineContexts[pipelineID]
			if ok {
				if vv := migration_util.GetMapIntValue(pipelineContext, "dump_hash.scrolled_docs"); vv > 0 {
					targetScrollDocs = vv
				}
			}
		}
		partitionTaskInfo["source_scroll_docs"] = sourceScrollDocs
		partitionTaskInfo["target_scroll_docs"] = targetScrollDocs
		partitionTaskInfos = append(partitionTaskInfos, partitionTaskInfo)
	}
	taskInfo.CompletedTime = completedTime
	taskInfo.Duration = duration
	// NOTE: overwrite major task start time with the first started sub task
	if taskInfo.StartTime == 0 {
		taskInfo.StartTime = startTime
	}
	taskInfo.Partitions = partitionTaskInfos
	taskInfo.CompletedPartitions = completedPartitions
	h.WriteJSON(w, taskInfo, http.StatusOK)
}
