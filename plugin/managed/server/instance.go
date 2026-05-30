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
	"bytes"
	"context"
	"fmt"
	console_common "infini.sh/console/common"
	agent_common "infini.sh/console/modules/agent/common"
	frameworkcredential "infini.sh/framework/core/credential"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/task"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
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

var getManagedInstanceByID = func(instance *model.Instance) (bool, error) {
	return orm.Get(instance)
}

var deleteManagedInstanceRecord = func(instance *model.Instance) error {
	return orm.Delete(&orm.Context{
		Refresh: orm.WaitForRefresh,
	}, instance)
}

var cleanupDeletedInstanceArtifactsFunc = cleanupDeletedInstanceArtifacts

func init() {
	//for public usage, agent can report self to server, usually need to enroll by manager
	api.HandleAPIMethod(api.POST, common.REGISTER_API, handler.registerInstance) //client register self to config servers
	api.HandleUIMethod(api.POST, common.REGISTER_API, handler.registerInstance)
	api.HandleAPIMethod(api.POST, instanceTokenExchangeAPI, handler.exchangeInstanceToken)
	api.HandleUIMethod(api.POST, instanceTokenExchangeAPI, handler.exchangeInstanceToken)

	//for public usage, get install script
	api.HandleAPIMethod(api.GET, getInstallScriptAPI, handler.getInstallScript)
	api.HandleUIMethod(api.GET, getInstallScriptAPI, handler.getInstallScript)
	api.HandleAPIMethod(api.GET, getGatewayInstallScriptAPI, handler.getGatewayInstallScript)
	api.HandleUIMethod(api.GET, getGatewayInstallScriptAPI, handler.getGatewayInstallScript)

	api.HandleAPIMethod(api.POST, "/instance/_generate_install_script", handler.RequireLogin(handler.generateInstallCommand))
	api.HandleAPIMethod(api.POST, "/instance/_generate_gateway_install_script", handler.RequirePermission(handler.generateGatewayInstallCommand, enum.PermissionGatewayInstanceWrite))
	api.HandleAPIMethod(api.POST, "/instance/_prepare_registration", handler.RequirePermission(handler.prepareRegistration, enum.PermissionGatewayInstanceWrite))

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
	//clear instance that is not alive in 7 days
	api.HandleAPIMethod(api.POST, "/instance/_clear", handler.RequirePermission(handler.clearInstance, enum.PermissionGatewayInstanceWrite))

}

