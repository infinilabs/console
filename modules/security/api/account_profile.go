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

package api

import (
	"net/http"
	"sort"

	rbac "infini.sh/console/core/security"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	frameworksecurity "infini.sh/framework/core/security"
)

type accountProfileResponse struct {
	frameworksecurity.UserProfile
	Privilege []string `json:"privilege,omitempty"`
}

func (h APIHandler) Profile(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	reqUser, err := rbac.FromUserContext(r.Context())
	if err != nil || reqUser == nil {
		h.WriteError(w, "invalid user", http.StatusUnauthorized)
		return
	}

	profile := accountProfileResponse{
		UserProfile: frameworksecurity.UserProfile{
			Roles:       append([]string(nil), reqUser.Roles...),
			Preferences: frameworksecurity.Preferences{},
		},
	}
	profile.ID = reqUser.UserId
	profile.Name = reqUser.Username
	profile.Privilege = collectPlatformPrivileges(profile.Roles)

	if orm.HasHandler() {
		if user, err := h.User.Get(reqUser.UserId); err == nil && user.ID != "" {
			if user.Username != "" {
				profile.Name = user.Username
			}
			profile.Email = user.Email
			profile.Phone = user.Phone
			profile.Avatar = user.AvatarUrl

			if roles, privilege := user.GetPermissions(); len(roles) > 0 || len(privilege) > 0 {
				if len(roles) > 0 {
					profile.Roles = append([]string(nil), roles...)
				}
				if len(privilege) > 0 {
					profile.Privilege = normalizeStringList(privilege)
				}
			}
		}
	}

	profile.Permissions = privilegesToPermissionKeys(profile.Privilege)
	h.WriteJSON(w, profile, http.StatusOK)
}

func collectPlatformPrivileges(roles []string) []string {
	privileges := normalizeStringList(rbac.CombineUserRoles(roles).Platform)
	if len(privileges) > 0 {
		return privileges
	}

	var builtinPrivileges []string
	for _, roleName := range roles {
		role, ok := rbac.BuiltinRoles[roleName]
		if !ok {
			continue
		}
		builtinPrivileges = append(builtinPrivileges, role.Privilege.Platform...)
	}
	return normalizeStringList(builtinPrivileges)
}

func privilegesToPermissionKeys(privileges []string) []frameworksecurity.PermissionKey {
	permissions := make([]frameworksecurity.PermissionKey, 0, len(privileges)+1)
	for _, privilege := range normalizeStringList(privileges) {
		permissions = append(permissions, frameworksecurity.PermissionKey(privilege))
	}
	sessionUser := &frameworksecurity.UserSessionInfo{
		UserAssignedPermission: frameworksecurity.NewUserAssignedPermission(permissions, nil),
	}
	rbac.EnsureFrameworkDefaultPermissions(sessionUser)
	if sessionUser.UserAssignedPermission == nil {
		return nil
	}
	return sessionUser.UserAssignedPermission.GetPermissionKeys()
}

func normalizeStringList(values []string) []string {
	if len(values) == 0 {
		return nil
	}

	unique := make(map[string]struct{}, len(values))
	for _, value := range values {
		if value == "" {
			continue
		}
		unique[value] = struct{}{}
	}

	if len(unique) == 0 {
		return nil
	}

	out := make([]string, 0, len(unique))
	for value := range unique {
		out = append(out, value)
	}
	sort.Strings(out)
	return out
}
