/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package migration

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	log "github.com/cihub/seelog"

	"infini.sh/console/model"
	migration_model "infini.sh/console/plugin/migration/model"
	migration_util "infini.sh/console/plugin/migration/util"

	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac"
	"infini.sh/framework/core/api/rbac/enum"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	task2 "infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

func InitAPI() {
	handler := APIHandler{}
	api.HandleAPIMethod(api.GET, "/migration/data/_search", handler.RequirePermission(handler.searchTask("cluster_migration"), enum.PermissionMigrationTaskRead))
	api.HandleAPIMethod(api.POST, "/migration/data", handler.RequirePermission(handler.createDataMigrationTask, enum.PermissionMigrationTaskWrite))
	api.HandleAPIMethod(api.DELETE, "/migration/data/:task_id", handler.RequirePermission(handler.deleteTask, enum.PermissionMigrationTaskWrite))
	api.HandleAPIMethod(api.POST, "/migration/data/:task_id/_start", handler.RequirePermission(handler.startTask, enum.PermissionMigrationTaskWrite))
	api.HandleAPIMethod(api.POST, "/migration/data/:task_id/_stop", handler.RequirePermission(handler.stopTask, enum.PermissionMigrationTaskWrite))
	api.HandleAPIMethod(api.GET, "/migration/data/:task_id/info", handler.RequirePermission(handler.getDataMigrationTaskInfo, enum.PermissionMigrationTaskRead))
	api.HandleAPIMethod(api.GET, "/migration/data/:task_id/info/:index", handler.RequirePermission(handler.getDataMigrationTaskOfIndex, enum.PermissionMigrationTaskRead))

	api.HandleAPIMethod(api.GET, "/comparison/data/_search", handler.RequirePermission(handler.searchTask("cluster_comparison"), enum.PermissionComparisonTaskRead))
	api.HandleAPIMethod(api.POST, "/comparison/data", handler.RequirePermission(handler.createDataComparisonTask, enum.PermissionComparisonTaskWrite))
	api.HandleAPIMethod(api.DELETE, "/comparison/data/:task_id", handler.RequirePermission(handler.deleteTask, enum.PermissionComparisonTaskWrite))
	api.HandleAPIMethod(api.GET, "/comparison/data/:task_id/info", handler.RequirePermission(handler.getDataComparisonTaskInfo, enum.PermissionComparisonTaskRead))
	api.HandleAPIMethod(api.GET, "/comparison/data/:task_id/info/:index", handler.RequirePermission(handler.getDataComparisonTaskOfIndex, enum.PermissionComparisonTaskRead))
	api.HandleAPIMethod(api.POST, "/comparison/data/:task_id/_start", handler.RequirePermission(handler.startTask, enum.PermissionComparisonTaskWrite))
	api.HandleAPIMethod(api.POST, "/comparison/data/:task_id/_stop", handler.RequirePermission(handler.stopTask, enum.PermissionComparisonTaskWrite))

	api.HandleAPIMethod(api.POST, "/migration/data/_validate", handler.RequireLogin(handler.validateDataMigration))
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_partition", handler.getIndexPartitionInfo)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_count", handler.countDocuments)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_refresh", handler.refreshIndex)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_init", handler.initIndex)

}

type APIHandler struct {
	api.Handler
}

func (h *APIHandler) createDataMigrationTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterTaskConfig := &migration_model.ClusterMigrationTaskConfig{}
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

	var totalDocs int64
	for _, index := range clusterTaskConfig.Indices {
		totalDocs += index.Source.Docs
	}

	srcClusterCfg := elastic.GetConfig(clusterTaskConfig.Cluster.Source.Id)
	clusterTaskConfig.Cluster.Source.Distribution = srcClusterCfg.Distribution
	dstClusterCfg := elastic.GetConfig(clusterTaskConfig.Cluster.Target.Id)
	clusterTaskConfig.Cluster.Target.Distribution = dstClusterCfg.Distribution
	t := task2.Task{
		Metadata: task2.Metadata{
			Type: "cluster_migration",
			Labels: util.MapStr{
				"business_id":       "cluster_migration",
				"source_cluster_id": clusterTaskConfig.Cluster.Source.Id,
				"target_cluster_id": clusterTaskConfig.Cluster.Target.Id,
				"source_total_docs": totalDocs,
			},
		},
		Cancellable:  true,
		Runnable:     false,
		Status:       task2.StatusInit,
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

func (h *APIHandler) getIndexPartitionInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		index     = ps.MustGetParameter("index")
		clusterID = ps.MustGetParameter("id")
	)
	client := elastic.GetClient(clusterID)
	pq := &elastic.PartitionQuery{
		IndexName: index,
	}
	err := h.DecodeJSON(req, pq)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	partitions, err := elastic.GetPartitions(pq, client)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, partitions, http.StatusOK)
}

