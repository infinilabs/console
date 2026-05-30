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
	"infini.sh/console/core"
	rbac "infini.sh/console/core/security"
	"infini.sh/console/core/security/enum"
	"infini.sh/framework/core/api"
	frameworkaccount "infini.sh/framework/modules/security/account"
	frameworkrbac "infini.sh/framework/modules/security/rbac"
)

type APIHandler struct {
	core.Handler
	rbac.Adapter
}

const adapterType = "native"

var apiHandler APIHandler

func permissionKeys(keys []string) []api.PermissionKey {
	result := make([]api.PermissionKey, 0, len(keys))
	for _, key := range keys {
		result = append(result, api.PermissionKey(key))
	}
	return result
}

func Init() {
	apiHandler = APIHandler{Adapter: rbac.GetAdapter(adapterType)} //TODO handle hard coded
	frameworkrbac.RegisterPublicUIAuthRoutes()

	api.HandleAPIMethod(api.GET, "/permission/:type", apiHandler.RequireLogin(apiHandler.ListPermission), api.RequireLogin())

	api.HandleAPIMethod(api.POST, "/role/:type", apiHandler.RequirePermission(apiHandler.CreateRole, enum.RoleAllPermission...), api.RequirePermission(permissionKeys(enum.RoleAllPermission)...))
	api.HandleAPIMethod(api.GET, "/role/:id", apiHandler.RequirePermission(apiHandler.GetRole, enum.RoleReadPermission...), api.RequirePermission(permissionKeys(enum.RoleReadPermission)...))
	api.HandleAPIMethod(api.DELETE, "/role/:id", apiHandler.RequirePermission(apiHandler.DeleteRole, enum.RoleAllPermission...), api.RequirePermission(permissionKeys(enum.RoleAllPermission)...))
	api.HandleAPIMethod(api.PUT, "/role/:id", apiHandler.RequirePermission(apiHandler.UpdateRole, enum.RoleAllPermission...), api.RequirePermission(permissionKeys(enum.RoleAllPermission)...))
	api.HandleAPIMethod(api.GET, "/role/_search", apiHandler.RequirePermission(apiHandler.SearchRole, enum.RoleReadPermission...), api.RequirePermission(permissionKeys(enum.RoleReadPermission)...))

	api.HandleAPIMethod(api.POST, "/user", apiHandler.RequireSecureTransport(apiHandler.RequireReplayProtection(apiHandler.RequirePermission(apiHandler.CreateUser, enum.UserAllPermission...))), api.RequirePermission(permissionKeys(enum.UserAllPermission)...))
	api.HandleAPIMethod(api.GET, "/user/:id", apiHandler.RequirePermission(apiHandler.GetUser, enum.UserReadPermission...), api.RequirePermission(permissionKeys(enum.UserReadPermission)...))
	api.HandleAPIMethod(api.DELETE, "/user/:id", apiHandler.RequirePermission(apiHandler.DeleteUser, enum.UserAllPermission...), api.RequirePermission(permissionKeys(enum.UserAllPermission)...))
	api.HandleAPIMethod(api.PUT, "/user/:id", apiHandler.RequirePermission(apiHandler.UpdateUser, enum.UserAllPermission...), api.RequirePermission(permissionKeys(enum.UserAllPermission)...))
	api.HandleAPIMethod(api.GET, "/user/_search", apiHandler.RequirePermission(apiHandler.SearchUser, enum.UserReadPermission...), api.RequirePermission(permissionKeys(enum.UserReadPermission)...))
	api.HandleAPIMethod(api.PUT, "/user/:id/password", apiHandler.RequireSecureTransport(apiHandler.RequireReplayProtection(apiHandler.RequirePermission(apiHandler.UpdateUserPassword, enum.UserAllPermission...))), api.RequirePermission(permissionKeys(enum.UserAllPermission)...))

	api.HandleAPIMethod(api.POST, "/account/replay_nonce", apiHandler.RequireSecureTransport(frameworkrbac.IssueReplayNonce))
	api.HandleAPIMethod(api.POST, "/account/login/challenge", apiHandler.RequireSecureTransport(frameworkrbac.LoginChallenge))
	api.HandleAPIMethod(api.POST, "/account/login", apiHandler.RequireSecureTransport(frameworkrbac.Login))
	api.HandleAPIMethod(api.POST, "/account/refresh", apiHandler.RequireSecureTransport(apiHandler.RequireLogin(frameworkaccount.Refresh)), api.RequireLogin())
	api.HandleAPIMethod(api.POST, "/account/logout", frameworkaccount.Logout)
	api.HandleAPIMethod(api.DELETE, "/account/logout", frameworkaccount.Logout)

	api.HandleAPIMethod(api.GET, "/account/profile", apiHandler.RequireLogin(apiHandler.Profile), api.RequireLogin())
	api.HandleAPIMethod(api.PUT, "/account/password", apiHandler.RequireSecureTransport(apiHandler.RequireReplayProtection(apiHandler.RequireLogin(apiHandler.UpdatePassword))), api.RequireLogin())

}
