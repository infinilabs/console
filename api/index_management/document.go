package index_management

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
)

type docReqBody struct {
	PageIndex     int    `json:"pageIndex"`
	PageSize      int    `json:"pageSize"`
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
		resResult["errno"] = "E10001"
		resResult["errmsg"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	indexName := ps.ByName("index")
	id := util.GetUUID()
	_, err = client.Index(indexName, id, reqBody)
	if err != nil {
		resResult["errno"] = "E10002"
		resResult["errmsg"] = err.Error()
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
		resResult["errno"] = "E10001"
		resResult["errmsg"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	indexName := ps.ByName("index")
	id := ps.ByName("id")
	resp, err := client.Get(indexName, id)
	if err != nil {
		resResult["errno"] = "E10004"
		resResult["errmsg"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	source := resp.Source
	for k, v := range reqBody {
		source[k] = v
	}
	_, err = client.Index(indexName, id, source)
	if err != nil {
		resResult["errno"] = "E10005"
		resResult["errmsg"] = err.Error()
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
	_, err := client.Delete(indexName, id)
	if err != nil {
		resResult["errmsg"] = err.Error()
		resResult["errno"] = "E10006"
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
		resResult["errno"] = "E10001"
		resResult["errmsg"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	indexName := ps.ByName("index")
	var (
		pageSize  = 10
		pageIndex = 1
		sort      = ""
	)
	if reqBody.PageSize > 0 {
		pageSize = reqBody.PageSize
	}
	if reqBody.PageIndex > 0 {
		pageIndex = reqBody.PageIndex
	}
	from := (pageIndex - 1) * pageSize
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
	query := fmt.Sprintf(`{"from":%d, "size": %d, "query": %s, "sort": [{%s}]}`, from, pageSize, filter, sort)
	//fmt.Println(indexName, query)
	var reqBytes = []byte(query)
	resp, err := client.SearchWithRawQueryDSL(indexName, reqBytes)
	if err != nil {
		resResult["errno"] = "E10007"
		resResult["errmsg"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	result := formatESSearchResult(resp)

	_, _, idxs, err := client.GetMapping(false, indexName)
	if err != nil {
		resResult["errno"] = "E10008"
		resResult["errmsg"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	result["mappings"] = idxs
	resResult["payload"] = result

	handler.WriteJSON(w, resResult, http.StatusOK)
}

func (handler APIHandler) HandleGetIndicesAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	indices, err := getESIndices(handler.Config.Elasticsearch)
	if err != nil {
		panic(err)
	}

	handler.WriteJSON(w, map[string]interface{}{
		"errno":   "0",
		"errmsg":  "",
		"payload": indices,
	}, http.StatusOK)
}

func getESIndices(esName string) ([]string, error) {
	client := elastic.GetClient(esName)
	esConfig := elastic.GetConfig(esName)
	url := fmt.Sprintf("%s/_cat/indices?format=json", esConfig.Endpoint)
	result, err := client.Request("GET", url, nil)
	if err != nil {
		return nil, err
	}
	var catIndices = []struct {
		Index string `json:"index"`
	}{}
	err = json.Unmarshal(result.Body, &catIndices)
	if err != nil {
		return nil, err
	}
	var indices = []string{}
	for _, index := range catIndices {
		if strings.HasPrefix(index.Index, ".") {
			continue
		}
		indices = append(indices, index.Index)
	}

	return indices, nil
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
