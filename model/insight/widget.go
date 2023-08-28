/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package insight

import "infini.sh/framework/core/orm"

type Widget struct {
	orm.ORMObjectBase
	Title string `json:"title" elastic_mapping:"title: { type: text }"`
	Config  interface{}`json:"config" elastic_mapping:"config: { type: object,enabled:false }"`
}
