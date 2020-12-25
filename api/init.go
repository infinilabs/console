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
	//ui.HandleUIMethod(api.POST, "/api/get_indices",index_management.API1)
	ui.HandleUIMethod(api.GET, "/api/dict/_search", handler.GetDictListAction)
	ui.HandleUIMethod(api.POST, "/api/dict/_create", handler.CreateDictItemAction)
	//ui.HandleUIMethod(api.GET, "/api/dict/:id",handler.GetDictItemAction)
	ui.HandleUIMethod(api.DELETE, "/api/dict/:id", handler.DeleteDictItemAction)
	//ui.HandleUIMethod(api.DELETE, "/api/dict/", handler.DeleteDictItemAction2)
	ui.HandleUIMethod(api.POST, "/api/dict/_update", handler.UpdateDictItemAction)
	ui.HandleUIMethod(api.POST, "/api/doc/:index", handler.HandleDocumentAction)
}
