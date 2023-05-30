/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package model

import (
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
)

type TaskSetting struct {
	ClusterHealth *ClusterHealthTask `json:"cluster_health,omitempty"`
	ClusterStats *ClusterStatsTask `json:"cluster_stats,omitempty"`
	IndexStats *IndexStatsTask `json:"index_stats,omitempty"`
	NodeStats *NodeStatsTask `json:"node_stats,omitempty"`
	Logs *LogsTask `json:"logs,omitempty"`
}

type ClusterHealthTask struct {
	Enabled bool `json:"enabled"`
}

type ClusterStatsTask struct {
	Enabled bool `json:"enabled"`
}

type IndexStatsTask struct {
	Enabled bool `json:"enabled"`
}

type NodeStatsTask struct {
	Enabled bool `json:"enabled"`
	NodeIDs []string `json:"node_ids,omitempty"`
}

type LogsTask struct {
	Enabled bool `json:"enabled"`
}

type ParseAgentSettingsResult struct {
	ClusterConfigs []elastic.ElasticsearchConfig
	Pipelines []util.MapStr
	ToDeletePipelineNames []string
}
