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
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package api

import (
	"bytes"
	"errors"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"infini.sh/console/common"
	rbac "infini.sh/console/core/security"
	"infini.sh/console/model"
	"infini.sh/console/service"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	frameworksecurity "infini.sh/framework/core/security"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic"
	"net/http"
	"sort"
	"strings"
	"time"
)

func (h APIHandler) CreateUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var user rbac.User
	err := h.DecodeJSON(r, &user)
	if err != nil {
		h.Error400(w, err.Error())
		return
	}
	if user.Username == "" {
		h.Error400(w, "username is required")
		return
	}
	localUser, err := rbac.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	if h.userNameExists(w, user.Username) {
		return
	}
	randStr := util.GenerateSecureString(16)
	material, err := frameworksecurity.GeneratePasswordMaterial(randStr)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	user.Password = material.Hash
	user.PasswordSalt = material.Salt
	user.PasswordVerifier = material.Verifier
	user.SetEnabled(true)

	now := time.Now()
	user.Created = &now
	user.Updated = &now

	id, err := h.User.Create(&user)
	user.ID = id
	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}

	if r.Header.Get("Referer") != "" {
		auditLog, _ := model.NewAuditLogBuilderWithDefault().WithOperator(localUser.Username).
			WithLogTypeOperation().WithResourceTypeAccountCenter().
			WithEventName("create user").WithEventSourceIP(common.GetClientIP(r)).
			WithResourceName(user.Username).WithOperationTypeNew().
			WithEventRecord(util.MustToJSON(user)).Build()
		_ = service.LogAuditLog(auditLog)
	}

	h.WriteOKJSON(w, util.MapStr{
		"_id":      id,
		"password": randStr,
		"result":   "created",
	})
	return

}

func (h APIHandler) userNameExists(w http.ResponseWriter, name string) bool {
	u, err := h.User.GetBy("name", name)
	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return true
	}
	if u != nil {
		h.ErrorInternalServer(w, "user name already exists")
		return true
	}
	return false
}

func (h APIHandler) GetUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	user, err := h.User.Get(id)
	if errors.Is(err, elastic.ErrNotFound) {
		h.WriteJSON(w, api.NotFoundResponse(id), http.StatusNotFound)
		return
	}

	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	user.Password = ""
	user.PasswordSalt = ""
	user.PasswordVerifier = ""
	h.WriteOKJSON(w, api.FoundResponse(id, user))
	return
}

func (h APIHandler) UpdateUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	var user rbac.User
	err := h.DecodeJSON(r, &user)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error400(w, err.Error())
		return
	}
	localUser, err := rbac.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	oldUser, err := h.User.Get(id)
	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	if user.Username != oldUser.Username && h.userNameExists(w, user.Username) {
		return
	}

	now := time.Now()
	user.Updated = &now
	user.Created = oldUser.Created
	user.ID = id
	user.Password = oldUser.Password
	user.PasswordSalt = oldUser.PasswordSalt
	user.PasswordVerifier = oldUser.PasswordVerifier
	if user.Enabled == nil {
		user.SetEnabled(oldUser.IsEnabled())
	}
	err = h.User.Update(&user)

	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	//let user relogin after roles changed
	sort.Slice(user.Roles, func(i, j int) bool {
		return user.Roles[i].ID < user.Roles[j].ID
	})
	sort.Slice(oldUser.Roles, func(i, j int) bool {
		return oldUser.Roles[i].ID < oldUser.Roles[j].ID
	})
	changeLog, _ := util.DiffTwoObject(user.Roles, oldUser.Roles)
	if len(changeLog) > 0 {
		rbac.DeleteUserToken(id)
	}

	if r.Header.Get("Referer") != "" {
		auditLog, _ := model.NewAuditLogBuilderWithDefault().WithOperator(localUser.Username).
			WithLogTypeOperation().WithResourceTypeAccountCenter().
			WithEventName("update user").WithEventSourceIP(common.GetClientIP(r)).
			WithResourceName(user.Username).WithOperationTypeModification().
			WithEventRecord(util.MustToJSON(user)).Build()
		_ = service.LogAuditLog(auditLog)
	}

	h.WriteOKJSON(w, api.UpdateResponse(id))
	return
}

func (h APIHandler) EnableUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	h.batchSetUserEnabled(w, r, true)
}

func (h APIHandler) DisableUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	h.batchSetUserEnabled(w, r, false)
}

