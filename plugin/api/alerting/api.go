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
}

