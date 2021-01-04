package index_management

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"infini.sh/search-center/model"
)

func (handler APIHandler) ReindexAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	reindexItem := &model.InfiniReindex{}
	resResult := map[string]interface{}{
		"errno":   "0",
		"errmsg":  "",
		"payload": nil,
	}

	err := handler.DecodeJSON(req, reindexItem)
	if err != nil {
		resResult["errno"] = "E20001"
		resResult["errmsg"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}

	fmt.Println(reindexItem)

	taskID, err := reindex(handler.Config.Elasticsearch, reindexItem)
	if err != nil {
		resResult["errno"] = "E20002"
		resResult["errmsg"] = err.Error()
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	resResult["payload"] = taskID
	handler.WriteJSON(w, resResult, http.StatusOK)
}

func reindex(esName string, body *model.InfiniReindex) (string, error) {
	client := elastic.GetClient(esName)
	esConfig := elastic.GetConfig(esName)
	url := fmt.Sprintf("%s/_reindex?wait_for_completion=false", esConfig.Endpoint)
	source := map[string]interface{}{
		"index": body.Source.Index,
	}
	if body.Source.Query != nil {
		source["query"] = body.Source.Query
	}
	if len(body.Source.Source) > 0 {
		source["_source"] = body.Source.Source
	}
	dest := map[string]string{
		"index": body.Dest.Index,
	}
	if body.Dest.Pipeline != "" {
		dest["pipeline"] = body.Dest.Pipeline
	}
	esBody := map[string]interface{}{
		"source": source,
		"dest":   dest,
	}
	buf, _ := json.Marshal(esBody)
	//fmt.Println(string(buf))
	reindexRes, err := client.Request("POST", url, buf)
	if err != nil {
		return "", err
	}
	resBody := struct {
		Task string `json:"task"`
	}{}
	err = json.Unmarshal(reindexRes.Body, &resBody)
	if err != nil {
		return "", err
	}
	body.ID = util.GetUUID()
	body.TaskId = resBody.Task
	body.CreatedAt = time.Now()

	_, err = client.Index("infinireindex", body.ID, body)
	if err != nil {
		return "", err
	}
	return body.ID, nil
}

func newResponseBody() map[string]interface{} {
	return map[string]interface{}{
		"errno":   "0",
		"errmsg":  "",
		"payload": nil,
	}

}

func (handler APIHandler) HandleDeleteRebuildAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var ids = []string{}
	resBody := newResponseBody()
	err := handler.DecodeJSON(req, &ids)
	if err != nil {
		resBody["errno"] = "E30001"
		resBody["errmsg"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	err = deleteTasksByTerms(handler.Config.Elasticsearch, ids)
	if err != nil {
		resBody["errno"] = "E30002"
		resBody["errmsg"] = err.Error()
	}
	resBody["payload"] = true
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) HandleGetRebuildListAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	defer func() {
		if err := recover(); err != nil {
			fmt.Println(err)
		}
	}()
	var (
		from    = handler.GetIntOrDefault(req, "from", 0)
		size    = handler.GetIntOrDefault(req, "size", 10)
		name    = handler.GetParameter(req, "name")
		resBody = newResponseBody()
		esName  = handler.Config.Elasticsearch
	)
	esResp, err := model.GetRebuildList(esName, from, size, name)
	if err != nil {
		resBody["errno"] = "E20003"
		resBody["errmsg"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}

	var ids = []string{}
	idMap := map[string]int{}
	for idx, doc := range esResp.Hits.Hits {
		taskId := doc.Source["task_id"].(string)
		ids = append(ids, taskId)
		idMap[taskId] = idx
	}
	taskResp, err := getTasksByTerms(esName, ids)
	if err != nil {
		resBody["errno"] = "E20004"
		resBody["errmsg"] = err.Error()
	}
	var (
		completed bool
		status    string
		esErrStr  string
		tookTime  int
	)
	for _, doc := range taskResp.Hits.Hits {
		status = "RUNNING"
		tookTime = 0
		esErrStr = ""
		completed = doc.Source["completed"].(bool)
		source := esResp.Hits.Hits[idMap[doc.ID.(string)]].Source
		if esErr, ok := doc.Source["error"]; ok {
			status = "FAILED"
			if errMap, ok := esErr.(map[string]interface{}); ok {
				esErrStr = errMap["reason"].(string)
			}
		} else {
			if resMap, ok := doc.Source["response"].(map[string]interface{}); ok {
				tookTime = int(resMap["took"].(float64))
			}
			status = "SUCCESS"
		}
		if !completed {
			status = "RUNNING"
		}
		source["status"] = status
		source["error"] = esErrStr
		source["took_time"] = tookTime
	}
	resBody["payload"] = formatESSearchResult(esResp)
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func getTasksByTerms(esName string, terms []string) (*elastic.SearchResponse, error) {
	if len(terms) == 0 {
		return nil, nil
	}
	client := elastic.GetClient(esName)
	esBody := buildTermsQuery(terms)
	return client.SearchWithRawQueryDSL(".tasks", []byte(esBody))
}

func buildTermsQuery(terms []string) string {
	esBody := `{
  "query":{
    "terms": {
      "_id": [
	  %s
      ]
    }
  }
}`
	strTerms := ""
	for _, term := range terms {
		strTerms += fmt.Sprintf(`"%s",`, term)
	}
	esBody = fmt.Sprintf(esBody, strTerms[0:len(strTerms)-1])
	return esBody
}

func deleteTasksByTerms(esName string, terms []string) error {
	client := elastic.GetClient(esName)
	esConfig := elastic.GetConfig(esName)
	url := fmt.Sprintf("%s/infinireindex/_delete_by_query", esConfig.Endpoint)
	esBody := buildTermsQuery(terms)
	result, err := client.Request("POST", url, []byte(esBody))
	if err != nil {
		return err
	}
	var deleteRes = struct {
		Deleted int `json:"deleted"`
		Total   int `json:"total"`
	}{}
	err = json.Unmarshal(result.Body, &deleteRes)
	if err != nil {
		return err
	}
	if deleteRes.Deleted != deleteRes.Total {
		return fmt.Errorf("total: %d, deleted: %d", deleteRes.Total, deleteRes.Deleted)
	}
	return nil
}
