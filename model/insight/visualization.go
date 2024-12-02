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

package insight

import "time"

type Visualization struct {
	ID      string    `json:"id,omitempty"      elastic_meta:"_id" elastic_mapping:"id: { type: keyword }"`
	Created *time.Time `json:"created,omitempty" elastic_mapping:"created: { type: date }"`
	Updated *time.Time `json:"updated,omitempty" elastic_mapping:"updated: { type: date }"`
	Title        string `json:"title,omitempty" elastic_mapping:"title: { type: keyword }"`
	IndexPattern string `json:"index_pattern,omitempty" elastic_mapping:"index_pattern: { type: keyword }"`
	ClusterId    string `json:"cluster_id,omitempty" elastic_mapping:"cluster_id: { type: keyword }"`
	Series []SeriesItem `json:"series"  elastic_mapping:"series: { type: object,enabled:false }"`
	Position *Position `json:"position,omitempty" elastic_mapping:"position: { type: object,enabled:false }"`
	Description string `json:"description,omitempty" elastic_mapping:"description: { type: keyword }"`
}

type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
	H int `json:"h"`
	W int `json:"w"`
}
