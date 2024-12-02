// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

package index_management

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/common"
	"infini.sh/console/core/security"
	"infini.sh/console/model"
	"infini.sh/console/service"
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
	user, auditLogErr := security.FromUserContext(req.Context())
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
	claims, auditLogErr := security.ValidateLogin(req.Header.Get("Authorization"))
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
