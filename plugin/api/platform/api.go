/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package platform

import (
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"io"
	"net/http"
)

type PlatformAPI struct {
	api.Handler
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
		ok bool
	)
	if meta, ok = collMetas[collName]; !ok {
		h.WriteError(w, fmt.Sprintf("metadata of collection [%s] not found", collName), http.StatusInternalServerError)
		return
	}
	if api.IsAuthEnable(){
		claims, err := rbac.ValidateLogin(req.Header.Get("Authorization"))
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusUnauthorized)
			return
		}
		err = rbac.ValidatePermission(claims, meta.RequirePermission["read"])
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
			h.WriteJSON(w, elastic.SearchResponse{
			}, http.StatusOK)
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
	h.WriteJSON(w, searchRes,http.StatusOK)
}

func (h *PlatformAPI) rewriteQueryWithFilter(queryDsl []byte, filter util.MapStr) ([]byte, error){

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

//getCollectionMeta returns metadata of target collection, includes backend index name
func (h *PlatformAPI) getCollectionMeta(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	collName := ps.MustGetParameter("collection_name")
	collMetas := GetCollectionMetas()
	var (
		meta CollectionMeta
		ok bool
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