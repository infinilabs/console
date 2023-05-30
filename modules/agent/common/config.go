/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"infini.sh/console/modules/agent/model"
	"infini.sh/framework/core/env"
	"sync"
)

var agentCfg *model.AgentConfig
var onceCfg = sync.Once{}

func GetAgentConfig() *model.AgentConfig {
	onceCfg.Do(func() {
		agentCfg = &model.AgentConfig{}
		_, err := env.ParseConfig("agent", agentCfg )
		if err != nil {
			panic(err)
		}
	})
	return agentCfg
}