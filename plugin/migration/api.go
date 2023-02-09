/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package migration

import (
	"context"
	"fmt"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/proxy"
	task2 "infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	"net/http"
	"strconv"
	"strings"
	"time"
)


func InitAPI(bulkResultIndexName string) {
	handler := APIHandler{
		bulkResultIndexName: bulkResultIndexName,
	}
	api.HandleAPIMethod(api.GET, "/migration/data/_search",  handler.RequireLogin(handler.searchDataMigrationTask))
	api.HandleAPIMethod(api.POST, "/migration/data", handler.RequireLogin(handler.createDataMigrationTask))
	api.HandleAPIMethod(api.POST, "/migration/data/_validate",  handler.RequireLogin(handler.validateDataMigration))

	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_partition", handler.getIndexPartitionInfo)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_count", handler.countDocuments)
	api.HandleAPIMethod(api.POST, "/migration/data/:task_id/_start",  handler.RequireLogin(handler.startDataMigration))
	api.HandleAPIMethod(api.POST, "/migration/data/:task_id/_stop",  handler.RequireLogin(handler.stopDataMigrationTask))
	//api.HandleAPIMethod(api.GET, "/migration/data/:task_id", handler.getMigrationTask)
	api.HandleAPIMethod(api.GET, "/migration/data/:task_id/info",  handler.RequireLogin(handler.getDataMigrationTaskInfo))
	api.HandleAPIMethod(api.GET, "/migration/data/:task_id/info/index",  handler.RequireLogin(handler.getDataMigrationTaskOfIndex))
	api.HandleAPIMethod(api.PUT, "/migration/data/:task_id/status",  handler.RequireLogin(handler.updateDataMigrationTaskStatus))

}

type APIHandler struct {
	api.Handler
	bulkResultIndexName string
}

