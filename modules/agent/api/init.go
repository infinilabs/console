/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"infini.sh/console/core"
	"infini.sh/console/core/security/enum"
	"infini.sh/console/plugin/managed/server"
	"infini.sh/framework/core/api"
)

type APIHandler struct {
	core.Handler
}

func Init() {
	handler := APIHandler{}
	api.HandleAPIMethod(api.POST, "/host/_enroll", handler.enrollHost)
	api.HandleAPIMethod(api.GET, "/host/:host_id/agent/info", handler.GetHostAgentInfo)
	api.HandleAPIMethod(api.GET, "/host/:host_id/processes", handler.GetHostElasticProcess)
	api.HandleAPIMethod(api.DELETE, "/host/:host_id", handler.deleteHost)

	//bind agent with nodes
	api.HandleAPIMethod(api.GET, "/instance/:instance_id/node/_discovery", handler.RequirePermission(handler.discoveryESNodesInfo, enum.PermissionAgentInstanceRead))
	api.HandleAPIMethod(api.POST, "/instance/:instance_id/node/_discovery", handler.RequirePermission(handler.discoveryESNodesInfo, enum.PermissionAgentInstanceRead))
	api.HandleAPIMethod(api.POST, "/instance/:instance_id/node/_enroll", handler.RequirePermission(handler.enrollESNode, enum.PermissionAgentInstanceWrite))
	api.HandleAPIMethod(api.POST, "/instance/:instance_id/node/_revoke", handler.RequirePermission(handler.revokeESNode, enum.PermissionAgentInstanceWrite))

	api.HandleAPIMethod(api.POST, "/instance/node/_auto_enroll", handler.RequirePermission(handler.autoEnrollESNode, enum.PermissionAgentInstanceWrite))

	//get elasticsearch node logs, direct fetch or via stored logs(TODO)
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/node/:node_id/logs/_list", handler.RequirePermission(handler.getLogFilesByNode, enum.PermissionAgentInstanceRead))
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/node/:node_id/logs/_read", handler.RequirePermission(handler.getLogFileContent, enum.PermissionAgentInstanceRead))

	server.RegisterConfigProvider(remoteConfigProvider)
	server.RegisterConfigProvider(dynamicAgentConfigProvider)
}
