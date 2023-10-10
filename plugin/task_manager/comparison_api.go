package task_manager

import (
	"fmt"
	"net/http"
	"time"

	log "github.com/cihub/seelog"

	"infini.sh/console/plugin/task_manager/cluster_comparison"
	migration_model "infini.sh/console/plugin/task_manager/model"
	migration_util "infini.sh/console/plugin/task_manager/util"

	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
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
	user, err := rbac.FromUserContext(req.Context())
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	t, err := cluster_comparison.CreateTask(clusterTaskConfig, user)
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
		count := indexState[indexName].TotalScrollDocs
		percent := float64(count) / float64(index.Source.Docs+index.Target.Docs) * 100
		if percent > 100 {
			percent = 100
		}
		taskConfig.Indices[i].Source.Docs = indexState[indexName].SourceTotalDocs
		taskConfig.Indices[i].Target.Docs = indexState[indexName].TargetTotalDocs
		taskConfig.Indices[i].ScrollPercent = util.ToFixed(percent, 2)
		taskConfig.Indices[i].TotalScrollDocs = count
		taskConfig.Indices[i].ErrorPartitions = indexState[indexName].ErrorPartitions
		taskConfig.Indices[i].RunningChildren = indexState[indexName].RunningChildren
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

	_, repeatStatus, err := h.calcRepeatingStatus(&obj)
	if err != nil {
		log.Warnf("failed to calc repeat info, err: %v", err)
	}
	obj.Metadata.Labels["repeat"] = repeatStatus

	obj.ConfigString = util.MustToJSON(taskConfig)
	obj.Metadata.Labels["completed_indices"] = completedIndices
	h.WriteJSON(w, obj, http.StatusOK)
}

type ClusterComparisonTaskState struct {
	SourceTotalDocs  int64
	SourceScrollDocs int64
	TargetTotalDocs  int64
	TargetScrollDocs int64
	TotalDiffDocs    int64
	RunningChildren int
}

type ComparisonIndexStateInfo struct {
	ErrorPartitions  int
	SourceTotalDocs  int64
	SourceScrollDocs int64
	TargetTotalDocs  int64
	TargetScrollDocs int64
	TotalDiffDocs    int64
	RunningChildren int
	TotalScrollDocs int64
}

func (h *APIHandler) getComparisonMajorTaskInfo(taskID string) (taskStats ClusterComparisonTaskState, indexState map[string]ComparisonIndexStateInfo, err error) {
	var pipelineTaskIDs = map[string][]string{}
	var pipelineIndexNames = map[string]string{}
	indexState = map[string]ComparisonIndexStateInfo{}
	const size = 500
	var (
		from = -size
		hasMore = true
	)
	for hasMore {
		from += size
		taskQuery := util.MapStr{
			"size": 500,
			"query": util.MapStr{
				"bool": util.MapStr{
					"must": []util.MapStr{
						{
							"term": util.MapStr{
								"parent_id": util.MapStr{
									"value": taskID,
								},
							},
						},
						{
							"term": util.MapStr{
								"metadata.type": util.MapStr{
									"value": "index_comparison",
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

			cfg := migration_model.IndexComparisonTaskConfig{}
			err = migration_util.GetTaskConfig(&subTask, &cfg)
			if err != nil {
				log.Errorf("failed to get task config, err: %v", err)
				continue
			}
			totalDiffDocs := migration_util.GetMapIntValue(taskLabels, "total_diff_docs")
			taskStats.SourceTotalDocs += cfg.Source.DocCount
			taskStats.TargetTotalDocs += cfg.Target.DocCount
			taskStats.TotalDiffDocs += totalDiffDocs
			st := indexState[indexName]
			st.SourceTotalDocs += cfg.Source.DocCount
			st.TargetTotalDocs += cfg.Target.DocCount
			st.TotalDiffDocs += totalDiffDocs
			if subTask.Status == task.StatusError {
				st.ErrorPartitions += 1
			}
			if subTask.Status == task.StatusRunning {
				st.RunningChildren++
				indexState[indexName] = st
				indexMigrationTaskIDs = append(indexMigrationTaskIDs, subTask.ID)
				continue
			}
			sourceDocs := migration_util.GetMapIntValue(taskLabels, "source_scrolled")
			targetDocs := migration_util.GetMapIntValue(taskLabels, "target_scrolled")
			st.SourceScrollDocs += sourceDocs
			st.TargetScrollDocs += targetDocs
			st.TotalScrollDocs += sourceDocs + targetDocs
			taskStats.TargetScrollDocs += targetDocs
			taskStats.SourceScrollDocs += sourceDocs
			indexState[indexName] = st
		}

		if len(indexMigrationTaskIDs) == 0 {
			continue
		}

		taskQuery = util.MapStr{
			"size": len(indexMigrationTaskIDs) * 2,
			"query": util.MapStr{
				"bool": util.MapStr{
					"must": []util.MapStr{
						{
							"terms": util.MapStr{
								"parent_id": indexMigrationTaskIDs,
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
		// add scrolledDocs of running tasks
		scrollDocs := migration_util.GetMapIntValue(pipelineContext, "dump_hash.scrolled_docs")
		indexName := pipelineIndexNames[pipelineID]
		st := indexState[indexName]
		st.TotalScrollDocs += scrollDocs
		indexState[indexName] = st
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

	taskConfig := &migration_model.ClusterComparisonTaskConfig{}
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

	subTasks, pipelineTaskIDs, _, parentIDPipelineTasks, err := h.getChildTaskInfosByIndex(id, uniqueIndexName)

	taskInfo.DataPartition = len(subTasks)
	if len(subTasks) == 0 {
		h.WriteJSON(w, taskInfo, http.StatusOK)
		return
	}

	pipelineContexts := h.getChildPipelineInfosFromGateway(pipelineTaskIDs)
	startTime, completedTime, duration, completedPartitions := h.calcMajorTaskInfo(subTasks, taskInfo.Repeating)

	var partitionTaskInfos []util.MapStr
	var workers = map[string]struct{}{}

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
		instID := migration_util.GetMapStringValue(subTask.Metadata.Labels, "execution_instance_id")
		if instID != "" {
			workers[instID] = struct{}{}
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
		onlyInSource := migration_util.GetMapIntValue(subTaskLabels, "only_in_source")
		onlyInTarget := migration_util.GetMapIntValue(subTaskLabels, "only_in_target")
		diffBoth := migration_util.GetMapIntValue(subTaskLabels, "diff_both")

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
			"only_in_source": onlyInSource,
			"only_in_target": onlyInTarget,
			"diff_both": diffBoth,
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
	for _, node := range taskConfig.Settings.Execution.Nodes.Permit {
		if _, ok := workers[node.ID]; ok {
			taskInfo.Workers = append(taskInfo.Workers, util.MapStr{
				"id": node.ID,
				"name": node.Name,
			})
		}
	}
	taskInfo.Partitions = partitionTaskInfos
	taskInfo.CompletedPartitions = completedPartitions
	h.WriteJSON(w, taskInfo, http.StatusOK)
}
