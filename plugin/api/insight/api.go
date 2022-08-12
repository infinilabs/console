/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package insight

import "infini.sh/framework/core/api"

type InsightAPI struct {
	api.Handler
}

func init() {
	insight := InsightAPI{}
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/visualization/metadata", insight.HandleGetMetadata)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/visualization/data", insight.HandleGetMetricData)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/visualization/preview", insight.HandleGetPreview)

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

}
