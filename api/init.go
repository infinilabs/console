package api

import (
	"infini.sh/framework/core/api"
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

	api.HandleAPIMethod(api.GET,  path.Join(esPrefix, "_cat/indices"), handler.HandleGetIndicesAction)
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index/_mappings"), handler.HandleGetMappingsAction)
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index/_settings"), handler.HandleGetSettingsAction)
	api.HandleAPIMethod(api.PUT, path.Join(esPrefix, "index/:index/_settings"), handler.HandleUpdateSettingsAction)
	api.HandleAPIMethod(api.DELETE, path.Join(esPrefix, "index/:index"), handler.HandleDeleteIndexAction)
	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "index/:index"), handler.HandleCreateIndexAction)

	api.HandleAPIMethod(api.POST,  path.Join(pathPrefix, "elasticsearch/command"), handler.HandleAddCommonCommandAction)
	api.HandleAPIMethod(api.PUT,  path.Join(pathPrefix, "elasticsearch/command/:cid"), handler.HandleSaveCommonCommandAction)
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "elasticsearch/command"), handler.HandleQueryCommonCommandAction)
	api.HandleAPIMethod(api.DELETE, path.Join(pathPrefix, "elasticsearch/command/:cid"), handler.HandleDeleteCommonCommandAction)

	//new api
	api.HandleAPIMethod(api.GET,  path.Join(pathPrefix, "alerting/overview"), alerting.GetAlertOverview)
	api.HandleAPIMethod(api.GET,  path.Join(pathPrefix, "alerting/overview/alerts"), alerting.GetAlerts)
	api.HandleAPIMethod(api.POST,  path.Join(pathPrefix,"alerting/destinations/email_accounts"), alerting.CreateEmailAccount)
	api.HandleAPIMethod(api.PUT,  path.Join(pathPrefix, "alerting/email_accounts/:emailAccountId"), alerting.UpdateEmailAccount)
	api.HandleAPIMethod(api.DELETE,  path.Join(pathPrefix,"alerting/email_accounts/:emailAccountId"), alerting.DeleteEmailAccount)
	api.HandleAPIMethod(api.GET,  path.Join(pathPrefix,"alerting/destinations/email_accounts"), alerting.GetEmailAccounts)
	api.HandleAPIMethod(api.GET,  path.Join(pathPrefix,"alerting/email_accounts/:emailAccountId"), alerting.GetEmailAccount)
	api.HandleAPIMethod(api.POST,  path.Join(pathPrefix,"alerting/destinations/email_groups"), alerting.CreateEmailGroup)
	api.HandleAPIMethod(api.GET,  path.Join(pathPrefix,"alerting/destinations/email_groups"), alerting.GetEmailGroups)
	api.HandleAPIMethod(api.DELETE,  path.Join(pathPrefix,"alerting/email_groups/:emailGroupId"), alerting.DeleteEmailGroup)
	api.HandleAPIMethod(api.PUT,  path.Join(pathPrefix,"alerting/email_groups/:emailGroupId"), alerting.UpdateEmailGroup)
	api.HandleAPIMethod(api.GET,  path.Join(pathPrefix,"alerting/email_groups/:emailGroupId"), alerting.GetEmailGroup)
	api.HandleAPIMethod(api.GET,  path.Join(pathPrefix, "alerting/destinations"), alerting.GetDestinations)
	api.HandleAPIMethod(api.POST,  path.Join(pathPrefix,"alerting/destinations"), alerting.CreateDestination)
	api.HandleAPIMethod(api.PUT,  path.Join(pathPrefix,"alerting/destinations/:destinationId"), alerting.UpdateDestination)
	api.HandleAPIMethod(api.DELETE,  path.Join(pathPrefix, "alerting/destinations/:destinationId"), alerting.DeleteDestination)
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/alerting/monitors/:monitorID", alerting.GetMonitor)
	api.HandleAPIMethod(api.PUT, "/elasticsearch/:id/alerting/monitors/:monitorID", alerting.UpdateMonitor)
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/alerting/monitors", alerting.GetMonitors)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/alerting/monitors", alerting.CreateMonitor)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/alerting/monitors/_execute", alerting.ExecuteMonitor)
	api.HandleAPIMethod(api.DELETE, "/elasticsearch/:id/alerting/monitors/:monitorID", alerting.DeleteMonitor)

	api.HandleAPIMethod(api.GET,  path.Join(pathPrefix,"alerting/_settings"), alerting.GetSettings)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/alerting/_indices", alerting.GetIndices)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/alerting/_aliases", alerting.GetAliases)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/alerting/_mappings", alerting.GetMappings)
	api.HandleAPIMethod(api.POST, path.Join(pathPrefix, "alerting/_search"), alerting.Search)
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/alerting/alerts", alerting.GetAlerts)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/alerting/_monitors/:monitorID/_acknowledge/alerts", alerting.AcknowledgeAlerts)



	api.HandleAPIMethod(api.POST, "/api/login/account", handler.AccountLogin)
	api.HandleAPIMethod(api.GET, "/api/currentUser", handler.CurrentUser)


	api.HandleAPIMethod(api.POST, "/account/login", handler.AccountLogin)
	api.HandleAPIMethod(api.GET, "/account/current_user", handler.CurrentUser)




	//task.RegisterScheduleTask(task.ScheduleTask{
	//	Description: "sync reindex task result",
	//	Task: func() {
	//		err := index_management.SyncRebuildResult(cfg.Elasticsearch)
	//		if err != nil {
	//			log.Error(err)
	//		}
	//	},
	//})

}
