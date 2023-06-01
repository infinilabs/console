/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"fmt"
	"infini.sh/console/modules/agent/model"
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	log "src/github.com/cihub/seelog"
	"strings"
)

func ParseAgentSettings(settings []agent.Setting)(*model.ParseAgentSettingsResult, error){
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
		taskSetting := model.TaskSetting{}
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
	return &model.ParseAgentSettingsResult{
		ClusterConfigs: clusterCfgs,
		Pipelines: pipelines,
		ToDeletePipelineNames: toDeletePipelineNames,
	}, nil
}

// GetAgentSettings query agent setting by agent id and updated timestamp,
// if there has any setting was updated, then return setting list includes settings not changed,
// otherwise return empty setting list
func GetAgentSettings(agentID string, timestamp int64) ([]agent.Setting, error) {
	query := util.MapStr{
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
				//{
				//	"range": util.MapStr{
				//		"updated": util.MapStr{
				//			"gt": timestamp,
				//		},
				//	},
				//},
			},
		},
	}
	queryDsl := util.MapStr{
		"size": 500,
		"query": query,
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
	var (
		settings []agent.Setting
		hasUpdated bool
	)
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
		if setting.Updated != nil && setting.Updated.UnixMilli() > timestamp {
			hasUpdated = true
		}
		settings = append(settings, setting)
	}
	if !hasUpdated {
		return nil, nil
	}
	return settings, nil
}

func TransformSettingsToConfig(setting *model.TaskSetting, clusterID, nodeUUID string) ([]util.MapStr, []string, error) {
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


func LoadAgentsFromES(clusterID string) ([]agent.Instance, error) {
	q := orm.Query{
		Size: 1000,
	}
	if clusterID != "" {
		q.Conds = orm.And(orm.Eq("id", clusterID))
	}
	err, result := orm.Search(agent.Instance{}, &q)
	if err != nil {
		return nil, fmt.Errorf("query agent error: %w", err)
	}

	if len(result.Result) > 0 {
		var agents = make([]agent.Instance, 0, len(result.Result))
		for _, row := range result.Result {
			ag := agent.Instance{}
			bytes := util.MustToJSONBytes(row)
			err = util.FromJSONBytes(bytes, &ag)
			if err != nil {
				log.Errorf("got unexpected agent: %s, error: %v", string(bytes), err)
				continue
			}
			agents = append(agents, ag)
		}
		return agents, nil
	}
	return nil, nil
}

func GetLatestOnlineAgentIDs(agentIds []string, lastSeconds int) (map[string]struct{}, error) {
	q := orm.Query{
		WildcardIndex: true,
	}
	mustQ := []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.name": util.MapStr{
					"value": "agent",
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.category": util.MapStr{
					"value": "instance",
				},
			},
		},
	}
	if len(agentIds) > 0 {
		mustQ = append(mustQ, util.MapStr{
			"terms": util.MapStr{
				"agent.id": agentIds,
			},
		})
	}
	queryDSL := util.MapStr{
		"_source": "agent.id",
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
		"collapse": util.MapStr{
			"field": "agent.id",
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"filter": []util.MapStr{
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"gte": fmt.Sprintf("now-%ds", lastSeconds),
							},
						},
					},
				},
				"must": mustQ,
			},
		},
	}
	q.RawQuery = util.MustToJSONBytes(queryDSL)
	err, result := orm.Search(event.Event{}, &q)
	if err != nil {
		return nil, fmt.Errorf("query agent instance metric error: %w", err)
	}
	agentIDs := map[string]struct{}{}
	if len(result.Result) > 0 {
		searchRes := elastic.SearchResponse{}
		err = util.FromJSONBytes(result.Raw, &searchRes)
		if err != nil {
			return nil, err
		}
		agentIDKeyPath := []string{"agent", "id"}
		for _, hit := range searchRes.Hits.Hits {
			agentID, _ := util.GetMapValueByKeys(agentIDKeyPath, hit.Source)
			if v, ok := agentID.(string); ok {
				agentIDs[v] = struct{}{}
			}
		}
	}
	return agentIDs, nil
}

func GetAgentIngestConfig() (string, *elastic.BasicAuth, error) {
	agCfg := GetAgentConfig()
	var (
		endpoint string
		ok bool
	)
	if endpoint, ok = agCfg.Setup.IngestClusterEndpoint.(string);ok {
		if endpoint = strings.TrimSpace(endpoint); endpoint == "" {
			return "", nil, fmt.Errorf("config ingest_cluster_endpoint must not be empty")
		}
	}
	var (
		basicAuth elastic.BasicAuth
	)
	if agCfg.Setup.IngestClusterCredentialID != "" {
		cred := credential.Credential{}
		cred.ID = agCfg.Setup.IngestClusterCredentialID
		_, err := orm.Get(&cred)
		if err != nil {
			return "", nil, fmt.Errorf("query credential [%s] error: %w", cred.ID, err)
		}
		info, err := cred.Decode()
		if err != nil {
			return "", nil, fmt.Errorf("decode credential [%s] error: %w", cred.ID, err)
		}
		if basicAuth, ok = info.(elastic.BasicAuth); !ok {
			log.Debug("invalid credential: ", cred)
		}
	}
	tpl := `elasticsearch:
  - name: default
    enabled: true
    endpoint: %s
    discovery:
      enabled: true
    basic_auth:
      username: %s
      password: $[[keystore.ingest_cluster_password]]
metrics:
  enabled: true
  queue: metrics
  network:
    enabled: true
    summary: true
    details: true
  memory:
    metrics:
      - swap
      - memory
  disk:
    metrics:
      - iops
      - usage
  cpu:
    metrics:
      - idle
      - system
      - user
      - iowait
      - load
  instance:
    enabled: true
pipeline:
  - name: logs_indexing_merge
    auto_start: true
    keep_running: true
    processor:
      - indexing_merge:
          index_name: ".infini_logs"
          elasticsearch: "default"
          input_queue: "logs"
          idle_timeout_in_seconds: 10
          output_queue:
            name: "logs_requests"
            label:
              tag: "logs"
          worker_size: 1
          bulk_size_in_mb: 10
  - name: ingest_logs
    auto_start: true
    keep_running: true
    processor:
      - bulk_indexing:
          bulk:
            compress: true
            batch_size_in_mb: 5
            batch_size_in_docs: 5000
          consumer:
            fetch_max_messages: 100
          queues:
            type: indexing_merge
            tag: "logs"
          when:
            cluster_available: ["default"]
  - name: metrics_indexing_merge
    auto_start: true
    keep_running: true
    processor:
      - indexing_merge:
          elasticsearch: "default"
          index_name: ".infini_metrics"
          input_queue: "metrics"
          output_queue:
            name: "metrics_requests"
            label:
              tag: "metrics"
          worker_size: 1
          bulk_size_in_mb: 5
  - name: ingest_metrics
    auto_start: true
    keep_running: true
    processor:
      - bulk_indexing:
          bulk:
            compress: true
            batch_size_in_mb: 5
            batch_size_in_docs: 5000
          consumer:
            fetch_max_messages: 100
          queues:
            type: indexing_merge
            tag: "metrics"
          when:
            cluster_available: ["default"]`
	tpl = fmt.Sprintf(tpl, endpoint, basicAuth.Username)
	return tpl, &basicAuth, nil
}