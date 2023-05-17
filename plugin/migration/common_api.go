package migration

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	log "github.com/cihub/seelog"

	migration_model "infini.sh/console/plugin/migration/model"
	migration_util "infini.sh/console/plugin/migration/util"

	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	elastic2 "infini.sh/framework/modules/elastic"
)

func (h *APIHandler) searchTask(taskType string) func(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	return func(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		var (
			keyword = h.GetParameterOrDefault(req, "keyword", "")
			strSize = h.GetParameterOrDefault(req, "size", "20")
			strFrom = h.GetParameterOrDefault(req, "from", "0")
			mustQ   []interface{}
		)
		mustQ = append(mustQ, util.MapStr{
			"term": util.MapStr{
				"metadata.type": util.MapStr{
					"value": taskType,
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

		err, res := orm.Search(&task.Task{}, &q)
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
			if hit.Source["status"] == task.StatusRunning {
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
}

func (h *APIHandler) startTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	taskID := ps.MustGetParameter("task_id")
	obj := task.Task{}

	obj.ID = taskID
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteError(w, fmt.Sprintf("task [%s] not found", taskID), http.StatusInternalServerError)
		return
	}
	if obj.Metadata.Type != "pipeline" && obj.Status == task.StatusComplete {
		h.WriteError(w, fmt.Sprintf("[%s] task [%s] completed, can't start anymore", obj.Metadata.Type, taskID), http.StatusInternalServerError)
		return
	}
	obj.Status = task.StatusReady

	err = orm.Update(nil, &obj)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	migration_util.WriteLog(&obj, &task.TaskResult{
		Success: true,
	}, "task status manually set to ready")

	// update status of parent task to running
	for _, parentTaskID := range obj.ParentId {
		parentTask := task.Task{}
		parentTask.ID = parentTaskID
		exists, err := orm.Get(&parentTask)
		if !exists || err != nil {
			h.WriteError(w, fmt.Sprintf("parent task [%s] not found", parentTaskID), http.StatusInternalServerError)
			return
		}
		parentTask.Status = task.StatusRunning
		err = orm.Update(nil, &parentTask)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		migration_util.WriteLog(&parentTask, nil, fmt.Sprintf("child [%s] task [%s] manually started", obj.Metadata.Type, taskID))
	}

	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)
}

func (h *APIHandler) stopTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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
	if task.IsEnded(obj.Status) {
		h.WriteJSON(w, util.MapStr{
			"success": true,
		}, 200)
		return
	}
	obj.Status = task.StatusPendingStop
	err = orm.Update(nil, &obj)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	migration_util.WriteLog(&obj, &task.TaskResult{
		Success: true,
	}, "task status manually set to pending stop")

	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)
}

// delete task and all sub tasks
func (h *APIHandler) deleteTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("task_id")
	obj := task.Task{}
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
	if util.StringInArray([]string{task.StatusReady, task.StatusRunning, task.StatusPendingStop}, obj.Status) {
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
