/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package layout

import (
	"infini.sh/framework/core/api"
)

type LayoutAPI struct {
	api.Handler
}

func InitAPI() {
	layoutAPI := LayoutAPI{}
	api.HandleAPIMethod(api.GET, "/layout/:layout_id", layoutAPI.getLayout)
	api.HandleAPIMethod(api.POST, "/layout", layoutAPI.RequireLogin(layoutAPI.createLayout))
	api.HandleAPIMethod(api.PUT, "/layout/:layout_id", layoutAPI.updateLayout)
	api.HandleAPIMethod(api.DELETE, "/layout/:layout_id", layoutAPI.deleteLayout)
	api.HandleAPIMethod(api.GET, "/layout/_search", layoutAPI.searchLayout)
}
