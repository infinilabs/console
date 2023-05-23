/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package agent

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/modules/agent/api"
	"infini.sh/console/modules/agent/common"
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/host"
	"infini.sh/framework/core/orm"
	"time"
)

func (module *AgentModule) Name() string {
	return "agent"
}

func (module *AgentModule) Setup() {
	module.AgentConfig.Enabled = true
	module.AgentConfig.StateManager.Enabled = true
	exists, err := env.ParseConfig("agent", &module.AgentConfig)
	if exists && err != nil {
		panic(err)
	}
	if module.AgentConfig.Enabled {
		api.Init()
	}
}
func (module *AgentModule) Start() error {
	if !module.AgentConfig.Enabled {
		return nil
	}
	orm.RegisterSchemaWithIndexName(agent.Instance{}, "agent")
	orm.RegisterSchemaWithIndexName(agent.ESNodeInfo{}, "agent-node")
	orm.RegisterSchemaWithIndexName(host.HostInfo{}, "host")
	orm.RegisterSchemaWithIndexName(agent.Setting{}, "agent-setting")
	common.RegisterClient(&common.Client{})

	if module.AgentConfig.StateManager.Enabled {
		onlineAgentIDs, err := common.GetLatestOnlineAgentIDs(nil, 60)
		if err != nil {
			log.Error(err)
		}
		agents, err := common.LoadAgentsFromES("")
		if err != nil {
			log.Error(err)
		}
		agentIds := map[string]string{}
		for _, ag := range agents {
			if _, ok := onlineAgentIDs[ag.ID]; ok {
				agentIds[ag.ID] = "online"
			}
		}

		sm := common.NewStateManager(time.Second*30, "agent_state", agentIds)
		common.RegisterStateManager(sm)
		go sm.LoopState()
	}
	return nil
}

func (module *AgentModule) Stop() error {
	if !module.AgentConfig.Enabled {
		return nil
	}
	log.Info("start to stop agent module")
	if module.AgentConfig.StateManager.Enabled {
		common.GetStateManager().Stop()
	}
	log.Info("agent module was stopped")
	return nil
}

type AgentModule struct {
	common.AgentConfig
}