func (h APIHandler) batchSetUserEnabled(w http.ResponseWriter, r *http.Request, enabled bool) {
	var userIDs []string
	if err := h.DecodeJSON(r, &userIDs); err != nil {
		h.Error400(w, err.Error())
		return
	}
	if len(userIDs) == 0 {
		h.WriteAckOKJSON(w)
		return
	}

	reqUser, err := rbac.FromUserContext(r.Context())
	if err != nil {
		log.Error("failed to get user from context, err: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var updatedUsernames []string
	for _, userID := range userIDs {
		user, err := h.User.Get(userID)
		if errors.Is(err, elastic.ErrNotFound) {
			h.WriteJSON(w, api.NotFoundResponse(userID), http.StatusNotFound)
			return
		}
		if err != nil {
			h.ErrorInternalServer(w, err.Error())
			return
		}

		if reqUser != nil && reqUser.UserId == userID && !enabled {
			h.Error400(w, "can not disable yourself")
			return
		}
		if !enabled && isAdministratorUser(user) {
			h.Error400(w, "can not disable administrator")
			return
		}

		if user.IsEnabled() == enabled {
			continue
		}
		user.SetEnabled(enabled)
		if err = h.User.Update(&user); err != nil {
			h.ErrorInternalServer(w, err.Error())
			return
		}
		if !enabled {
			rbac.DeleteUserToken(userID)
		}
		updatedUsernames = append(updatedUsernames, user.Username)
	}

	if len(updatedUsernames) > 0 && r.Header.Get("Referer") != "" {
		eventName := "enable user"
		if !enabled {
			eventName = "disable user"
		}
		auditLog, _ := model.NewAuditLogBuilderWithDefault().WithOperator(reqUser.Username).
			WithLogTypeOperation().WithResourceTypeAccountCenter().
			WithEventName(eventName).WithEventSourceIP(common.GetClientIP(r)).
			WithResourceName(strings.Join(updatedUsernames, ",")).WithOperationTypeModification().
			WithEventRecord(util.MustToJSON(updatedUsernames)).Build()
		_ = service.LogAuditLog(auditLog)
	}

	h.WriteAckOKJSON(w)
}

func isAdministratorUser(user rbac.User) bool {
	for _, role := range user.Roles {
		if role.ID == rbac.RoleAdminName || role.Name == rbac.RoleAdminName {
			return true
		}
	}
	return false
}

func (h APIHandler) DeleteUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	user, err := rbac.FromUserContext(r.Context())
	if err != nil {
		log.Error("failed to get user from context, err: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user != nil && user.UserId == id {
		h.WriteError(w, "can not delete yourself", http.StatusInternalServerError)
		return
	}

	oldUser, getErr := h.User.Get(id)

	err = h.User.Delete(id)
	if errors.Is(err, elastic.ErrNotFound) {
		h.WriteJSON(w, api.NotFoundResponse(id), http.StatusNotFound)
		return
	}
	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	rbac.DeleteUserToken(id)

	if r.Header.Get("Referer") != "" {
		resourceName := id
		if getErr == nil {
			resourceName = oldUser.Username
		}
		auditLog, _ := model.NewAuditLogBuilderWithDefault().WithOperator(user.Username).
			WithLogTypeOperation().WithResourceTypeAccountCenter().
			WithEventName("delete user").WithEventSourceIP(common.GetClientIP(r)).
			WithResourceName(resourceName).WithOperationTypeDeletion().
			WithEventRecord(resourceName).Build()
		_ = service.LogAuditLog(auditLog)
	}

	h.WriteOKJSON(w, api.DeleteResponse(id))
	return
}

func (h APIHandler) SearchUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var (
		keyword = h.GetParameterOrDefault(r, "keyword", "")
		from    = h.GetIntOrDefault(r, "from", 0)
		size    = h.GetIntOrDefault(r, "size", 20)
	)

	res, err := h.User.Search(keyword, from, size)
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	//remove password field
	hitsBuf := bytes.Buffer{}
	hitsBuf.Write([]byte("["))
	jsonparser.ArrayEach(res.Raw, func(value []byte, dataType jsonparser.ValueType, offset int, err error) {
		value = jsonparser.Delete(value, "_source", "password")
		value = jsonparser.Delete(value, "_source", "password_salt")
		value = jsonparser.Delete(value, "_source", "password_verifier")
		hitsBuf.Write(value)
		hitsBuf.Write([]byte(","))
	}, "hits", "hits")
	buf := hitsBuf.Bytes()
	if buf[len(buf)-1] == ',' {
		buf[len(buf)-1] = ']'
	} else {
		hitsBuf.Write([]byte("]"))
	}
	res.Raw, err = jsonparser.Set(res.Raw, hitsBuf.Bytes(), "hits", "hits")
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}

	h.Write(w, res.Raw)
	return

}

func (h APIHandler) UpdateUserPassword(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	var req = struct {
		Password string `json:"password"`
	}{}
	err := h.DecodeJSON(r, &req)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error400(w, err.Error())
		return
	}
	localUser, err := rbac.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	user, err := h.User.Get(id)
	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	material, err := frameworksecurity.GeneratePasswordMaterial(req.Password)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	user.Password = material.Hash
	user.PasswordSalt = material.Salt
	user.PasswordVerifier = material.Verifier
	//t:=time.Now()
	//user.Updated =&t
	err = h.User.Update(&user)
	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	//disable old token to let user login
	rbac.DeleteUserToken(id)

	if r.Header.Get("Referer") != "" {
		auditLog, _ := model.NewAuditLogBuilderWithDefault().WithOperator(localUser.Username).
			WithLogTypeOperation().WithResourceTypeAccountCenter().
			WithEventName("reset user password").WithEventSourceIP(common.GetClientIP(r)).
			WithResourceName(user.Username).WithOperationTypeModification().
			WithEventRecord("password reset for user: " + user.Username).Build()
		_ = service.LogAuditLog(auditLog)
	}

	h.WriteOKJSON(w, api.UpdateResponse(id))
	return

}
