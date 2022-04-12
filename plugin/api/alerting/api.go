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
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/alerting/rule/:rule_id", alert.getRule)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/alerting/rule", alert.createRule)
}

