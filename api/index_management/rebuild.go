package index_management

import (
	"encoding/json"
	"fmt"
	"infini.sh/framework/core/orm"
	"net/http"
	"strings"
	"time"

	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"infini.sh/search-center/model"
)

func (handler APIHandler) HandleReindexAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	reindexItem := &model.Reindex{}
	id := ps.ByName("id")
	if strings.Trim(id, "/") != "" {
		reindexItem.ID = id
	}
	resResult := newResponseBody()

	err := handler.DecodeJSON(req, reindexItem)
	if err != nil {
		resResult["error"] = err
		resResult["status"] = false
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}

	//fmt.Println(reindexItem)

	ID, err := reindex(handler.Config.Elasticsearch, reindexItem)
	if err != nil {
		resResult["error"] = err
		resResult["status"] = false
		handler.WriteJSON(w, resResult, http.StatusOK)
		return
	}
	resResult["payload"] = ID
	handler.WriteJSON(w, resResult, http.StatusOK)
}

func reindex(esName string, body *model.Reindex) (string, error) {
	client := elastic.GetClient(esName)
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
	reindexResp, err := client.Reindex(buf)
	if err != nil {
		return "", err
	}
	if body.ID == "" {
		body.ID = util.GetUUID()
	}
	body.TaskId = reindexResp.Task
	body.Status = model.ReindexStatusRunning
	body.CreatedAt = time.Now()

	_, err = client.Index(orm.GetIndexName(body), body.ID, body)
	if err != nil {
		return "", err
	}
	return body.ID, nil
}

func newResponseBody() map[string]interface{} {
	return map[string]interface{}{
		"status": true,
	}
}

func (handler APIHandler) HandleDeleteRebuildAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	var ids = []string{id}
	resBody := newResponseBody()
	err := deleteTasksByIds(handler.Config.Elasticsearch, ids)
	if err != nil {
		resBody["error"] = err
		resBody["status"] = false
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
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
		resBody["error"] = err.Error()
		resBody["status"] = false
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	err = SyncRebuildResult(esName)
	if err != nil {
		resBody["status"] = false
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}

	resBody["payload"] = esResp
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func SyncRebuildResult(esName string) error {
	client := elastic.GetClient(esName)
	esBody := fmt.Sprintf(`{"query":{"match":{"status": "%s"}}}`, model.ReindexStatusRunning)
	esRes, err := client.SearchWithRawQueryDSL(orm.GetIndexName(model.Reindex{}), []byte(esBody))
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
		_, err := client.Index(orm.GetIndexName(model.Reindex{}), esRes.Hits.Hits[idMap[doc.ID.(string)]].ID, source)
		return err
	}
	return nil
}

func buildTermsQuery(fieldName string, terms []string) string {
	esBody := `{
  "query":{
    "terms": {
      "%s": [
	  %s
      ]
    }
  }
}`
	strTerms := ""
	for _, term := range terms {
		strTerms += fmt.Sprintf(`"%s",`, term)
	}
	esBody = fmt.Sprintf(esBody, fieldName, strTerms[0:len(strTerms)-1])
	return esBody
}

func deleteTasksByIds(esName string, terms []string) error {
	client := elastic.GetClient(esName)
	esBody := buildTermsQuery("_id", terms)
	deleteRes, err := client.DeleteByQuery(orm.GetIndexName(model.Reindex{}), []byte(esBody))
	if err != nil {
		return err
	}
	if deleteRes.Deleted != deleteRes.Total {
		return fmt.Errorf("total: %d, deleted: %d", deleteRes.Total, deleteRes.Deleted)
	}
	return nil
}