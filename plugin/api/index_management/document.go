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

package index_management

import (
	"fmt"
	"net/http"
	"strings"

	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
)

type docReqBody struct {
	From          int    `json:"from"`
	Size          int    `json:"size"`
	Filter        string `json:"filter"`
	Cluster       string `json:"cluster"`
	Keyword       string `json:"keyword"`
	Sort          string `json:"sort"`
	SortDirection string `json:"sort_direction"`
}

func (handler APIHandler) HandleAddDocumentAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	reqBody := map[string]interface{}{}
	resBody := newResponseBody()
	err := handler.DecodeJSON(req, &reqBody)
	if err != nil {
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	indexName := ps.ByName("index")
	docID := ps.ByName("docId")
	if strings.Trim(docID, "/") == "" {
		docID = util.GetUUID()
	}
	docType := handler.GetParameter(req, "_type")
	insertRes, err := client.Index(indexName, docType, docID, reqBody, "wait_for")
	if err != nil {
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	reqBody["_id"] = docID
	resBody["result"] = insertRes.Result
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) HandleUpdateDocumentAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	resBody := newResponseBody()
	if client == nil {
		resBody["error"] = "can not found target cluster"
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	reqBody := map[string]interface{}{}

	err := handler.DecodeJSON(req, &reqBody)
	if err != nil {
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	indexName := ps.ByName("index")
	docID := ps.ByName("docId")
	typ := handler.GetParameter(req, "_type")
	isNew := handler.GetParameter(req, "is_new")
	if isNew == "1" {
		getRes, err := client.Get(indexName, typ, docID)
		if err != nil {
			resBody["error"] = err.Error()
			handler.WriteJSON(w, resBody, http.StatusOK)
			return
		}
		if getRes.Found {
			resBody["error"] = "doc id already exists"
			handler.WriteJSON(w, resBody, http.StatusOK)
			return
		}
	}

	insertRes, err := client.Index(indexName, typ, docID, reqBody, "wait_for")
	if err != nil {
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	resBody["_source"] = reqBody
	resBody["_id"] = docID
	resBody["result"] = insertRes.Result
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) HandleDeleteDocumentAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	resBody := newResponseBody()
	if client == nil {
		resBody["error"] = "can not found target cluster"
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}

	indexName := ps.ByName("index")
	docID := ps.ByName("docId")
	typ := handler.GetParameter(req, "_type")
	delRes, err := client.Delete(indexName, typ, docID, "wait_for")
	if err != nil {
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	resBody["result"] = delRes.Result
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) HandleSearchDocumentAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	reqBody := docReqBody{}
	resResult := newResponseBody()
	err := handler.DecodeJSON(req, &reqBody)
	if err != nil {
		resResult["status"] = false
		resResult["error"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	indexName := ps.ByName("index")
	var (
		sort = ""
	)
	if reqBody.From < 0 {
		reqBody.From = 0
	}
	if reqBody.Size <= 0 {
		reqBody.Size = 10
	}
	filter := `{"match_all": {}}`
	if reqBody.Keyword != "" {
		filter = fmt.Sprintf(`{"query_string":{"query":"%s"}}`, reqBody.Keyword)
	}
	if reqBody.Filter != "" {
		filter = reqBody.Filter
	}
	if sortField := strings.Trim(reqBody.Sort, " "); sortField != "" {
		sortDirection := reqBody.SortDirection
		if sortDirection != "desc" {
			sortDirection = "asc"
		}
		sort = fmt.Sprintf(`"%s":{"order":"%s"}`, sortField, sortDirection)
	}
	query := fmt.Sprintf(`{"from":%d, "size": %d, "query": %s, "sort": [{%s}]}`, reqBody.From, reqBody.Size, filter, sort)
	//fmt.Println(indexName, query)
	var reqBytes = []byte(query)
	resp, err := client.SearchWithRawQueryDSL(indexName, reqBytes)
	if err != nil {
		resResult["status"] = false
		resResult["error"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	//result := formatESSearchResult(resp)

	resResult["payload"] = resp

	handler.WriteJSON(w, resResult, http.StatusOK)
}

func (handler APIHandler) ValidateDocIDAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	resBody := util.MapStr{}
	if client != nil {
		resBody["error"] = "cluster not found"
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	var (
		index = handler.GetParameter(req, "index")
		docID = handler.GetParameter(req, "doc_id")
		typ   = handler.GetParameter(req, "type")
	)
	getRes, err := client.Get(index, typ, docID)
	if err != nil {
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	resBody["found"] = getRes.Found
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func formatESSearchResult(esResp *elastic.SearchResponse) map[string]interface{} {
	total := esResp.Hits.Total
	if len(esResp.Hits.Hits) == 0 {
		return map[string]interface{}{
			"total": total,
			"data":  nil,
		}
	}
	dataArr := make([]interface{}, 0, len(esResp.Hits.Hits))
	for _, hit := range esResp.Hits.Hits {
		if _, ok := hit.Source["id"]; !ok {
			hit.Source["id"] = hit.ID
		}
		hit.Source["_index"] = hit.Index
		dataArr = append(dataArr, hit.Source)
	}
	return map[string]interface{}{
		"total": total,
		"data":  dataArr,
	}
}
