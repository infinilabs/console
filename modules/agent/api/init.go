// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

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
