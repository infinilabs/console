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
	resBody := map[string]interface{}{
		"errno":   "0",
		"errmsg":  "",
		"payload": nil,
	}
	var copyAll = false
	if indexName == "*" {
		indexName = ""
		copyAll = true
	}
	_, _, idxs, err := client.GetMapping(copyAll, indexName)
	if err != nil {
		resBody["errno"] = "E30001"
		resBody["errmsg"] = err.Error()
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
