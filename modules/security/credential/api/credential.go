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

/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"context"
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/console/core"
	agent_common "infini.sh/console/modules/agent/common"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	"net/http"
	"strconv"
	"strings"
)

type APIHandler struct {
	core.Handler
}

func (h *APIHandler) createCredential(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	cred := credential.Credential{}
	err := h.DecodeJSON(req, &cred)
	if err != nil {
		log.Error(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	cred.Name = strings.TrimSpace(cred.Name)
	err = cred.Validate()
	if err != nil {
		log.Error(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	exists, err := credentialNameExists(cred.Name, "")
	if err != nil {
		log.Error(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if exists {
		h.WriteError(w, "credential name already exists", http.StatusConflict)
		return
	}
	err = cred.Encode()
	if err != nil {
		log.Error(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ctx := orm.Context{
		Refresh: "wait_for",
	}
	cred.ID = util.GetUUID()
	err = orm.Create(&ctx, &cred)
	if err != nil {
		log.Error(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteCreatedOKJSON(w, cred.ID)
}

func (h *APIHandler) updateCredential(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	obj := credential.Credential{}

	obj.ID = id
	exists, err := orm.GetV2(orm.NewContext(), &obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	newObj := credential.Credential{}
	err = h.DecodeJSON(req, &newObj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	newObj.Name = strings.TrimSpace(newObj.Name)
	err = newObj.Validate()
	if err != nil {
		log.Error(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	exists, err = credentialNameExists(newObj.Name, obj.ID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if exists {
		h.WriteError(w, "credential name already exists", http.StatusConflict)
		return
	}
	err = validateCredentialUpdate(&obj, &newObj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	encodeChanged := false
	rotatedTokenValue := ""
	switch newObj.Type {
	case credential.BasicAuth:
		var oldPwd string
		if oldParams, ok := obj.Payload[newObj.Type].(map[string]interface{}); ok {
			if pwd, ok := oldParams["password"].(string); ok {
				oldPwd = pwd
			} else {
				http.Error(w, fmt.Sprintf("invalid password of credential [%s]", obj.ID), http.StatusInternalServerError)
				return
			}
		}
		if params, ok := newObj.Payload[newObj.Type].(map[string]interface{}); ok {
			if pwd, ok := params["password"].(string); ok && pwd != oldPwd {
				obj.Payload = newObj.Payload
				encodeChanged = true
			}
			if oldParams, ok := obj.Payload[obj.Type].(map[string]interface{}); ok {
				oldParams["username"] = params["username"]
			}
		}
	case credential.Token:
		var oldValue string
		if oldParams, ok := obj.Payload[newObj.Type].(map[string]interface{}); ok {
			if value, ok := oldParams["value"].(string); ok {
				oldValue = value
			} else {
				http.Error(w, fmt.Sprintf("invalid token value of credential [%s]", obj.ID), http.StatusInternalServerError)
				return
			}
		}
		if params, ok := newObj.Payload[newObj.Type].(map[string]interface{}); ok {
			if value, ok := params["value"].(string); ok && value != oldValue {
				obj.Payload = newObj.Payload
				encodeChanged = true
				rotatedTokenValue = oldValue
			}
		}
	default:
		h.WriteError(w, fmt.Sprintf("unsupport credential type [%s]", newObj.Type), http.StatusInternalServerError)
		return
	}
	obj.Name = newObj.Name
	obj.Type = newObj.Type
	obj.Tags = newObj.Tags
	if encodeChanged {
		err = obj.Encode()
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			log.Error(err)
			return
		}
	}
	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	obj.Invalid = false
	err = orm.Update(ctx, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if rotatedTokenValue != "" {
		agent_common.RememberPreviousToken(obj.ID, rotatedTokenValue)
	}
	task.RunWithinGroup("credential_callback", func(ctx context.Context) error {
		credential.TriggerChangeEvent(&obj)
		return nil
	})

	h.WriteUpdatedOKJSON(w, id)
}

func validateCredentialUpdate(current, next *credential.Credential) error {
	if current == nil || next == nil {
		return fmt.Errorf("credential update input can not be nil")
	}
	if current.Type != next.Type {
		return fmt.Errorf("credential type cannot be changed")
	}
	return nil
}

func (h *APIHandler) deleteCredential(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")

	obj := credential.Credential{}
	obj.ID = id

	exists, err := orm.GetV2(orm.NewContext(), &obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}
	//check dependency
	toDelete, err := canDelete(&obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if !toDelete {
		h.WriteError(w, "This credential is in use and cannot be deleted", http.StatusInternalServerError)
		return
	}
	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	err = orm.Delete(ctx, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteDeletedOKJSON(w, id)
}

func credentialNameExists(name, excludeID string) (bool, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return false, nil
	}

	existing := []credential.Credential{}
	query := orm.Query{
		Size: 10,
		Conds: orm.And(
			orm.Eq("name", name),
		),
	}
	err, _ := orm.SearchWithJSONMapper(&existing, &query)
	if err != nil {
		return false, err
	}
	if len(existing) == 0 {
		return false, nil
	}
	return hasCredentialNameConflict(existing, excludeID), nil
}

func hasCredentialNameConflict(existing []credential.Credential, excludeID string) bool {
	excludeID = strings.TrimSpace(excludeID)
	for _, item := range existing {
		if excludeID != "" && item.ID == excludeID {
			continue
		}
		return true
	}
	return false
}

func canDelete(cred *credential.Credential) (bool, error) {
	if cred == nil {
		return false, fmt.Errorf("parameter cred can not be nil")
	}
	q := orm.Query{
		Conds: orm.And(orm.Eq("credential_id", cred.ID)),
	}
	err, result := orm.Search(elastic.ElasticsearchConfig{}, &q)
	if err != nil {
		return false, fmt.Errorf("query elasticsearch config error: %w", err)
	}
	if result.Total > 0 {
		return false, nil
	}
	q = orm.Query{
		Conds: orm.Or(
			orm.Eq("manager_credential_id", cred.ID),
			orm.Eq("access_credential_id", cred.ID),
		),
	}
	err, result = orm.Search(model.Instance{}, &q)
	if err != nil {
		return false, fmt.Errorf("query instance config error: %w", err)
	}
	return result.Total == 0, nil
}

func (h *APIHandler) searchCredential(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		keyword = h.GetParameterOrDefault(req, "keyword", "")
		strSize = h.GetParameterOrDefault(req, "size", "20")
		strFrom = h.GetParameterOrDefault(req, "from", "0")
	)
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	queryDSL := buildCredentialSearchQueryDSL(keyword, from, size)

	q := orm.Query{}
	q.RawQuery = util.MustToJSONBytes(queryDSL)

	err, res := orm.Search(&credential.Credential{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	searchRes := elastic.SearchResponse{}
	util.MustFromJSONBytes(res.Raw, &searchRes)
	if len(searchRes.Hits.Hits) > 0 {
		for _, hit := range searchRes.Hits.Hits {
			delete(hit.Source, "encrypt")
			util.MapStr(hit.Source).Delete("payload.basic_auth.password")
			util.MapStr(hit.Source).Delete("payload.token.value")
		}
	}

	h.WriteJSON(w, searchRes, http.StatusOK)
}

func buildCredentialSearchQueryDSL(keyword string, from, size int) util.MapStr {
	mustQ := []interface{}{}
	if keyword != "" {
		mustQ = append(mustQ, util.MapStr{
			"query_string": util.MapStr{
				"default_field": "*",
				"query":         keyword,
			},
		})
	}

	queryDSL := util.MapStr{
		"size": size,
		"from": from,
		"sort": []util.MapStr{
			{
				"created": util.MapStr{
					"order": "desc",
				},
			},
		},
	}
	boolQuery := util.MapStr{
		"must_not": []interface{}{
			buildManagedPendingCredentialExclusion(),
		},
	}
	if len(mustQ) > 0 {
		boolQuery["must"] = mustQ
	}
	queryDSL["query"] = util.MapStr{
		"bool": boolQuery,
	}
	return queryDSL
}

func buildManagedPendingCredentialExclusion() util.MapStr {
	mustQ := make([]interface{}, 0, len(agent_common.BuildPendingManagerCredentialTags()))
	for _, tag := range agent_common.BuildPendingManagerCredentialTags() {
		mustQ = append(mustQ, util.MapStr{
			"term": util.MapStr{
				"tags": tag,
			},
		})
	}
	return util.MapStr{
		"bool": util.MapStr{
			"must": mustQ,
		},
	}
}

func (h *APIHandler) getCredential(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	obj := credential.Credential{}

	obj.ID = id
	exists, err := orm.GetV2(orm.NewContext(), &obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}
	util.MapStr(obj.Payload).Delete("basic_auth.password")
	util.MapStr(obj.Payload).Delete("token.value")
	h.WriteGetOKJSON(w, id, obj)
}
