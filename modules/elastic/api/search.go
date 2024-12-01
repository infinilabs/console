package api

import (
	"fmt"
	log "github.com/cihub/seelog"
	"github.com/segmentio/encoding/json"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func (h *APIHandler) HandleCreateSearchTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody := map[string] interface{}{
	}
	targetClusterID := ps.ByName("id")
	exists,client,err:=h.GetClusterClient(targetClusterID)

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	if !exists{
		resBody["error"] = fmt.Sprintf("cluster [%s] not found",targetClusterID)
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}

	var template = &elastic.SearchTemplate{}

	err = h.DecodeJSON(req, template)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	var body = map[string]interface{}{
		"script": map[string]interface{}{
			"lang": "mustache",
			"source": template.Source,
		},
	}
	bodyBytes, _ := json.Marshal(body)

	//fmt.Println(client)
	err = client.SetSearchTemplate(template.Name, bodyBytes)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	id := util.GetUUID()
	template.Created = time.Now()
	template.Updated = template.Created
	template.ClusterID = targetClusterID
	index:=orm.GetIndexName(elastic.SearchTemplate{})
	insertRes, err := esClient.Index(index, "", id, template, "wait_for")
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	resBody["_source"] = template
	resBody["_id"] = id
	resBody["result"] = insertRes.Result

	h.WriteJSON(w, resBody,http.StatusOK)
}

func (h *APIHandler) HandleUpdateSearchTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody := map[string] interface{}{
	}
	targetClusterID := ps.ByName("id")
	exists,client,err:=h.GetClusterClient(targetClusterID)

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	if !exists{
		resBody["error"] = fmt.Sprintf("cluster [%s] not found",targetClusterID)
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}

	var template = &elastic.SearchTemplate{}

	err = h.DecodeJSON(req, template)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	templateID := ps.ByName("template_id")
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	index:=orm.GetIndexName(elastic.SearchTemplate{})
	getRes, err := esClient.Get(index, "",templateID)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if getRes.Found == false {
		resBody["error"] = fmt.Sprintf("template %s can not be found", templateID)
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}
	originTemplate := getRes.Source
	targetTemplate := make(map[string]interface{}, len(originTemplate))
	for k, v := range originTemplate {
		targetTemplate[k] = v
	}
	targetName := originTemplate["name"].(string)
	if template.Name != "" && template.Name != targetName {
		err = client.DeleteSearchTemplate(targetName)
		if err != nil {
			log.Error(err)
			resBody["error"] = err.Error()
			h.WriteJSON(w, resBody, http.StatusInternalServerError)
			return
		}
		targetTemplate["name"] = template.Name
		targetName = template.Name
	}
	if template.Source != "" {
		targetTemplate["source"] = template.Source
	}
	var body = map[string]interface{}{
		"script": map[string]interface{}{
			"lang":   "mustache",
			"source": targetTemplate["source"],
		},
	}
	bodyBytes, _ := json.Marshal(body)

	err = client.SetSearchTemplate(targetName, bodyBytes)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	targetTemplate["updated"] = time.Now()
	insertRes, err := esClient.Index(index, "", templateID, targetTemplate, "wait_for")
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	ht := &elastic.SearchTemplateHistory{
		TemplateID: templateID,
		Action: "update",
		Content: originTemplate,
		Created: time.Now(),
	}
	esClient.Index(orm.GetIndexName(ht), "", util.GetUUID(), ht, "")

	resBody["_source"] = originTemplate
	resBody["_id"] = templateID
	resBody["result"] = insertRes.Result

	h.WriteJSON(w, resBody,http.StatusOK)
}

func (h *APIHandler) HandleDeleteSearchTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody := map[string] interface{}{
	}
	targetClusterID := ps.ByName("id")
	exists,client,err:=h.GetClusterClient(targetClusterID)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	if !exists{
		resBody["error"] = fmt.Sprintf("cluster [%s] not found",targetClusterID)
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}

	templateID := ps.ByName("template_id")

	index:=orm.GetIndexName(elastic.SearchTemplate{})
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	res, err := esClient.Get(index, "", templateID)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	err = client.DeleteSearchTemplate(res.Source["name"].(string))
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	delRes, err := esClient.Delete(index, "", res.ID)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	ht := &elastic.SearchTemplateHistory{
		TemplateID: templateID,
		Action: "delete",
		Content: res.Source,
		Created: time.Now(),
	}
	_, err = esClient.Index(orm.GetIndexName(ht), "", util.GetUUID(), ht, "wait_for")
	if err != nil {
		log.Error(err)
	}

	resBody["_id"] = templateID
	resBody["result"] = delRes.Result
	h.WriteJSON(w, resBody, delRes.StatusCode)

}

