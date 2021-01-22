package index_management

import (
	"net/http"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
)

func (handler APIHandler) GetClusterVersion(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	client := elastic.GetClient(handler.Config.Elasticsearch)
	ver := client.GetMajorVersion()
	resBody := newResponseBody()
	resBody["payload"] = map[string]int{
		"major": ver,
	}
	handler.WriteJSON(w, resBody, http.StatusOK)
}