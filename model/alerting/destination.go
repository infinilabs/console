/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import "infini.sh/framework/core/orm"

type Channel struct {
	orm.ORMObjectBase
	Name string `json:"name"`
	Type string `json:"type"` // email or webhook
	Priority       int `json:"priority,omitempty"`
	Webhook *CustomWebhook `json:"webhook,omitempty"`
	//Name string `json:"name" elastic_mapping:"name:{type:keyword,copy_to:search_text}"`
	//SearchText string `json:"-" elastic_mapping:"search_text:{type:text,index_prefixes:{},index_phrases:true, analyzer:suggest_text_search }"`
}


const (
	ChannelEmail   = "email"
	ChannelWebhook = "webhook"
)