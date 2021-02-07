package system

import (
	"fmt"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"infini.sh/search-center/config"
	"infini.sh/search-center/model"
	"infini.sh/framework/core/orm"
	"net/http"
)

type APIHandler struct {
	Config *config.AppConfig
	api.Handler
}

func (h *APIHandler) HandleCreateClusterAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	var conf = &model.ClusterConfig{}
	resBody := map[string] interface{}{
	}
	err := h.DecodeJSON(req, conf)
	if err != nil {
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	// TODO validate data format
	esClient := elastic.GetClient(h.Config.Elasticsearch)
	id := util.GetUUID()
	ir, err := esClient.Index(orm.GetIndexName(model.ClusterConfig{}), "", id, conf)
	if err != nil {
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	resBody["payload"] = ir
	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) HandleUpdateClusterAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	var conf = map[string]interface{}{}
	resBody := map[string] interface{}{
	}
	err := h.DecodeJSON(req, conf)
	if err != nil {
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	id := ps.ByName("id")
	esClient := elastic.GetClient(h.Config.Elasticsearch)
	indexName := orm.GetIndexName(model.ClusterConfig{})
	originConf, err := esClient.Get(indexName, "", id)
	if err != nil {
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	source := originConf.Source
	for k, v := range conf {
		if k == "id" {
			continue
		}
		source[k] = v
	}
	ir, err := esClient.Index(indexName, "", id, source)
	if err != nil {
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	resBody["acknowledged"] = true
	resBody["payload"] = ir
	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) HandleDeleteClusterAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody := map[string] interface{}{
	}
	id := ps.ByName("id")
	esClient := elastic.GetClient(h.Config.Elasticsearch)
	_, err := esClient.Delete(orm.GetIndexName(model.ClusterConfig{}), "", id)
	if err != nil {
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}

	resBody["acknowledged"] = true
	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) HandleSearchClusterAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody := map[string] interface{}{
	}
	var (
		name = h.GetParameterOrDefault(req, "name", "")
		enable = h.GetParameterOrDefault(req, "enable", "")
		queryDSL = `{"query":{"bool":{"must":[%s, %s]}}}`
	)
	if name != ""{
		name = fmt.Sprintf(`{"match":{"name": "%s""}}`, name)
	}
	if enable != "" {
		if enable != "true" {
			enable = "false"
		}
		enable = fmt.Sprintf(`{"match":{"enable": "%s""}}`, enable)
	}
	queryDSL = fmt.Sprintf(queryDSL, name, enable)
	esClient := elastic.GetClient(h.Config.Elasticsearch)
	res, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(model.ClusterConfig{}), []byte(queryDSL))
	if err != nil {
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}

	h.WriteJSON(w, res, http.StatusOK)
}