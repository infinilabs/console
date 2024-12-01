/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/modules/elastic/adapter"
	"net/http"
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
)

func (h *APIHandler) GetShardInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	shardID := ps.MustGetParameter("shard_id")
	clusterUUID, err := adapter.GetClusterUUID(clusterID)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	q := orm.Query{
		Size: 1,
	}
	q.Conds = orm.And(
		orm.Eq("metadata.labels.shard_id", shardID),
		orm.Eq("metadata.labels.cluster_uuid", clusterUUID),
	)
	q.AddSort("timestamp", orm.DESC)

	err, res := orm.Search(&event.Event{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(res.Result) == 0 {
		h.WriteJSON(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}
	h.WriteJSON(w, res.Result[0], http.StatusOK)
}
