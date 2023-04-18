/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package migration

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"
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
	elastic2 "infini.sh/framework/modules/elastic"
)

func InitAPI() {
	handler := APIHandler{}
	api.HandleAPIMethod(api.GET, "/migration/data/_search", handler.RequirePermission(handler.searchDataMigrationTask, enum.PermissionTaskRead))
	api.HandleAPIMethod(api.POST, "/migration/data", handler.RequirePermission(handler.createDataMigrationTask, enum.PermissionTaskWrite))
	api.HandleAPIMethod(api.POST, "/migration/data/_validate", handler.RequireLogin(handler.validateDataMigration))

	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_partition", handler.getIndexPartitionInfo)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_count", handler.countDocuments)
	api.HandleAPIMethod(api.POST, "/migration/data/:task_id/_start", handler.RequirePermission(handler.startDataMigration, enum.PermissionTaskWrite))
	api.HandleAPIMethod(api.POST, "/migration/data/:task_id/_stop", handler.RequirePermission(handler.stopDataMigrationTask, enum.PermissionTaskWrite))
	//api.HandleAPIMethod(api.GET, "/migration/data/:task_id", handler.getMigrationTask)
	api.HandleAPIMethod(api.GET, "/migration/data/:task_id/info", handler.RequirePermission(handler.getDataMigrationTaskInfo, enum.PermissionTaskRead))
	api.HandleAPIMethod(api.GET, "/migration/data/:task_id/info/:index", handler.RequirePermission(handler.getDataMigrationTaskOfIndex, enum.PermissionTaskRead))
	api.HandleAPIMethod(api.PUT, "/migration/data/:task_id/status", handler.RequirePermission(handler.updateDataMigrationTaskStatus, enum.PermissionTaskRead))
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_init", handler.initIndex)
	api.HandleAPIMethod(api.DELETE, "/migration/data/:task_id", handler.deleteDataMigrationTask)

}

type APIHandler struct {
	api.Handler
	bulkResultIndexName string
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

func (h *APIHandler) searchDataMigrationTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		keyword = h.GetParameterOrDefault(req, "keyword", "")
		strSize = h.GetParameterOrDefault(req, "size", "20")
		strFrom = h.GetParameterOrDefault(req, "from", "0")
		mustQ   []interface{}
	)
	mustQ = append(mustQ, util.MapStr{
		"term": util.MapStr{
			"metadata.labels.business_id": util.MapStr{
				"value": "cluster_migration",
			},
		},
	})

	if keyword != "" {
		mustQ = append(mustQ, util.MapStr{
			"query_string": util.MapStr{
				"default_field": "*",
				"query":         keyword,
			},
		})
	}
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	queryDSL := util.MapStr{
		"sort": []util.MapStr{
			{
				"created": util.MapStr{
					"order": "desc",
				},
			},
		},
		"size": size,
		"from": from,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": mustQ,
			},
		},
	}

	q := orm.Query{}
	q.RawQuery = util.MustToJSONBytes(queryDSL)

	err, res := orm.Search(&task2.Task{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	searchRes := &elastic.SearchResponse{}
	err = util.FromJSONBytes(res.Raw, searchRes)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	for _, hit := range searchRes.Hits.Hits {
		sourceM := util.MapStr(hit.Source)
		buf := util.MustToJSONBytes(sourceM["config"])
		dataConfig := migration_model.ClusterMigrationTaskConfig{}
		err = util.FromJSONBytes(buf, &dataConfig)
		if err != nil {
			log.Error(err)
			continue
		}
		//var targetTotalDocs int64
		if hit.Source["status"] == task2.StatusRunning {
			ts, err := getMajorTaskStatsFromInstances(hit.ID)
			if err != nil {
				log.Warnf("fetch progress info of task error: %v", err)
				continue
			}
			sourceM.Put("metadata.labels.target_total_docs", ts.IndexDocs)
		}

	}

	h.WriteJSON(w, searchRes, http.StatusOK)
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

func (h *APIHandler) startDataMigration(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	taskID := ps.MustGetParameter("task_id")
	obj := task2.Task{}

	obj.ID = taskID
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteError(w, fmt.Sprintf("task [%s] not found", taskID), http.StatusInternalServerError)
		return
	}
	if obj.Status == task2.StatusComplete {
		h.WriteError(w, fmt.Sprintf("task [%s] completed, can't start anymore", taskID), http.StatusInternalServerError)
		return
	}
	obj.Status = task2.StatusReady

	err = orm.Update(nil, &obj)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	migration_util.WriteLog(&obj, &task2.TaskResult{
		Success: true,
	}, "task status manually set to ready")

	if obj.Metadata.Labels != nil && obj.Metadata.Labels["business_id"] == "index_migration" && len(obj.ParentId) > 0 {
		//update status of major task to running
		query := util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"id": util.MapStr{
								"value": obj.ParentId[0],
							},
						},
					},
				},
			},
		}
		queryDsl := util.MapStr{
			"query": query,
			"script": util.MapStr{
				"source": fmt.Sprintf("ctx._source['status'] = '%s'", task2.StatusRunning),
			},
		}

		err = orm.UpdateBy(obj, util.MustToJSONBytes(queryDsl))
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)
}

