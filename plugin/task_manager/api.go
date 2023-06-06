/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package task_manager

import (
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac/enum"
)

func InitAPI() {
	handler := APIHandler{}
	api.HandleAPIMethod(api.GET, "/migration/data/_search", handler.RequirePermission(handler.searchTask("cluster_migration"), enum.PermissionMigrationTaskRead))
	api.HandleAPIMethod(api.POST, "/migration/data", handler.RequirePermission(handler.createDataMigrationTask, enum.PermissionMigrationTaskWrite))
	api.HandleAPIMethod(api.DELETE, "/migration/data/:task_id", handler.RequirePermission(handler.deleteTask, enum.PermissionMigrationTaskWrite))
	api.HandleAPIMethod(api.POST, "/migration/data/:task_id/_start", handler.RequirePermission(handler.startTask, enum.PermissionMigrationTaskWrite))
	api.HandleAPIMethod(api.POST, "/migration/data/:task_id/_stop", handler.RequirePermission(handler.stopTask, enum.PermissionMigrationTaskWrite))
	api.HandleAPIMethod(api.POST, "/migration/data/:task_id/_pause", handler.RequirePermission(handler.pauseTask, enum.PermissionMigrationTaskWrite))
	api.HandleAPIMethod(api.POST, "/migration/data/:task_id/_resume", handler.RequirePermission(handler.resumeTask, enum.PermissionMigrationTaskWrite))
	api.HandleAPIMethod(api.GET, "/migration/data/:task_id/info", handler.RequirePermission(handler.getDataMigrationTaskInfo, enum.PermissionMigrationTaskRead))
	api.HandleAPIMethod(api.GET, "/migration/data/:task_id/info/:index", handler.RequirePermission(handler.getDataMigrationTaskOfIndex, enum.PermissionMigrationTaskRead))

	api.HandleAPIMethod(api.GET, "/comparison/data/_search", handler.RequirePermission(handler.searchTask("cluster_comparison"), enum.PermissionComparisonTaskRead))
	api.HandleAPIMethod(api.POST, "/comparison/data", handler.RequirePermission(handler.createDataComparisonTask, enum.PermissionComparisonTaskWrite))
	api.HandleAPIMethod(api.DELETE, "/comparison/data/:task_id", handler.RequirePermission(handler.deleteTask, enum.PermissionComparisonTaskWrite))
	api.HandleAPIMethod(api.GET, "/comparison/data/:task_id/info", handler.RequirePermission(handler.getDataComparisonTaskInfo, enum.PermissionComparisonTaskRead))
	api.HandleAPIMethod(api.GET, "/comparison/data/:task_id/info/:index", handler.RequirePermission(handler.getDataComparisonTaskOfIndex, enum.PermissionComparisonTaskRead))
	api.HandleAPIMethod(api.POST, "/comparison/data/:task_id/_start", handler.RequirePermission(handler.startTask, enum.PermissionComparisonTaskWrite))
	api.HandleAPIMethod(api.POST, "/comparison/data/:task_id/_stop", handler.RequirePermission(handler.stopTask, enum.PermissionComparisonTaskWrite))
	api.HandleAPIMethod(api.POST, "/comparison/data/:task_id/_pause", handler.RequirePermission(handler.pauseTask, enum.PermissionComparisonTaskWrite))
	api.HandleAPIMethod(api.POST, "/comparison/data/:task_id/_resume", handler.RequirePermission(handler.resumeTask, enum.PermissionComparisonTaskWrite))

	api.HandleAPIMethod(api.POST, "/migration/data/_validate", handler.RequireLogin(handler.validateDataMigration))
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_partition", handler.getIndexPartitionInfo)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_count", handler.countDocuments)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_refresh", handler.refreshIndex)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/index/:index/_init", handler.initIndex)

}

type APIHandler struct {
	api.Handler
}
