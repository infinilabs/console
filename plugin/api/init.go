package api

import (
	"infini.sh/console/plugin/api/email"
	"infini.sh/console/plugin/api/license"
	"path"

	"infini.sh/console/config"
	"infini.sh/console/plugin/api/alerting"
	"infini.sh/console/plugin/api/gateway"
	"infini.sh/console/plugin/api/index_management"
	"infini.sh/console/plugin/api/insight"
	"infini.sh/console/plugin/api/layout"
	"infini.sh/console/plugin/api/notification"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac/enum"
)

func Init(cfg *config.AppConfig) {

	handler := index_management.APIHandler{
		Config: cfg,
	}
	var pathPrefix = "/_search-center/"
	var esPrefix = "/elasticsearch/:id/"
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "elasticsearch/overview"), handler.RequirePermission(handler.ElasticsearchOverviewAction, enum.PermissionElasticsearchMetricRead))
	//api.HandleAPIMethod(api.POST, "/api/get_indices",index_management.API1)

	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "dict/_search"), handler.GetDictListAction)
	api.HandleAPIMethod(api.POST, path.Join(pathPrefix, "dict/*id"), handler.CreateDictItemAction)
	//api.HandleAPIMethod(api.GET, "/api/dict/:id",handler.GetDictItemAction)
	api.HandleAPIMethod(api.DELETE, path.Join(pathPrefix, "dict/:id"), handler.DeleteDictItemAction)
	api.HandleAPIMethod(api.PUT, path.Join(pathPrefix, "dict/:id"), handler.UpdateDictItemAction)

	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "doc/:index/_search"), handler.RequireLogin(handler.HandleSearchDocumentAction))
	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "doc/:index"), handler.IndexRequired(handler.HandleAddDocumentAction, "doc.create"))
	api.HandleAPIMethod(api.PUT, path.Join(esPrefix, "doc/:index/:docId"), handler.IndexRequired(handler.HandleUpdateDocumentAction, "doc.update"))
	api.HandleAPIMethod(api.DELETE, path.Join(esPrefix, "doc/:index/:docId"), handler.IndexRequired(handler.HandleDeleteDocumentAction, "doc.delete"))
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "doc/_validate"), handler.ValidateDocIDAction)

	api.HandleAPIMethod(api.POST, path.Join(pathPrefix, "rebuild/*id"), handler.HandleReindexAction)
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "rebuild/_search"), handler.HandleGetRebuildListAction)
	api.HandleAPIMethod(api.DELETE, path.Join(pathPrefix, "rebuild/:id"), handler.HandleDeleteRebuildAction)

	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "_cat/indices"), handler.RequireLogin(handler.HandleCatIndicesAction))
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index/_mappings"), handler.IndexRequired(handler.HandleGetMappingsAction, "indices.get_mapping"))
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index/_settings"), handler.IndexRequired(handler.HandleGetSettingsAction, "indices.get_settings"))
	api.HandleAPIMethod(api.PUT, path.Join(esPrefix, "index/:index/_settings"), handler.IndexRequired(handler.HandleUpdateSettingsAction, "indices.put_settings"))
	api.HandleAPIMethod(api.DELETE, path.Join(esPrefix, "index/:index"), handler.IndexRequired(handler.HandleDeleteIndexAction, "indices.delete"))
	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "index/:index"), handler.IndexRequired(handler.HandleCreateIndexAction, "indices.create"))
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index"), handler.IndexRequired(handler.HandleGetIndexAction, "indices.get"))

	api.HandleAPIMethod(api.POST, path.Join(pathPrefix, "elasticsearch/command"), handler.RequirePermission(handler.HandleAddCommonCommandAction, enum.PermissionCommandWrite))
	api.HandleAPIMethod(api.PUT, path.Join(pathPrefix, "elasticsearch/command/:cid"), handler.RequirePermission(handler.HandleSaveCommonCommandAction, enum.PermissionCommandWrite))
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "elasticsearch/command"), handler.RequirePermission(handler.HandleQueryCommonCommandAction, enum.PermissionCommandRead))
	api.HandleAPIMethod(api.DELETE, path.Join(pathPrefix, "elasticsearch/command/:cid"), handler.RequirePermission(handler.HandleDeleteCommonCommandAction, enum.PermissionCommandWrite))
	api.HandleAPIMethod(api.GET, "/elasticsearch/overview/status", handler.RequireLogin(handler.ElasticsearchStatusSummaryAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/overview/treemap", handler.RequireClusterPermission(handler.RequirePermission(handler.ClusterOverTreeMap, enum.PermissionElasticsearchMetricRead)))
	//task.RegisterScheduleTask(task.ScheduleTask{
	//	Description: "sync reindex task result",
	//	Task: func() {
	//		err := index_management.SyncRebuildResult(cfg.Elasticsearch)
	//		if err != nil {
	//			log.Error(err)
	//		}
	//	},
	//})

	alertAPI := alerting.AlertAPI{}

	alertAPI.Init()

	gateway.InitAPI()
	insight.InitAPI()
	layout.InitAPI()
	notification.InitAPI()

	license.InitAPI()
	email.InitAPI()
}
