/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package alerting

import (
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/global"
)

func GetEnvVariables() (map[string]interface{}, error){
	configFile := global.Env().GetConfigFile()
	envVariables, err := config.LoadEnvVariables(configFile)
	//todo override env variables with the variables defined in console ui
	return envVariables, err
}
