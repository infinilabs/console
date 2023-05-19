package migration

import (
	log "github.com/cihub/seelog"

	migration_model "infini.sh/console/plugin/migration/model"
	migration_util "infini.sh/console/plugin/migration/util"

	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

type MigrationIndexStateInfo struct {
	ErrorPartitions int
	IndexDocs       int64
}

/*
We count data from two sources:
  - index_migrations with complete/error status
  - plus index_migration.index_docs with realtime bulk indexing info
  - realtime bulk indexing info is only available for running index_migrations
*/
func (h *APIHandler) getMigrationMajorTaskInfo(majorTaskID string) (taskStats migration_model.ClusterMigrationTaskState, indexState map[string]MigrationIndexStateInfo, err error) {
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
													"metadata.type": util.MapStr{
														"value": "index_migration",
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

	var pipelineTaskIDs = map[string][]string{}
	var pipelineIndexNames = map[string]string{}
	indexState = map[string]MigrationIndexStateInfo{}
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
		if subTask.Metadata.Type == "index_migration" {
			indexDocs := migration_util.GetMapIntValue(taskLabels, "index_docs")
			taskStats.IndexDocs += indexDocs
			st := indexState[indexName]
			st.IndexDocs += indexDocs
			if subTask.Status == task.StatusError {
				st.ErrorPartitions += 1
			}
			indexState[indexName] = st
			continue
		}
		pipelineIndexNames[subTask.ID] = indexName

		if instID := migration_util.GetMapStringValue(taskLabels, "execution_instance_id"); instID != "" {
			pipelineTaskIDs[instID] = append(pipelineTaskIDs[instID], subTask.ID)
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
