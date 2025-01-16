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

/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package server

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	log "github.com/cihub/seelog"
	"infini.sh/console/core/security/enum"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	elastic2 "infini.sh/framework/core/elastic"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/configs/common"
	"infini.sh/framework/modules/elastic"
	common2 "infini.sh/framework/modules/elastic/common"
)

var instanceConfigFiles = map[string][]string{}     //map instance->config files TODO lru cache, short life instance should be removed
var instanceSecrets = map[string][]common.Secrets{} //map instance->secrets TODO lru cache, short life instance should be removed

func init() {
	//for public usage, agent can report self to server, usually need to enroll by manager
	api.HandleAPIMethod(api.POST, common.REGISTER_API, handler.registerInstance) //client register self to config servers

	//for public usage, get install script
	api.HandleAPIMethod(api.GET, GET_INSTALL_SCRIPT_API, handler.getInstallScript)

	api.HandleAPIMethod(api.POST, "/instance/_generate_install_script", handler.RequireLogin(handler.generateInstallCommand))

	api.HandleAPIMethod(api.POST, "/instance", handler.RequirePermission(handler.createInstance, enum.PermissionGatewayInstanceWrite))
	api.HandleAPIMethod(api.GET, "/instance/:instance_id", handler.RequirePermission(handler.getInstance, enum.PermissionAgentInstanceRead))
	api.HandleAPIMethod(api.PUT, "/instance/:instance_id", handler.RequirePermission(handler.updateInstance, enum.PermissionAgentInstanceWrite))
	api.HandleAPIMethod(api.DELETE, "/instance/:instance_id", handler.RequirePermission(handler.deleteInstance, enum.PermissionAgentInstanceWrite))
	api.HandleAPIMethod(api.POST, "/instance/_enroll", handler.RequirePermission(handler.enrollInstance, enum.PermissionGatewayInstanceWrite)) //config server enroll clients

	api.HandleAPIMethod(api.GET, "/instance/_search", handler.RequirePermission(handler.searchInstance, enum.PermissionAgentInstanceRead))

	api.HandleAPIMethod(api.POST, "/instance/stats", handler.RequirePermission(handler.getInstanceStatus, enum.PermissionAgentInstanceRead))

	//delegate request to instance
	api.HandleAPIMethod(api.POST, "/instance/:instance_id/_proxy", handler.RequirePermission(handler.proxy, enum.PermissionGatewayInstanceRead))
	api.HandleAPIMethod(api.POST, "/instance/:instance_id/elasticsearch/try_connect", handler.RequireLogin(handler.tryESConnect))

	//try to connect to instance
	api.HandleAPIMethod(api.POST, "/instance/try_connect", handler.RequireLogin(handler.tryConnect))

}

func (h APIHandler) registerInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var obj = &model.Instance{}
	err := h.DecodeJSON(req, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
	}

	oldInst := &model.Instance{}
	oldInst.ID = obj.ID
	exists, err := orm.Get(oldInst)
	if exists {
		errMsg := fmt.Sprintf("agent [%s] already exists", obj.ID)
		h.WriteError(w, errMsg, http.StatusInternalServerError)
		return
	}

	err = orm.Create(nil, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Infof("register instance: %v[%v], %v", obj.Name, obj.ID, obj.Endpoint)

	h.WriteAckOKJSON(w)
}

func (h APIHandler) enrollInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

}

func (h *APIHandler) getInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	id := ps.MustGetParameter("instance_id")

	obj := model.Instance{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"found":   true,
		"_id":     id,
		"_source": obj,
	}, 200)
}

func (h *APIHandler) createInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var obj = &model.Instance{}
	err := h.DecodeJSON(req, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	res, err := h.getInstanceInfo(obj.Endpoint, obj.BasicAuth)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	obj.ID = res.ID
	obj.Description = res.Description
	if len(res.Tags) > 0 {
		obj.Tags = res.Tags
	}
	if res.Name != "" && obj.Name == "" {
		obj.Name = res.Name
	}
	obj.Application = res.Application

	exists, err := orm.Get(obj)
	if err != nil && err != elastic.ErrNotFound {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if exists {
		h.WriteError(w, "instance already registered", http.StatusInternalServerError)
		return
	}
	err = orm.Create(nil, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "created",
	}, 200)

}

func (h *APIHandler) deleteInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("instance_id")

	obj := model.Instance{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	err = orm.Delete(nil, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteDeletedOKJSON(w, id)
}

func (h *APIHandler) updateInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("instance_id")
	obj := model.Instance{}

	obj.ID = id
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	id = obj.ID
	create := obj.Created
	obj = model.Instance{}
	err = h.DecodeJSON(req, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	//protect
	obj.ID = id
	obj.Created = create
	err = orm.Update(nil, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "updated",
	}, 200)
}

