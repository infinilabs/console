package api

import (
	"infini.sh/console/config"
	m "infini.sh/framework/core/security/rbac/middleware"
	"infini.sh/console/plugin/api/alerting"
	"infini.sh/console/plugin/api/index_management"
	"infini.sh/framework/core/api"
	"path"
)

func Init(cfg *config.AppConfig) {

	handler := index_management.APIHandler{
		Config: cfg,
	}
	var pathPrefix = "/_search-center/"
	var esPrefix = "/elasticsearch/:id/"
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "elasticsearch/overview"), handler.ElasticsearchOverviewAction)
	//api.HandleAPIMethod(api.POST, "/api/get_indices",index_management.API1)

	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "dict/_search"), handler.GetDictListAction)
	api.HandleAPIMethod(api.POST, path.Join(pathPrefix, "dict/*id"), handler.CreateDictItemAction)
	//api.HandleAPIMethod(api.GET, "/api/dict/:id",handler.GetDictItemAction)
	api.HandleAPIMethod(api.DELETE, path.Join(pathPrefix, "dict/:id"), handler.DeleteDictItemAction)
	api.HandleAPIMethod(api.PUT, path.Join(pathPrefix, "dict/:id"), handler.UpdateDictItemAction)

	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "doc/:index/_search"), m.IndexRequired(handler.HandleSearchDocumentAction, "doc.search"))
	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "doc/:index"), m.IndexRequired(handler.HandleAddDocumentAction, "doc.create"))
	api.HandleAPIMethod(api.PUT, path.Join(esPrefix, "doc/:index/:docId"), m.IndexRequired(handler.HandleUpdateDocumentAction, "doc.update"))
	api.HandleAPIMethod(api.DELETE, path.Join(esPrefix, "doc/:index/:docId"), m.IndexRequired(handler.HandleDeleteDocumentAction, "doc.delete"))
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "doc/_validate"), handler.ValidateDocIDAction)

	api.HandleAPIMethod(api.POST, path.Join(pathPrefix, "rebuild/*id"), handler.HandleReindexAction)
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "rebuild/_search"), handler.HandleGetRebuildListAction)
	api.HandleAPIMethod(api.DELETE, path.Join(pathPrefix, "rebuild/:id"), handler.HandleDeleteRebuildAction)

	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "_cat/indices"), m.ClusterRequired(handler.HandleGetIndicesAction, "cat.indices"))
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index/_mappings"), m.IndexRequired(handler.HandleGetMappingsAction, "indices.get_mapping"))
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index/_settings"), m.IndexRequired(handler.HandleGetSettingsAction, "indices.get_settings"))
	api.HandleAPIMethod(api.PUT, path.Join(esPrefix, "index/:index/_settings"), m.IndexRequired(handler.HandleUpdateSettingsAction, "indices.put_mapping"))
	api.HandleAPIMethod(api.DELETE, path.Join(esPrefix, "index/:index"), m.IndexRequired(handler.HandleDeleteIndexAction, "indices.delete"))
	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "index/:index"), m.IndexRequired(handler.HandleCreateIndexAction, "indices.create"))

	api.HandleAPIMethod(api.POST, path.Join(pathPrefix, "elasticsearch/command"), handler.HandleAddCommonCommandAction)
	api.HandleAPIMethod(api.PUT, path.Join(pathPrefix, "elasticsearch/command/:cid"), handler.HandleSaveCommonCommandAction)
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "elasticsearch/command"), handler.HandleQueryCommonCommandAction)
	api.HandleAPIMethod(api.DELETE, path.Join(pathPrefix, "elasticsearch/command/:cid"), handler.HandleDeleteCommonCommandAction)
	//task.RegisterScheduleTask(task.ScheduleTask{
	//	Description: "sync reindex task result",
	//	Task: func() {
	//		err := index_management.SyncRebuildResult(cfg.Elasticsearch)
	//		if err != nil {
	//			log.Error(err)
	//		}
	//	},
	//})
	alertAPI := alerting.AlertAPI{
		Config: cfg,
	}
	alertAPI.Init()

}
