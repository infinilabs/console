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
	"infini.sh/framework/core/orm"
)

type Channel struct {
	orm.ORMObjectBase
	Name string `json:"name" elastic_mapping:"name:{type:keyword,copy_to:search_text}"`
	Type string `json:"type" elastic_mapping:"type:{type:keyword,copy_to:search_text}"` // email or webhook
	Priority       int `json:"priority,omitempty"`
	Webhook *CustomWebhook `json:"webhook,omitempty" elastic_mapping:"webhook:{type:object}"`
	SearchText string `json:"-" elastic_mapping:"search_text:{type:text,index_prefixes:{},index_phrases:true, analyzer:suggest_text_search }"`
	SubType string `json:"sub_type" elastic_mapping:"sub_type:{type:keyword,copy_to:search_text}"`
	Email *Email `json:"email,omitempty" elastic_mapping:"email:{type:object}"`
	Enabled bool `json:"enabled" elastic_mapping:"enabled:{type:boolean}"`
}


const (
	ChannelEmail   = "email"
	ChannelWebhook = "webhook"
)