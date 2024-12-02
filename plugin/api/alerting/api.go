// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"infini.sh/console/core"
	"infini.sh/console/core/security/enum"
	"infini.sh/framework/core/api"
)

type AlertAPI struct {
	core.Handler
}

func (alert *AlertAPI) Init() {
	api.HandleAPIMethod(api.GET, "/alerting/rule/:rule_id", alert.RequirePermission(alert.getRule, enum.PermissionAlertRuleRead))
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
	api.HandleAPIMethod(api.GET, "/alerting/rule/_search_values", alert.RequirePermission(alert.searchFieldValues, enum.PermissionAlertRuleRead))

	api.HandleAPIMethod(api.GET, "/alerting/channel/:channel_id", alert.RequirePermission(alert.getChannel, enum.PermissionAlertChannelRead))
	api.HandleAPIMethod(api.POST, "/alerting/channel", alert.RequirePermission(alert.createChannel, enum.PermissionAlertChannelWrite))
	api.HandleAPIMethod(api.DELETE, "/alerting/channel", alert.RequirePermission(alert.deleteChannel, enum.PermissionAlertChannelWrite))
	api.HandleAPIMethod(api.PUT, "/alerting/channel/:channel_id", alert.RequirePermission(alert.updateChannel, enum.PermissionAlertChannelWrite))
	api.HandleAPIMethod(api.GET, "/alerting/channel/_search", alert.RequirePermission(alert.searchChannel, enum.PermissionAlertChannelRead))
	api.HandleAPIMethod(api.POST, "/alerting/channel/test", alert.RequirePermission(alert.testChannel, enum.PermissionAlertChannelWrite))
	api.HandleAPIMethod(api.POST, "/alerting/channel/_enable", alert.RequirePermission(alert.batchEnableChannel, enum.PermissionAlertChannelWrite))
	api.HandleAPIMethod(api.POST, "/alerting/channel/_disable", alert.RequirePermission(alert.batchDisableChannel, enum.PermissionAlertChannelWrite))

	api.HandleAPIMethod(api.GET, "/alerting/alert/_search", alert.RequirePermission(alert.searchAlert, enum.PermissionAlertHistoryRead))
	api.HandleAPIMethod(api.GET, "/alerting/alert/:alert_id", alert.RequirePermission(alert.getAlert, enum.PermissionAlertHistoryRead))
	api.HandleAPIMethod(api.GET, "/alerting/template/parameters", alert.getTemplateParams)

	api.HandleAPIMethod(api.GET, "/alerting/message/_search", alert.RequirePermission(alert.searchAlertMessage, enum.PermissionAlertMessageRead))
	api.HandleAPIMethod(api.POST, "/alerting/message/_ignore", alert.RequirePermission(alert.ignoreAlertMessage, enum.PermissionAlertMessageWrite))
	api.HandleAPIMethod(api.GET, "/alerting/message/_stats", alert.RequirePermission(alert.getAlertMessageStats, enum.PermissionAlertMessageRead))
	api.HandleAPIMethod(api.GET, "/alerting/message/:message_id", alert.RequirePermission(alert.getAlertMessage, enum.PermissionAlertMessageRead))
	api.HandleAPIMethod(api.GET, "/alerting/message/:message_id/notification", alert.getMessageNotificationInfo)

	//just for test
	//api.HandleAPIMethod(api.GET, "/alerting/rule/test", alert.testRule)

}
