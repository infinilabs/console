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
	console_common "infini.sh/console/common"
	agent_common "infini.sh/console/modules/agent/common"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/task"
	"net/http"
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
	ucfg "infini.sh/framework/lib/go-ucfg"
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
	api.HandleAPIMethod(api.GET, getInstallScriptAPI, handler.getInstallScript)
	api.HandleAPIMethod(api.GET, getGatewayInstallScriptAPI, handler.getGatewayInstallScript)

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

	if strings.EqualFold(obj.Application.Name, "agent") {
		tokenValue := getBearerToken(req)
		if exists {
			if oldInst.Created != nil {
				obj.Created = oldInst.Created
			}
			if oldInst.ManagerCredentialID != "" {
				ok, err := agent_common.ValidateManagerToken(oldInst, tokenValue)
				if err != nil {
					h.WriteError(w, err.Error(), http.StatusInternalServerError)
					return
				}
				if !ok {
					h.WriteError(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
					return
				}
			} else if err := validateManagerBasicAuthIfConfigured(req); err != nil {
				h.WriteError(w, err.Error(), http.StatusUnauthorized)
				return
			}
			obj.ManagerCredentialID = oldInst.ManagerCredentialID
			obj.AccessCredentialID = oldInst.AccessCredentialID
			obj.BasicAuth = oldInst.BasicAuth
		} else {
			if tokenValue == "" {
				h.WriteError(w, "missing agent manager token", http.StatusUnauthorized)
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

	if exists && strings.EqualFold(obj.Application.Name, "agent") && registerReq.AccessToken != nil {
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

	res, err := h.getInstanceInfo(obj.Endpoint, obj.BasicAuth, reqBody.AccessToken)
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

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	err = orm.Delete(&orm.Context{
		Refresh: orm.WaitForRefresh,
	}, &obj)
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

		storedInstance := &model.Instance{
			AccessCredentialID: util.ToString(instance["access_credential_id"]),
		}
		username, _ := instance.GetValue("basic_auth.username")
		if username != nil && username.(string) != "" {
			password, _ := instance.GetValue("basic_auth.password")
			if password != nil && password.(string) != "" {
				storedInstance.BasicAuth = &model.BasicAuth{
					Username: username.(string),
					Password: ucfg.SecretString(password.(string)),
				}
			}
		}
		if err := agent_common.ApplyInstanceRequestAuth(req, storedInstance); err != nil {
			log.Error(err)
			result[gid.(string)] = util.MapStr{}
			continue
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
					accessToken, tokenErr := agent_common.GetTokenCredentialValue(inst.AccessCredentialID)
					if tokenErr != nil {
						err = tokenErr
					} else {
						_, err = h.getInstanceInfo(inst.Endpoint, inst.BasicAuth, accessToken)
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
	paths := []string{"/_info"}
	if strings.TrimSpace(accessToken) != "" {
		paths = []string{"/agent/_info", "/_info"}
	}

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
	connectRes, err := h.getInstanceInfo(reqBody.Endpoint, reqBody.BasicAuth, reqBody.AccessToken)
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

func getBearerToken(req *http.Request) string {
	if req == nil {
		return ""
	}
	value := strings.TrimSpace(req.Header.Get("Authorization"))
	if !strings.HasPrefix(strings.ToLower(value), "bearer ") {
		return ""
	}
	return strings.TrimSpace(value[7:])
}

func validateManagerBasicAuthIfConfigured(req *http.Request) error {
	managerAuth := global.Env().SystemConfig.Configs.ManagerConfig.BasicAuth
	if managerAuth.Username == "" {
		return nil
	}
	user, password, ok := req.BasicAuth()
	if !ok || user != managerAuth.Username || password != managerAuth.Password.Get() {
		return fmt.Errorf("invalid manager basic auth")
	}
	return nil
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
