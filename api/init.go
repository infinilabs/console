package api

import (
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/ui"
	"infini.sh/search-center/api/index_management"
)

func Init()  {
	handler:=index_management.APIHandler{}
	//ui.HandleUIMethod(api.POST, "/api/get_indices",index_management.API1)
	ui.HandleUIMethod(api.POST, "/api/dict/_create",handler.CreateDictItemAction)
	//ui.HandleUIMethod(api.GET, "/api/dict/:id",handler.GetDictItemAction)
	ui.HandleUIMethod(api.DELETE, "/api/dict/:id",handler.DeleteDictItemAction)
	ui.HandleUIMethod(api.DELETE, "/api/dict/",handler.DeleteDictItemAction2)
}
