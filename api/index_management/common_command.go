package index_management

import (
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"time"
)

func (h *APIHandler) HandleSaveCommonCommandAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{
	}

	reqParams := elastic.CommonCommand{}
	err := h.DecodeJSON(req, &reqParams)
	if err != nil {
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	reqParams.Created = time.Now()
	reqParams.ID = util.GetUUID()
	esClient := elastic.GetClient(h.Config.Elasticsearch)

	queryDSL :=[]byte(fmt.Sprintf(`{"size":1, "query":{"bool":{"must":{"match":{"title":"%s"}}}}}`, reqParams.Title))
	var indexName  = orm.GetIndexName(reqParams)
	searchRes, err := esClient.SearchWithRawQueryDSL(indexName, queryDSL)
	if err != nil {
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if  len(searchRes.Hits.Hits) > 0 {
		resBody["error"] = "title already exists"
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	_, err = esClient.Index(indexName,"", reqParams.ID, reqParams)

	resBody["_id"] = reqParams.ID
	resBody["result"] = "created"
	resBody["_source"] = reqParams

	h.WriteJSON(w, resBody,http.StatusOK)
}

func (h *APIHandler) HandleQueryCommonCommandAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{
	}

	//title := h.GetParameterOrDefault(req, "title", "")
	//tag := h.GetParameterOrDefault(req, "search", "")

	esClient := elastic.GetClient(h.Config.Elasticsearch)
	//queryDSL :=[]byte(fmt.Sprintf(`{"query":{"bool":{"must":{"match":{"title":"%s"}}}}}`, title))

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(elastic.CommonCommand{}),nil)
	if err != nil {
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}



	h.WriteJSON(w, searchRes,http.StatusOK)
}
