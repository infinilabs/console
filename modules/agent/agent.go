/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package agent

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/modules/agent/api"
	"infini.sh/console/modules/agent/client"
	"infini.sh/console/modules/agent/common"
	"infini.sh/console/modules/agent/model"
	"infini.sh/console/modules/agent/state"
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
	client.RegisterClient(&client.Client{})

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

		sm := state.NewStateManager(time.Second*30, "agent_state", agentIds)
		state.RegisterStateManager(sm)
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
		state.GetStateManager().Stop()
	}
	log.Info("agent module was stopped")
	return nil
}

type AgentModule struct {
	model.AgentConfig
}
