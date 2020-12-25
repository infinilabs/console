package index_management

import (
	"fmt"
	"net/http"

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
		panic(err)
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
			panic(err)
		}
		reqBody.Payload["id"] = id
		resResult["payload"] = reqBody.Payload
		handler.WriteJSON(w, resResult, http.StatusOK)
	case "SAVE":
		if id == "" {
			panic("empty id")
		}
		resp, err := client.Get(indexName, id)
		if err != nil {
			panic(err)
		}
		source := resp.Source
		for k, v := range reqBody.Payload {
			source[k] = v
		}
		_, err = client.Index(indexName, id, source)
		if err != nil {
			panic(err)
		}
		handler.WriteJSON(w, resResult, http.StatusOK)

	case "DELETE":
		if id == "" {
			panic("empty id")
		}
		_, err = client.Delete(indexName, id)
		if err != nil {
			resResult["errmsg"] = err.Error()
			resResult["errno"] = "E100003"
			handler.WriteJSON(w, resResult, http.StatusOK)
			return
		}
		handler.WriteJSON(w, resResult, http.StatusOK)
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
		if reqBody.Filter != "" {
			filter = reqBody.Filter
		}
		query := fmt.Sprintf(`{"from":%d, "size": %d, "query": %s}`, from, pageSize, filter)
		var reqBytes = []byte(query)
		resp, err := client.SearchWithRawQueryDSL(indexName, reqBytes)
		if err != nil {
			panic(err)
		}

		result := formatESSearchResult(resp)

		handler.WriteJSON(w, map[string]interface{}{
			"errno":   "0",
			"errmsg":  "",
			"payload": result,
		}, http.StatusOK)
	}
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
