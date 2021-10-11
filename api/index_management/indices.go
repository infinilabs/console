package index_management

import (
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"net/http"
)

func (handler APIHandler) HandleGetMappingsAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	indexName := ps.ByName("index")
	resBody := newResponseBody()
	var copyAll = false
	if indexName == "*" {
		indexName = ""
		copyAll = true
	}
	_, _, idxs, err := client.GetMapping(copyAll, indexName)
	if err != nil {
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	//if copyAll {
	//	for key, _ := range *idxs {
	//		if strings.HasPrefix(key, ".") || strings.HasPrefix(key, "infini-") {
	//			delete(*idxs, key)
	//		}
	//	}
	//}

	handler.WriteJSON(w, idxs, http.StatusOK)
}

func (handler APIHandler) HandleGetIndicesAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	catIndices, err := client.GetIndices("")
	resBody := util.MapStr{}
	if err != nil {
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	handler.WriteJSON(w, catIndices, http.StatusOK)
}

func (handler APIHandler) HandleGetSettingsAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	indexName := ps.ByName("index")
	resBody := newResponseBody()
	indexes, err := client.GetIndexSettings(indexName)
	if err != nil {
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	handler.WriteJSON(w, indexes, http.StatusOK)
}

func (handler APIHandler) HandleUpdateSettingsAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	indexName := ps.ByName("index")
	settings := map[string]interface{}{}
	resBody := newResponseBody()
	err := handler.DecodeJSON(req, &settings)
	if err != nil {
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	err = client.UpdateIndexSettings(indexName, settings)
	if err != nil {
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	resBody["result"] = "updated"
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) HandleDeleteIndexAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	indexName := ps.ByName("index")
	resBody := newResponseBody()
	err := client.DeleteIndex(indexName)
	if err != nil {
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	resBody["result"] = "deleted"
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) HandleCreateIndexAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	indexName := ps.ByName("index")
	resBody := newResponseBody()
	config := map[string]interface{}{}
	err := handler.DecodeJSON(req, &config)
	if err != nil {
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	err = client.CreateIndex(indexName, config)
	if err != nil {
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	resBody["result"] = "created"
	handler.WriteJSON(w, resBody, http.StatusOK)
}
