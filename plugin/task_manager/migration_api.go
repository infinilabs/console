package task_manager

import (
	"fmt"
	"net/http"
	"time"

	log "github.com/cihub/seelog"

	"infini.sh/console/plugin/task_manager/cluster_migration"
	migration_model "infini.sh/console/plugin/task_manager/model"
	migration_util "infini.sh/console/plugin/task_manager/util"

	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

func (h *APIHandler) createDataMigrationTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterTaskConfig := &migration_model.ClusterMigrationTaskConfig{}
	err := h.DecodeJSON(req, clusterTaskConfig)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	user, err := rbac.FromUserContext(req.Context())
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	t, err := cluster_migration.CreateTask(clusterTaskConfig, user)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteCreatedOKJSON(w, t.ID)
}

func (h *APIHandler) getDataMigrationTaskInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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
	taskConfig := &migration_model.ClusterMigrationTaskConfig{}
	err = migration_util.GetTaskConfig(&obj, taskConfig)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, indexState, err := h.getMigrationMajorTaskInfo(id)
	if err != nil {
		log.Errorf("failed to get major task info, err: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var completedIndices int
	for i, index := range taskConfig.Indices {
		indexName := index.Source.GetUniqueIndexName()
		count := indexState[indexName].IndexDocs
		sourceDocs := index.Source.Docs
		var percent float64
		if sourceDocs <= 0 {
			percent = 100
		}else{
			percent = float64(count) / float64(sourceDocs) * 100
			if percent > 100 {
				percent = 100
			}
		}
		//taskConfig.Indices[i].Source.Docs = sourceDocs
		taskConfig.Indices[i].Target.Docs = count
		taskConfig.Indices[i].Percent = util.ToFixed(percent, 2)
		taskConfig.Indices[i].ErrorPartitions = indexState[indexName].ErrorPartitions
		if count == index.Source.Docs {
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

	_, repeatStatus, err := h.calcRepeatingStatus(&obj)
	if err != nil {
		log.Warnf("failed to calc repeat info, err: %v", err)
	}
	obj.Metadata.Labels["repeat"] = repeatStatus

	obj.ConfigString = util.MustToJSON(taskConfig)
	obj.Metadata.Labels["completed_indices"] = completedIndices
	h.WriteJSON(w, obj, http.StatusOK)
}

func (h *APIHandler) getDataMigrationTaskOfIndex(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("task_id")
	uniqueIndexName := ps.MustGetParameter("index")
	majorTask := task.Task{}
	majorTask.ID = id
	exists, err := orm.Get(&majorTask)
	if !exists || err != nil {
		h.WriteError(w, fmt.Sprintf("task [%s] not found", id), http.StatusInternalServerError)
		return
	}

	taskConfig := &migration_model.ClusterMigrationTaskConfig{}
	err = migration_util.GetTaskConfig(&majorTask, taskConfig)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	taskInfo := &TaskInfoResponse{
		TaskID:    id,
		StartTime: majorTask.StartTimeInMillis,
		Repeating: migration_util.IsRepeating(taskConfig.Settings.Execution.Repeat, majorTask.Metadata.Labels),
	}

	subTasks, pipelineTaskIDs, pipelineSubParentIDs, parentIDPipelineTasks, err := h.getChildTaskInfosByIndex(id, uniqueIndexName)

	taskInfo.DataPartition = len(subTasks)
	if len(subTasks) == 0 {
		h.WriteJSON(w, taskInfo, http.StatusOK)
		return
	}

	var scrollStats = map[string]int64{}
	var bulkStats = map[string]int64{}
	pipelineContexts := h.getChildPipelineInfosFromGateway(pipelineTaskIDs)
	for pipelineID, pipelineContext := range pipelineContexts {
		if pid, ok := pipelineSubParentIDs[pipelineID]; ok {
			if vv := migration_util.GetMapIntValue(pipelineContext, "es_scroll.scrolled_docs"); vv > 0 {
				scrollStats[pid] = vv
			}
			if vv := migration_util.GetMapIntValue(pipelineContext, "bulk_indexing.success.count"); vv > 0 {
				bulkStats[pid] = vv
			}
		}
	}

	startTime, completedTime, duration, completedPartitions := h.calcMajorTaskInfo(subTasks, taskInfo.Repeating)

	var partitionTaskInfos []util.MapStr

	for i, ptask := range subTasks {
		cfg := migration_model.IndexMigrationTaskConfig{}
		err := migration_util.GetTaskConfig(&ptask, &cfg)
		if err != nil {
			log.Errorf("failed to get task config, err: %v", err)
			continue
		}
		if i == 0 {
			taskInfo.Step = cfg.Source.Step
		}

		var durationInMS int64
		var subCompletedTime int64
		if ptask.StartTimeInMillis > 0 {
			if migration_util.IsPendingState(ptask.Status) {
				durationInMS = time.Now().UnixMilli() - ptask.StartTimeInMillis
			} else if ptask.CompletedTime != nil {
				subCompletedTime = ptask.CompletedTime.UnixMilli()
				durationInMS = subCompletedTime - ptask.StartTimeInMillis
			}
		}
		var (
			scrollDocs int64
			indexDocs  int64
		)
		ptaskLabels := util.MapStr(ptask.Metadata.Labels)
		if vv, ok := scrollStats[ptask.ID]; ok {
			scrollDocs = vv
		} else {
			scrollDocs = migration_util.GetMapIntValue(ptaskLabels, "scrolled_docs")
		}
		if vv, ok := bulkStats[ptask.ID]; ok {
			indexDocs = vv
		} else {
			indexDocs = migration_util.GetMapIntValue(ptaskLabels, "index_docs")
		}

		partitionTotalDocs := cfg.Source.DocCount
		partitionTaskInfo := util.MapStr{
			"task_id":        ptask.ID,
			"status":         ptask.Status,
			"start_time":     ptask.StartTimeInMillis,
			"completed_time": subCompletedTime,
			"start":          cfg.Source.Start,
			"end":            cfg.Source.End,
			"duration":       durationInMS,
			"scroll_docs":    scrollDocs,
			"index_docs":     indexDocs,
			"total_docs":     partitionTotalDocs,
		}
		scrollTask, bulkTask := migration_util.SplitIndexMigrationTasks(parentIDPipelineTasks[ptask.ID])
		if scrollTask != nil {
			partitionTaskInfo["scroll_task"] = util.MapStr{
				"id":     scrollTask.ID,
				"status": scrollTask.Status,
			}
		}
		if bulkTask != nil {
			partitionTaskInfo["bulk_task"] = util.MapStr{
				"id":     bulkTask.ID,
				"status": bulkTask.Status,
			}
		}
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

type MigrationIndexStateInfo struct {
	ErrorPartitions int
	IndexDocs       int64
	SourceDocs      int64
}

/*
We count data from two sources:
  - index_migrations with complete/error status
  - plus index_migration.index_docs with realtime bulk indexing info
  - realtime bulk indexing info is only available for running index_migrations
*/
func (h *APIHandler) getMigrationMajorTaskInfo(id string) (taskStats migration_model.ClusterMigrationTaskState, indexState map[string]MigrationIndexStateInfo, err error) {
	var pipelineTaskIDs = map[string][]string{}
	var pipelineIndexNames = map[string]string{}
	indexState = map[string]MigrationIndexStateInfo{}
	const size = 500
	var (
		from = -size
		hasMore = true
	)
	for hasMore {
		from += size
		taskQuery := util.MapStr{
			"from": from,
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
							"term": util.MapStr{
								"parent_id": util.MapStr{
									"value": id,
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
		subTasks, err := migration_util.GetTasks(taskQuery)
		if err != nil {
			return taskStats, indexState, err
		}
		if len(subTasks) < size {
			hasMore = false
		}

		var indexMigrationTaskIDs []string
		for _, subTask := range subTasks {
			taskLabels := util.MapStr(subTask.Metadata.Labels)
			indexName := migration_util.GetMapStringValue(taskLabels, "unique_index_name")
			if indexName == "" {
				continue
			}

			cfg := migration_model.IndexMigrationTaskConfig{}
			err = migration_util.GetTaskConfig(&subTask, &cfg)
			if err != nil {
				log.Errorf("failed to get task config, err: %v", err)
				continue
			}

			taskStats.SourceDocs += cfg.Source.DocCount
			st := indexState[indexName]
			st.SourceDocs += cfg.Source.DocCount
			indexState[indexName] = st

			if subTask.Status == task.StatusRunning {
				indexMigrationTaskIDs = append(indexMigrationTaskIDs, subTask.ID)
				continue
			}

			indexDocs := migration_util.GetMapIntValue(taskLabels, "index_docs")
			taskStats.IndexDocs += indexDocs
			st.IndexDocs += indexDocs
			if subTask.Status == task.StatusError {
				st.ErrorPartitions += 1
				taskStats.ErrorPartitions += 1
			}
			indexState[indexName] = st
			indexMigrationTaskIDs = append(indexMigrationTaskIDs, subTask.ID)
		}

		if len(indexMigrationTaskIDs) == 0 {
			continue
		}

		taskQuery = util.MapStr{
			"size": len(indexMigrationTaskIDs),
			"query": util.MapStr{
				"bool": util.MapStr{
					"must": []util.MapStr{
						{
							"terms": util.MapStr{
								"parent_id": indexMigrationTaskIDs,
							},
						},
						{
							"term": util.MapStr{
								"metadata.labels.pipeline_id": util.MapStr{
									"value": "bulk_indexing",
								},
							},
						},
					},
				},
			},
		}
		subTasks, err = migration_util.GetTasks(taskQuery)
		if err != nil {
			return taskStats, indexState, err
		}

		for _, subTask := range subTasks {
			taskLabels := util.MapStr(subTask.Metadata.Labels)
			indexName := migration_util.GetMapStringValue(taskLabels, "unique_index_name")
			if indexName == "" {
				continue
			}

			pipelineIndexNames[subTask.ID] = indexName

			if instID := migration_util.GetMapStringValue(taskLabels, "execution_instance_id"); instID != "" {
				pipelineTaskIDs[instID] = append(pipelineTaskIDs[instID], subTask.ID)
			}
		}
	}

	pipelineContexts := h.getChildPipelineInfosFromGateway(pipelineTaskIDs)
	for pipelineID, pipelineContext := range pipelineContexts {
		// add indexDocs of running tasks
		indexDocs := migration_util.GetMapIntValue(pipelineContext, "bulk_indexing.success.count")
		taskStats.IndexDocs += indexDocs
		indexName := pipelineIndexNames[pipelineID]
		st := indexState[indexName]
		st.IndexDocs += indexDocs
		indexState[indexName] = st
	}
	return taskStats, indexState, nil
}
