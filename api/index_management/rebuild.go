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
	if body.Source.MaxDocs > 0 {
		source["max_docs"] = body.Source.MaxDocs
	}
	if body.Source.Query != nil {
		source["query"] = body.Source.Query
	}
	if body.Source.Sort != "" {
		source["sort"] = body.Source.Sort
	}
	if body.Source.Source != "" {
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
	fmt.Println(string(buf))
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
