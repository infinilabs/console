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