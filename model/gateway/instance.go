/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package gateway

import (
	"infini.sh/framework/core/orm"
)


type Instance struct {
	orm.ORMObjectBase

	InstanceID string `json:"instance_id,omitempty" elastic_mapping:"instance_id: { type: keyword }"`
	Name        string `json:"name,omitempty" elastic_mapping:"name:{type:keyword,fields:{text: {type: text}}}"`
	Endpoint string `json:"endpoint,omitempty" elastic_mapping:"endpoint: { type: keyword }"`
	Version map[string]interface{} `json:"version,omitempty" elastic_mapping:"version: { type: object }"`
	BasicAuth *struct {
		Username string `json:"username,omitempty" config:"username" elastic_mapping:"username:{type:keyword}"`
		Password string `json:"password,omitempty" config:"password" elastic_mapping:"password:{type:keyword}"`
	} `config:"basic_auth" json:"basic_auth,omitempty" elastic_mapping:"basic_auth:{type:object}"`
	Owner string `json:"owner,omitempty" config:"owner" elastic_mapping:"owner:{type:keyword}"`
	Group string `json:"group,omitempty"`
	Description string `json:"description,omitempty" config:"description" elastic_mapping:"description:{type:keyword}"`
}
