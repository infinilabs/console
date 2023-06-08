/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package agent

import (
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/console/modules/agent/api"
	"infini.sh/console/modules/agent/client"
	"infini.sh/console/modules/agent/common"
	"infini.sh/console/modules/agent/model"
	"infini.sh/console/modules/agent/state"
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/host"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
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
	var (
		executor client.Executor
		err error
		caFile string
		caKey string
	)
	if module.AgentConfig.Setup != nil {
		caFile = module.AgentConfig.Setup.CACertFile
		caKey = module.AgentConfig.Setup.CAKeyFile
	}
	if caFile == "" && caKey == "" {
		caFile, caKey, err = common.GetOrInitDefaultCaCerts()
		if err != nil {
			panic(err)
		}
	}
	executor, err = client.NewMTLSExecutor(caFile, caKey)
	if err != nil {
		panic(err)
	}
	agClient := &client.Client{
		Executor: executor,
	}
	client.RegisterClient(agClient)

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
		credential.RegisterChangeEvent(func(cred *credential.Credential) {
			var effectsClusterIDs []string
			elastic.WalkConfigs(func(key, value interface{}) bool {
				if cfg, ok := value.(*elastic.ElasticsearchConfig); ok {
					if cfg.CredentialID == cred.ID {
						effectsClusterIDs = append(effectsClusterIDs, cfg.ID)
					}
				}
				return true
			})
			if len(effectsClusterIDs) > 0 {
				queryDsl := util.MapStr{
					"query": util.MapStr{
						"bool": util.MapStr{
							"must": []util.MapStr{
								{
									"terms": util.MapStr{
										"metadata.labels.cluster_id": effectsClusterIDs,
									},
								},
							},
						},
					},
					"script": util.MapStr{
						"source": fmt.Sprintf("ctx._source['updated'] = '%s'", time.Now().Format(time.RFC3339Nano)),
					},
				}
				err = orm.UpdateBy(agent.Setting{}, util.MustToJSONBytes(queryDsl))
				if err != nil {
					log.Error(err)
				}
			}
			//check ingest cluster credential
			if module.AgentConfig.Setup != nil && module.AgentConfig.Setup.IngestClusterCredentialID == cred.ID {
				agents, err = common.LoadAgentsFromES("")
				if err != nil {
					log.Error(err)
					return
				}
				for _, ag := range agents {
					err = kv.AddValue(model.KVAgentIngestConfigChanged, []byte(ag.ID), []byte("1"))
					if err != nil {
						log.Error(err)
					}
				}
			}
		})

		sm := state.NewStateManager(time.Second*30, "agent_state", agentIds, agClient)
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
