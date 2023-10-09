package task_manager

import (
	"errors"
	"fmt"
	migration_model "infini.sh/console/plugin/task_manager/model"
	"infini.sh/framework/core/global"
	"net/http"
	"strconv"
	"strings"
	"time"

	log "github.com/cihub/seelog"

	"infini.sh/console/model"
	migration_util "infini.sh/console/plugin/task_manager/util"

	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	elastic2 "infini.sh/framework/modules/elastic"
)

type TaskInfoResponse struct {
	TaskID              string        `json:"task_id"`
	Step                interface{}   `json:"step"`
	StartTime           int64         `json:"start_time"`
	CompletedTime       int64         `json:"completed_time"`
	Duration            int64         `json:"duration"`
	DataPartition       int           `json:"data_partition"`
	CompletedPartitions int           `json:"completed_partitions"`
	Partitions          []util.MapStr `json:"partitions"`
	Repeating           bool          `json:"repeating"`
	Workers []util.MapStr `json:"workers"`
	Incremental *migration_model.IndexIncremental `json:"incremental"`
	NextRunTime int64 `json:"next_run_time"`
}

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
					"must_not": util.MapStr{
						"exists": util.MapStr{
							"field": "parent_id",
						},
					},
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
			h.populateMajorTaskInfo(hit.ID, sourceM)
		}

		h.WriteJSON(w, searchRes, http.StatusOK)
	}
}

func (h *APIHandler) populateMajorTaskInfo(taskID string, sourceM util.MapStr) {
	buf := util.MustToJSONBytes(sourceM)
	majorTask := task.Task{}
	err := util.FromJSONBytes(buf, &majorTask)
	if err != nil {
		log.Errorf("failed to unmarshal major task info, err: %v", err)
		return
	}
	_, repeatStatus, err := h.calcRepeatingStatus(&majorTask)
	if err != nil {
		log.Warnf("failed to calc repeat info, err: %v", err)
		return
	}
	sourceM.Put("repeat", repeatStatus)
	switch majorTask.Metadata.Type {
	case "cluster_migration":
		ts, _, err := h.getMigrationMajorTaskInfo(taskID)
		if err != nil {
			log.Warnf("fetch progress info of task error: %v", err)
			return
		}
		sourceM.Put("metadata.labels.target_total_docs", ts.IndexDocs)
		sourceM.Put("metadata.labels.source_total_docs", ts.SourceDocs)
		sourceM.Put("metadata.labels.error_partitions", ts.ErrorPartitions)
		count, err := migration_util.CountRunningChildren(taskID, "index_migration")
		if err != nil {
			log.Warnf("failed to count running children, err: %v", err)
			return
		}
		sourceM.Put("running_children", count)
		if repeatStatus.IsRepeat && repeatStatus.LastRunChildTaskID != "" {
			ts, _, err = h.getMigrationMajorTaskInfo(repeatStatus.LastRunChildTaskID)
			if err != nil {
				log.Warnf("fetch progress info of task error: %v", err)
				return
			}
			sourceM.Put("metadata.labels.target_total_docs", ts.IndexDocs)
			sourceM.Put("metadata.labels.source_total_docs", ts.SourceDocs)
		}
	case "cluster_comparison":
		ts, _, err := h.getComparisonMajorTaskInfo(taskID)
		if err != nil {
			log.Warnf("fetch progress info of task error: %v", err)
			return
		}
		sourceM.Put("metadata.labels.source_scroll_docs", ts.SourceScrollDocs)
		sourceM.Put("metadata.labels.source_total_docs", ts.SourceTotalDocs)
		sourceM.Put("metadata.labels.target_total_docs", ts.TargetTotalDocs)
		sourceM.Put("metadata.labels.target_scroll_docs", ts.TargetScrollDocs)
		sourceM.Put("metadata.labels.total_diff_docs", ts.TotalDiffDocs)
		count, err := migration_util.CountRunningChildren(taskID, "index_comparison")
		if err != nil {
			log.Warnf("failed to count running children, err: %v", err)
			return
		}
		sourceM.Put("running_children", count)
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
	if obj.Metadata.Type != "pipeline" && (obj.Status == task.StatusComplete && obj.Metadata.Type != "cluster_comparison") {
		h.WriteError(w, fmt.Sprintf("[%s] task [%s] completed, can't start anymore", obj.Metadata.Type, taskID), http.StatusInternalServerError)
		return
	}
	obj.Status = task.StatusReady
	if _, ok := obj.Metadata.Labels["next_run_time"]; !ok {
		startTime := time.Now().UnixMilli()
		// only set for initial cluster-level tasks
		if len(obj.ParentId) == 0 {
			obj.Metadata.Labels["next_run_time"] = startTime
		}
	}

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

// resume an repeating task
func (h *APIHandler) resumeTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	taskID := ps.MustGetParameter("task_id")
	obj := task.Task{}

	obj.ID = taskID
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteError(w, fmt.Sprintf("task [%s] not found", taskID), http.StatusInternalServerError)
		return
	}
	if len(obj.ParentId) > 0 {
		h.WriteError(w, fmt.Sprintf("can't resume on a child task", taskID), http.StatusInternalServerError)
		return
	}
	lastRepeatingChild, repeatStatus, err := h.calcRepeatingStatus(&obj)
	if err != nil {
		h.WriteError(w, fmt.Sprintf("failed to get repeating status", taskID), http.StatusInternalServerError)
		return
	}
	if !repeatStatus.IsRepeat {
		h.WriteError(w, fmt.Sprintf("not a repeating task", taskID), http.StatusInternalServerError)
		return
	}
	if repeatStatus.Done {
		h.WriteError(w, fmt.Sprintf("repeat task done", taskID), http.StatusInternalServerError)
		return
	}
	if repeatStatus.Repeating {
		h.WriteJSON(w, util.MapStr{
			"success": true,
		}, 200)
		return
	}

	lastRepeatingChild.Metadata.Labels["repeat_triggered"] = false
	err = orm.Update(nil, lastRepeatingChild)
	if err != nil {
		log.Errorf("failed to update last child, err: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	migration_util.WriteLog(&obj, nil, fmt.Sprintf("repeating task [%s] manually resumed", obj.Metadata.Type, taskID))
	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)
	return
}

// query index level task logging
func (h *APIHandler) searchIndexLevelTaskLogging(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("task_id")
	uniqueIndexName := ps.MustGetParameter("index")
	cfg := global.MustLookup("cluster_migration_config")
	var (
		migrationConfig *DispatcherConfig
		ok bool
	)
	if migrationConfig, ok = cfg.(*DispatcherConfig); !ok {
		h.WriteJSON(w, elastic.SearchResponse{}, http.StatusOK)
		return
	}
	client := elastic.GetClient(migrationConfig.Elasticsearch)
	var (
		strSize = h.GetParameterOrDefault(req, "size", "500")
		min =  h.GetParameterOrDefault(req, "min", "")
		max = h.GetParameterOrDefault(req, "max", "")
	)
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 500
	}
	rangeObj := util.MapStr{}
	if min != "" {
		rangeObj["gte"] = min
	}
	if max != "" {
		rangeObj["lt"] = max
	}
	mustQ := []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.category": util.MapStr{
					"value": "task",
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.labels.parent_task_id": util.MapStr{
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
	}
	if len(rangeObj) > 0 {
		mustQ = append(mustQ, util.MapStr{
			"range": util.MapStr{
				"timestamp": rangeObj,
			},
		})
	}
	query := util.MapStr{
		"size": size,
		"_source": []string{"payload.task.logging.message", "timestamp"},
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": mustQ,
			},
		},
	}
	searchRes, err := client.SearchWithRawQueryDSL(migrationConfig.LogIndexName, util.MustToJSONBytes(query))
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, searchRes, http.StatusOK)
}

