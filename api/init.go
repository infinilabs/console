package api

import (
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/ui"
	"infini.sh/search-center/api/index_management"
	"infini.sh/search-center/api/system"
	"infini.sh/search-center/config"
	log "github.com/cihub/seelog"
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

	ui.HandleUIMethod(api.POST, pathPrefix+"rebuild/*id", handler.HandleReindexAction)
	ui.HandleUIMethod(api.GET, pathPrefix+"rebuild/_search", handler.HandleGetRebuildListAction)
	ui.HandleUIMethod(api.DELETE, pathPrefix+"rebuild/:id", handler.HandleDeleteRebuildAction)
	ui.HandleUIMethod(api.GET, pathPrefix+"_cat/indices", handler.HandleGetIndicesAction)
	ui.HandleUIMethod(api.GET, pathPrefix+"index/:index/_mappings", handler.HandleGetMappingsAction)
	ui.HandleUIMethod(api.GET, pathPrefix+"index/:index/_settings", handler.HandleGetSettingsAction)
	ui.HandleUIMethod(api.PUT, pathPrefix+"index/:index/_settings", handler.HandleUpdateSettingsAction)
	ui.HandleUIMethod(api.DELETE, pathPrefix+"index/:index", handler.HandleDeleteIndexAction)
	ui.HandleUIMethod(api.POST, pathPrefix+"index/:index", handler.HandleCreateIndexAction)

	ui.HandleUIMethod(api.GET, pathPrefix+"cluster/:cluster/version", handler.GetClusterVersion)

	task.RegisterScheduleTask(task.ScheduleTask{
		Description: "sync reindex task result",
		Task: func() {
			err := index_management.SyncRebuildResult(cfg.Elasticsearch)
			if err != nil {
				log.Error(err)
			}
		},
	})

	shdl := system.APIHandler{
		Config: cfg,
	}

	ui.HandleUIMethod(api.POST, pathPrefix + "system/cluster", shdl.HandleCreateClusterAction)
	ui.HandleUIMethod(api.PUT, pathPrefix + "system/cluster/:id", shdl.HandleUpdateClusterAction)
	ui.HandleUIMethod(api.DELETE, pathPrefix + "system/cluster/:id", shdl.HandleDeleteClusterAction)
	ui.HandleUIMethod(api.GET, pathPrefix + "system/cluster/_search", shdl.HandleSearchClusterAction)
	ui.HandleUIMethod(api.POST, pathPrefix + "system/cluster/_search", shdl.HandleSearchClusterAction)
}
