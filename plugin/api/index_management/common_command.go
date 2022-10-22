package index_management

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

func (h *APIHandler) HandleAddCommonCommandAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{
	}

	reqParams := elastic.CommonCommand{}
	err := h.DecodeJSON(req, &reqParams)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}

	reqParams.Created = time.Now()
	reqParams.ID = util.GetUUID()
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))

	queryDSL :=[]byte(fmt.Sprintf(`{"size":1, "query":{"bool":{"must":{"match":{"title.keyword":"%s"}}}}}`, reqParams.Title))
	var indexName  = orm.GetIndexName(reqParams)
	searchRes, err := esClient.SearchWithRawQueryDSL(indexName, queryDSL)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	if  len(searchRes.Hits.Hits) > 0 {
		resBody["error"] = "title already exists"
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	_, err = esClient.Index(indexName,"", reqParams.ID, reqParams, "wait_for")
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}

	resBody["_id"] = reqParams.ID
	resBody["result"] = "created"
	resBody["_source"] = reqParams

	h.WriteJSON(w, resBody,http.StatusOK)
}

func (h *APIHandler) HandleSaveCommonCommandAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{
	}

	reqParams := elastic.CommonCommand{}
	err := h.DecodeJSON(req, &reqParams)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	reqParams.ID = ps.ByName("cid")
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))

	queryDSL :=[]byte(fmt.Sprintf(`{"size":1, "query":{"bool":{"must":{"match":{"title.keyword":"%s"}}}}}`, reqParams.Title))
	var indexName  = orm.GetIndexName(reqParams)
	searchRes, err := esClient.SearchWithRawQueryDSL(indexName, queryDSL)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if  len(searchRes.Hits.Hits) > 0 && searchRes.Hits.Hits[0].ID != reqParams.ID {
		resBody["error"] = "title already exists"
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	_, err = esClient.Index(indexName,"", reqParams.ID, reqParams, "wait_for")
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	resBody["_id"] = reqParams.ID
	resBody["result"] = "updated"
	resBody["_source"] = reqParams

	h.WriteJSON(w, resBody,http.StatusOK)
}

func (h *APIHandler) HandleQueryCommonCommandAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{
	}

	var (
		keyword          = h.GetParameterOrDefault(req, "keyword", "")
		queryDSL      = `{"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
		strSize       = h.GetParameterOrDefault(req, "size", "20")
		strFrom       = h.GetParameterOrDefault(req, "from", "0")
		filterBuilder = &strings.Builder{}
	)
	if keyword != ""{
		filterBuilder.WriteString(fmt.Sprintf(`{"query_string": {
            "default_field": "*",
            "query": "%s"
          }
        }`, keyword))
	}
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	queryDSL = fmt.Sprintf(queryDSL, filterBuilder.String(), size, from)
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(elastic.CommonCommand{}), []byte(queryDSL))
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, searchRes,http.StatusOK)
}

func (h *APIHandler) HandleDeleteCommonCommandAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.ByName("cid")
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	delRes, err := esClient.Delete(orm.GetIndexName(elastic.CommonCommand{}), "", id, "wait_for")
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		if delRes!=nil{
			h.WriteJSON(w, resBody, delRes.StatusCode)
		}else{
			h.WriteJSON(w, resBody, http.StatusInternalServerError)
		}
		return
	}

	elastic.RemoveInstance(id)
	resBody["_id"] = id
	resBody["result"] = delRes.Result
	h.WriteJSON(w, resBody, delRes.StatusCode)
}