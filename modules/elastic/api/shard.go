// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

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
