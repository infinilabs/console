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
	From     int    `json:"from"`
	Size      int    `json:"size"`
	Filter        string `json:"filter"`
	Cluster       string `json:"cluster"`
	Keyword       string `json:"keyword"`
	Sort          string `json:"sort"`
	SortDirection string `json:"sort_direction"`
}

func (handler APIHandler) HandleAddDocumentAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	client := elastic.GetClient(handler.Config.Elasticsearch)
	reqBody := map[string]interface{}{}
	resResult := newResponseBody()
	err := handler.DecodeJSON(req, &reqBody)
	if err != nil {
		resResult["status"] = false
		resResult["error"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	indexName := ps.ByName("index")
	id := ps.ByName("id")
	if strings.Trim(id, "/") == "" {
		id = util.GetUUID()
	}
	docType := handler.GetParameter(req, "_type")
	_, err = client.Index(indexName, docType, id, reqBody)
	if err != nil {
		resResult["status"] = false
		resResult["error"] = err
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	reqBody["id"] = id
	resResult["payload"] = reqBody
	handler.WriteJSON(w, resResult, http.StatusOK)
}

func (handler APIHandler) HandleUpdateDocumentAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	client := elastic.GetClient(handler.Config.Elasticsearch)
	reqBody := map[string]interface{}{}
	resResult := newResponseBody()
	err := handler.DecodeJSON(req, &reqBody)
	if err != nil {
		resResult["status"] = false
		resResult["error"] = err
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	indexName := ps.ByName("index")
	id := ps.ByName("id")
	typ := handler.GetParameter(req, "_type")
	resp, err := client.Get(indexName,typ, id)
	if err != nil {
		resResult["status"] = false
		resResult["error"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	source := resp.Source
	for k, v := range reqBody {
		if k == "id" {
			continue
		}
		source[k] = v
	}
	_, err = client.Index(indexName, typ, id, source)
	if err != nil {
		resResult["status"] = false
		resResult["error"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	resResult["payload"] = reqBody
	handler.WriteJSON(w, resResult, http.StatusOK)
}

func (handler APIHandler) HandleDeleteDocumentAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	client := elastic.GetClient(handler.Config.Elasticsearch)
	resResult := newResponseBody()
	indexName := ps.ByName("index")
	id := ps.ByName("id")
	typ := handler.GetParameter(req, "_type")
	_, err := client.Delete(indexName, typ, id)
	if err != nil {
		resResult["error"] = err.Error()
		resResult["status"] = false
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	resResult["payload"] = true
	handler.WriteJSON(w, resResult, http.StatusOK)
}

func (handler APIHandler) HandleSearchDocumentAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	client := elastic.GetClient(handler.Config.Elasticsearch)
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
		sort      = ""
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
