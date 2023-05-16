package util

import (
	"fmt"

	log "github.com/cihub/seelog"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

func GetPendingChildTasks(elasticsearch, indexName string, taskID string, taskType string) ([]task.Task, error) {

	//check whether all pipeline task is stopped or not, then update task status
	q := util.MapStr{
		"size": 200,
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
					{
						"terms": util.MapStr{
							"status": []string{task.StatusRunning, task.StatusPendingStop, task.StatusReady},
						},
					},
				},
			},
		},
	}
	return GetTasks(elasticsearch, indexName, q)
}

func GetTasks(elasticsearch, indexName string, query interface{}) ([]task.Task, error) {
	esClient := elastic.GetClient(elasticsearch)
	res, err := esClient.SearchWithRawQueryDSL(indexName, util.MustToJSONBytes(query))
	if err != nil {
		log.Errorf("query tasks from es failed, err: %v", err)
		return nil, err
	}
	if res.GetTotal() == 0 {
		return nil, nil
	}
	var tasks []task.Task
	for _, hit := range res.Hits.Hits {
		buf, err := util.ToJSONBytes(hit.Source)
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
