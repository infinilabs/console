package api

import (
	"fmt"
	log "github.com/cihub/seelog"
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

func (h *APIHandler) HandleCrateTraceTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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

	var traceReq = &elastic.TraceTemplate{

	}

	err = h.DecodeJSON(req, traceReq)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	traceReq.Created = time.Now()
	traceReq.Updated = traceReq.Created
	traceReq.ClusterID = targetClusterID

	var id = util.GetUUID()
	insertRes, err := client.Index(orm.GetIndexName(elastic.TraceTemplate{}), "", id, traceReq, "wait_for")
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	resBody["_source"] = traceReq
	resBody["_id"] = insertRes.ID
	resBody["result"] = insertRes.Result

	h.WriteJSON(w, resBody,http.StatusOK)
}

func (h *APIHandler) HandleSearchTraceTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string] interface{}{
	}
	var (
		name          = h.GetParameterOrDefault(req, "name", "")
		queryDSL      = `{"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
		strSize       = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		mustBuilder = &strings.Builder{}
	)
	targetClusterID := ps.ByName("id")
	mustBuilder.WriteString(fmt.Sprintf(`{"term":{"cluster_id":{"value": "%s"}}}`, targetClusterID))
	if name != ""{
		mustBuilder.WriteString(fmt.Sprintf(`,{"prefix":{"name": "%s"}}`, name))
	}
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	queryDSL = fmt.Sprintf(queryDSL, mustBuilder.String(), size, from)
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	res, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(elastic.TraceTemplate{}), []byte(queryDSL))

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, res, http.StatusOK)
}

func (h *APIHandler) HandleSaveTraceTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{
	}

	reqParams := elastic.TraceTemplate{}
	err := h.DecodeJSON(req, &reqParams)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	reqParams.ID = ps.ByName("template_id")
	reqParams.Updated = time.Now()
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	_, err = esClient.Index(orm.GetIndexName(reqParams),"", reqParams.ID, reqParams, "wait_for")
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}

	resBody["_id"] = reqParams.ID
	resBody["result"] = "updated"
	resBody["_source"] = reqParams

	h.WriteJSON(w, resBody,http.StatusOK)
}

func (h *APIHandler) HandleGetTraceTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody := map[string] interface{}{}

	id := ps.ByName("template_id")
	indexName := orm.GetIndexName(elastic.TraceTemplate{})
	getResponse, err := h.Client().Get(indexName, "", id)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
	}
	h.WriteJSON(w,getResponse, getResponse.StatusCode)
}

func (h *APIHandler) HandleDeleteTraceTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.ByName("template_id")
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	delRes, err := esClient.Delete(orm.GetIndexName(elastic.TraceTemplate{}), "", id, "wait_for")
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		if delRes!=nil{
			h.WriteJSON(w, resBody, delRes.StatusCode)
		}else{
			h.WriteJSON(w, resBody, http.StatusInternalServerError)
		}
	}

	elastic.RemoveInstance(id)
	resBody["_id"] = id
	resBody["result"] = delRes.Result
	h.WriteJSON(w, resBody, delRes.StatusCode)
}
