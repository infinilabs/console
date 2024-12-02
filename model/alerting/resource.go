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

package alerting

import (
	"fmt"
)

type Resource struct {
	ID string `json:"resource_id" elastic_mapping:"resource_id:{type:keyword}"`
	Name string `json:"resource_name" elastic_mapping:"resource_name:{type:keyword}"`
	Type string `json:"type" elastic_mapping:"type:{type:keyword}"`
	Objects []string `json:"objects" elastic_mapping:"objects:{type:keyword,copy_to:search_text}"`
	Filter FilterQuery `json:"filter,omitempty" elastic_mapping:"-"`
	RawFilter map[string]interface{} `json:"raw_filter,omitempty"`
	TimeField string `json:"time_field,omitempty" elastic_mapping:"id:{type:keyword}"`
	Context Context `json:"context"`
}

func (r Resource) Validate() error{
	if r.TimeField == "" {
		return fmt.Errorf("TimeField can not be empty")
	}
	return nil
}

