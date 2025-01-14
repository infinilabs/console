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

package api

import (
	"fmt"
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"time"
)

func (h *APIHandler) HandleSettingAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	targetClusterID := ps.ByName("id")

	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	var reqParams = elastic.Setting{
		UpdatedAt: time.Now(),
		ClusterID: targetClusterID,
	}

	err := h.DecodeJSON(req, &reqParams)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	indexName := orm.GetIndexName(reqParams)
	queryDSL := fmt.Sprintf(`{"size":1,"query":{"bool":{"must":[{"match":{"key":"%s"}},{"match":{"cluster_id":"%s"}}]}}}`, reqParams.Key, targetClusterID)
	searchRes, err := esClient.SearchWithRawQueryDSL(indexName, []byte(queryDSL))
	if len(searchRes.Hits.Hits) > 0 {
		_, err = esClient.Index(indexName, "", searchRes.Hits.Hits[0].ID, reqParams, "wait_for")
	} else {
		reqParams.ID = util.GetUUID()
		_, err = esClient.Index(indexName, "", reqParams.ID, reqParams, "wait_for")
	}

	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	resBody["acknowledged"] = true
	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) HandleGetSettingAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	targetClusterID := ps.ByName("id")

	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	var key = ps.ByName("key")

	queryDSL := fmt.Sprintf(`{"size":1,"query":{"bool":{"must":[{"match":{"key":"%s"}},{"match":{"cluster_id":"%s"}}]}}}`, key, targetClusterID)
	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(elastic.Setting{}), []byte(queryDSL))

	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	var value interface{}
	if len(searchRes.Hits.Hits) > 0 {
		value = searchRes.Hits.Hits[0].Source["value"]
	} else {
		value = ""
	}
	h.WriteJSON(w, value, http.StatusOK)
}
