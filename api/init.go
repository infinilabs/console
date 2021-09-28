package api

import (
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/ui"
	"infini.sh/search-center/api/index_management"
	"infini.sh/search-center/config"
	"infini.sh/search-center/service/alerting"
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

	//new api
	ui.HandleUIMethod(api.GET, "/elasticsearch/:id/alerting/overview", alerting.GetAlertOverview)
	ui.HandleUIMethod(api.POST, "/elasticsearch/:id/alerting/destinations/email_accounts", alerting.CreateEmailAccount)
	ui.HandleUIMethod(api.PUT, "/elasticsearch/:id/alerting/email_accounts/:emailAccountId", alerting.UpdateEmailAccount)
	ui.HandleUIMethod(api.DELETE, "/elasticsearch/:id/alerting/email_accounts/:emailAccountId", alerting.DeleteEmailAccount)
	ui.HandleUIMethod(api.GET, "/elasticsearch/:id/alerting/destinations/email_accounts", alerting.GetEmailAccounts)
	ui.HandleUIMethod(api.GET, "/elasticsearch/:id/alerting/email_accounts/:emailAccountId", alerting.GetEmailAccount)
	ui.HandleUIMethod(api.POST, "/elasticsearch/:id/alerting/destinations/email_groups", alerting.CreateEmailGroup)
	ui.HandleUIMethod(api.GET, "/elasticsearch/:id/alerting/destinations/email_groups", alerting.GetEmailGroups)
	ui.HandleUIMethod(api.DELETE, "/elasticsearch/:id/alerting/email_groups/:emailGroupId", alerting.DeleteEmailGroup)
	ui.HandleUIMethod(api.PUT, "/elasticsearch/:id/alerting/email_groups/:emailGroupId", alerting.UpdateEmailGroup)
	ui.HandleUIMethod(api.GET, "/elasticsearch/:id/alerting/email_groups/:emailGroupId", alerting.GetEmailGroup)
	ui.HandleUIMethod(api.GET, "/elasticsearch/:id/alerting/destinations", alerting.GetDestinations)
	ui.HandleUIMethod(api.POST, "/elasticsearch/:id/alerting/destinations", alerting.CreateDestination)
	ui.HandleUIMethod(api.PUT, "/elasticsearch/:id/alerting/destinations/:destinationId", alerting.UpdateDestination)
	ui.HandleUIMethod(api.DELETE, "/elasticsearch/:id/alerting/destinations/:destinationId", alerting.DeleteDestination)
	ui.HandleUIMethod(api.GET, "/elasticsearch/:id/alerting/monitors/:monitorID", alerting.GetMonitor)
	ui.HandleUIMethod(api.PUT, "/elasticsearch/:id/alerting/monitors/:monitorID", alerting.UpdateMonitor)
	ui.HandleUIMethod(api.GET, "/elasticsearch/:id/alerting/monitors", alerting.GetMonitors)
	ui.HandleUIMethod(api.POST, "/elasticsearch/:id/alerting/monitors", alerting.CreateMonitor)
	ui.HandleUIMethod(api.POST, "/elasticsearch/:id/alerting/monitors/_execute", alerting.ExecuteMonitor)
	ui.HandleUIMethod(api.DELETE, "/elasticsearch/:id/alerting/monitors/:monitorID", alerting.DeleteMonitor)

	ui.HandleUIMethod(api.GET, "/elasticsearch/:id/alerting/_settings", alerting.GetSettings)
	ui.HandleUIMethod(api.POST, "/elasticsearch/:id/alerting/_indices", alerting.GetIndices)
	ui.HandleUIMethod(api.POST, "/elasticsearch/:id/alerting/_aliases", alerting.GetAliases)
	ui.HandleUIMethod(api.POST, "/elasticsearch/:id/alerting/_mappings", alerting.GetMappings)
	ui.HandleUIMethod(api.POST, "/elasticsearch/:id/alerting/monitors/_search", alerting.Search)
	ui.HandleUIMethod(api.GET, "/elasticsearch/:id/alerting/alerts", alerting.GetAlerts)
	ui.HandleUIMethod(api.POST, "/elasticsearch/:id/alerting/_monitors/:monitorID/_acknowledge/alerts", alerting.AcknowledgeAlerts)

	task.RegisterScheduleTask(task.ScheduleTask{
		Description: "sync reindex task result",
		Task: func() {
			err := index_management.SyncRebuildResult(cfg.Elasticsearch)
			if err != nil {
				log.Error(err)
			}
		},
	})

}