func (h *APIHandler) stopDataMigrationTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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
	if task2.IsEnded(obj.Status) {
		h.WriteJSON(w, util.MapStr{
			"success": true,
		}, 200)
		return
	}
	obj.Status = task2.StatusPendingStop
	err = orm.Update(nil, &obj)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	migration_util.WriteLog(&obj, &task2.TaskResult{
		Success: true,
	}, "task status manually set to pending stop")

	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)
}

func getIndexRefreshInterval(indexNames []string, targetESClient elastic.API) (map[string]string, error) {
	const step = 50
	var (
		length = len(indexNames)
		end    int
	)
	refreshIntervals := map[string]string{}
	for i := 0; i < length; i += step {
		end = i + step
		if end > length-1 {
			end = length
		}
		tempNames := indexNames[i:end]
		strNames := strings.Join(tempNames, ",")
		resultM, err := targetESClient.GetIndexSettings(strNames)
		if err != nil {
			return refreshIntervals, nil
		}
		for indexName, v := range *resultM {
			if m, ok := v.(map[string]interface{}); ok {
				refreshInterval, _ := util.GetMapValueByKeys([]string{"settings", "index", "refresh_interval"}, m)
				if ri, ok := refreshInterval.(string); ok {
					refreshIntervals[indexName] = ri
					continue
				}
				refreshInterval, _ = util.GetMapValueByKeys([]string{"defaults", "index", "refresh_interval"}, m)
				if ri, ok := refreshInterval.(string); ok {
					refreshIntervals[indexName] = ri
					continue
				}
			}

		}
	}
	return refreshIntervals, nil

}

func (h *APIHandler) getIndexRefreshIntervals(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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
	var indexNames []string
	for _, index := range taskConfig.Indices {
		indexNames = append(indexNames, index.Target.Name)
	}
	targetESClient := elastic.GetClientNoPanic(taskConfig.Cluster.Target.Id)
	if targetESClient == nil {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
	}
	vals, err := getIndexRefreshInterval(indexNames, targetESClient)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, vals, http.StatusOK)
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

	indexState, err := getMajorTaskInfoByIndex(id)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	realtimeIndexState, err := getMajorTaskByIndexFromES(id)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var completedIndices int
	for i, index := range taskConfig.Indices {
		indexName := index.Source.GetUniqueIndexName()
		count := indexState[indexName].IndexDocs + realtimeIndexState[indexName].IndexDocs
		percent := count * 100 / float64(index.Source.Docs)
		if percent > 100 {
			percent = 100
		}
		taskConfig.Indices[i].Target.Docs = int64(count)
		taskConfig.Indices[i].Percent = util.ToFixed(percent, 2)
		taskConfig.Indices[i].ErrorPartitions = indexState[indexName].ErrorPartitions
		if int64(count) == index.Source.Docs {
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
func getMajorTaskInfoByIndex(taskID string) (map[string]migration_model.IndexStateInfo, error) {
	query := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"group_by_task": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.unique_index_name",
					"size":  100,
				},
				"aggs": util.MapStr{
					"group_by_status": util.MapStr{
						"terms": util.MapStr{
							"field": "status",
							"size":  100,
						},
					},
					"total_docs": util.MapStr{
						"sum": util.MapStr{
							"field": "metadata.labels.index_docs",
						},
					},
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
							"parent_id": util.MapStr{
								"value": taskID,
							},
						},
					},
				},
			},
		},
	}
	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}
	err, result := orm.Search(task2.Task{}, q)
	if err != nil {
		return nil, err
	}

	searchRes := &elastic.SearchResponse{}
	err = util.FromJSONBytes(result.Raw, searchRes)
	if err != nil {
		return nil, err
	}
	resBody := map[string]migration_model.IndexStateInfo{}

	if taskAgg, ok := searchRes.Aggregations["group_by_task"]; ok {
		for _, bk := range taskAgg.Buckets {
			if key, ok := bk["key"].(string); ok {
				//resBody[key] = int(bk["doc_count"].(float64))
				resBody[key] = migration_model.IndexStateInfo{}
				if statusAgg, ok := bk["group_by_status"].(map[string]interface{}); ok {
					if sbks, ok := statusAgg["buckets"].([]interface{}); ok {
						for _, sbk := range sbks {
							if sbkM, ok := sbk.(map[string]interface{}); ok {
								if sbkM["key"] == task2.StatusError {
									if v, ok := sbkM["doc_count"].(float64); ok {
										st := resBody[key]
										st.ErrorPartitions = int(v)
										resBody[key] = st
									}
								}
							}
						}
					}
				}
				if indexDocsAgg, ok := bk["total_docs"].(map[string]interface{}); ok {
					if v, ok := indexDocsAgg["value"].(float64); ok {
						st := resBody[key]
						st.IndexDocs = v
						resBody[key] = st
					}

				}
			}
		}
	}
	return resBody, nil
}

