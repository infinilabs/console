package api

import (
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/ui"
	"infini.sh/search-center/api/index_management"
	"infini.sh/search-center/api/cluster"
	"infini.sh/search-center/config"
	"path"
)

func Init(cfg *config.AppConfig) {
	handler := index_management.APIHandler{
		Config: cfg,
	}
	var pathPrefix = "/_search-center/"
	//ui.HandleUIMethod(api.POST, "/api/get_indices",index_management.API1)
	ui.HandleUIMethod(api.GET, path.Join(pathPrefix, "dict/_search"), handler.GetDictListAction)
	ui.HandleUIMethod(api.POST, path.Join(pathPrefix, "dict/*id"), handler.CreateDictItemAction)
	//ui.HandleUIMethod(api.GET, "/api/dict/:id",handler.GetDictItemAction)
	ui.HandleUIMethod(api.DELETE, path.Join(pathPrefix, "dict/:id"), handler.DeleteDictItemAction)
	ui.HandleUIMethod(api.PUT, path.Join(pathPrefix, "dict/:id"), handler.UpdateDictItemAction)
	ui.HandleUIMethod(api.POST, path.Join(pathPrefix, "doc/:index/_search"), handler.HandleSearchDocumentAction)
	ui.HandleUIMethod(api.POST, path.Join(pathPrefix, "doc/:index/_create"), handler.HandleAddDocumentAction)
	ui.HandleUIMethod(api.PUT, path.Join(pathPrefix, "doc/:index/:id"), handler.HandleUpdateDocumentAction)
	ui.HandleUIMethod(api.DELETE, path.Join(pathPrefix, "doc/:index/:id"), handler.HandleDeleteDocumentAction)

	ui.HandleUIMethod(api.POST, path.Join(pathPrefix, "rebuild/*id"), handler.HandleReindexAction)
	ui.HandleUIMethod(api.GET, path.Join(pathPrefix, "rebuild/_search"), handler.HandleGetRebuildListAction)
	ui.HandleUIMethod(api.DELETE, path.Join(pathPrefix, "rebuild/:id"), handler.HandleDeleteRebuildAction)
	ui.HandleUIMethod(api.GET, path.Join(pathPrefix, "_cat/indices"), handler.HandleGetIndicesAction)
	ui.HandleUIMethod(api.GET, path.Join(pathPrefix, "index/:index/_mappings"), handler.HandleGetMappingsAction)
	ui.HandleUIMethod(api.GET, path.Join(pathPrefix, "index/:index/_settings"), handler.HandleGetSettingsAction)
	ui.HandleUIMethod(api.PUT, path.Join(pathPrefix, "index/:index/_settings"), handler.HandleUpdateSettingsAction)
	ui.HandleUIMethod(api.DELETE, path.Join(pathPrefix, "index/:index"), handler.HandleDeleteIndexAction)
	ui.HandleUIMethod(api.POST, path.Join(pathPrefix, "index/:index"), handler.HandleCreateIndexAction)


	task.RegisterScheduleTask(task.ScheduleTask{
		Description: "sync reindex task result",
		Task: func() {
			err := index_management.SyncRebuildResult(cfg.Elasticsearch)
			if err != nil {
				log.Error(err)
			}
		},
	})

	shdl := cluster.APIHandler{
		Config: cfg,
	}
	ui.HandleUIMethod(api.GET, path.Join(pathPrefix, "/cluster/:id/version"), shdl.GetClusterVersion)
	ui.HandleUIMethod(api.GET, path.Join(pathPrefix, "/cluster/:id/metrics"), shdl.HandleClusterMetricsAction)
	ui.HandleUIMethod(api.POST, path.Join(pathPrefix, "/cluster"), shdl.HandleCreateClusterAction)
	ui.HandleUIMethod(api.PUT, path.Join(pathPrefix, "/cluster/:id"), shdl.HandleUpdateClusterAction)
	ui.HandleUIMethod(api.DELETE, path.Join(pathPrefix, "/cluster/:id"), shdl.HandleDeleteClusterAction)
	ui.HandleUIMethod(api.GET, path.Join(pathPrefix, "/cluster/_search"), shdl.HandleSearchClusterAction)
	ui.HandleUIMethod(api.POST, path.Join(pathPrefix, "/cluster/_search"), shdl.HandleSearchClusterAction)
}
