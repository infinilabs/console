package migration

import (
	"net/http"

	log "github.com/cihub/seelog"

	migration_model "infini.sh/console/plugin/migration/model"

	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
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
	t := task.Task{
		Metadata: task.Metadata{
			Type: "cluster_comparison",
			Labels: util.MapStr{
				"business_id":       "cluster_comparison",
				"source_cluster_id": clusterTaskConfig.Cluster.Source.Id,
				"target_cluster_id": clusterTaskConfig.Cluster.Target.Id,
				"source_total_docs": totalDocs,
			},
		},
		Cancellable:  true,
		Runnable:     false,
		Status:       task.StatusInit,
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
