/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"fmt"
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

func ParseAgentSettings(settings []agent.Setting)(*ParseAgentSettingsResult, error){
	var clusterCfgs []elastic.ElasticsearchConfig
	var (
		pipelines []util.MapStr
		toDeletePipelineNames []string
	)
	for _, setting := range settings {
		if setting.Metadata.Labels == nil {
			return nil, fmt.Errorf("empty metadata labels of setting [%s]", setting.ID)
		}
		var (
			clusterID string
			ok bool
		)
		if clusterID, ok = setting.Metadata.Labels["cluster_id"].(string); ok && clusterID != ""{
			cfg := elastic.GetConfig(clusterID)
			newCfg := elastic.ElasticsearchConfig{
				Enabled: true,
				Name: cfg.Name,
				BasicAuth: cfg.BasicAuth,
				Endpoint: setting.Metadata.Labels["endpoint"].(string),
			}
			newCfg.ID = clusterID
			clusterCfgs = append(clusterCfgs, newCfg)
		}else{
			return nil, fmt.Errorf("got wrong cluster id [%v] from metadata labels", setting.Metadata.Labels["cluster_id"])
		}
		nodeUUID := util.ToString(setting.Metadata.Labels["node_uuid"])

		taskCfg, err := util.MapStr(setting.Payload).GetValue("task")
		if err != nil {
			return nil, err
		}
		vBytes, err := util.ToJSONBytes(taskCfg)
		if err != nil {
			return nil, err
		}
		taskSetting := TaskSetting{}
		err = util.FromJSONBytes(vBytes, &taskSetting)
		if err != nil {
			return nil, err
		}
		partPipelines, partDeletePipelineNames, err := TransformSettingsToConfig(&taskSetting, clusterID, nodeUUID)
		if err != nil {
			return nil, err
		}
		pipelines = append(pipelines, partPipelines...)
		toDeletePipelineNames = append(toDeletePipelineNames, partDeletePipelineNames...)
	}
	return &ParseAgentSettingsResult{
		ClusterConfigs: clusterCfgs,
		Pipelines: pipelines,
		ToDeletePipelineNames: toDeletePipelineNames,
	}, nil
}

func GetAgentSettings(agentID string, timestamp int64) ([]agent.Setting, error) {
	queryDsl := util.MapStr{
		"size": 500,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.category": util.MapStr{
								"value": "agent",
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.name": util.MapStr{
								"value": "task",
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.labels.agent_id": util.MapStr{
								"value": agentID,
							},
						},
					},
					{
						"range": util.MapStr{
							"updated": util.MapStr{
								"gt": timestamp,
							},
						},
					},
				},
			},
		},
	}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(queryDsl),
	}
	err, result := orm.Search(agent.Setting{}, &q)
	if err != nil {
		return nil, fmt.Errorf("search settings error: %w", err)
	}
	if len(result.Result) == 0 {
		return nil, nil
	}
	var settings []agent.Setting
	for _, row := range result.Result {
		setting := agent.Setting{}
		buf, err := util.ToJSONBytes(row)
		if err != nil {
			return nil, err
		}
		err = util.FromJSONBytes(buf, &setting)
		if err != nil {
			return nil, err
		}
		settings = append(settings, setting)
	}
	return settings, nil
}

func TransformSettingsToConfig(setting *TaskSetting, clusterID, nodeUUID string) ([]util.MapStr, []string, error) {
	if setting == nil {
		return nil, nil, fmt.Errorf("empty setting")
	}
	var (
		pipelines []util.MapStr
		toDeletePipelineNames []string
	)
	if setting.ClusterStats != nil {
		var processorName = "es_cluster_stats"
		if setting.ClusterStats.Enabled {
			pipelineCfg, err := newClusterMetricPipeline(processorName, clusterID)
			if err != nil {
				return nil, nil, err
			}
			pipelines = append(pipelines, pipelineCfg)
		}else{
			toDeletePipelineNames = append(toDeletePipelineNames, getMetricPipelineName(clusterID, processorName))
		}
	}
	if setting.IndexStats != nil {
		var processorName = "es_index_stats"
		if setting.IndexStats.Enabled {
			pipelineCfg, err := newClusterMetricPipeline(processorName, clusterID)
			if err != nil {
				return nil, nil, err
			}
			pipelines = append(pipelines, pipelineCfg)
		}else{
			toDeletePipelineNames = append(toDeletePipelineNames, getMetricPipelineName(clusterID, processorName))
		}
	}
	if setting.ClusterHealth != nil {
		var processorName = "es_cluster_health"
		if setting.ClusterHealth.Enabled {
			pipelineCfg, err := newClusterMetricPipeline(processorName, clusterID)
			if err != nil {
				return nil, nil, err
			}
			pipelines = append(pipelines, pipelineCfg)
		}else{
			toDeletePipelineNames = append(toDeletePipelineNames, getMetricPipelineName(clusterID, processorName))
		}
	}
	if setting.NodeStats != nil {
		var processorName = "es_node_stats"
		if setting.NodeStats.Enabled {
			params := util.MapStr{
				"elasticsearch": clusterID,
			}
			if len(setting.NodeStats.NodeIDs) > 0{
				params["node_uuids"] = setting.NodeStats.NodeIDs
			}
			cfg := util.MapStr{
				processorName: params,
			}
			enabled := true
			pipelineCfg := util.MapStr{
				"enabled": &enabled,
				"name": getMetricPipelineName(nodeUUID, processorName),
				"auto_start": true,
				"keep_running": true,
				"retry_delay_in_ms": 10000,
				"processor": []util.MapStr{cfg},
			}
			pipelines = append(pipelines, pipelineCfg)
		}else{
			toDeletePipelineNames = append(toDeletePipelineNames, getMetricPipelineName(nodeUUID, processorName))
		}
	}
	return pipelines, toDeletePipelineNames, nil
}

func newClusterMetricPipeline(processorName string, clusterID string)(util.MapStr, error){
	cfg := util.MapStr{
		processorName: util.MapStr{
			"elasticsearch": clusterID,
		},
	}
	enabled := true
	pipelineCfg := util.MapStr{
		"enabled": &enabled,
		"name": getMetricPipelineName(clusterID, processorName),
		"auto_start": true,
		"keep_running": true,
		"retry_delay_in_ms": 10000,
		"processor": []util.MapStr{cfg},
	}
	return pipelineCfg, nil
}

func getMetricPipelineName(clusterID, processorName string) string{
	return fmt.Sprintf("collect_%s_%s", clusterID, processorName)
}

