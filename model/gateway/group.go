/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package gateway

import "infini.sh/framework/core/orm"

type Group struct {
	orm.ORMObjectBase
	Name    string `json:"name,omitempty" elastic_mapping:"name:{type:keyword,fields:{text: {type: text}}}"`
	Owner string `json:"owner,omitempty" config:"owner" elastic_mapping:"owner:{type:keyword}"`
}
