/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"infini.sh/framework/core/env"
	"sync"
)

type AgentConfig struct {
	Enabled bool `config:"enabled"`
	StateManager struct{
		Enabled bool `config:"enabled"`
	} `config:"state_manager"`
	Setup SetupConfig `config:"setup"`
}

type SetupConfig struct {
	DownloadURL string `config:"download_url"`
	Version string `config:"version"`
	CACertFile string `config:"ca_cert"`
	CAKeyFile string `config:"ca_key"`
	ScriptEndpoint string `config:"script_endpoint"`
}

var agentCfg *AgentConfig
var onceCfg = sync.Once{}

func GetAgentConfig() *AgentConfig {
	onceCfg.Do(func() {
		agentCfg = &AgentConfig{}
		_, err := env.ParseConfig("agent", agentCfg )
		if err != nil {
			panic(err)
		}
	})
	return agentCfg
}