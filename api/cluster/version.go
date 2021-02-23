package cluster

import (
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

func (handler APIHandler) GetClusterVersion(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	//client := elastic.GetClient(handler.Config.Elasticsearch)
	//ver := client.GetMajorVersion()
	//resBody := handler.newResponseBody()
	//resBody["payload"] = map[string]int{
	//	"major": ver,
	//}
	//handler.WriteJSON(w, resBody, http.StatusOK)
}
