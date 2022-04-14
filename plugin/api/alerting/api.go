/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import "infini.sh/framework/core/api"


type AlertAPI struct {
	api.Handler
}

func init() {
	alert:=AlertAPI{}
	api.HandleAPIMethod(api.GET, "/alerting/rule/:rule_id", alert.getRule)
	api.HandleAPIMethod(api.POST, "/alerting/rule", alert.createRule)
	api.HandleAPIMethod(api.DELETE, "/alerting/rule/:rule_id", alert.deleteRule)
	api.HandleAPIMethod(api.PUT, "/alerting/rule/:rule_id", alert.updateRule)
	api.HandleAPIMethod(api.GET, "/alerting/rule/_search", alert.searchRule)

	api.HandleAPIMethod(api.GET, "/alerting/channel/:channel_id", alert.getChannel)
	api.HandleAPIMethod(api.POST, "/alerting/channel", alert.createChannel)
	api.HandleAPIMethod(api.DELETE, "/alerting/channel/:channel_id", alert.deleteChannel)
	api.HandleAPIMethod(api.PUT, "/alerting/channel/:channel_id", alert.updateChannel)
	api.HandleAPIMethod(api.GET, "/alerting/channel/_search", alert.searchChannel)

	//just for test
	//api.HandleAPIMethod(api.GET, "/alerting/rule/test", alert.testRule)
}

