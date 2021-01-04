package api

import (
	"infini.sh/framework/core/api"
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
	ui.HandleUIMethod(api.POST, pathPrefix+"dict/_create", handler.CreateDictItemAction)
	//ui.HandleUIMethod(api.GET, "/api/dict/:id",handler.GetDictItemAction)
	ui.HandleUIMethod(api.DELETE, pathPrefix+"dict/:id", handler.DeleteDictItemAction)
	//ui.HandleUIMethod(api.DELETE, "/api/dict/", handler.DeleteDictItemAction2)
	ui.HandleUIMethod(api.POST, pathPrefix+"dict/_update", handler.UpdateDictItemAction)
	ui.HandleUIMethod(api.POST, pathPrefix+"doc/:index", handler.HandleDocumentAction)
	ui.HandleUIMethod(api.GET, pathPrefix+"indices/_cat", handler.HandleGetIndicesAction)

	ui.HandleUIMethod(api.POST, pathPrefix+"rebuild/_create", handler.ReindexAction)
	ui.HandleUIMethod(api.GET, pathPrefix+"rebuild/list", handler.HandleGetRebuildListAction)
	ui.HandleUIMethod(api.POST, pathPrefix+"rebuild/_delete", handler.HandleDeleteRebuildAction)
	ui.HandleUIMethod(api.GET, pathPrefix+"indices/_mappings/:index", handler.HandleGetMappingsAction)
}
