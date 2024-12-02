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

package model

import "infini.sh/framework/core/orm"

type Layout struct {
	orm.ORMObjectBase
	Name string `json:"name" elastic_mapping:"name: { type: text }"`
	Description string `json:"description" elastic_mapping:"description: { type: text }"`
	Creator struct {
		Name string `json:"name"`
		Id   string `json:"id"`
	} `json:"creator"`
	ViewID string `json:"view_id" elastic_mapping:"view_id: { type: keyword }"`
	Config interface{} `json:"config" elastic_mapping:"config: { type: object, enabled:false }"`
	Reserved bool  `json:"reserved,omitempty" elastic_mapping:"reserved:{type:boolean}"`
	Type LayoutType `json:"type" elastic_mapping:"type: { type: keyword }"`
	IsFixed bool `json:"is_fixed" elastic_mapping:"is_fixed: { type: boolean }"`
}

type LayoutType string
const (
	LayoutTypeWorkspace LayoutType = "workspace"
)