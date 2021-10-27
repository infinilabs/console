package index_management

import (
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"strconv"
	"strings"
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

	var (
		title          = h.GetParameterOrDefault(req, "title", "")
		queryDSL      = `{"query":{"bool":{"filter":[%s]}}, "size": %d, "from": %d}`
		strSize       = h.GetParameterOrDefault(req, "size", "20")
		strFrom       = h.GetParameterOrDefault(req, "from", "0")
		filterBuilder = &strings.Builder{}
	)
	if title != ""{
		filterBuilder.WriteString(fmt.Sprintf(`{"prefix":{"title": "%s"}}`, title))
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
	esClient := elastic.GetClient(h.Config.Elasticsearch)

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(elastic.CommonCommand{}), []byte(queryDSL))
	if err != nil {
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, searchRes,http.StatusOK)
}

func (h *APIHandler) HandleDeleteCommonCommandAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.ByName("cid")
	esClient := elastic.GetClient(h.Config.Elasticsearch)
	delRes, err := esClient.Delete(orm.GetIndexName(elastic.CommonCommand{}), "", id, "wait_for")
	if err != nil {
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