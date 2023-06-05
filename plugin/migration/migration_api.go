package migration

import (
	"net/http"

	log "github.com/cihub/seelog"

	"infini.sh/console/plugin/migration/cluster_migration"
	migration_model "infini.sh/console/plugin/migration/model"
	migration_util "infini.sh/console/plugin/migration/util"

	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
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
	taskQuery := util.MapStr{
		"size": 500,
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

	var indexMigrationTaskIDs []string
	indexState = map[string]MigrationIndexStateInfo{}
	for _, subTask := range subTasks {
		taskLabels := util.MapStr(subTask.Metadata.Labels)
		indexName := migration_util.GetMapStringValue(taskLabels, "unique_index_name")
		if indexName == "" {
			continue
		}

		if subTask.Status == task.StatusRunning {
			indexMigrationTaskIDs = append(indexMigrationTaskIDs, subTask.ID)
			continue
		}

		cfg := migration_model.IndexMigrationTaskConfig{}
		err = migration_util.GetTaskConfig(&subTask, &cfg)
		if err != nil {
			log.Errorf("failed to get task config, err: %v", err)
			continue
		}
		indexDocs := migration_util.GetMapIntValue(taskLabels, "index_docs")
		taskStats.IndexDocs += indexDocs
		taskStats.SourceDocs += cfg.Source.DocCount
		st := indexState[indexName]
		st.IndexDocs += indexDocs
		st.SourceDocs += cfg.Source.DocCount
		if subTask.Status == task.StatusError {
			st.ErrorPartitions += 1
			taskStats.ErrorPartitions += 1
		}
		indexState[indexName] = st
		indexMigrationTaskIDs = append(indexMigrationTaskIDs, subTask.ID)
	}

	taskQuery = util.MapStr{
		"size": 500,
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

	var pipelineTaskIDs = map[string][]string{}
	var pipelineIndexNames = map[string]string{}
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
