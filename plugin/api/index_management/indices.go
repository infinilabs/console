package index_management

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/common"
	"infini.sh/console/model"
	"infini.sh/console/service"
	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/radix"
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
		log.Error(err)
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusInternalServerError)
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

func (handler APIHandler) HandleCatIndicesAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	user, auditLogErr := rbac.FromUserContext(req.Context())
	if auditLogErr == nil && handler.GetHeader(req, "Referer", "") != "" {
		auditLog, _ := model.NewAuditLogBuilderWithDefault().WithOperator(user.Username).
			WithLogTypeAccess().WithResourceTypeClusterManagement().
			WithEventName("get indices").WithEventSourceIP(common.GetClientIP(req)).
			WithResourceName(targetClusterID).WithOperationTypeAccess().WithEventRecord("").Build()
		_ = service.LogAuditLog(auditLog)
	}
	client := elastic.GetClient(targetClusterID)
	//filter indices
	allowedIndices, hasAllPrivilege := handler.GetAllowedIndices(req, targetClusterID)
	if !hasAllPrivilege && len(allowedIndices) == 0 {
		handler.WriteJSON(w, []interface{}{}, http.StatusOK)
		return
	}
	catIndices, err := client.GetIndices("")
	resBody := util.MapStr{}
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if !hasAllPrivilege {
		filterIndices := map[string]elastic.IndexInfo{}
		pattern := radix.Compile(allowedIndices...)
		for indexName, indexInfo := range *catIndices {
			if pattern.Match(indexName) {
				filterIndices[indexName] = indexInfo
			}
		}
		catIndices = &filterIndices
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
		log.Error(err)
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusInternalServerError)
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
		log.Error(err)
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	err = client.UpdateIndexSettings(indexName, settings)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	resBody["result"] = "updated"
	handler.WriteJSON(w, resBody, http.StatusCreated)
}

func (handler APIHandler) HandleDeleteIndexAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	indexName := ps.ByName("index")
	resBody := newResponseBody()
	err := client.DeleteIndex(indexName)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	resBody["result"] = "deleted"
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) HandleCreateIndexAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	indexName := ps.ByName("index")
	claims, auditLogErr := rbac.ValidateLogin(req.Header.Get("Authorization"))
	if auditLogErr == nil && handler.GetHeader(req, "Referer", "") != "" {
		auditLog, _ := model.NewAuditLogBuilderWithDefault().WithOperator(claims.Username).
			WithLogTypeOperation().WithResourceTypeClusterManagement().
			WithEventName("create index").WithEventSourceIP(common.GetClientIP(req)).
			WithResourceName(targetClusterID).WithOperationTypeNew().WithEventRecord(indexName).Build()
		auditLogErr = service.LogAuditLog(auditLog)
	}
	resBody := newResponseBody()
	config := map[string]interface{}{}
	err := handler.DecodeJSON(req, &config)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	err = client.CreateIndex(indexName, config)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		handler.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	resBody["result"] = "created"
	handler.WriteJSON(w, resBody, http.StatusCreated)
}

func (handler APIHandler) HandleGetIndexAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	client := elastic.GetClient(targetClusterID)
	indexName := ps.ByName("index")
	indexRes, err := client.GetIndex(indexName)
	if err != nil {
		log.Error(err)
		handler.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	handler.WriteJSON(w, indexRes, http.StatusOK)

}
