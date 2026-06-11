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

package security

import (
	"context"
	"fmt"
	frameworksecurity "infini.sh/framework/core/security"

	"github.com/golang-jwt/jwt/v4"
)

const ctxUserKey = "user"

type UserClaims struct {
	*jwt.RegisteredClaims
	*ShortUser
}

type ShortUser struct {
	Provider string   `json:"provider"`
	Username string   `json:"username"`
	UserId   string   `json:"user_id"`
	Roles    []string `json:"roles"`
}

const Secret = "console"

var frameworkDefaultPermissions = []frameworksecurity.PermissionKey{
	frameworksecurity.GetOrInitPermission("generic", "license", "info"),
}

func NewUserContext(ctx context.Context, clam *UserClaims) context.Context {
	if clam != nil {
		ctx = frameworksecurity.AddUserToContext(ctx, clam.ToSessionInfo())
	}
	return context.WithValue(ctx, ctxUserKey, clam)
}

func FromUserContext(ctx context.Context) (*ShortUser, error) {
	ctxUser := ctx.Value(ctxUserKey)
	if ctxUser != nil {
		switch reqUser := ctxUser.(type) {
		case *UserClaims:
			return reqUser.ShortUser, nil
		case *ShortUser:
			return reqUser, nil
		}
	}

	sessionUser, err := frameworksecurity.GetUserFromContext(ctx)
	if err == nil && sessionUser != nil {
		return NewShortUserFromSession(sessionUser), nil
	}
	return nil, fmt.Errorf("user not found")
}

func NewShortUserFromSession(sessionUser *frameworksecurity.UserSessionInfo) *ShortUser {
	if sessionUser == nil {
		return nil
	}
	return &ShortUser{
		Provider: sessionUser.Provider,
		Username: sessionUser.Login,
		UserId:   sessionUser.UserID,
		Roles:    append([]string(nil), sessionUser.Roles...),
	}
}

func NewUserClaimsFromSession(sessionUser *frameworksecurity.UserSessionInfo) *UserClaims {
	shortUser := NewShortUserFromSession(sessionUser)
	if shortUser == nil {
		return nil
	}
	return &UserClaims{
		ShortUser: shortUser,
	}
}

func (u *UserClaims) ToSessionInfo() *frameworksecurity.UserSessionInfo {
	if u == nil {
		return nil
	}
	return u.ShortUser.ToSessionInfo()
}

func (u *ShortUser) ToSessionInfo() *frameworksecurity.UserSessionInfo {
	if u == nil {
		return nil
	}
	sessionUser := &frameworksecurity.UserSessionInfo{
		Provider: u.Provider,
		Login:    u.Username,
		Roles:    append([]string(nil), u.Roles...),
	}
	sessionUser.SetUserID(u.UserId)
	return EnsureFrameworkDefaultPermissions(sessionUser)
}

func EnsureFrameworkDefaultPermissions(sessionUser *frameworksecurity.UserSessionInfo) *frameworksecurity.UserSessionInfo {
	if sessionUser == nil {
		return nil
	}

	permissions := getFrameworkPermissionKeys(sessionUser)
	for _, permission := range frameworkDefaultPermissions {
		if !hasFrameworkPermission(permissions, permission) {
			permissions = append(permissions, permission)
		}
	}
	sessionUser.UserAssignedPermission = frameworksecurity.NewUserAssignedPermission(permissions, nil)

	return sessionUser
}

func getFrameworkPermissionKeys(sessionUser *frameworksecurity.UserSessionInfo) []frameworksecurity.PermissionKey {
	if sessionUser == nil || sessionUser.UserAssignedPermission == nil {
		return nil
	}
	return append([]frameworksecurity.PermissionKey(nil), sessionUser.UserAssignedPermission.GetPermissionKeys()...)
}

func hasFrameworkPermission(permissions []frameworksecurity.PermissionKey, permission frameworksecurity.PermissionKey) bool {
	for _, existing := range permissions {
		if existing == permission {
			return true
		}
	}
	return false
}
