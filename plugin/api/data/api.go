/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package data

import (
	"infini.sh/console/core"
	"infini.sh/console/core/security/enum"
	"infini.sh/framework/core/api"
)

type DataAPI struct {
	core.Handler
}

func InitAPI() {
	dataApi := DataAPI{}
	api.HandleAPIMethod(api.POST, "/data/export", dataApi.RequirePermission(dataApi.exportData, enum.PermissionAlertChannelRead, enum.PermissionAlertRuleRead))
	api.HandleAPIMethod(api.POST, "/data/import", dataApi.RequirePermission(dataApi.importData, enum.PermissionAlertChannelWrite, enum.PermissionAlertRuleWrite))

}