func (h APIHandler) registerInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	registerReq := common.InstanceRegisterRequest{}
	err := h.DecodeJSON(req, &registerReq)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	obj := &registerReq.Client
	if obj.Endpoint == "" {
		h.WriteError(w, "empty endpoint", http.StatusInternalServerError)
		return
	}

	oldInst := &model.Instance{}
	oldInst.ID = obj.ID
	exists, err := orm.Get(oldInst)
	if err == elastic.ErrNotFound {
		err = nil
		exists = false
	}
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var pendingToConsume *agent_common.PendingRegistrationToken

	if common.SupportsManagedAccessToken(obj.Application.Name) {
		tokenValue := agent_common.ExtractManagerToken(req)
		if exists {
			if oldInst.Created != nil {
				obj.Created = oldInst.Created
			}
			if err := validateManagedAgentRequestAuth(req, oldInst); err != nil {
				if agent_common.IsManagerAuthFailure(err) {
					h.WriteError(w, err.Error(), http.StatusUnauthorized)
				} else {
					h.WriteError(w, err.Error(), http.StatusInternalServerError)
				}
				return
			}
			obj.ManagerCredentialID = oldInst.ManagerCredentialID
			obj.AccessCredentialID = oldInst.AccessCredentialID
			obj.BasicAuth = oldInst.BasicAuth
		} else {
			if tokenValue == "" {
				h.WriteError(w, "missing manager token", http.StatusUnauthorized)
				return
			}
			pending, err := agent_common.FindPendingManagerTokenByValue(tokenValue)
			if err != nil {
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if pending == nil {
				h.WriteError(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
				return
			}
			obj.ManagerCredentialID = pending.CredentialID
			if err := renamePendingManagerCredential(obj, pending.CredentialID); err != nil {
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if err := upsertInstanceAccessCredential(obj, registerReq.AccessToken); err != nil {
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			pendingToConsume = pending
		}
	} else if exists {
		obj.Created = oldInst.Created
	}

	if exists && common.SupportsManagedAccessToken(obj.Application.Name) && registerReq.AccessToken != nil {
		if err := upsertInstanceAccessCredential(obj, registerReq.AccessToken); err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	err = orm.Save(&orm.Context{Refresh: orm.WaitForRefresh}, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if pendingToConsume != nil {
		if err := agent_common.MarkPendingRegistrationTokenConsumed(pendingToConsume, obj.ID); err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	log.Infof("register instance: %v[%v], %v", obj.Name, obj.ID, obj.Endpoint)

	h.WriteAckOKJSON(w)
}

func syncManagedInstanceEndpoint(client model.Instance) {
	if client.ID == "" || client.Endpoint == "" {
		return
	}

	existing := model.Instance{}
	existing.ID = client.ID
	exists, err := orm.Get(&existing)
	if err != nil || !exists || existing.Endpoint == client.Endpoint {
		return
	}

	existing.Endpoint = client.Endpoint
	if err := orm.Update(nil, &existing); err != nil {
		log.Warnf("failed to update instance endpoint for [%s]: %v", client.ID, err)
	}
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
	var reqBody struct {
		model.Instance
		RegistrationID string `json:"registration_id"`
		AccessToken    string `json:"access_token"`
	}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	obj := &reqBody.Instance
	var pendingToConsume *agent_common.PendingRegistrationToken

	probeAccessToken := effectiveInstanceProbeAccessToken(req, obj.Endpoint, reqBody.AccessToken)
	res, err := h.getInstanceInfo(obj.Endpoint, obj.BasicAuth, probeAccessToken)
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
	if reqBody.RegistrationID != "" {
		pending, err := agent_common.GetPendingRegistrationTokenByID(reqBody.RegistrationID)
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if pending == nil || pending.Consumed || (pending.ExpiresAt > 0 && time.Now().UnixMilli() > pending.ExpiresAt) {
			h.WriteError(w, "registration token is invalid", http.StatusUnauthorized)
			return
		}
		obj.ManagerCredentialID = pending.CredentialID
		if err := renamePendingManagerCredential(obj, pending.CredentialID); err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		pendingToConsume = pending
	}
	if strings.TrimSpace(reqBody.AccessToken) != "" {
		credentialID, err := agent_common.SaveTokenCredential(
			agent_common.BuildAccessCredentialName(obj),
			agent_common.BuildAccessCredentialTags(),
			reqBody.AccessToken,
		)
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		obj.AccessCredentialID = credentialID
		obj.BasicAuth = nil
	}
	err = orm.Create(&orm.Context{Refresh: orm.WaitForRefresh}, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if pendingToConsume != nil {
		if err := agent_common.MarkPendingRegistrationTokenConsumed(pendingToConsume, obj.ID); err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
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

	exists, err := getManagedInstanceByID(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	err = deleteManagedInstanceRecord(&obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	payload := util.MapStr{
		"_id":    id,
		"result": "deleted",
	}
	if warnings := cleanupDeletedInstanceArtifactsFunc(&obj); len(warnings) > 0 {
		payload["warnings"] = warnings
	}

	h.WriteJSON(w, payload, http.StatusOK)
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

	instances := []model.Instance{}
	if err, _ := orm.SearchWithJSONMapper(&instances, &q); err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	result := util.MapStr{}
	for i := range instances {
		instance := instances[i]
		var resMap = util.MapStr{}
		if !fetchManagedInstanceStats(req, &instance, &resMap) {
			result[instance.ID] = util.MapStr{}
			continue
		}
		result[instance.ID] = resMap
	}
	h.WriteJSON(w, result, http.StatusOK)
}

func fetchManagedInstanceStats(currentReq *http.Request, instance *model.Instance, stats *util.MapStr) bool {
	if instance == nil {
		return false
	}
	if shouldFetchManagedInstanceStatsLocally(instance) && fetchManagedInstanceStatsLocally(stats) {
		return true
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	req := &util.Request{
		Method:  http.MethodGet,
		Path:    "/stats",
		Context: ctx,
	}
	if err := agent_common.ApplyInstanceRequestAuth(req, instance); err != nil {
		log.Error(err)
		return false
	}
	agent_common.ApplyBearerToken(req, effectiveManagedInstanceAccessToken(currentReq, instance))

	if _, err := proxyInstanceRequest(instance, req, stats); err != nil {
		log.Error(instance.GetEndpoint(), ",", err)
		return false
	}
	return true
}

func shouldFetchManagedInstanceStatsLocally(instance *model.Instance) bool {
	if instance == nil {
		return false
	}
	if isCurrentManagedInstance(instance) {
		return true
	}
	return shouldReuseCurrentRequestAuthForEndpoint(instance.GetEndpoint())
}

func isCurrentManagedInstance(instance *model.Instance) bool {
	if instance == nil {
		return false
	}
	instanceID := strings.TrimSpace(instance.ID)
	if instanceID == "" {
		return false
	}
	return instanceID == strings.TrimSpace(global.Env().SystemConfig.NodeConfig.ID)
}

func fetchManagedInstanceStatsLocally(stats *util.MapStr) bool {
	if stats == nil {
		return false
	}
	res, err := proxyManagedAPIRequestLocally(&util.Request{
		Method: http.MethodGet,
		Path:   "/stats",
	}, stats)
	if err != nil {
		body := ""
		status := 0
		if res != nil {
			body = string(res.Body)
			status = res.StatusCode
		}
		log.Errorf("local /stats request failed, status: %d, body: %s", status, body)
		return false
	}
	return true
}

func proxyManagedAPIRequestLocally(req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, error) {
	if req == nil {
		return nil, fmt.Errorf("request is nil")
	}
	requestPath := strings.TrimSpace(req.Path)
	if requestPath == "" {
		return nil, fmt.Errorf("request path is empty")
	}

	bodyReader := bytes.NewReader(req.Body)
	localReq := httptest.NewRequest(req.Method, requestPath, bodyReader)
	if req.Context != nil {
		localReq = localReq.WithContext(req.Context)
	}
	for key, value := range req.AllHeaders() {
		localReq.Header.Set(key, value)
	}
	if req.ContentType != "" {
		localReq.Header.Set("Content-Type", req.ContentType)
	}
	applyConsoleLocalAPIAuth(localReq)

	recorder := httptest.NewRecorder()
	api.ServeRegisteredAPIRequest(recorder, localReq)
	httpResult := recorder.Result()
	defer httpResult.Body.Close()

	res := &util.Result{
		StatusCode: recorder.Code,
		Body:       append([]byte(nil), recorder.Body.Bytes()...),
		Headers:    map[string][]string{},
	}
	for key, values := range httpResult.Header {
		res.Headers[strings.ToLower(key)] = append([]string(nil), values...)
	}

	if res.StatusCode != http.StatusOK {
		return res, fmt.Errorf("request error: %v, %v", nil, string(res.Body))
	}
	if responseObjectToUnMarshall != nil && len(res.Body) > 0 {
		if err := util.FromJSONBytes(res.Body, responseObjectToUnMarshall); err != nil {
			return res, err
		}
	}
	return res, nil
}

func applyConsoleLocalAPIAuth(req *http.Request) {
	if req == nil {
		return
	}
	apiCfg := global.Env().SystemConfig.APIConfig
	if !apiCfg.Security.Enabled {
		return
	}
	username := strings.TrimSpace(apiCfg.Security.Username)
	if username == "" {
		return
	}
	req.SetBasicAuth(username, apiCfg.Security.Password)
}
func (h *APIHandler) clearInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	appName := h.GetParameterOrDefault(req, "app_name", "")
	task.RunWithinGroup("clear_instance", func(ctx context.Context) error {
		err := h.clearInstanceByAppName(appName)
		if err != nil {
			log.Error(err)
		}
		return err
	})
	h.WriteAckOKJSON(w)
}

func (h *APIHandler) clearInstanceByAppName(appName string) error {
	var (
		size = 100
		from = 0
	)
	// Paginated query for all running instances
	q := orm.Query{
		Size: size,
		From: from,
	}
	if appName != "" {
		q.Conds = orm.And(
			orm.Eq("application.name", appName),
		)
	}
	q.AddSort("created", orm.ASC)
	insts := []model.Instance{}
	var (
		instanceIDs []string
		toRemoveIDs []string
		instsCache  = map[string]*model.Instance{}
	)
	client := elastic2.GetClient(global.MustLookupString(elastic2.GlobalSystemElasticsearchID))
	for {
		err, _ := orm.SearchWithJSONMapper(&insts, &q)
		if err != nil {
			return err
		}
		for _, inst := range insts {
			instanceIDs = append(instanceIDs, inst.ID)
			instsCache[inst.ID] = &inst
		}
		if len(instanceIDs) == 0 {
			break
		}
		aliveInstanceIDs, err := getAliveInstanceIDs(client, instanceIDs)
		if err != nil {
			return err
		}
		for _, instanceID := range instanceIDs {
			if _, ok := aliveInstanceIDs[instanceID]; !ok {
				toRemoveIDs = append(toRemoveIDs, instanceID)
			}
		}
		if len(toRemoveIDs) > 0 {
			// Use the same slice to avoid extra allocation
			filteredIDs := toRemoveIDs[:0]
			// check whether the instance is still online
			for _, instanceID := range toRemoveIDs {
				if inst, ok := instsCache[instanceID]; ok {
					if _, tokenErr := agent_common.GetTokenCredentialValue(inst.AccessCredentialID); tokenErr != nil {
						err = tokenErr
					} else {
						if inst != nil {
							_, err = h.getRuntimeInstanceInfo(inst)
						}
					}
					if err == nil {
						// Skip online instance, do not append to filtered list
						continue
					}
				}
				// Keep only offline instances
				filteredIDs = append(filteredIDs, instanceID)
			}

			// Assign back after filtering
			toRemoveIDs = filteredIDs
			query := util.MapStr{
				"query": util.MapStr{
					"terms": util.MapStr{
						"id": toRemoveIDs,
					},
				},
			}
			// remove instances
			err = orm.DeleteBy(model.Instance{}, util.MustToJSONBytes(query))
			if err != nil {
				return fmt.Errorf("failed to delete instance: %w", err)
			}
			// remove instance related data
			query = util.MapStr{
				"query": util.MapStr{
					"terms": util.MapStr{
						"metadata.labels.agent_id": toRemoveIDs,
					},
				},
			}
			err = orm.DeleteBy(model.Setting{}, util.MustToJSONBytes(query))
		}

		// Exit loop when the number of returned records is less than the page size
		if len(insts) <= size {
			break
		}
		// Reset instance state for the next iteration
		insts = []model.Instance{}
		toRemoveIDs = nil
		instsCache = make(map[string]*model.Instance)
		q.From += size
	}
	return nil
}

func getAliveInstanceIDs(client elastic2.API, instanceIDs []string) (map[string]struct{}, error) {
	query := util.MapStr{
		"size": 0,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"terms": util.MapStr{
							"agent.id": instanceIDs,
						},
					},
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"gt": "now-7d",
							},
						},
					},
				},
			},
		},
		"aggs": util.MapStr{
			"grp_agent_id": util.MapStr{
				"terms": util.MapStr{
					"field": "agent.id",
				},
				"aggs": util.MapStr{
					"count": util.MapStr{
						"value_count": util.MapStr{
							"field": "agent.id",
						},
					},
				},
			},
		},
	}
	queryDSL := util.MustToJSONBytes(query)
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	response, err := client.QueryDSL(ctx, orm.GetWildcardIndexName(event.Event{}), nil, queryDSL)
	if err != nil {
		return nil, err
	}
	ret := map[string]struct{}{}
	for _, bk := range response.Aggregations["grp_agent_id"].Buckets {
		key := bk["key"].(string)
		if bk["doc_count"].(float64) > 0 {
			ret[key] = struct{}{}
		}
	}
	return ret, nil
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
	if err := agent_common.ApplyInstanceRequestAuth(req1, obj); err != nil {
		panic(err)
	}

	res, err := proxyInstanceRequest(obj, req1, nil)
	if err != nil {
		panic(err)
	}

	if isSensitiveInfoPath(path) && len(res.Body) > 0 {
		res.Body, err = console_common.SanitizeInstanceInfoBytes(res.Body)
		if err != nil {
			panic(err)
		}
	}

	h.WriteHeader(w, res.StatusCode)
	h.Write(w, res.Body)
}

func (h *APIHandler) getInstanceInfo(endpoint string, basicAuth *model.BasicAuth, accessToken string) (*model.Instance, error) {
	paths := buildInstanceInfoPaths(false, accessToken)

	var lastErr error
	for _, infoPath := range paths {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
		req1 := &util.Request{
			Method:  http.MethodGet,
			Path:    infoPath,
			Context: ctx,
		}
		if strings.TrimSpace(accessToken) != "" {
			agent_common.ApplyBearerToken(req1, accessToken)
		} else if basicAuth != nil {
			req1.SetBasicAuth(basicAuth.Username, basicAuth.Password.Get())
		}
		obj := &model.Instance{}
		res, err := ProxyAgentRequest("runtime", endpoint, req1, obj)
		cancel()
		if err == nil {
			return obj, nil
		}
		if lastErr == nil {
			lastErr = err
		}
		if !shouldFallbackInstanceInfoPath(infoPath, res, err) {
			return nil, err
		}
	}

	return nil, lastErr
}

func (h *APIHandler) getRuntimeInstanceInfo(instance *model.Instance) (*model.Instance, error) {
	if instance == nil {
		return nil, fmt.Errorf("instance is nil")
	}

	paths := buildInstanceInfoPaths(strings.EqualFold(instance.Application.Name, "agent"), "")
	var lastErr error
	for _, infoPath := range paths {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
		req1 := &util.Request{
			Method:  http.MethodGet,
			Path:    infoPath,
			Context: ctx,
		}
		if err := agent_common.ApplyInstanceRequestAuth(req1, instance); err != nil {
			cancel()
			return nil, err
		}

		obj := &model.Instance{}
		res, err := proxyInstanceRequest(instance, req1, obj)
		cancel()
		if err == nil {
			return obj, nil
		}
		if lastErr == nil {
			lastErr = err
		}
		if !shouldFallbackInstanceInfoPath(infoPath, res, err) {
			return nil, err
		}
	}
	return nil, lastErr
}

func (h *APIHandler) tryConnect(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var reqBody = struct {
		Endpoint    string           `json:"endpoint"`
		BasicAuth   *model.BasicAuth `json:"basic_auth"`
		AccessToken string           `json:"access_token"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	probeAccessToken := effectiveInstanceProbeAccessToken(req, reqBody.Endpoint, reqBody.AccessToken)
	connectRes, err := h.getInstanceInfo(reqBody.Endpoint, reqBody.BasicAuth, probeAccessToken)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, console_common.SanitizeInstanceInfoMap(util.MapStr{
		"id":          connectRes.ID,
		"name":        connectRes.Name,
		"application": connectRes.Application,
		"labels":      connectRes.Labels,
		"tags":        connectRes.Tags,
		"description": connectRes.Description,
		"status":      connectRes.Status,
	}), http.StatusOK)
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
	if err := agent_common.ApplyInstanceRequestAuth(req1, instance); err != nil {
		panic(err)
	}

	res, err := proxyInstanceRequest(instance, req1, nil)
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

func isSensitiveInfoPath(rawPath string) bool {
	if rawPath == "" {
		return false
	}
	parsed, err := url.Parse(rawPath)
	if err != nil {
		return rawPath == "/_info" || rawPath == "/agent/_info"
	}
	return parsed.Path == "/_info" || parsed.Path == "/agent/_info"
}

func buildInstanceInfoPaths(isAgent bool, accessToken string) []string {
	if isAgent || strings.TrimSpace(accessToken) != "" {
		return []string{"/agent/_info", "/_info"}
	}
	return []string{"/_info"}
}

func effectiveInstanceProbeAccessToken(req *http.Request, endpoint, accessToken string) string {
	accessToken = strings.TrimSpace(accessToken)
	if accessToken != "" {
		return accessToken
	}
	if req == nil || !shouldReuseCurrentRequestAuthForEndpoint(endpoint) {
		return ""
	}
	return agent_common.ExtractBearerToken(req)
}

func effectiveManagedInstanceAccessToken(req *http.Request, instance *model.Instance) string {
	if instance == nil {
		return ""
	}
	if instance.AccessCredentialID != "" || instance.BasicAuth != nil {
		return ""
	}
	if !shouldReuseCurrentRequestAuthForEndpoint(instance.GetEndpoint()) {
		return ""
	}
	return agent_common.ExtractBearerToken(req)
}

func shouldReuseCurrentRequestAuthForEndpoint(endpoint string) bool {
	parsed, err := url.Parse(strings.TrimSpace(endpoint))
	if err != nil || parsed == nil {
		return false
	}
	host := strings.TrimSpace(parsed.Hostname())
	if !isLocalManagedEndpointHost(host) {
		return false
	}
	port := endpointPort(parsed)
	if port == "" {
		return false
	}
	if global.Env().SystemConfig.WebAppConfig.Enabled && endpointMatchesPort(global.Env().SystemConfig.WebAppConfig.GetEndpoint(), port) {
		return true
	}
	if global.Env().SystemConfig.APIConfig.Enabled && endpointMatchesPort(global.Env().SystemConfig.APIConfig.GetEndpoint(), port) {
		return true
	}
	return false
}

func isLocalManagedEndpointHost(host string) bool {
	host = strings.TrimSpace(host)
	if host == "" {
		return false
	}
	if strings.EqualFold(host, "localhost") {
		return true
	}
	ip := net.ParseIP(host)
	if ip == nil {
		return false
	}
	if ip.IsLoopback() {
		return true
	}
	for _, localIP := range util.GetLocalIPs() {
		if parsed := net.ParseIP(strings.TrimSpace(localIP)); parsed != nil && parsed.Equal(ip) {
			return true
		}
	}
	return false
}

func endpointMatchesPort(endpoint, port string) bool {
	parsed, err := url.Parse(strings.TrimSpace(endpoint))
	if err != nil || parsed == nil {
		return false
	}
	return endpointPort(parsed) == port
}

func endpointPort(parsed *url.URL) string {
	if parsed == nil {
		return ""
	}
	if port := strings.TrimSpace(parsed.Port()); port != "" {
		return port
	}
	switch strings.ToLower(strings.TrimSpace(parsed.Scheme)) {
	case "https":
		return "443"
	case "http":
		return "80"
	default:
		return ""
	}
}

func shouldFallbackInstanceInfoPath(path string, res *util.Result, err error) bool {
	if path != "/agent/_info" || err == nil {
		return false
	}
	if res != nil {
		return res.StatusCode == http.StatusNotFound
	}
	return true
}

// TODO check permission by user
func GetRuntimeInstanceByID(instanceID string) (bool, *model.Instance, error) {
	obj := model.Instance{}
	obj.ID = instanceID
	exists, err := orm.Get(&obj)
	if err == elastic.ErrNotFound {
		err = nil
		exists = false
	}
	if !exists || err != nil {
		if !exists {
			err = fmt.Errorf("instance not found")
		}
		return exists, nil, err
	}
	return true, &obj, err
}

func renamePendingManagerCredential(instance *model.Instance, credentialID string) error {
	if instance == nil || credentialID == "" {
		return nil
	}
	tokenValue, err := agent_common.GetTokenCredentialValue(credentialID)
	if err != nil {
		return err
	}
	return agent_common.UpdateTokenCredential(
		credentialID,
		agent_common.BuildManagerCredentialName(instance),
		agent_common.BuildManagerCredentialTags(),
		tokenValue,
	)
}

func upsertInstanceAccessCredential(instance *model.Instance, registerToken *common.RegisterToken) error {
	if instance == nil || registerToken == nil || strings.TrimSpace(registerToken.Value) == "" {
		return nil
	}
	if instance.AccessCredentialID != "" {
		return agent_common.UpdateTokenCredential(
			instance.AccessCredentialID,
			agent_common.BuildAccessCredentialName(instance),
			agent_common.BuildAccessCredentialTags(),
			registerToken.Value,
		)
	}
	credentialID, err := agent_common.SaveTokenCredential(
		agent_common.BuildAccessCredentialName(instance),
		agent_common.BuildAccessCredentialTags(),
		registerToken.Value,
	)
	if err != nil {
		return err
	}
	instance.AccessCredentialID = credentialID
	instance.BasicAuth = nil
	return nil
}

var canDeleteCredentialAfterInstanceRemoval = func(credentialID string) (bool, error) {
	credentialID = strings.TrimSpace(credentialID)
	if credentialID == "" {
		return false, nil
	}

	q := orm.Query{
		Size:  0,
		Conds: orm.And(orm.Eq("credential_id", credentialID)),
	}
	err, result := orm.Search(elastic2.ElasticsearchConfig{}, &q)
	if err != nil {
		return false, fmt.Errorf("query elasticsearch config error: %w", err)
	}
	if result.Total > 0 {
		return false, nil
	}

	q = orm.Query{
		Size: 0,
		Conds: orm.Or(
			orm.Eq("manager_credential_id", credentialID),
			orm.Eq("access_credential_id", credentialID),
		),
	}
	err, result = orm.Search(model.Instance{}, &q)
	if err != nil {
		return false, fmt.Errorf("query instance config error: %w", err)
	}
	return result.Total == 0, nil
}

var deleteCredentialByID = func(credentialID string) error {
	credentialID = strings.TrimSpace(credentialID)
	if credentialID == "" {
		return nil
	}

	cred := frameworkcredential.Credential{}
	cred.ID = credentialID
	exists, err := orm.Get(&cred)
	if err != nil {
		return err
	}
	if !exists {
		return nil
	}
	return orm.Delete(&orm.Context{Refresh: orm.WaitForRefresh}, &cred)
}

var deletePendingRegistrationTokensByInstanceID = func(instanceID string) error {
	instanceID = strings.TrimSpace(instanceID)
	if instanceID == "" {
		return nil
	}

	query := orm.Query{
		Size: 1000,
		Conds: orm.And(
			orm.Eq("instance_id", instanceID),
		),
	}
	records := []agent_common.PendingRegistrationToken{}
	if err, _ := orm.SearchWithJSONMapper(&records, &query); err != nil {
		return err
	}

	ctx := &orm.Context{Refresh: orm.WaitForRefresh}
	for i := range records {
		if err := orm.Delete(ctx, &records[i]); err != nil {
			return err
		}
	}
	return nil
}

func cleanupDeletedInstanceArtifacts(instance *model.Instance) []string {
	if instance == nil {
		return nil
	}

	warnings := []string{}
	seenCredentials := map[string]struct{}{}

	for _, credentialID := range []string{instance.ManagerCredentialID, instance.AccessCredentialID} {
		credentialID = strings.TrimSpace(credentialID)
		if credentialID == "" {
			continue
		}
		if _, exists := seenCredentials[credentialID]; exists {
			continue
		}
		seenCredentials[credentialID] = struct{}{}

		deletable, err := canDeleteCredentialAfterInstanceRemoval(credentialID)
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("failed to inspect credential [%s]: %v", credentialID, err))
			continue
		}
		if !deletable {
			continue
		}
		if err := deleteCredentialByID(credentialID); err != nil {
			warnings = append(warnings, fmt.Sprintf("failed to delete credential [%s]: %v", credentialID, err))
		}
	}

	if err := deletePendingRegistrationTokensByInstanceID(instance.ID); err != nil {
		warnings = append(warnings, fmt.Sprintf("failed to delete pending registration token for instance [%s]: %v", instance.ID, err))
	}

	return warnings
}
