package api

import (
	"infini.sh/console/config"
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
	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "doc/:index/_search"), handler.HandleSearchDocumentAction)
	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "doc/:index"), handler.HandleAddDocumentAction)
	api.HandleAPIMethod(api.PUT, path.Join(esPrefix, "doc/:index/:docId"), handler.HandleUpdateDocumentAction)
	api.HandleAPIMethod(api.DELETE, path.Join(esPrefix, "doc/:index/:docId"), handler.HandleDeleteDocumentAction)
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "doc/_validate"), handler.ValidateDocIDAction)

	api.HandleAPIMethod(api.POST, path.Join(pathPrefix, "rebuild/*id"), handler.HandleReindexAction)
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "rebuild/_search"), handler.HandleGetRebuildListAction)
	api.HandleAPIMethod(api.DELETE, path.Join(pathPrefix, "rebuild/:id"), handler.HandleDeleteRebuildAction)

	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "_cat/indices"), handler.HandleGetIndicesAction)
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index/_mappings"), handler.HandleGetMappingsAction)
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index/_settings"), handler.HandleGetSettingsAction)
	api.HandleAPIMethod(api.PUT, path.Join(esPrefix, "index/:index/_settings"), handler.HandleUpdateSettingsAction)
	api.HandleAPIMethod(api.DELETE, path.Join(esPrefix, "index/:index"), handler.HandleDeleteIndexAction)
	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "index/:index"), handler.HandleCreateIndexAction)

	api.HandleAPIMethod(api.POST, path.Join(pathPrefix, "elasticsearch/command"), handler.HandleAddCommonCommandAction)
	api.HandleAPIMethod(api.PUT, path.Join(pathPrefix, "elasticsearch/command/:cid"), handler.HandleSaveCommonCommandAction)
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "elasticsearch/command"), handler.HandleQueryCommonCommandAction)
	api.HandleAPIMethod(api.DELETE, path.Join(pathPrefix, "elasticsearch/command/:cid"), handler.HandleDeleteCommonCommandAction)
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "cluster/indices"), handler.ListIndex)
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
