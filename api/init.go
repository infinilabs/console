package api

import (
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/ui"
	"infini.sh/search-center/api/index_management"
)

func Init()  {
	ui.HandleUIMethod(api.POST, "/api/get_indices",index_management.API1)
}