/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package elasticsearch

import "infini.sh/console/service/alerting"

func init(){
	eng := Engine{}
	alerting.RegistEngine("elasticsearch", &eng)
}