func (h *APIHandler) HandleSearchSearchTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody := map[string] interface{}{
	}
	var (
		name = h.GetParameterOrDefault(req, "name", "")
		strFrom = h.GetParameterOrDefault(req, "from", "0")
		strSize = h.GetParameterOrDefault(req, "size", "20")
		queryDSL = `{"query":{"bool":{"must":[%s]}},"from": %d, "size": %d}`
		mustBuilder = &strings.Builder{}
	)
	from, _ := strconv.Atoi(strFrom)
	size, _ := strconv.Atoi(strSize)
	targetClusterID := ps.ByName("id")
	mustBuilder.WriteString(fmt.Sprintf(`{"match":{"cluster_id": "%s"}}`, targetClusterID))
	if name != ""{
		mustBuilder.WriteString(fmt.Sprintf(`,{"match":{"name": "%s"}}`, name))
	}

	queryDSL = fmt.Sprintf(queryDSL, mustBuilder.String(), from, size)
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	res, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(elastic.SearchTemplate{}), []byte(queryDSL))

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, res, http.StatusOK)
}

func (h *APIHandler) HandleGetSearchTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody := map[string] interface{}{}

	id := ps.ByName("template_id")
	indexName := orm.GetIndexName(elastic.SearchTemplate{})
	getResponse, err := h.Client().Get(indexName, "", id)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		if getResponse!=nil{
			h.WriteJSON(w, resBody, getResponse.StatusCode)
		}else{
			h.WriteJSON(w, resBody, http.StatusInternalServerError)
		}
		return
	}
	h.WriteJSON(w,getResponse,200)
}

func (h *APIHandler) HandleSearchSearchTemplateHistoryAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody := map[string] interface{}{
	}
	var (
		templateID = h.GetParameterOrDefault(req, "template_id", "")
		strFrom = h.GetParameterOrDefault(req, "from", "0")
		strSize = h.GetParameterOrDefault(req, "size", "20")
		queryDSL = `{"query":{"bool":{"must":[%s]}},"from": %d, "size": %d}`
		mustBuilder = &strings.Builder{}
	)
	from, _ := strconv.Atoi(strFrom)
	size, _ := strconv.Atoi(strSize)
	targetClusterID := ps.ByName("id")
	mustBuilder.WriteString(fmt.Sprintf(`{"match":{"content.cluster_id": "%s"}}`, targetClusterID))
	if templateID != ""{
		mustBuilder.WriteString(fmt.Sprintf(`,{"match":{"template_id": "%s"}}`, templateID))
	}

	queryDSL = fmt.Sprintf(queryDSL, mustBuilder.String(), from, size)
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	res, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(elastic.SearchTemplateHistory{}), []byte(queryDSL))

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, res, http.StatusOK)
}

func (h *APIHandler) HandleRenderTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody := map[string] interface{}{
	}
	targetClusterID := ps.ByName("id")
	exists,client,err:=h.GetClusterClient(targetClusterID)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	if !exists{
		resBody["error"] = fmt.Sprintf("cluster [%s] not found",targetClusterID)
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}
	reqBody := map[string]interface{}{}
	err = h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	res, err := client.RenderTemplate(reqBody)

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, string(res), http.StatusOK)
}

func (h *APIHandler) HandleSearchTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody := map[string] interface{}{
	}
	targetClusterID := ps.ByName("id")
	exists,client,err:=h.GetClusterClient(targetClusterID)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	if !exists{
		resBody["error"] = fmt.Sprintf("cluster [%s] not found",targetClusterID)
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}
	reqBody := map[string]interface{}{}
	err = h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	res, err := client.SearchTemplate(reqBody)

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, string(res), http.StatusOK)
}