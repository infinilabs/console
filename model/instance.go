/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package model

import (
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/orm"
)


type Instance struct {
	orm.ORMObjectBase

	//InstanceID string `json:"instance_id,omitempty" elastic_mapping:"instance_id: { type: keyword }"`
	Name        string `json:"name,omitempty" elastic_mapping:"name:{type:keyword,fields:{text: {type: text}}}"`
	Endpoint string `json:"endpoint,omitempty" elastic_mapping:"endpoint: { type: keyword }"`
	Version map[string]interface{} `json:"version,omitempty" elastic_mapping:"version: { type: object }"`
	BasicAuth agent.BasicAuth `config:"basic_auth" json:"basic_auth,omitempty" elastic_mapping:"basic_auth:{type:object}"`
	Owner string `json:"owner,omitempty" config:"owner" elastic_mapping:"owner:{type:keyword}"`
	Tags [] string `json:"tags,omitempty"`
	Description string `json:"description,omitempty" config:"description" elastic_mapping:"description:{type:keyword}"`
}