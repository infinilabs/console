/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package gateway

import (
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac/enum"
)

type GatewayAPI struct {
	api.Handler
}

func InitAPI() {
	gateway:=GatewayAPI{}
	api.HandleAPIMethod(api.POST, "/gateway/instance/try_connect", gateway.RequireLogin(gateway.tryConnect))
	api.HandleAPIMethod(api.GET, "/gateway/instance/:instance_id", gateway.RequirePermission(gateway.getInstance, enum.PermissionGatewayInstanceRead))
	api.HandleAPIMethod(api.POST, "/gateway/instance", gateway.RequirePermission(gateway.createInstance, enum.PermissionGatewayInstanceWrite))
	api.HandleAPIMethod(api.PUT, "/gateway/instance/:instance_id", gateway.RequirePermission(gateway.updateInstance, enum.PermissionGatewayInstanceWrite))
	api.HandleAPIMethod(api.DELETE, "/gateway/instance/:instance_id", gateway.RequirePermission(gateway.deleteInstance, enum.PermissionGatewayInstanceWrite))
	api.HandleAPIMethod(api.GET, "/gateway/instance/_search", gateway.RequirePermission(gateway.searchInstance, enum.PermissionGatewayInstanceRead))
	api.HandleAPIMethod(api.POST, "/gateway/instance/status", gateway.RequirePermission(gateway.getInstanceStatus, enum.PermissionGatewayInstanceRead))

	api.HandleAPIMethod(api.POST, "/gateway/instance/:instance_id/_proxy", gateway.RequirePermission(gateway.proxy, enum.PermissionGatewayInstanceRead))
}
