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
}

type LayoutType string
const (
	LayoutTypeWorkspace LayoutType = "workspace"
)