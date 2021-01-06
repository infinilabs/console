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

	//fmt.Println(reindexItem)

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
	body.Status = model.ReindexStatusRunning
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
	err = SyncRebuildResult(esName)
	if err != nil {
		resBody["errno"] = "E20004"
		resBody["errmsg"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}

	resBody["payload"] = formatESSearchResult(esResp)
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func SyncRebuildResult(esName string) error {
	client := elastic.GetClient(esName)
	esBody := `{"query":{"match":{"status": "RUNNING"}}}`
	esRes, err := client.SearchWithRawQueryDSL("infinireindex", []byte(esBody))
	if err != nil {
		return err
	}
	var ids = []string{}
	idMap := map[string]int{}
	for idx, doc := range esRes.Hits.Hits {
		taskId := doc.Source["task_id"].(string)
		ids = append(ids, taskId)
		idMap[taskId] = idx
	}
	if len(ids) == 0 {
		return nil
	}
	taskResp, err := client.SearchTasksByIds(ids)
	if err != nil {
		return err
	}
	var (
		status model.ReindexStatus
	)
	for _, doc := range taskResp.Hits.Hits {
		status = model.ReindexStatusRunning
		source := esRes.Hits.Hits[idMap[doc.ID.(string)]].Source
		if _, ok := doc.Source["error"]; ok {
			status = model.ReindexStatusFailed
		} else {
			status = model.ReindexStatusSuccess
		}
		source["status"] = status
		source["task_source"] = doc.Source
		_, err := client.Index("infinireindex", esRes.Hits.Hits[idMap[doc.ID.(string)]].ID, source)
		return err
	}
	return nil
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
