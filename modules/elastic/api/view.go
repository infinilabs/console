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
	"github.com/segmentio/encoding/json"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/radix"
	"infini.sh/framework/core/util"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func (h *APIHandler) HandleCreateViewAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}

	targetClusterID := ps.ByName("id")
	exists, _, err := h.GetClusterClient(targetClusterID)

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	if !exists {
		resBody["error"] = fmt.Sprintf("cluster [%s] not found", targetClusterID)
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}

	var viewReq = &elastic.ViewRequest{}

	err = h.DecodeJSON(req, viewReq)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	id := util.GetUUID()
	viewReq.Attributes.UpdatedAt = time.Now()
	viewReq.Attributes.ClusterID = targetClusterID
	_, err = esClient.Index(orm.GetIndexName(viewReq.Attributes), "", id, viewReq.Attributes, "wait_for")
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	resBody = map[string]interface{}{
		"id":         id,
		"type":       "index-pattern",
		"updated_at": viewReq.Attributes.UpdatedAt,
		"attributes": viewReq.Attributes,
		"namespaces": []string{"default"},
	}
	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) HandleGetViewListAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}

	targetClusterID := ps.ByName("id")
	strSize := h.GetParameterOrDefault(req, "per_page", "10000")
	size, _ := strconv.Atoi(strSize)
	search := h.GetParameterOrDefault(req, "search", "")
	if search != "" {
		search = fmt.Sprintf(`,{"match":{"title":%s}}`, search)
	}

	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))

	queryDSL := []byte(fmt.Sprintf(`{"_source":["title","viewName", "updated_at", "builtin"],"size": %d, "query":{"bool":{"must":[{"match":{"cluster_id":"%s"}}%s]}}}`, size, targetClusterID, search))

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(elastic.View{}), queryDSL)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	var total = len(searchRes.Hits.Hits)
	if totalVal, ok := searchRes.Hits.Total.(map[string]interface{}); ok {
		total = int(totalVal["value"].(float64))
	}
	resBody = map[string]interface{}{
		"per_page": size,
		"total":    total,
	}
	var savedObjects = make([]map[string]interface{}, 0, len(searchRes.Hits.Hits))
	for _, hit := range searchRes.Hits.Hits {
		var savedObject = map[string]interface{}{
			"id": hit.ID,
			"attributes": map[string]interface{}{
				"title":    hit.Source["title"],
				"viewName": hit.Source["viewName"],
				"builtin":  hit.Source["builtin"],
			},
			"score":      0,
			"type":       "index-pattern",
			"namespaces": []string{"default"},
			"updated_at": hit.Source["updated_at"],
		}
		savedObjects = append(savedObjects, savedObject)
	}
	resBody["saved_objects"] = savedObjects
	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) HandleDeleteViewAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	viewID := ps.ByName("view_id")
	view := elastic.View{
		ID: viewID,
	}
	_, err := orm.Get(&view)
	if err != nil {
		log.Error(err)
		h.WriteJSON(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if view.Builtin {
		h.WriteJSON(w, "builtin view can't be deleted", http.StatusBadRequest)
		return
	}

	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	err = orm.Delete(ctx, &view)
	if err != nil {
		log.Error(err)
		h.WriteJSON(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteCreatedOKJSON(w, viewID)
}

func (h *APIHandler) HandleResolveIndexAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}

	targetClusterID := ps.ByName("id")
	wild := ps.ByName("wild")
	//wild = strings.ReplaceAll(wild, "*", "")

	exists, client, err := h.GetClusterClient(targetClusterID)

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	if !exists {
		resBody["error"] = fmt.Sprintf("cluster [%s] not found", targetClusterID)
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}
	allowedIndices, hasAllPrivilege := h.GetAllowedIndices(req, targetClusterID)
	if !hasAllPrivilege && len(allowedIndices) == 0 {
		h.WriteJSON(w, elastic.AliasAndIndicesResponse{
			Aliases: []elastic.AAIR_Alias{},
			Indices: []elastic.AAIR_Indices{},
		}, http.StatusOK)
		return
	}
	//ccs
	if strings.Contains(wild, ":") {
		q := util.MapStr{
			"size": 0,
			"aggs": util.MapStr{
				"indices": util.MapStr{
					"terms": util.MapStr{
						"field": "_index",
						"size":  200,
					},
				},
			},
		}
		searchRes, err := client.SearchWithRawQueryDSL(wild, util.MustToJSONBytes(q))
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		indices := []elastic.AAIR_Indices{}
		parts := strings.SplitN(wild, ":", 2)
		if parts[1] == "" {
			wild = "*"
		}
		var filterPattern *radix.Pattern
		if !hasAllPrivilege {
			filterPattern = radix.Compile(allowedIndices...)
		}
		inputPattern := radix.Compile(wild)
		if agg, ok := searchRes.Aggregations["indices"]; ok {
			for _, bk := range agg.Buckets {
				if k, ok := bk["key"].(string); ok {
					if !hasAllPrivilege && !filterPattern.Match(k) {
						continue
					}
					if inputPattern.Match(k) {
						indices = append(indices, elastic.AAIR_Indices{
							Name:       k,
							Attributes: []string{"open"},
						})
					}
				}
			}
		}
		h.WriteJSON(w, elastic.AliasAndIndicesResponse{
			Aliases: []elastic.AAIR_Alias{},
			Indices: indices,
		}, http.StatusOK)
		return
	}

	res, err := client.GetAliasesAndIndices()
	if err != nil || res == nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if wild == "" {
		wild = "*"
	}
	var filterPattern *radix.Pattern
	if !hasAllPrivilege {
		filterPattern = radix.Compile(allowedIndices...)
	}
	inputPattern := radix.Compile(wild)
	var (
		aliases = []elastic.AAIR_Alias{}
		indices = []elastic.AAIR_Indices{}
	)
	for _, alias := range res.Aliases {
		if !hasAllPrivilege && !filterPattern.Match(alias.Name) {
			continue
		}
		if inputPattern.Match(alias.Name) {
			aliases = append(aliases, alias)
		}
	}
	for _, index := range res.Indices {
		if !hasAllPrivilege && !filterPattern.Match(index.Name) {
			continue
		}
		if inputPattern.Match(index.Name) {
			indices = append(indices, index)
		}
	}
	res.Indices = indices
	res.Aliases = aliases

	h.WriteJSON(w, res, http.StatusOK)
}

func (h *APIHandler) HandleBulkGetViewAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	targetClusterID := ps.ByName("id")
	var reqIDs = []struct {
		ID   string `json:"id"`
		Type string `json:"type"`
	}{}

	err := h.DecodeJSON(req, &reqIDs)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	var strIDs []string
	var indexNames []string
	for _, reqID := range reqIDs {
		if reqID.Type == "view" {
			strIDs = append(strIDs, fmt.Sprintf(`"%s"`, reqID.ID))
		} else if reqID.Type == "index" {
			indexNames = append(indexNames, reqID.ID)
		}
	}
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	esTragertClient := elastic.GetClient(targetClusterID)
	queryDSL := []byte(fmt.Sprintf(`{"query": {"bool": {"must": [{"terms": {"_id": [%s]}},
		{"match": {"cluster_id": "%s"}}]}}}`, strings.Join(strIDs, ","), targetClusterID))
	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(elastic.View{}), queryDSL)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	var savedObjects = make([]map[string]interface{}, 0, len(searchRes.Hits.Hits))
	for _, hit := range searchRes.Hits.Hits {
		var savedObject = map[string]interface{}{
			"id": hit.ID,
			"attributes": map[string]interface{}{
				"title":          hit.Source["title"],
				"fields":         hit.Source["fields"],
				"viewName":       hit.Source["viewName"],
				"timeFieldName":  hit.Source["timeFieldName"],
				"fieldFormatMap": hit.Source["fieldFormatMap"],
			},
			"score":            0,
			"type":             "view",
			"namespaces":       []string{"default"},
			"migrationVersion": map[string]interface{}{"index-pattern": "7.6.0"},
			"updated_at":       hit.Source["updated_at"],
			"complex_fields":   hit.Source["complex_fields"],
			"builtin":          hit.Source["builtin"],
			"references":       []interface{}{},
		}
		savedObjects = append(savedObjects, savedObject)
	}
	//index mock
	for _, indexName := range indexNames {
		fields, err := elastic.GetFieldCaps(esTragertClient, indexName, []string{"_source", "_id", "_type", "_index"})
		if err != nil {
			log.Error(err)
			resBody["error"] = err.Error()
			h.WriteJSON(w, resBody, http.StatusInternalServerError)
			return
		}
		bufFields, _ := json.Marshal(fields)
		var savedObject = map[string]interface{}{
			"id": indexName, //fmt.Sprintf("%x", md5.Sum([]byte(fmt.Sprintf("%s-%s", targetClusterID,indexName)))),
			"attributes": map[string]interface{}{
				"title":          indexName,
				"fields":         string(bufFields),
				"viewName":       indexName,
				"timeFieldName":  "",
				"fieldFormatMap": "",
			},
			"score":            0,
			"type":             "index",
			"namespaces":       []string{"default"},
			"migrationVersion": map[string]interface{}{"index-pattern": "7.6.0"},
			"updated_at":       time.Now(),
		}
		savedObjects = append(savedObjects, savedObject)
	}
	resBody["saved_objects"] = savedObjects
	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) HandleUpdateViewAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}

	targetClusterID := ps.ByName("id")
	exists, _, err := h.GetClusterClient(targetClusterID)

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	if !exists {
		resBody["error"] = fmt.Sprintf("cluster [%s] not found", targetClusterID)
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}

	var viewReq = &elastic.ViewRequest{}

	err = h.DecodeJSON(req, viewReq)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if viewReq.Attributes.Title == "" {
		resBody["error"] = "miss title"
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	id := ps.ByName("view_id")
	viewReq.Attributes.UpdatedAt = time.Now()
	viewReq.Attributes.ClusterID = targetClusterID
	viewReq.Attributes.ID = id
	oldView := &elastic.View{
		ID: id,
	}
	_, err = orm.Get(oldView)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if oldView.Builtin {
		h.WriteJSON(w, "builtin view can't be updated", http.StatusBadRequest)
		return
	}
	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	err = orm.Save(ctx, viewReq.Attributes)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, viewReq.Attributes, http.StatusOK)
}

