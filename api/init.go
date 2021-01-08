package api

import (
	"log"

	"infini.sh/framework/core/api"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/ui"
	"infini.sh/search-center/api/index_management"
	"infini.sh/search-center/config"
)

func Init(cfg *config.AppConfig) {
	handler := index_management.APIHandler{
		Config: cfg,
	}
	var pathPrefix = "/_search-center/"
	//ui.HandleUIMethod(api.POST, "/api/get_indices",index_management.API1)
	ui.HandleUIMethod(api.GET, pathPrefix+"dict/_search", handler.GetDictListAction)
	ui.HandleUIMethod(api.POST, pathPrefix+"dict/*id", handler.CreateDictItemAction)
	//ui.HandleUIMethod(api.GET, "/api/dict/:id",handler.GetDictItemAction)
	ui.HandleUIMethod(api.DELETE, pathPrefix+"dict/:id", handler.DeleteDictItemAction)
	ui.HandleUIMethod(api.PUT, pathPrefix+"dict/:id", handler.UpdateDictItemAction)
	ui.HandleUIMethod(api.POST, pathPrefix+"doc/:index/_search", handler.HandleSearchDocumentAction)
	ui.HandleUIMethod(api.POST, pathPrefix+"doc/:index/_create", handler.HandleAddDocumentAction)
	ui.HandleUIMethod(api.PUT, pathPrefix+"doc/:index/:id", handler.HandleUpdateDocumentAction)
	ui.HandleUIMethod(api.DELETE, pathPrefix+"doc/:index/:id", handler.HandleDeleteDocumentAction)

	ui.HandleUIMethod(api.POST, pathPrefix+"rebuild/*id", handler.ReindexAction)
	ui.HandleUIMethod(api.GET, pathPrefix+"rebuild/_search", handler.HandleGetRebuildListAction)
	ui.HandleUIMethod(api.DELETE, pathPrefix+"rebuild/:id", handler.HandleDeleteRebuildAction)
	ui.HandleUIMethod(api.GET, pathPrefix+"_cat/indices", handler.HandleGetIndicesAction)
	ui.HandleUIMethod(api.GET, pathPrefix+"index/:index/_mappings", handler.HandleGetMappingsAction)

	task.RegisterScheduleTask(task.ScheduleTask{
		Description: "sync reindex task result to index infinireindex",
		Task: func() {
			err := index_management.SyncRebuildResult(cfg.Elasticsearch)
			if err != nil {
				log.Println(err)
			}
		},
	})
}
