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
	api.HandleAPIMethod(api.POST, "/agent/instance", handler.createInstance)
	api.HandleAPIMethod(api.GET, "/agent/instance/_search", handler.RequirePermission(handler.searchInstance, enum.PermissionAgentInstanceRead))
	api.HandleAPIMethod(api.GET, "/agent/instance/:instance_id", handler.getInstance)
	api.HandleAPIMethod(api.DELETE, "/agent/instance/:instance_id", handler.RequirePermission(handler.deleteInstance, enum.PermissionAgentInstanceWrite))
	api.HandleAPIMethod(api.POST, "/agent/instance/_stats", handler.RequirePermission(handler.getInstanceStats, enum.PermissionAgentInstanceRead))
	api.HandleAPIMethod(api.GET, "/agent/log/node/:node_id/files", handler.RequirePermission(handler.getLogFilesByNode, enum.PermissionAgentInstanceRead))
	api.HandleAPIMethod(api.POST, "/agent/log/node/:node_id/_scroll", handler.RequirePermission(handler.getLogFileContent, enum.PermissionAgentInstanceRead))
	api.HandleAPIMethod(api.GET, "/agent/instance/:instance_id/_nodes", handler.RequirePermission(handler.getESNodesInfo, enum.PermissionAgentInstanceRead))
	api.HandleAPIMethod(api.POST, "/agent/instance/:instance_id/_nodes/_refresh", handler.RequirePermission(handler.refreshESNodesInfo, enum.PermissionAgentInstanceWrite))
	api.HandleAPIMethod(api.POST, "/agent/instance/:instance_id/node/_auth", handler.RequirePermission(handler.authESNode, enum.PermissionAgentInstanceWrite))
	api.HandleAPIMethod(api.DELETE, "/agent/instance/:instance_id/_nodes", handler.RequirePermission(handler.deleteESNode, enum.PermissionAgentInstanceWrite))
	api.HandleAPIMethod(api.POST, "/agent/instance/:instance_id/node/_associate", handler.RequirePermission(handler.associateESNode, enum.PermissionAgentInstanceWrite))

	api.HandleAPIMethod(api.POST, "/host/_enroll", handler.enrollHost)
	api.HandleAPIMethod(api.GET, "/host/:host_id/agent/info",handler.GetHostAgentInfo)
	api.HandleAPIMethod(api.GET, "/host/:host_id/processes",handler.GetHostElasticProcess)
}
