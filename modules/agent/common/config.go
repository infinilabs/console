/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/modules/agent/model"
	"infini.sh/console/plugin/managed/common"
	"infini.sh/framework/core/env"
)

func GetAgentConfig() *model.AgentConfig {
	agentCfg := &model.AgentConfig{
		Enabled: true,
		Setup: &model.SetupConfig{
			DownloadURL: "https://release.infinilabs.com/agent/stable",
		},
	}
	_, err := env.ParseConfig("agent", agentCfg)
	if err != nil {
		log.Errorf("agent config not found: %v", err)
	}
	if agentCfg.Setup.CACertFile == "" && agentCfg.Setup.CAKeyFile == "" {
		agentCfg.Setup.CACertFile, agentCfg.Setup.CAKeyFile, err = common.GetOrInitDefaultCaCerts()
		if err != nil {
			log.Errorf("generate default ca certs error: %v", err)
		}
	}
	return agentCfg
}