func (h *APIHandler) createDataMigrationTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	clusterTaskConfig := &ElasticDataConfig{}
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
	user, err  := rbac.FromUserContext(req.Context())
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

	t := task2.Task{
		Metadata: task2.Metadata{
			Type: "pipeline",
			Labels: util.MapStr{
				"pipeline_id": "cluster_migration",
				"source_cluster_id": clusterTaskConfig.Cluster.Source.Id,
				"target_cluster_id": clusterTaskConfig.Cluster.Target.Id,
				"source_total_docs": totalDocs,
			},
		},
		Cancellable: true,
		Runnable: false,
		Status: task2.StatusInit,
		Parameters: map[string]interface{}{
			"pipeline": util.MapStr{
				"config": clusterTaskConfig,
			},
		},
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
		strSize      = h.GetParameterOrDefault(req, "size", "20")
		strFrom      = h.GetParameterOrDefault(req, "from", "0")
		mustQ       []interface{}
	)
	mustQ = append(mustQ, util.MapStr{
		"term": util.MapStr{
			"metadata.labels.pipeline_id": util.MapStr{
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
mainLoop:
	for _, hit := range searchRes.Hits.Hits {
		sourceM := util.MapStr(hit.Source)
		config, err := sourceM.GetValue("parameters.pipeline.config")
		if err != nil {
			log.Error(err)
			continue
		}
		buf := util.MustToJSONBytes(config)
		dataConfig := ElasticDataConfig{}
		err = util.FromJSONBytes(buf, &dataConfig)
		if err != nil {
			log.Error(err)
			continue
		}
		var targetTotalDocs int64
		if hit.Source["status"] == task2.StatusRunning {
			esClient := elastic.GetClientNoPanic(dataConfig.Cluster.Target.Id)
			if esClient == nil {
				log.Warnf("cluster [%s] was not found", dataConfig.Cluster.Target.Id)
				continue
			}
			for _, index := range dataConfig.Indices {
				count, err := getIndexTaskDocCount(&index, esClient)
				if err != nil {
					log.Error(err)
					continue mainLoop
				}
				targetTotalDocs += count
			}
			sourceM.Put("metadata.labels.target_total_docs", targetTotalDocs)
			sourceTotalDocs, _ := sourceM.GetValue("metadata.labels.source_total_docs")
			if sv, ok := sourceTotalDocs.(float64); ok{
				if int64(sv) == targetTotalDocs {
					hit.Source["status"] = task2.StatusComplete
				}
			}
		}

	}

	h.WriteJSON(w, searchRes, http.StatusOK)
}

func (h *APIHandler) getIndexPartitionInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	var (
		index = ps.MustGetParameter("index")
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

func (h *APIHandler) startDataMigration(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	taskID := ps.MustGetParameter("task_id")
	obj := task2.Task{}

	obj.ID = taskID
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteError(w,  fmt.Sprintf("task [%s] not found", taskID), http.StatusInternalServerError)
		return
	}
	if obj.Status == "init" {
		//root task
		obj.Status = task2.StatusReady
	}else if obj.Status == task2.StatusStopped {
		if obj.Metadata.Labels != nil && obj.Metadata.Labels["level"] == "partition" {
			obj.Status = task2.StatusReady
			//update parent task status
			if len(obj.ParentId) == 0 {
				h.WriteError(w,  fmt.Sprintf("empty parent id of task [%s]", taskID), http.StatusInternalServerError)
				return
			}
			query := util.MapStr{
				"bool": util.MapStr{
					"must": []util.MapStr{
						{
							"terms": util.MapStr{
								"id": obj.ParentId,
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
		}else{
			obj.Status = task2.StatusRunning
			//update sub task status
			query := util.MapStr{
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
								"metadata.labels.pipeline_id": util.MapStr{
									"value": "index_migration",
								},
							},
						},
						{
							"terms": util.MapStr{
								"status": []string{task2.StatusError, task2.StatusStopped},
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

			err = orm.UpdateBy(task2.Task{}, util.MustToJSONBytes(queryDsl))
			if err != nil {
				log.Error(err)
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

	}else if obj.Status == task2.StatusError {
		obj.Status = task2.StatusReady
	}

	err = orm.Update(nil, &obj)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)
}

func getNodeEndpoint(nodeID string) (string, error){
	indexName := ".infini_agent,.infini_instance"
	query := util.MapStr{
		"size": 1,
		"query": util.MapStr{
			"term": util.MapStr{
				"id": util.MapStr{
					"value": nodeID,
				},
			},
		},
	}
	q := orm.Query{
		IndexName: indexName,
		RawQuery: util.MustToJSONBytes(query),
	}
	err, result := orm.Search(nil, &q)
	if err != nil {
		return "", err
	}
	if len(result.Result) == 0 {
		return "", fmt.Errorf("node [%s] not found", nodeID)
	}
	if info, ok := result.Result[0].(map[string]interface{}); ok {
		if v, ok := info["endpoint"]; ok {
			if endpoint, ok := v.(string); ok {
				return endpoint, nil
			}
			return "", fmt.Errorf("got invalid endpoint value: %v", v)
		}
		ag := agent.Instance{}
		buf := util.MustToJSONBytes(info)
		err = util.FromJSONBytes(buf, &ag)
		if err != nil {
			return "", err
		}
		return ag.GetEndpoint(), nil
	}
	return "", fmt.Errorf("got unexpect node info: %s", util.MustToJSON(result.Result[0]))
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
	execution, _ := util.MapStr(obj.Parameters).GetValue("pipeline.config.settings.execution")
	if execution == nil {
		execution, err = util.MapStr(obj.Parameters).GetValue("pipeline.config.execution")
		if err != nil {
			errStr := fmt.Sprintf("get execution config in task %s error: %s", id, err.Error())
			h.WriteError(w, errStr, http.StatusInternalServerError)
			log.Error(errStr)
			return
		}
	}
	buf := util.MustToJSONBytes(execution)
	executionConfig := ExecutionConfig{}
	err = util.FromJSONBytes(buf, &executionConfig)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	if len(executionConfig.Nodes.Permit) == 0 {
		h.WriteError(w, "node of running task can not found", http.StatusInternalServerError)
		return
	}

	query := util.MapStr{
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
						"metadata.labels.pipeline_id": util.MapStr{
							"value": "index_migration",
						},
					},
				},
				{
					"terms": util.MapStr{
						"status": []string{task2.StatusRunning, task2.StatusInit},
					},
				},
			},
		},
	}
	//todo reset stat_time?
	queryDsl := util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"minimum_should_match": 1,
				"should": []util.MapStr{
					{
						"term": util.MapStr{
							"id": util.MapStr{
								"value": id,
							},
						},
					},
					query,
				},
			},
		},
		"script": util.MapStr{
			"source": "ctx._source['status'] = 'stopped'",
		},
	}

	err = orm.UpdateBy(task2.Task{}, util.MustToJSONBytes(queryDsl))
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)
}

func getTaskConfig(task *task2.Task, config interface{}) error{
	configSec, err := util.MapStr(task.Parameters).GetValue("pipeline.config")
	if err != nil {
		return err
	}
	configBytes, err := util.ToJSONBytes(configSec)
	if err != nil {
		return err
	}

	return util.FromJSONBytes(configBytes, config)
}

func getIndexRefreshInterval(indexNames []string, targetESClient elastic.API)(map[string]string, error){
	const step = 50
	var (
		length = len(indexNames)
		end int
	)
	refreshIntervals := map[string]string{}
	for i := 0; i < length; i += step {
		end = i + step
		if end > length - 1 {
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

func (h *APIHandler) getIndexRefreshIntervals(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
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
	taskConfig := &ElasticDataConfig{}
	err = getTaskConfig(&obj, taskConfig)
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

func (h *APIHandler) getDataMigrationTaskInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
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
	taskConfig := &ElasticDataConfig{}
	err = getTaskConfig(&obj, taskConfig)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	taskErrors, err := getErrorPartitionTasks(id)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	//get status of sub task
	//todo size config?
	query :=  util.MapStr{
		"size": 1000,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"parent_id": util.MapStr{
								"value": id,
							},
						},
					},{
						"term": util.MapStr{
							"metadata.labels.pipeline_id": util.MapStr{
								"value": "index_migration",
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.labels.level": util.MapStr{
								"value": "index",
							},
						},
					},
				},
			},
		},
	}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}
	err, result := orm.Search(task2.Task{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	statusM := util.MapStr{}
	for _, row := range result.Result {
		if rowM, ok := row.(map[string]interface{}); ok {
			if v, ok := rowM["id"].(string); ok {
				statusM[v] = rowM["status"]
			}
		}
	}

	var completedIndices int
	targetESClient := elastic.GetClientNoPanic(taskConfig.Cluster.Target.Id)
	for i, index := range taskConfig.Indices {
		if st, ok := statusM[index.TaskID]; ok {
			taskConfig.Indices[i].Status = st.(string)
		}
		var count = index.Target.Docs
		if taskConfig.Indices[i].Status != task2.StatusComplete || count == 0 {
			if targetESClient == nil {
				log.Warnf("cluster [%s] was not found", taskConfig.Cluster.Target.Id)
				break
			}
			count, err = getIndexTaskDocCount(&index, targetESClient)
			if err != nil {
				log.Error(err)
				continue
			}
			taskConfig.Indices[i].Target.Docs = count
		}
		percent := float64(count * 100) / float64(index.Source.Docs)
		if percent > 100 {
			percent = 100
		}
		taskConfig.Indices[i].Percent = util.ToFixed(percent, 2)
		taskConfig.Indices[i].ErrorPartitions = taskErrors[index.TaskID]
		if count == index.Source.Docs {
			completedIndices ++
			taskConfig.Indices[i].Status = task2.StatusComplete
		}
	}
	cfg := global.MustLookup("cluster_migration_config")
	if migrationConfig, ok := cfg.(*ClusterMigrationConfig); ok {
		if obj.Metadata.Labels == nil {
			obj.Metadata.Labels = util.MapStr{}
		}
		obj.Metadata.Labels["log_info"] = util.MapStr{
			"cluster_id": migrationConfig.Elasticsearch,
			"index_name": migrationConfig.LogIndexName,
		}
	}
	util.MapStr(obj.Parameters).Put("pipeline.config", taskConfig)
	obj.Metadata.Labels["completed_indices"] = completedIndices
	h.WriteJSON(w, obj, http.StatusOK)
}
func getErrorPartitionTasks(taskID string) (map[string]int, error){
	query := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"group_by_task": util.MapStr{
				"terms": util.MapStr{
					"field": "parent_id",
					"size": 100,
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.pipeline_id": util.MapStr{
								"value": "index_migration",
							},
						},
					},
					{
						"term": util.MapStr{
							"runnable": util.MapStr{
								"value": true,
							},
						},
					},
					{
						"term": util.MapStr{
							"status": util.MapStr{
								"value": task2.StatusError,
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
	resBody := map[string]int{}

	if taskAgg, ok := searchRes.Aggregations["group_by_task"]; ok {
		for _, bk := range taskAgg.Buckets {
			if key, ok := bk["key"].(string); ok {
				if key == taskID {
					continue
				}
				resBody[key] = int(bk["doc_count"].(float64))
			}
		}
	}
	return resBody, nil
}

func getIndexTaskDocCount(index *IndexConfig, targetESClient elastic.API) (int64, error) {
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

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*3)
	defer cancel()
	countRes, err := targetESClient.Count(ctx, targetIndexName, body)
	if err != nil {
		return 0, err
	}
	if countRes.StatusCode != http.StatusOK && countRes.RawResult != nil {
		return 0, fmt.Errorf(string(countRes.RawResult.Body))
	}
	return countRes.Count, nil
}

func getExecutionConfig(parameters map[string]interface{}, key string)(*ExecutionConfig, error){
	execution, err := util.MapStr(parameters).GetValue(key)
	if err != nil {
		return nil, err
	}
	buf := util.MustToJSONBytes(execution)
	executionConfig := ExecutionConfig{}
	err = util.FromJSONBytes(buf, &executionConfig)
	return &executionConfig, err
}

func getTaskStats(nodeID string) (map[string]interface{}, error){
	endpoint, err := getNodeEndpoint(nodeID)
	if err != nil {
		return nil, err
	}
	res, err := proxy.DoProxyRequest(&proxy.Request{
		Method: http.MethodGet,
		Endpoint: endpoint,
		Path: "/stats",
	})

	if err != nil {
		return nil, fmt.Errorf("call stats api error: %w", err)
	}
	resBody := struct {
		Stats map[string]interface{} `json:"stats"`
	}{}
	err = util.FromJSONBytes(res.Body, &resBody)
	return resBody.Stats, err
}

func (h *APIHandler) getDataMigrationTaskOfIndex(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	id := ps.MustGetParameter("task_id")
	indexTask := task2.Task{}
	indexTask.ID = id
	exists, err := orm.Get(&indexTask)
	if !exists || err != nil {
		h.WriteError(w, fmt.Sprintf("task [%s] not found", id), http.StatusInternalServerError)
		return
	}

	var durationInMS int64
	if indexTask.StartTimeInMillis > 0 {
		durationInMS = time.Now().UnixMilli() - indexTask.StartTimeInMillis
		if indexTask.CompletedTime != nil && indexTask.Status == task2.StatusComplete {
			durationInMS = indexTask.CompletedTime.UnixMilli() - indexTask.StartTimeInMillis
		}
	}
	var completedTime int64
	if indexTask.CompletedTime != nil {
		completedTime = indexTask.CompletedTime.UnixMilli()
	}

	taskInfo := util.MapStr{
		"task_id": id,
		"start_time": indexTask.StartTimeInMillis,
		"status": indexTask.Status,
		"completed_time": completedTime,
		"duration": durationInMS,
	}
	if len(indexTask.Metadata.Labels) > 0 {
		taskInfo["data_partition"] = indexTask.Metadata.Labels["partition_count"]
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
					},{
						"term": util.MapStr{
							"metadata.labels.pipeline_id": util.MapStr{
								"value": "index_migration",
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
	executionConfig, err := getExecutionConfig(indexTask.Parameters, "pipeline.config.execution")
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(executionConfig.Nodes.Permit) == 0 {
		h.WriteError(w, "node of running task can not found", http.StatusInternalServerError)
		return
	}
	stats, err := getTaskStats(executionConfig.Nodes.Permit[0].ID)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var ptasks = make([]task2.Task, 0, len(result.Result))
	var ptaskIds = make([]string, 0, len(result.Result))
	for _, row := range result.Result {
		buf := util.MustToJSONBytes(row)
		ptask := task2.Task{}
		err = util.FromJSONBytes(buf, &ptask)
		if err != nil {
			log.Error(err)
			continue
		}
		ptasks = append(ptasks, ptask)
		ptaskIds = append(ptaskIds, ptask.ID)
	}
	indexingStats, err := getIndexingStats(ptaskIds, h.bulkResultIndexName)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var (
		partitionTaskInfos []util.MapStr
		completedPartitions int
	)
	for i, ptask := range ptasks {
		start, _ := util.MapStr(ptask.Parameters).GetValue("pipeline.config.source.start")
		end, _ := util.MapStr(ptask.Parameters).GetValue("pipeline.config.source.end")
		if i == 0 {
			step, _ := util.MapStr(ptask.Parameters).GetValue("pipeline.config.source.step")
			taskInfo["step"] = step
		}
		durationInMS = 0
		if ptask.StartTimeInMillis > 0 {
			durationInMS = time.Now().UnixMilli() - ptask.StartTimeInMillis
			if ptask.CompletedTime != nil && (ptask.Status == task2.StatusComplete || ptask.Status == task2.StatusError) {
				durationInMS = ptask.CompletedTime.UnixMilli() - ptask.StartTimeInMillis
			}
		}
		var (
			scrollDocs float64
			indexDocs float64
		)
		var stKey = fmt.Sprintf("scrolling_processing.%s", ptask.ID)
		if pt, ok := stats[stKey]; ok {
			if ptv, ok := pt.(map[string]interface{}); ok {
				if v, ok := ptv["docs"].(float64); ok {
					scrollDocs = v
				}
			}
		}
		if v, ok := indexingStats[ptask.ID]; ok {
			indexDocs = v
		}
		var subCompletedTime int64
		if ptask.CompletedTime != nil {
			subCompletedTime = ptask.CompletedTime.UnixMilli()
		}

		partitionTotalDocs, _ := util.MapStr(ptask.Parameters).GetValue("pipeline.config.source.doc_count")
		partitionTaskInfos = append(partitionTaskInfos, util.MapStr{
			"task_id": ptask.ID,
			"status": ptask.Status,
			"start_time": ptask.StartTimeInMillis,
			"completed_time": subCompletedTime,
			"start": start,
			"end": end,
			"duration": durationInMS,
			"scroll_docs": scrollDocs,
			"index_docs": indexDocs,
			"total_docs": partitionTotalDocs,
		})
		if ptask.Status == task2.StatusComplete {
			completedPartitions++
		}
	}
	taskInfo["partitions"] = partitionTaskInfos
	taskInfo["completed_partitions"] = completedPartitions
	h.WriteJSON(w, taskInfo, http.StatusOK)
}

func (h *APIHandler) getMigrationTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
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

func (h *APIHandler) countDocuments(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	var (
		index = ps.MustGetParameter("index")
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

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	countRes, err := client.Count(ctx, index, query)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, countRes, http.StatusOK)
}

func (h *APIHandler) getMigrationTaskLog(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	id := ps.MustGetParameter("task_id")
	query := util.MapStr{
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "asc",
				},
			},
		},
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
					},{
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

	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}
	err, _ := orm.Search(task2.Log{}, q)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
	}
}

func (h *APIHandler) updateDataMigrationTaskStatus(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
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

func (h *APIHandler) validateDataMigration(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	typ := h.GetParameter(req, "type")
	switch typ {
	case "multi_type":
		h.validateMultiType(w, req, ps)
		return
	}
	h.WriteError(w, "unknown parameter type", http.StatusOK)
}

func (h *APIHandler) validateMultiType(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	var reqBody = struct {
		Cluster struct{
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
	} , http.StatusOK)
}

func getIndexingStats(taskIDs []string, indexName string) (map[string]float64, error){
	if len(taskIDs) == 0 {
		return nil, fmt.Errorf("taskIDs should not be empty")
	}
	q := util.MapStr{
		"size": 0,
		"query": util.MapStr{
			"terms": util.MapStr{
				"labels.queue": taskIDs,
			},
		},
		"aggs": util.MapStr{
			"gp_task": util.MapStr{
				"terms": util.MapStr{
					"field": "labels.queue",
					"size": len(taskIDs),
				},
				"aggs": util.MapStr{
					"success_count": util.MapStr{
						"sum": util.MapStr{
							"field": "bulk_results.summary.success.count",
						},
					},
				},
			},
		},
	}
	query := orm.Query{
		RawQuery: util.MustToJSONBytes(q),
		IndexName: indexName,
	}
	err, result := orm.Search(nil, &query)
	if err != nil {
		return nil, fmt.Errorf("query indexing stats error: %w", err)
	}
	statsM := map[string]float64{}
	jsonparser.ArrayEach(result.Raw, func(value []byte, dataType jsonparser.ValueType, offset int, err error) {
		key, _ := jsonparser.GetString(value, "key")
		successCount, err := jsonparser.GetFloat(value, "success_count", "value")
		if err != nil {
			log.Error(err)
		}
		statsM[key] = successCount
	}, "aggregations", "gp_task", "buckets")
	return statsM, nil
}