func getIndexTaskDocCount(ctx context.Context, index *migration_model.IndexConfig, targetESClient elastic.API) (int64, error) {
	targetIndexName := index.Target.Name
	if targetIndexName == "" {
		if v, ok := index.IndexRename[index.Source.Name].(string); ok {
			targetIndexName = v
		}
	}

	var body []byte
	var must []interface{}
	if index.Target.DocType != "" && targetESClient.GetMajorVersion() < 8 {
		must = append(must, util.MapStr{
			"terms": util.MapStr{
				"_type": []string{index.Target.DocType},
			},
		})
	}
	if index.RawFilter != nil {
		must = append(must, index.RawFilter)
	}
	if len(must) > 0 {
		query := util.MapStr{
			"query": util.MapStr{
				"bool": util.MapStr{
					"must": must,
				},
			},
		}
		body = util.MustToJSONBytes(query)
	}

	countRes, err := targetESClient.Count(ctx, targetIndexName, body)
	if err != nil {
		return 0, err
	}
	if countRes.StatusCode != http.StatusOK && countRes.RawResult != nil {
		return 0, fmt.Errorf(string(countRes.RawResult.Body))
	}
	return countRes.Count, nil
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

	var completedTime int64

	taskInfo := util.MapStr{
		"task_id":    id,
		"start_time": majorTask.StartTimeInMillis,
	}
	partitionTaskQuery := util.MapStr{
		"size": 500,
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
		RawQuery: util.MustToJSONBytes(partitionTaskQuery),
	}
	err, result := orm.Search(task2.Task{}, q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var subTasks []task2.Task
	var pipelineTaskIDs = map[string][]string{}
	pipelineSubParentIDs := map[string]string{}
	subTaskStatus := map[string]string{}
	for _, row := range result.Result {
		buf := util.MustToJSONBytes(row)
		subTask := task2.Task{}
		err = util.FromJSONBytes(buf, &subTask)
		if err != nil {
			log.Error(err)
			continue
		}
		if subTask.Metadata.Labels != nil {
			if subTask.Metadata.Labels["business_id"] == "index_migration" {
				subTasks = append(subTasks, subTask)
				subTaskStatus[subTask.ID] = subTask.Status
				continue
			}
			if subTask.Metadata.Labels["pipeline_id"] == "es_scroll" || subTask.Metadata.Labels["pipeline_id"] == "bulk_indexing" {
				if instID, ok := subTask.Metadata.Labels["execution_instance_id"].(string); ok {
					pipelineTaskIDs[instID] = append(pipelineTaskIDs[instID], subTask.ID)
					if pl := len(subTask.ParentId); pl > 0 {
						if subTaskStatus[subTask.ParentId[pl-1]] == task2.StatusRunning {
							pipelineSubParentIDs[subTask.ID] = subTask.ParentId[pl-1]
						}
					}
				}
			}
		}
	}
	taskInfo["data_partition"] = len(subTasks)
	var taskStats = map[string]struct {
		ScrolledDocs float64
		IndexDocs    float64
	}{}
	for instID, taskIDs := range pipelineTaskIDs {
		inst := &model.Instance{}
		inst.ID = instID
		_, err = orm.Get(inst)
		if err != nil {
			log.Error(err)
			continue
		}
		pipelines, err := inst.GetPipelinesByIDs(taskIDs)
		if err != nil {
			log.Error(err)
			continue
		}

		for pipelineID, status := range pipelines {
			if pid, ok := pipelineSubParentIDs[pipelineID]; ok {
				if v, err := status.Context.GetValue("es_scroll.scrolled_docs"); err == nil {
					if vv, ok := v.(float64); ok {
						stat := taskStats[pid]
						stat.ScrolledDocs = vv
						taskStats[pid] = stat
					}
				}
				if v, err := status.Context.GetValue("bulk_indexing.success.count"); err == nil {
					if vv, ok := v.(float64); ok {
						stat := taskStats[pid]
						stat.IndexDocs = vv
						taskStats[pid] = stat
					}
				}
			}
		}
	}

	var (
		partitionTaskInfos  []util.MapStr
		completedPartitions int
		startTime           int64
	)
	if len(subTasks) > 0 {
		startTime = subTasks[0].StartTimeInMillis
	}
	for i, ptask := range subTasks {
		cfg := migration_model.IndexMigrationTaskConfig{}
		err := migration_util.GetTaskConfig(&ptask, &cfg)
		if err != nil {
			log.Errorf("failed to get task config, err: %v", err)
			continue
		}
		start := cfg.Source.Start
		end := cfg.Source.End
		if i == 0 {
			step := cfg.Source.Step
			taskInfo["step"] = step
		}
		var durationInMS int64 = 0
		if ptask.StartTimeInMillis > 0 {
			if ptask.StartTimeInMillis < startTime {
				startTime = ptask.StartTimeInMillis
			}
			durationInMS = time.Now().UnixMilli() - ptask.StartTimeInMillis
			if ptask.CompletedTime != nil && (ptask.Status == task2.StatusComplete || ptask.Status == task2.StatusError) {
				durationInMS = ptask.CompletedTime.UnixMilli() - ptask.StartTimeInMillis
			}
		}
		var (
			scrollDocs float64
			indexDocs  float64
		)
		if stat, ok := taskStats[ptask.ID]; ok {
			scrollDocs = stat.ScrolledDocs
			indexDocs = stat.IndexDocs
		} else {
			if ptask.Status == task2.StatusComplete || ptask.Status == task2.StatusError {
				if ptask.Metadata.Labels != nil {
					if v, ok := ptask.Metadata.Labels["scrolled_docs"].(float64); ok {
						scrollDocs = v
					}
					if v, ok := ptask.Metadata.Labels["index_docs"].(float64); ok {
						indexDocs = v
					}
				}
			}
		}

		var subCompletedTime int64
		if ptask.CompletedTime != nil {
			subCompletedTime = ptask.CompletedTime.UnixMilli()
			if subCompletedTime > completedTime {
				completedTime = subCompletedTime
			}
		}

		partitionTotalDocs := cfg.Source.DocCount
		partitionTaskInfos = append(partitionTaskInfos, util.MapStr{
			"task_id":        ptask.ID,
			"status":         ptask.Status,
			"start_time":     ptask.StartTimeInMillis,
			"completed_time": subCompletedTime,
			"start":          start,
			"end":            end,
			"duration":       durationInMS,
			"scroll_docs":    scrollDocs,
			"index_docs":     indexDocs,
			"total_docs":     partitionTotalDocs,
		})
		if ptask.Status == task2.StatusComplete || ptask.Status == task2.StatusError {
			completedPartitions++
		}
	}
	if len(subTasks) == completedPartitions {
		taskInfo["completed_time"] = completedTime
		taskInfo["duration"] = completedTime - startTime
	} else {
		taskInfo["duration"] = time.Now().UnixMilli() - startTime
	}
	taskInfo["start_time"] = startTime
	taskInfo["partitions"] = partitionTaskInfos
	taskInfo["completed_partitions"] = completedPartitions
	h.WriteJSON(w, taskInfo, http.StatusOK)
}

func (h *APIHandler) getMigrationTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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

	h.WriteJSON(w, util.MapStr{
		"found":   true,
		"_id":     id,
		"_source": obj,
	}, 200)
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

func (h *APIHandler) updateDataMigrationTaskStatus(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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
	reqBody := struct {
		Status string `json:"status"`
	}{}
	err = h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	obj.Status = reqBody.Status
	err = orm.Update(nil, obj)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)
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

func (h *APIHandler) deleteDataMigrationTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("task_id")
	obj := task2.Task{}
	obj.ID = id

	_, err := orm.Get(&obj)
	if err != nil {
		if errors.Is(err, elastic2.ErrNotFound) {
			h.WriteJSON(w, util.MapStr{
				"_id":    id,
				"result": "not_found",
			}, http.StatusNotFound)
			return
		}
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if util.StringInArray([]string{task2.StatusReady, task2.StatusRunning, task2.StatusPendingStop}, obj.Status) {
		h.WriteError(w, fmt.Sprintf("can not delete task [%s] with status [%s]", obj.ID, obj.Status), http.StatusInternalServerError)
		return
	}

	q := util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"minimum_should_match": 1,
				"should": []util.MapStr{
					{
						"term": util.MapStr{
							"parent_id": util.MapStr{
								"value": id,
							},
						},
					},
					{
						"term": util.MapStr{
							"id": util.MapStr{
								"value": id,
							},
						},
					},
				},
			},
		},
	}
	err = orm.DeleteBy(&obj, util.MustToJSONBytes(q))
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "deleted",
	}, 200)
}

