/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac/enum"
)

func Init() {
	handler := APIHandler{}
	api.HandleAPIMethod(api.POST, "/host/_enroll", handler.enrollHost)
	api.HandleAPIMethod(api.GET, "/host/:host_id/agent/info", handler.GetHostAgentInfo)
	api.HandleAPIMethod(api.GET, "/host/:host_id/processes", handler.GetHostElasticProcess)
	api.HandleAPIMethod(api.DELETE, "/host/:host_id", handler.deleteHost)

	//bind agent with nodes
	api.HandleAPIMethod(api.GET, "/instance/:instance_id/node/_discovery", handler.RequirePermission(handler.getESNodesInfo, enum.PermissionAgentInstanceRead))
	api.HandleAPIMethod(api.POST, "/instance/:instance_id/node/_enroll", handler.RequirePermission(handler.enrollESNode, enum.PermissionAgentInstanceWrite))
	api.HandleAPIMethod(api.POST, "/instance/:instance_id/node/_revoke", handler.RequirePermission(handler.revokeESNode, enum.PermissionAgentInstanceWrite))

	api.HandleAPIMethod(api.POST, "/auto_associate", handler.RequirePermission(handler.autoAssociateESNode, enum.PermissionAgentInstanceWrite))

	//api.HandleAPIMethod(api.POST, "/instance/:instance_id/node/_auth", handler.RequirePermission(handler.authESNode, enum.PermissionAgentInstanceWrite))
	//api.HandleAPIMethod(api.DELETE, "/instance/:instance_id/_nodes", handler.RequirePermission(handler.deleteESNode, enum.PermissionAgentInstanceWrite))

	//get elasticsearch node logs, direct fetch or via stored logs(TODO)
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/node/:node_id/logs/_list", handler.RequirePermission(handler.getLogFilesByNode, enum.PermissionAgentInstanceRead))
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/node/:node_id/logs/_read", handler.RequirePermission(handler.getLogFileContent, enum.PermissionAgentInstanceRead))

	//api.HandleAPIMethod(api.POST, "/agent/install_command", handler.RequireLogin(handler.generateInstallCommand))
	//api.HandleAPIMethod(api.GET, "/agent/install.sh", handler.getInstallScript)
}
