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
	Index     string                 `json:"index"`
	Action    string                 `json:"action"`
	Payload   map[string]interface{} `json:"payload"`
	PageIndex int                    `json:"pageIndex"`
	PageSize  int                    `json:"pageSize"`
	Filter    string                 `json:"filter"`
	Cluster   string                 `json:"cluster"`
	Keyword   string                 `json:"keyword"`
}

func (handler APIHandler) HandleDocumentAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	client := elastic.GetClient(handler.Config.Elasticsearch)
	reqBody := docReqBody{}
	resResult := map[string]interface{}{
		"errno":   "0",
		"errmsg":  "",
		"payload": nil,
	}
	err := handler.DecodeJSON(req, &reqBody)
	if err != nil {
		resResult["errno"] = "E10001"
		resResult["errmsg"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	indexName := ps.ByName("index")
	var id string
	if val, ok := reqBody.Payload["id"]; ok {
		id = val.(string)
	}
	if _, ok := reqBody.Payload["_index"]; ok {
		delete(reqBody.Payload, "_index")
	}
	switch reqBody.Action {
	case "ADD":
		id = util.GetUUID()
		//security problem
		_, err := client.Index(indexName, id, reqBody.Payload)
		if err != nil {
			resResult["errno"] = "E10002"
			resResult["errmsg"] = err.Error()
			break
		}
		reqBody.Payload["id"] = id
		resResult["payload"] = reqBody.Payload
	case "SAVE":
		if id == "" {
			resResult["errno"] = "E10003"
			resResult["errmsg"] = "empty id"
			break
		}
		resp, err := client.Get(indexName, id)
		if err != nil {
			resResult["errno"] = "E10004"
			resResult["errmsg"] = err.Error()
			break
		}
		source := resp.Source
		for k, v := range reqBody.Payload {
			source[k] = v
		}
		_, err = client.Index(indexName, id, source)
		if err != nil {
			resResult["errno"] = "E10005"
			resResult["errmsg"] = err.Error()
			break
		}

	case "DELETE":
		if id == "" {
			panic("empty id")
		}
		_, err = client.Delete(indexName, id)
		if err != nil {
			resResult["errmsg"] = err.Error()
			resResult["errno"] = "E10006"
			break
		}
	default:
		var (
			pageSize  = 10
			pageIndex = 1
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
		query := fmt.Sprintf(`{"from":%d, "size": %d, "query": %s}`, from, pageSize, filter)
		fmt.Println(indexName, query)
		var reqBytes = []byte(query)
		resp, err := client.SearchWithRawQueryDSL(indexName, reqBytes)
		if err != nil {
			resResult["errno"] = "E10007"
			resResult["errmsg"] = err.Error()
			break
		}
		result := formatESSearchResult(resp)

		_, _, idxs, err := client.GetMapping(false, indexName)
		if err != nil {
			resResult["errno"] = "E10008"
			resResult["errmsg"] = err.Error()
			break
		}
		result["mappings"] = idxs
		resResult["payload"] = result

	}
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