func getMajorTaskStatsFromInstances(majorTaskID string) (taskStats migration_model.MajorTaskState, err error) {
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
											"value": "bulk_indexing",
										},
									},
								},
								{
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
												"terms": util.MapStr{
													"status": []string{task2.StatusComplete, task2.StatusError},
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
	err, result := orm.Search(task2.Task{}, q)
	if err != nil {
		return taskStats, err
	}
	var pipelineTaskIDs = map[string][]string{}
	for _, row := range result.Result {
		buf := util.MustToJSONBytes(row)
		subTask := task2.Task{}
		err = util.FromJSONBytes(buf, &subTask)
		if err != nil {
			log.Error(err)
			continue
		}
		if subTask.Metadata.Labels != nil {
			//add indexDocs of already complete
			if subTask.Metadata.Labels["business_id"] == "index_migration" {
				if v, ok := subTask.Metadata.Labels["index_docs"].(float64); ok {
					taskStats.IndexDocs += v
				}
				continue
			}
			if instID, ok := subTask.Metadata.Labels["execution_instance_id"].(string); ok {
				pipelineTaskIDs[instID] = append(pipelineTaskIDs[instID], subTask.ID)
			}
		}
	}
	for instID, taskIDs := range pipelineTaskIDs {
		inst := &model.Instance{}
		inst.ID = instID
		_, err = orm.Get(inst)
		if err != nil {
			log.Error(err)
			continue
		}
		pipelines, err := inst.GetPipelinesByIDs(taskIDs)
		if err != nil {
			log.Error(err)
			continue
		}

		for _, status := range pipelines {
			if v, err := status.Context.GetValue("bulk_indexing.success.count"); err == nil {
				if vv, ok := v.(float64); ok {
					taskStats.IndexDocs += vv
				}
			}
		}
	}
	return taskStats, nil
}

func getMajorTaskByIndexFromES(majorTaskID string) (map[string]migration_model.IndexStateInfo, error) {
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
	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(taskQuery),
	}
	err, result := orm.Search(task2.Task{}, q)
	if err != nil {
		return nil, err
	}
	var pipelineTaskIDs = map[string][]string{}
	var pipelineIndexNames = map[string]string{}
	for _, row := range result.Result {
		buf := util.MustToJSONBytes(row)
		subTask := task2.Task{}
		err = util.FromJSONBytes(buf, &subTask)
		if err != nil {
			log.Error(err)
			continue
		}
		if subTask.Metadata.Labels != nil {
			if instID, ok := subTask.Metadata.Labels["execution_instance_id"].(string); ok {
				pipelineTaskIDs[instID] = append(pipelineTaskIDs[instID], subTask.ID)
			}
			if indexName, ok := subTask.Metadata.Labels["unique_index_name"].(string); ok {
				pipelineIndexNames[subTask.ID] = indexName
			}
		}
	}
	state := map[string]migration_model.IndexStateInfo{}
	for instID, taskIDs := range pipelineTaskIDs {
		inst := &model.Instance{}
		inst.ID = instID
		_, err = orm.Get(inst)
		if err != nil {
			log.Error(err)
			continue
		}
		pipelines, err := inst.GetPipelinesByIDs(taskIDs)
		if err != nil {
			log.Error(err)
			continue
		}

		for pipelineID, status := range pipelines {
			indexName := pipelineIndexNames[pipelineID]
			if v, err := status.Context.GetValue("bulk_indexing.success.count"); err == nil {
				if vv, ok := v.(float64); ok && indexName != "" {
					st := state[indexName]
					st.IndexDocs += vv
					state[indexName] = st
				}
			}
		}
	}
	return state, nil
}
