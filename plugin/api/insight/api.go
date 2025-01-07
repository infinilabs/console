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

	api.HandleAPIMethod(api.GET, "/insight/visualization/:visualization_id", insight.getVisualization)
	api.HandleAPIMethod(api.POST, "/insight/visualization", insight.createVisualization)
	api.HandleAPIMethod(api.PUT, "/insight/visualization/:visualization_id", insight.updateVisualization)
	api.HandleAPIMethod(api.DELETE, "/insight/visualization/:visualization_id", insight.deleteVisualization)
	api.HandleAPIMethod(api.GET, "/insight/visualization/_search", insight.searchVisualization)

	api.HandleAPIMethod(api.GET, "/insight/dashboard/:dashboard_id", insight.getDashboard)
	api.HandleAPIMethod(api.POST, "/insight/dashboard", insight.createDashboard)
	api.HandleAPIMethod(api.PUT, "/insight/dashboard/:dashboard_id", insight.updateDashboard)
	api.HandleAPIMethod(api.DELETE, "/insight/dashboard/:dashboard_id", insight.deleteDashboard)
	api.HandleAPIMethod(api.GET, "/insight/dashboard/_search", insight.searchDashboard)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/map_label/_render", insight.renderMapLabelTemplate)
	api.HandleAPIMethod(api.GET, "/insight/widget/:widget_id", insight.getWidget)
	api.HandleAPIMethod(api.POST, "/insight/widget", insight.RequireLogin(insight.createWidget))
	api.HandleAPIMethod(api.POST, "/insight/metric", insight.createMetric)
	api.HandleAPIMethod(api.PUT, "/insight/metric/:metric_id", insight.updateMetric)
	api.HandleAPIMethod(api.DELETE, "/insight/metric/:metric_id", insight.deleteMetric)
}
