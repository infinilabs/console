/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"infini.sh/console/config"
	"infini.sh/framework/core/api"
)


type AlertAPI struct {
	api.Handler
	Config *config.AppConfig
}

func (alert *AlertAPI) Init() {
	api.HandleAPIMethod(api.GET, "/alerting/rule/:rule_id", alert.getRule)
	api.HandleAPIMethod(api.POST, "/alerting/rule", alert.createRule)
	api.HandleAPIMethod(api.POST, "/alerting/rule/test", alert.sendTestMessage)
	api.HandleAPIMethod(api.DELETE, "/alerting/rule/:rule_id", alert.deleteRule)
	api.HandleAPIMethod(api.PUT, "/alerting/rule/:rule_id", alert.updateRule)
	api.HandleAPIMethod(api.GET, "/alerting/rule/_search", alert.searchRule)
	api.HandleAPIMethod(api.GET, "/alerting/stats", alert.getAlertStats)
	api.HandleAPIMethod(api.POST, "/alerting/rule/info", alert.fetchAlertInfos)
	api.HandleAPIMethod(api.POST, "/alerting/rule/:rule_id/_enable", alert.enableRule)
	api.HandleAPIMethod(api.GET, "/alerting/rule/:rule_id/metric", alert.getMetricData)

	api.HandleAPIMethod(api.GET, "/alerting/channel/:channel_id", alert.getChannel)
	api.HandleAPIMethod(api.POST, "/alerting/channel", alert.createChannel)
	api.HandleAPIMethod(api.DELETE, "/alerting/channel/:channel_id", alert.deleteChannel)
	api.HandleAPIMethod(api.PUT, "/alerting/channel/:channel_id", alert.updateChannel)
	api.HandleAPIMethod(api.GET, "/alerting/channel/_search", alert.searchChannel)

	api.HandleAPIMethod(api.GET, "/alerting/alert/_search", alert.searchAlert)
	api.HandleAPIMethod(api.GET, "/alerting/alert/:alert_id", alert.getAlert)
	api.HandleAPIMethod(api.GET, "/alerting/template/parameters", alert.getTemplateParams)

	api.HandleAPIMethod(api.GET, "/alerting/message/_search", alert.searchAlertMessage)
	api.HandleAPIMethod(api.POST, "/alerting/message/_ignore", alert.ignoreAlertMessage)
	api.HandleAPIMethod(api.GET, "/alerting/message/_stats", alert.getAlertMessageStats)
	api.HandleAPIMethod(api.GET, "/alerting/message/:message_id", alert.getAlertMessage)


	//just for test
	//api.HandleAPIMethod(api.GET, "/alerting/rule/test", alert.testRule)

}

