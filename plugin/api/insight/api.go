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
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package insight

import (
	"infini.sh/console/core"
	"infini.sh/console/core/security/enum"
	"infini.sh/framework/core/api"
)

type InsightAPI struct {
	core.Handler
}

func InitAPI() {
	insight := InsightAPI{}
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/visualization/metadata", insight.RequireLogin(insight.HandleGetMetadata))
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/visualization/data", insight.RequireLogin(insight.HandleGetMetricData))
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/visualization/preview", insight.RequireLogin(insight.HandleGetPreview))

	api.HandleAPIMethod(api.GET, "/insight/visualization/:visualization_id", insight.RequirePermission(insight.getVisualization, enum.PermissionLayoutRead))
	api.HandleAPIMethod(api.POST, "/insight/visualization", insight.RequirePermission(insight.createVisualization, enum.PermissionLayoutWrite))
	api.HandleAPIMethod(api.PUT, "/insight/visualization/:visualization_id", insight.RequirePermission(insight.updateVisualization, enum.PermissionLayoutWrite))
	api.HandleAPIMethod(api.DELETE, "/insight/visualization/:visualization_id", insight.RequirePermission(insight.deleteVisualization, enum.PermissionLayoutWrite))
	api.HandleAPIMethod(api.GET, "/insight/visualization/_search", insight.RequirePermission(insight.searchVisualization, enum.PermissionLayoutRead))

	api.HandleAPIMethod(api.GET, "/insight/dashboard/:dashboard_id", insight.RequirePermission(insight.getDashboard, enum.DashboardReadPermission...))
	api.HandleAPIMethod(api.POST, "/insight/dashboard", insight.RequirePermission(insight.createDashboard, enum.DashboardAllPermission...))
	api.HandleAPIMethod(api.PUT, "/insight/dashboard/:dashboard_id", insight.RequirePermission(insight.updateDashboard, enum.DashboardAllPermission...))
	api.HandleAPIMethod(api.DELETE, "/insight/dashboard/:dashboard_id", insight.RequirePermission(insight.deleteDashboard, enum.DashboardAllPermission...))
	api.HandleAPIMethod(api.GET, "/insight/dashboard/_search", insight.RequirePermission(insight.searchDashboard, enum.DashboardReadPermission...))
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/map_label/_render", insight.RequireClusterPermission(insight.renderMapLabelTemplate, enum.PermissionElasticsearchClusterRead))
	api.HandleAPIMethod(api.GET, "/insight/widget/:widget_id", insight.RequirePermission(insight.getWidget, enum.PermissionLayoutRead))
	api.HandleAPIMethod(api.POST, "/insight/widget", insight.RequirePermission(insight.createWidget, enum.PermissionLayoutWrite))
}
