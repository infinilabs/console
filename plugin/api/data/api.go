/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package data

import (
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac/enum"
)

type DataAPI struct {
	api.Handler
}

func InitAPI() {
	dataApi := DataAPI{}
	api.HandleAPIMethod(api.POST, "/data/export", dataApi.RequirePermission(dataApi.exportData, enum.PermissionAlertChannelRead, enum.PermissionAlertRuleRead))
	api.HandleAPIMethod(api.POST, "/data/import", dataApi.RequirePermission(dataApi.importData, enum.PermissionAlertChannelWrite, enum.PermissionAlertRuleWrite))

}