/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package layout

import (
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac/enum"
)

type LayoutAPI struct {
	api.Handler
}

func InitAPI() {
	layoutAPI := LayoutAPI{}
	api.HandleAPIMethod(api.GET, "/layout/:layout_id", layoutAPI.RequirePermission(layoutAPI.getLayout, enum.PermissionLayoutRead))
	api.HandleAPIMethod(api.POST, "/layout", layoutAPI.RequirePermission(layoutAPI.createLayout, enum.PermissionLayoutWrite))
	api.HandleAPIMethod(api.PUT, "/layout/:layout_id", layoutAPI.RequirePermission(layoutAPI.updateLayout, enum.PermissionLayoutWrite))
	api.HandleAPIMethod(api.DELETE, "/layout/:layout_id", layoutAPI.RequirePermission(layoutAPI.deleteLayout, enum.PermissionLayoutWrite))
	api.HandleAPIMethod(api.GET, "/layout/_search", layoutAPI.RequirePermission(layoutAPI.searchLayout, enum.PermissionLayoutRead))
}