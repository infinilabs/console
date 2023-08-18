/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac/enum"
)


type AlertAPI struct {
	api.Handler
}

func (alert *AlertAPI) Init() {
	api.HandleAPIMethod(api.GET, "/alerting/rule/:rule_id", alert.RequirePermission(alert.getRule,enum.PermissionAlertRuleRead))
	api.HandleAPIMethod(api.POST, "/alerting/rule", alert.RequirePermission(alert.createRule, enum.PermissionAlertRuleWrite))
	api.HandleAPIMethod(api.POST, "/alerting/rule/test", alert.RequireLogin(alert.sendTestMessage))
	api.HandleAPIMethod(api.DELETE, "/alerting/rule/:rule_id", alert.RequirePermission(alert.deleteRule, enum.PermissionAlertRuleWrite))
	api.HandleAPIMethod(api.DELETE, "/alerting/rule", alert.RequirePermission(alert.batchDeleteRule, enum.PermissionAlertRuleWrite))
	api.HandleAPIMethod(api.PUT, "/alerting/rule/:rule_id", alert.RequirePermission(alert.updateRule, enum.PermissionAlertRuleWrite))
	api.HandleAPIMethod(api.GET, "/alerting/rule/_search", alert.RequirePermission(alert.searchRule, enum.PermissionAlertRuleRead))
	api.HandleAPIMethod(api.GET, "/alerting/stats", alert.RequirePermission(alert.getAlertStats, enum.PermissionAlertHistoryRead))
	api.HandleAPIMethod(api.POST, "/alerting/rule/info", alert.RequirePermission(alert.fetchAlertInfos, enum.PermissionAlertHistoryRead))
	api.HandleAPIMethod(api.POST, "/alerting/rule/preview_metric", alert.RequireLogin(alert.getPreviewMetricData))
	api.HandleAPIMethod(api.POST, "/alerting/rule/:rule_id/_enable", alert.RequirePermission(alert.enableRule, enum.PermissionAlertRuleWrite))
	api.HandleAPIMethod(api.GET, "/alerting/rule/:rule_id/metric", alert.RequirePermission(alert.getMetricData, enum.PermissionAlertRuleRead))
	api.HandleAPIMethod(api.GET, "/alerting/rule/:rule_id/info", alert.RequirePermission(alert.getRuleDetail, enum.PermissionAlertRuleRead, enum.PermissionAlertMessageRead))
	api.HandleAPIMethod(api.POST, "/alerting/rule/_enable", alert.RequirePermission(alert.batchEnableRule, enum.PermissionAlertRuleWrite))
	api.HandleAPIMethod(api.POST, "/alerting/rule/_disable", alert.RequirePermission(alert.batchDisableRule, enum.PermissionAlertRuleWrite))

	api.HandleAPIMethod(api.GET, "/alerting/channel/:channel_id", alert.RequirePermission(alert.getChannel, enum.PermissionAlertChannelRead))
	api.HandleAPIMethod(api.POST, "/alerting/channel", alert.RequirePermission(alert.createChannel, enum.PermissionAlertChannelWrite))
	api.HandleAPIMethod(api.DELETE, "/alerting/channel", alert.RequirePermission(alert.deleteChannel, enum.PermissionAlertChannelWrite))
	api.HandleAPIMethod(api.PUT, "/alerting/channel/:channel_id", alert.RequirePermission(alert.updateChannel, enum.PermissionAlertChannelWrite))
	api.HandleAPIMethod(api.GET, "/alerting/channel/_search", alert.RequirePermission(alert.searchChannel, enum.PermissionAlertChannelRead))
	api.HandleAPIMethod(api.POST, "/alerting/channel/test", alert.RequirePermission(alert.testChannel, enum.PermissionAlertChannelWrite))

	api.HandleAPIMethod(api.GET, "/alerting/alert/_search", alert.RequirePermission(alert.searchAlert, enum.PermissionAlertHistoryRead))
	api.HandleAPIMethod(api.GET, "/alerting/alert/:alert_id", alert.RequirePermission(alert.getAlert, enum.PermissionAlertHistoryRead))
	api.HandleAPIMethod(api.GET, "/alerting/template/parameters", alert.getTemplateParams)

	api.HandleAPIMethod(api.GET, "/alerting/message/_search", alert.RequirePermission(alert.searchAlertMessage, enum.PermissionAlertMessageRead))
	api.HandleAPIMethod(api.POST, "/alerting/message/_ignore", alert.RequirePermission(alert.ignoreAlertMessage, enum.PermissionAlertMessageWrite))
	api.HandleAPIMethod(api.GET, "/alerting/message/_stats",  alert.RequirePermission(alert.getAlertMessageStats, enum.PermissionAlertMessageRead))
	api.HandleAPIMethod(api.GET, "/alerting/message/:message_id", alert.RequirePermission(alert.getAlertMessage, enum.PermissionAlertMessageRead))
	api.HandleAPIMethod(api.GET, "/alerting/message/:message_id/notification", alert.getMessageNotificationInfo)


	//just for test
	//api.HandleAPIMethod(api.GET, "/alerting/rule/test", alert.testRule)

}

