/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package gateway

import (
	"infini.sh/framework/core/api"
)

type GatewayAPI struct {
	api.Handler
}

func init() {
	gateway:=GatewayAPI{}
	api.HandleAPIMethod(api.POST, "/gateway/instance/try_connect", gateway.tryConnect)
	api.HandleAPIMethod(api.GET, "/gateway/instance/:instance_id", gateway.getInstance)
	api.HandleAPIMethod(api.POST, "/gateway/instance", gateway.createInstance)
	api.HandleAPIMethod(api.PUT, "/gateway/instance/:instance_id", gateway.updateInstance)
	api.HandleAPIMethod(api.DELETE, "/gateway/instance/:instance_id", gateway.deleteInstance)
	api.HandleAPIMethod(api.GET, "/gateway/instance/_search", gateway.searchInstance)
	api.HandleAPIMethod(api.POST, "/gateway/instance/status", gateway.getInstanceStatus)

	api.HandleAPIMethod(api.POST, "/gateway/instance/:instance_id/_proxy", gateway.proxy)
}
