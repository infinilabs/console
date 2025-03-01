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
	"infini.sh/framework/core/orm"
)

type User struct {
	orm.ORMObjectBase

	AuthProvider string   `json:"auth_provider"  elastic_mapping:"auth_provider: { type: keyword }"`
	Username     string   `json:"name"  elastic_mapping:"name: { type: keyword }"`
	Nickname     string   `json:"nick_name"  elastic_mapping:"nick_name: { type: keyword }"`
	Password     string   `json:"password"  elastic_mapping:"password: { type: keyword }"`
	Email        string   `json:"email" elastic_mapping:"email: { type: keyword }"`
	Phone        string   `json:"phone" elastic_mapping:"phone: { type: keyword }"`
	Tags         []string `json:"tags" elastic_mapping:"mobile: { type: keyword }"`

	AvatarUrl string      `json:"avatar_url" elastic_mapping:"avatar_url: { type: keyword }"`
	Roles     []UserRole  `json:"roles" elastic_mapping:"roles: { type: object }"`
	Payload   interface{} `json:"-"` //used for storing additional data derived from auth provider
}

func (user *User) GetPermissions() (roles []string, privileges []string) {
	for _, v := range user.Roles {
		role, ok := RoleMap[v.Name]
		if ok {
			roles = append(roles, v.Name)
			privileges = append(privileges, role.Privilege.Platform...)
		}
	}
	return roles, privileges
}

type UserRole struct {
	ID   string `json:"id" elastic_mapping:"id: { type: keyword }"`
	Name string `json:"name" elastic_mapping:"name: { type: keyword }"`
}
