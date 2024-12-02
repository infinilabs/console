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

package platform

import (
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/console/common"
	"infini.sh/console/core"
	"infini.sh/console/core/security"
	"infini.sh/console/model"
	"infini.sh/console/service"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"io"
	"net/http"
)

type PlatformAPI struct {
	core.Handler
}

func InitAPI() {
	papi := PlatformAPI{}
	api.HandleAPIMethod(api.POST, "/collection/:collection_name/_search", papi.RequireLogin(papi.searchCollection))
	api.HandleAPIMethod(api.GET, "/collection/:collection_name/metadata", papi.RequireLogin(papi.getCollectionMeta))
}

func (h *PlatformAPI) searchCollection(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	collName := ps.MustGetParameter("collection_name")
	collMetas := GetCollectionMetas()
	var (
		meta CollectionMeta
		ok   bool
	)
	if meta, ok = collMetas[collName]; !ok {
		h.WriteError(w, fmt.Sprintf("metadata of collection [%s] not found", collName), http.StatusInternalServerError)
		return
	}
	if api.IsAuthEnable() {
		claims, err := security.ValidateLogin(req.Header.Get("Authorization"))
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusUnauthorized)
			return
		}
		err = security.ValidatePermission(claims, meta.RequirePermission["read"])
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusForbidden)
			return
		}
	}
	client := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	queryDsl, err := io.ReadAll(req.Body)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if meta.GetSearchRequestBodyFilter != nil {
		filter, hasAllPrivilege := meta.GetSearchRequestBodyFilter(h, req)
		if !hasAllPrivilege && filter == nil {
			h.WriteJSON(w, elastic.SearchResponse{}, http.StatusOK)
			return
		}
		if !hasAllPrivilege {
			queryDsl, err = h.rewriteQueryWithFilter(queryDsl, filter)
			if err != nil {
				log.Error(err)
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}
	}

	searchRes, err := client.SearchWithRawQueryDSL(orm.GetIndexName(meta.MatchObject), queryDsl)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if searchRes.StatusCode != http.StatusOK {
		h.WriteError(w, string(searchRes.RawResult.Body), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, searchRes, http.StatusOK)
}

func (h *PlatformAPI) rewriteQueryWithFilter(queryDsl []byte, filter util.MapStr) ([]byte, error) {

	mapObj := util.MapStr{}
	err := util.FromJSONBytes(queryDsl, &mapObj)
	if err != nil {
		return nil, err
	}
	must := []util.MapStr{
		filter,
	}
	filterQ := util.MapStr{
		"bool": util.MapStr{
			"must": must,
		},
	}
	v, ok := mapObj["query"].(map[string]interface{})
	if ok { //exists query
		newQuery := util.MapStr{
			"bool": util.MapStr{
				"filter": filterQ,
				"must":   []interface{}{v},
			},
		}
		mapObj["query"] = newQuery
	} else {
		mapObj["query"] = util.MapStr{
			"bool": util.MapStr{
				"filter": filterQ,
			},
		}
	}
	queryDsl = util.MustToJSONBytes(mapObj)
	return queryDsl, nil
}

// getCollectionMeta returns metadata of target collection, includes backend index name
func (h *PlatformAPI) getCollectionMeta(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	collName := ps.MustGetParameter("collection_name")
	if collName == "activity" {
		user, auditLogErr := security.FromUserContext(req.Context())
		if auditLogErr == nil && h.GetHeader(req, "Referer", "") != "" {
			auditLog, _ := model.NewAuditLogBuilderWithDefault().WithOperator(user.Username).
				WithLogTypeAccess().WithResourceTypeAccountCenter().
				WithEventName("get activity meta").WithEventSourceIP(common.GetClientIP(req)).
				WithResourceName("activity").WithOperationTypeAccess().WithEventRecord("").Build()
			_ = service.LogAuditLog(auditLog)
		}
	}
	collMetas := GetCollectionMetas()
	var (
		meta CollectionMeta
		ok   bool
	)
	if meta, ok = collMetas[collName]; !ok {
		h.WriteError(w, fmt.Sprintf("metadata of collection [%s] not found", collName), http.StatusInternalServerError)
		return
	}
	indexName := orm.GetIndexName(meta.MatchObject)
	h.WriteJSON(w, util.MapStr{
		"collection_name": collName,
		"metadata": util.MapStr{
			"index_name": indexName,
		},
	}, http.StatusOK)
}
