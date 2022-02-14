/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package gateway

import "infini.sh/framework/core/orm"

type InstanceGroup struct {
	orm.ORMObjectBase
	GroupID string `json:"group_id,omitempty" elastic_mapping:"group_id: { type: keyword }"`
	InstanceID string `json:"instance_id,omitempty" elastic_mapping:"instance_id: { type: keyword }"`
}