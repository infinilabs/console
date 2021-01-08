package index_management

import (
	"net/http"
	"strings"

	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
)

func (handler APIHandler) HandleGetMappingsAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	client := elastic.GetClient(handler.Config.Elasticsearch)
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
		resBody["status"] = false
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	if copyAll {
		for key, _ := range *idxs {
			if strings.HasPrefix(key, ".") {
				delete(*idxs, key)
			}
		}
	}

	resBody["payload"] = idxs

	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) HandleGetIndicesAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	client := elastic.GetClient(handler.Config.Elasticsearch)
	catIndices, err := client.GetIndices()
	resBody := newResponseBody()
	if err != nil {
		resBody["status"] = false
		resBody["error"] = err
		handler.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	resBody["payload"] = catIndices
	handler.WriteJSON(w, resBody, http.StatusOK)
}
