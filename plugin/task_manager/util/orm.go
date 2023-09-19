package util

import (
	"fmt"

	log "github.com/cihub/seelog"

	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

func DeleteChildTasks(taskID string, taskType string) error {
	q := util.MapStr{
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
							"metadata.type": taskType,
						},
					},
				},
			},
		},
	}
	err := orm.DeleteBy(&task.Task{}, util.MustToJSONBytes(q))
	if err != nil {
		return err
	}
	return nil
}

func GetLastRepeatingChildTask(taskID string, taskType string) (*task.Task, *task.Task, error) {
	queryDsl := util.MapStr{
		"size": 2,
		"sort": []util.MapStr{
			{
				"metadata.labels.next_run_time": util.MapStr{
					"order": "desc",
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.type": taskType,
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
	tasks, err := GetTasks(queryDsl)
	if err != nil {
		return nil, nil, err
	}
	if len(tasks) == 0 {
		return nil, nil, nil
	}
	var lastRunChildTask *task.Task
	if tasks[0].StartTimeInMillis > 0 {
		lastRunChildTask = &tasks[0]
	}else{
		if len(tasks) == 2 {
			lastRunChildTask = &tasks[1]
		}
	}

	return &tasks[0], lastRunChildTask, nil
}

func GetPendingChildTasks(taskID string, taskType string) ([]task.Task, error) {
	return GetChildTasks(taskID, taskType, []string{task.StatusRunning, task.StatusPendingStop, task.StatusReady})
}

func CountRunningChildren(taskID string, taskType string) (int64, error) {
	return CountTasks(util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.type": taskType,
						},
					},
					{
						"term": util.MapStr{
							"parent_id": util.MapStr{
								"value": taskID,
							},
						},
					},
					{
						"terms": util.MapStr{
							"status": []string{task.StatusRunning, task.StatusPendingStop, task.StatusReady},
						},
					},
				},
			},
		},
	})
}

func GetChildTasks(taskID string, taskType string, status []string) ([]task.Task, error) {
	musts := []util.MapStr{
		{
			"term": util.MapStr{
				"parent_id": util.MapStr{
					"value": taskID,
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.type": taskType,
			},
		},
	}
	if len(status) > 0 {
		musts = append(musts, util.MapStr{
			"terms": util.MapStr{
				"status": status,
			},
		})
	}
	queryDsl := util.MapStr{
		"size": 999,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": musts,
			},
		},
	}
	return GetTasks(queryDsl)
}

func CountTasks(query util.MapStr) (int64, error) {
	return orm.Count(task.Task{}, util.MustToJSONBytes(query))
}

func GetTasks(query util.MapStr) ([]task.Task, error) {
	err, res := orm.Search(task.Task{}, &orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	})
	if err != nil {
		log.Errorf("query tasks from es failed, err: %v", err)
		return nil, err
	}
	if res.Total == 0 {
		return nil, nil
	}
	var tasks []task.Task
	for _, row := range res.Result {
		buf, err := util.ToJSONBytes(row)
		if err != nil {
			log.Errorf("marshal task json failed, err: %v", err)
			return nil, err
		}
		tk := task.Task{}
		err = util.FromJSONBytes(buf, &tk)
		if err != nil {
			log.Errorf("unmarshal task json failed, err: %v", err)
			return nil, err
		}
		if tk.Metadata.Labels == nil {
			continue
		}
		tasks = append(tasks, tk)
	}
	return tasks, nil
}

// update status of subtask to pending stop
func UpdatePendingChildTasksToPendingStop(taskItem *task.Task, taskType string) error {
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
						"status": []string{task.StatusRunning, task.StatusReady},
					},
				},
				{
					"term": util.MapStr{
						"metadata.type": util.MapStr{
							"value": taskType,
						},
					},
				},
			},
		},
	}
	queryDsl := util.MapStr{
		"query": query,
		"script": util.MapStr{
			"source": fmt.Sprintf("ctx._source['status'] = '%s'", task.StatusPendingStop),
		},
	}

	err := orm.UpdateBy(taskItem, util.MustToJSONBytes(queryDsl))
	if err != nil {
		return err
	}
	return nil
}

// update status of subtask to ready
func UpdateStoppedChildTasksToReady(taskItem *task.Task, taskType string) error {
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
						"status": []string{task.StatusError, task.StatusStopped},
					},
				},
				{
					"term": util.MapStr{
						"metadata.type": util.MapStr{
							"value": taskType,
						},
					},
				},
			},
		},
	}
	queryDsl := util.MapStr{
		"query": query,
		"script": util.MapStr{
			"source": fmt.Sprintf("ctx._source['status'] = '%s'", task.StatusReady),
		},
	}

	err := orm.UpdateBy(taskItem, util.MustToJSONBytes(queryDsl))
	if err != nil {
		return err
	}
	return nil
}