func (h *APIHandler) getDataMigrationTaskInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("task_id")

	obj := task2.Task{}
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
		percent := float64(count) / float64(index.Source.Docs) * 100
		if percent > 100 {
			percent = 100
		}
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
	obj.ConfigString = util.MustToJSON(taskConfig)
	obj.Metadata.Labels["completed_indices"] = completedIndices
	h.WriteJSON(w, obj, http.StatusOK)
}

type TaskInfoResponse struct {
	TaskID              string        `json:"task_id"`
	Step                interface{}   `json:"step"`
	StartTime           int64         `json:"start_time"`
	CompletedTime       int64         `json:"completed_time"`
	Duration            int64         `json:"duration"`
	DataPartition       int           `json:"data_partition"`
	CompletedPartitions int           `json:"completed_partitions"`
	Partitions          []util.MapStr `json:"partitions"`
}

func (h *APIHandler) getDataMigrationTaskOfIndex(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("task_id")
	uniqueIndexName := ps.MustGetParameter("index")
	majorTask := task2.Task{}
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

	subTasks, pipelineTaskIDs, pipelineSubParentIDs, parentIDPipelineTasks, err := h.getChildTaskInfosByIndex(&majorTask, uniqueIndexName)

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

	startTime, completedTime, duration, completedPartitions := h.calcMajorTaskInfo(subTasks)

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
				continue
			}
			if ptask.CompletedTime != nil {
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

func (h *APIHandler) countDocuments(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		index     = ps.MustGetParameter("index")
		clusterID = ps.MustGetParameter("id")
	)
	client := elastic.GetClient(clusterID)
	reqBody := struct {
		Filter interface{} `json:"filter"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var query []byte
	if reqBody.Filter != nil {
		query = util.MustToJSONBytes(util.MapStr{
			"query": reqBody.Filter,
		})
	}

	ctx := req.Context()

	countRes, err := client.Count(ctx, index, query)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, countRes, http.StatusOK)
}

func (h *APIHandler) validateDataMigration(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	typ := h.GetParameter(req, "type")
	switch typ {
	case "multi_type":
		h.validateMultiType(w, req, ps)
		return
	}
	h.WriteError(w, "unknown parameter type", http.StatusOK)
}

func (h *APIHandler) validateMultiType(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var reqBody = struct {
		Cluster struct {
			SourceID string `json:"source_id"`
			TargetID string `json:"target_id"`
		} `json:"cluster"`
		Indices []string
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	sourceClient := elastic.GetClient(reqBody.Cluster.SourceID)
	// get source type
	indexNames := strings.Join(reqBody.Indices, ",")
	typeInfo, err := elastic.GetIndexTypes(sourceClient, indexNames)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"result": typeInfo,
	}, http.StatusOK)
}

type InitIndexRequest struct {
	Mappings map[string]interface{} `json:"mappings"`
	Settings map[string]interface{} `json:"settings"`
}

func (h *APIHandler) initIndex(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.MustGetParameter("id")
	indexName := ps.MustGetParameter("index")
	reqBody := &InitIndexRequest{}
	err := h.DecodeJSON(req, reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	client := elastic.GetClient(targetClusterID)
	exists, err := client.Exists(indexName)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if exists {
		if len(reqBody.Settings) > 0 {
			err = client.UpdateIndexSettings(indexName, reqBody.Settings)
			if err != nil {
				log.Error(err)
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}
		if ml := len(reqBody.Mappings); ml > 0 {
			var (
				docType             = ""
				mapping interface{} = reqBody.Mappings
			)
			if ml == 1 {
				for key, _ := range reqBody.Mappings {
					if key != "properties" {
						docType = key
						mapping = reqBody.Mappings[key]
					}
				}
			}
			mappingBytes := util.MustToJSONBytes(mapping)
			_, err = client.UpdateMapping(indexName, docType, mappingBytes)
			if err != nil {
				log.Error(err)
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}
	} else {
		indexSettings := map[string]interface{}{}
		if len(reqBody.Settings) > 0 {
			indexSettings["settings"] = reqBody.Settings
		}
		if len(reqBody.Mappings) > 0 {
			indexSettings["mappings"] = reqBody.Mappings
		}
		err = client.CreateIndex(indexName, indexSettings)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, http.StatusOK)
}

func (h *APIHandler) refreshIndex(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		index     = ps.MustGetParameter("index")
		clusterID = ps.MustGetParameter("id")
	)
	client := elastic.GetClient(clusterID)
	err := client.Refresh(index)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)
}

func (h *APIHandler) getChildTaskInfosByIndex(taskItem *task2.Task, uniqueIndexName string) (subTasks []task2.Task, pipelineTaskIDs map[string][]string, pipelineSubParentIDs map[string]string, parentIDPipelineTasks map[string][]task2.Task, err error) {
	queryDsl := util.MapStr{
		"size": 9999,
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
								"value": taskItem.ID,
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.labels.unique_index_name": util.MapStr{
								"value": uniqueIndexName,
							},
						},
					},
				},
			},
		},
	}
	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(queryDsl),
	}
	err, result := orm.Search(task2.Task{}, q)
	if err != nil {
		return
	}

	pipelineTaskIDs = map[string][]string{}
	pipelineSubParentIDs = map[string]string{}
	parentIDPipelineTasks = map[string][]task2.Task{}

	for _, row := range result.Result {
		buf := util.MustToJSONBytes(row)
		subTask := task2.Task{}
		err = util.FromJSONBytes(buf, &subTask)
		if err != nil {
			log.Error(err)
			continue
		}

		if subTask.Metadata.Type != "pipeline" {
			subTasks = append(subTasks, subTask)
			continue
		}
		if subTask.Status != task2.StatusRunning {
			continue
		}

		// TODO: use more robust logic
		if pl := len(subTask.ParentId); pl != 2 {
			continue
		}
		parentID := subTask.ParentId[1]

		pipelineSubParentIDs[subTask.ID] = parentID
		instID := migration_util.GetMapStringValue(util.MapStr(subTask.Metadata.Labels), "execution_instance_id")
		if instID == "" {
			continue
		}
		pipelineTaskIDs[instID] = append(pipelineTaskIDs[instID], subTask.ID)
		parentIDPipelineTasks[parentID] = append(parentIDPipelineTasks[parentID], subTask)
	}

	return
}

func (h *APIHandler) getChildPipelineInfosFromGateway(pipelineTaskIDs map[string][]string) (pipelineContexts map[string]util.MapStr) {
	pipelineContexts = map[string]util.MapStr{}
	var err error

	for instID, taskIDs := range pipelineTaskIDs {
		inst := &model.Instance{}
		inst.ID = instID
		_, err = orm.Get(inst)
		if err != nil {
			log.Error("failed to get instance info, err: %v", err)
			continue
		}
		pipelines, err := inst.GetPipelinesByIDs(taskIDs)
		if err != nil {
			log.Errorf("failed to get pipelines info, err: %v", err)
			continue
		}

		for pipelineID, status := range pipelines {
			pipelineContexts[pipelineID] = status.Context
		}
	}

	return
}

func (h *APIHandler) calcMajorTaskInfo(subTasks []task2.Task) (startTime int64, completedTime int64, duration int64, completedPartitions int) {
	if len(subTasks) == 0 {
		return
	}

	for _, subTask := range subTasks {
		if subTask.StartTimeInMillis > 0 {
			if startTime == 0 {
				startTime = subTask.StartTimeInMillis
			}
			if subTask.StartTimeInMillis < startTime {
				startTime = subTask.StartTimeInMillis
			}
		}
		if subTask.CompletedTime != nil {
			subCompletedTime := subTask.CompletedTime.UnixMilli()
			if subCompletedTime > completedTime {
				completedTime = subCompletedTime
			}
		}

		if subTask.Status == task2.StatusComplete || subTask.Status == task2.StatusError {
			completedPartitions++
		}
	}
	if len(subTasks) != completedPartitions {
		completedTime = 0
		duration = time.Now().UnixMilli() - startTime
	} else {
		duration = completedTime - startTime
	}

	return
}
