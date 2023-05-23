/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"context"
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/host"
)

var defaultClient ClientAPI

func GetClient() ClientAPI {
	if defaultClient == nil {
		panic("agent client not init")
	}
	return defaultClient
}

func RegisterClient(client ClientAPI) {
	defaultClient = client
}
type ClientAPI interface {
	GetHostInfo(ctx context.Context, agentBaseURL string) (*host.HostInfo, error)
	DiscoveredHost(ctx context.Context, agentBaseURL string, body interface{}) error
	GetElasticProcess(ctx context.Context, agentBaseURL string, agentID string)(interface{}, error)
	GetElasticLogFiles(ctx context.Context, agentBaseURL string, logsPath string)(interface{}, error)
	GetElasticLogFileContent(ctx context.Context, agentBaseURL string, body interface{})(interface{}, error)
	GetInstanceBasicInfo(ctx context.Context, agentBaseURL string) (*agent.Instance, error)
	RegisterElasticsearch(ctx context.Context, agentBaseURL string, cfgs []elastic.ElasticsearchConfig) error
	GetElasticsearchNodes(ctx context.Context, agentBaseURL string) ([]agent.ESNodeInfo, error)
	AuthESNode(ctx context.Context, agentBaseURL string, cfg elastic.ElasticsearchConfig) (*agent.ESNodeInfo, error)
	CreatePipeline(ctx context.Context, agentBaseURL string, body []byte) error
	DeletePipeline(ctx context.Context, agentBaseURL, pipelineID string) error
}


var stateManager IStateManager

func GetStateManager() IStateManager {
	if stateManager == nil {
		panic("agent state manager not init")
	}
	return stateManager
}

func RegisterStateManager(sm IStateManager) {
	stateManager = sm
}

func IsEnabled() bool {
	return stateManager != nil
}

type IStateManager interface {
	GetAgent(ID string) (*agent.Instance, error)
	UpdateAgent(inst *agent.Instance, syncToES bool) (*agent.Instance, error)
	GetTaskAgent(clusterID string) (*agent.Instance, error)
	DeleteAgent(agentID string) error
	LoopState()
	Stop()
	GetAgentClient() ClientAPI
}