func (h *APIHandler) HandleGetFieldCapsAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	targetClusterID := ps.ByName("id")

	pattern := h.GetParameterOrDefault(req, "pattern", "*")
	keyword := h.GetParameterOrDefault(req, "keyword", "")
	aggregatable := h.GetParameterOrDefault(req, "aggregatable", "")
	size := h.GetIntOrDefault(req, "size", 0)
	typ := h.GetParameterOrDefault(req, "type", "")
	esType := h.GetParameterOrDefault(req, "es_type", "")

	metaFields := req.URL.Query()["meta_fields"]
	esClient := elastic.GetClient(targetClusterID)
	kbnFields, err := elastic.GetFieldCaps(esClient, pattern, metaFields)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if keyword != "" || aggregatable != "" || typ != "" || esType != "" || size > 0 {
		var filteredFields []elastic.ElasticField
		var count = 0
		for _, field := range kbnFields {
			if keyword != "" && !strings.Contains(field.Name, keyword) {
				continue
			}
			if aggregatable == "true" && !field.Aggregatable {
				continue
			}
			if typ != "" && field.Type != typ {
				continue
			}
			if esType != "" && field.ESTypes[0] != esType {
				continue
			}
			count++
			if size > 0 && count > size {
				break
			}
			filteredFields = append(filteredFields, field)
		}
		kbnFields = filteredFields
	}

	resBody["fields"] = kbnFields
	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) HandleGetViewAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("view_id")

	obj := elastic.View{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteGetOKJSON(w, id, obj)
}

func (h *APIHandler) SetDefaultLayout(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var viewReq = &elastic.View{}

	err := h.DecodeJSON(req, viewReq)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id := ps.MustGetParameter("view_id")
	viewObj := elastic.View{}
	viewObj.ID = id
	exists, err := orm.Get(&viewObj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	viewObj.DefaultLayoutID = viewReq.DefaultLayoutID
	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	err = orm.Update(ctx, &viewObj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)

}