func (h *APIHandler) searchInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var (
		application = h.GetParameterOrDefault(req, "application", "")
		keyword     = h.GetParameterOrDefault(req, "keyword", "")
		queryDSL    = `{"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
		strSize     = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		mustBuilder = &strings.Builder{}
	)
	if keyword != "" {
		mustBuilder.WriteString(fmt.Sprintf(`{"query_string":{"default_field":"*","query": "%s"}}`, keyword))
	}

	if application != "" {
		if mustBuilder.Len() > 0 {
			mustBuilder.WriteString(",")
		}
		mustBuilder.WriteString(fmt.Sprintf(`{"term":{"application.name":"%s"}}`, application))
	}

	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	q := orm.Query{}
	queryDSL = fmt.Sprintf(queryDSL, mustBuilder.String(), size, from)
	q.RawQuery = []byte(queryDSL)

	err, res := orm.Search(&model.Instance{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.Write(w, res.Raw)
}

// TODO replace proxy
func (h *APIHandler) getInstanceStatus(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var instanceIDs = []string{}
	err := h.DecodeJSON(req, &instanceIDs)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(instanceIDs) == 0 {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	q := orm.Query{}
	queryDSL := util.MapStr{
		"size": len(instanceIDs),
		"query": util.MapStr{
			"terms": util.MapStr{
				"_id": instanceIDs,
			},
		},
	}
	q.RawQuery = util.MustToJSONBytes(queryDSL)

	err, res := orm.Search(&model.Instance{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	result := util.MapStr{}
	for _, item := range res.Result {
		instance := util.MapStr(item.(map[string]interface{}))
		if err != nil {
			log.Error(err)
			continue
		}
		endpoint, _ := instance.GetValue("endpoint")

		gid, _ := instance.GetValue("id")

		//req := &proxy.Request{
		//	Endpoint: endpoint.(string),
		//	Method:   http.MethodGet,
		//	Path:     "/stats",
		//}
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
		defer cancel()
		req := &util.Request{
			Method:  http.MethodGet,
			Path:    "/stats",
			Context: ctx,
		}

		username, _ := instance.GetValue("basic_auth.username")
		if username != nil && username.(string) != "" {
			password, _ := instance.GetValue("basic_auth.password")
			if password != nil && password.(string) != "" {
				req.SetBasicAuth(username.(string), password.(string))
			}
		}

		var resMap = util.MapStr{}
		_, err := ProxyAgentRequest("runtime", endpoint.(string), req, &resMap)
		if err != nil {
			log.Error(endpoint, ",", err)
			result[gid.(string)] = util.MapStr{}
			continue
		}
		result[gid.(string)] = resMap
	}
	h.WriteJSON(w, result, http.StatusOK)
}

func (h *APIHandler) proxy(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		method = h.Get(req, "method", "GET")
		path   = h.Get(req, "path", "")
	)
	instanceID := ps.MustGetParameter("instance_id")
	_, obj, err := GetRuntimeInstanceByID(instanceID)
	if err != nil {
		panic(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	reqBody, _ := h.GetRawBody(req)
	req1 := &util.Request{
		Method:  method,
		Path:    path,
		Context: ctx,
		Body:    reqBody,
	}
	if obj.BasicAuth != nil {
		req1.SetBasicAuth(obj.BasicAuth.Username, obj.BasicAuth.Password.Get())
	}

	res, err := ProxyAgentRequest("runtime", obj.GetEndpoint(), req1, nil)
	if err != nil {
		panic(err)
	}

	h.WriteHeader(w, res.StatusCode)
	h.Write(w, res.Body)
}

func (h *APIHandler) getInstanceInfo(endpoint string, basicAuth *model.BasicAuth) (*model.Instance, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	req1 := &util.Request{
		Method:  http.MethodGet,
		Path:    "/_info",
		Context: ctx,
	}
	if basicAuth != nil {
		req1.SetBasicAuth(basicAuth.Username, basicAuth.Password.Get())
	}
	obj := &model.Instance{}
	_, err := ProxyAgentRequest("runtime", endpoint, req1, obj)
	if err != nil {
		panic(err)
	}
	return obj, err

}

func (h *APIHandler) tryConnect(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var reqBody = struct {
		Endpoint  string           `json:"endpoint"`
		BasicAuth *model.BasicAuth `json:"basic_auth"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	connectRes, err := h.getInstanceInfo(reqBody.Endpoint, reqBody.BasicAuth)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, connectRes, http.StatusOK)
}

func (h *APIHandler) tryESConnect(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	instanceID := ps.MustGetParameter("instance_id")

	var reqBody = struct {
		Host         string           `json:"host"`
		Schema       string           `json:"schema"`
		CredentialID string           `json:"credential_id"`
		BasicAuth    *model.BasicAuth `json:"basic_auth"`
	}{}

	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		panic(err)
	}

	if reqBody.BasicAuth == nil {
		//TODO remove `manual`
		if reqBody.CredentialID != "" && reqBody.CredentialID != "manual" {
			cred, err := common2.GetCredential(reqBody.CredentialID)
			if err != nil {
				panic(err)
			}
			auth, err := cred.DecodeBasicAuth()
			reqBody.BasicAuth = auth
		}
	}

	_, instance, err := GetRuntimeInstanceByID(instanceID)
	if err != nil {
		panic(err)
	}

	esConfig := elastic2.ElasticsearchConfig{Host: reqBody.Host, Schema: reqBody.Schema, BasicAuth: reqBody.BasicAuth}
	body := util.MustToJSONBytes(esConfig)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	req1 := &util.Request{
		Method:  http.MethodPost,
		Path:    "/elasticsearch/try_connect",
		Context: ctx,
		Body:    body,
	}
	if reqBody.BasicAuth != nil {
		req1.SetBasicAuth(reqBody.BasicAuth.Username, reqBody.BasicAuth.Password.Get())
	}

	res, err := ProxyAgentRequest("runtime", instance.GetEndpoint(), req1, nil)
	if err != nil {
		panic(err)
	}

	//res, err := ProxyRequestToRuntimeInstance(instance.Endpoint, "POST", "/elasticsearch/try_connect",
	//	body, int64(len(body)), reqBody.BasicAuth)
	//
	//if err != nil {
	//	panic(err)
	//}

	h.WriteHeader(w, res.StatusCode)
	h.Write(w, res.Body)
}

// TODO check permission by user
func GetRuntimeInstanceByID(instanceID string) (bool, *model.Instance, error) {
	obj := model.Instance{}
	obj.ID = instanceID
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		if !exists {
			err = fmt.Errorf("instance not found")
		}
		return exists, nil, err
	}
	return true, &obj, err
}