type RepeatStatus struct {
	IsRepeat  bool `json:"is_repeat"`
	Done      bool `json:"done"`
	Repeating bool `json:"repeating"`
	LastRunTime int64 `json:"last_run_time"`
	NextRunTime int64 `json:"next_run_time"`
	LastRunChildTaskID string `json:"last_run_child_task_id"`
	LastCompleteTime int64 `json:"last_complete_time"`
}

func (h *APIHandler) calcRepeatingStatus(taskItem *task.Task) (*task.Task, *RepeatStatus, error) {
	ret := &RepeatStatus{}
	lastRepeatingChild, lastRunChild, err := migration_util.GetLastRepeatingChildTask(taskItem.ID, taskItem.Metadata.Type)
	if err != nil {
		return nil, nil, err
	}
	if lastRepeatingChild == nil {
		lastRepeatingChild = taskItem
	}

	isRepeat := migration_util.GetMapBoolValue(lastRepeatingChild.Metadata.Labels, "is_repeat")
	if !isRepeat {
		return lastRepeatingChild, ret, nil
	}
	ret.IsRepeat = isRepeat

	repeatDone := migration_util.GetMapBoolValue(lastRepeatingChild.Metadata.Labels, "repeat_done")
	if repeatDone {
		ret.Done = true
		return lastRepeatingChild, ret, nil
	}
	repeatTriggered := migration_util.GetMapBoolValue(lastRepeatingChild.Metadata.Labels, "repeat_triggered")
	if !repeatTriggered {
		ret.Repeating = true
	}
	ret.NextRunTime = migration_util.GetMapIntValue(lastRepeatingChild.Metadata.Labels, "next_run_time")
	ret.LastRunTime = lastRepeatingChild.StartTimeInMillis
	if ret.LastRunTime == 0 && lastRunChild != nil {
		ret.LastRunTime = lastRunChild.StartTimeInMillis
		if lastRunChild.CompletedTime != nil && !lastRunChild.CompletedTime.IsZero(){
			ret.LastCompleteTime = lastRunChild.CompletedTime.UnixMilli()
		}
	}
	if lastRunChild != nil {
		ret.LastRunChildTaskID = lastRunChild.ID
	}
	return lastRepeatingChild, ret, nil
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

// pause an repeating task
func (h *APIHandler) pauseTask(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	taskID := ps.MustGetParameter("task_id")
	obj := task.Task{}

	obj.ID = taskID
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteError(w, fmt.Sprintf("task [%s] not found", taskID), http.StatusInternalServerError)
		return
	}
	if len(obj.ParentId) > 0 {
		h.WriteError(w, fmt.Sprintf("can't pause on a child task", taskID), http.StatusInternalServerError)
		return
	}
	lastRepeatingChild, repeatStatus, err := h.calcRepeatingStatus(&obj)
	if err != nil {
		h.WriteError(w, fmt.Sprintf("failed to get repeating status", taskID), http.StatusInternalServerError)
		return
	}
	if !repeatStatus.IsRepeat {
		h.WriteError(w, fmt.Sprintf("not a repeating task", taskID), http.StatusInternalServerError)
		return
	}
	if repeatStatus.Done {
		h.WriteError(w, fmt.Sprintf("repeat task done", taskID), http.StatusInternalServerError)
		return
	}
	if !repeatStatus.Repeating {
		h.WriteJSON(w, util.MapStr{
			"success": true,
		}, 200)
		return
	}

	lastRepeatingChild.Metadata.Labels["repeat_triggered"] = true
	err = orm.Update(nil, lastRepeatingChild)
	if err != nil {
		log.Errorf("failed to update last child, err: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	migration_util.WriteLog(&obj, nil, fmt.Sprintf("repeating task [%s] manually paused", taskID))
	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)
	return
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

func (h *APIHandler) getChildTaskInfosByIndex(id string, uniqueIndexName string) (subTasks []task.Task, runningPipelineTaskIDs map[string][]string, pipelineSubParentIDs map[string]string, parentIDPipelineTasks map[string][]task.Task, err error) {
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
	allTasks, err := migration_util.GetTasks(queryDsl)
	if err != nil {
		return
	}

	runningPipelineTaskIDs = map[string][]string{}
	pipelineSubParentIDs = map[string]string{}
	parentIDPipelineTasks = map[string][]task.Task{}

	for _, subTask := range allTasks {
		if subTask.Metadata.Type != "pipeline" {
			subTasks = append(subTasks, subTask)
			continue
		}

		if pl := len(subTask.ParentId); pl != 2 {
			continue
		}
		parentID := migration_util.GetDirectParentId(subTask.ParentId)

		pipelineSubParentIDs[subTask.ID] = parentID
		instID := migration_util.GetMapStringValue(util.MapStr(subTask.Metadata.Labels), "execution_instance_id")
		if instID == "" {
			continue
		}
		if subTask.Status == task.StatusRunning {
			runningPipelineTaskIDs[instID] = append(runningPipelineTaskIDs[instID], subTask.ID)
		}
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
			log.Errorf("failed to get instance info, id: %s, err: %v", instID, err)
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

func (h *APIHandler) calcMajorTaskInfo(subTasks []task.Task, repeating bool) (startTime int64, completedTime int64, duration int64, completedPartitions int) {
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

		if subTask.Status == task.StatusComplete || subTask.Status == task.StatusError {
			completedPartitions++
		}
	}
	if len(subTasks) != completedPartitions || repeating {
		completedTime = 0
		duration = time.Now().UnixMilli() - startTime
	} else {
		duration = completedTime - startTime
	}

	return
}

func (h *APIHandler) searchTaskFieldValues(taskType string) func(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	return func(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		var (
			field = h.GetParameterOrDefault(req, "field", "")
			keyword = h.GetParameterOrDefault(req, "keyword", "")
			mustQ   []interface{}
		)
		mustQ = append(mustQ, util.MapStr{
			"term": util.MapStr{
				"metadata.type": util.MapStr{
					"value": taskType,
				},
			},
		})

		if v := strings.TrimSpace(keyword); v != ""{
			mustQ = append(mustQ, util.MapStr{
				"query_string": util.MapStr{
					"default_field": field,
					"query":         fmt.Sprintf("*%s*", v),
				},
			})
		}
		queryDSL := util.MapStr{
			"aggs": util.MapStr{
				"items": util.MapStr{
					"terms": util.MapStr{
						"field": field,
						"size":  20,
					},
				},
			},
			"size": 0,
			"query": util.MapStr{
				"bool": util.MapStr{
					"must": mustQ,
				},
			},
		}
		q := orm.Query{
			RawQuery: util.MustToJSONBytes(queryDSL),
		}
		err, result := orm.Search(task.Task{}, &q)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		searchRes := elastic.SearchResponse{}
		err = util.FromJSONBytes(result.Raw, &searchRes)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items := []string{}
		for _, bk := range searchRes.Aggregations["items"].Buckets {
			if v, ok := bk["key"].(string); ok {
				if strings.Contains(v, keyword){
					items = append(items, v)
				}
			}
		}
		h.WriteJSON(w, items, http.StatusOK)
	}
}

