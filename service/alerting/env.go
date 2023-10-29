/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package alerting

import (
	"fmt"
	config2 "infini.sh/console/config"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/kv"
	log "src/github.com/cihub/seelog"
)

func GetEnvVariables() (map[string]interface{}, error){
	configFile := global.Env().GetConfigFile()
	envVariables, err := config.LoadEnvVariables(configFile)
	if err != nil {
		return nil, err
	}
	//todo override env variables with the variables defined in console ui
	if envVariables != nil && envVariables["INFINI_CONSOLE_ENDPOINT"] == nil {
		buf, err := kv.GetValue("system", []byte("INFINI_CONSOLE_ENDPOINT"))
		if err != nil {
			log.Error(err)
		}
		var endpoint string
		if len(buf) > 0 {
			endpoint = string(buf)
		}
		if endpoint == "" {
			endpoint, err = GetInnerConsoleEndpoint()
			if err != nil {
				return nil, err
			}
		}
		envVariables["INFINI_CONSOLE_ENDPOINT"] = endpoint
	}
	return envVariables, nil
}

func GetInnerConsoleEndpoint() (string, error){
	appConfig := &config2.AppConfig{
		UI: config2.UIConfig{},
	}

	ok, err := env.ParseConfig("web", appConfig)
	if err != nil {
		return "", err
	}
	if !ok {
		return "", fmt.Errorf("web config not exists")
	}
	endpoint := appConfig.GetEndpoint()
	return endpoint, nil
}
