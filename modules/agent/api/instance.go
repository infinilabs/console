/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"context"
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/host"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	common2 "infini.sh/console/modules/agent/common"
	elastic2 "infini.sh/framework/modules/elastic"
	"infini.sh/framework/modules/elastic/common"
	"net/http"
	"strconv"
)

type APIHandler struct {
	api.Handler
}

func (h *APIHandler) createInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var obj = &agent.Instance{}
	err := h.DecodeJSON(req, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	oldInst := &agent.Instance{}
	oldInst.ID = obj.ID
	exists, err := orm.Get(oldInst)

	if err != nil && err != elastic2.ErrNotFound {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if exists {
		errMsg := fmt.Sprintf("agent [%s] already exists", obj.ID)
		h.WriteError(w, errMsg, http.StatusInternalServerError)
		log.Error(errMsg)
		return
	}
	//fetch more information of agent instance
	res, err := common2.GetClient().GetInstanceBasicInfo(context.Background(), obj.GetEndpoint())
	if err != nil {
		errStr := fmt.Sprintf("get agent instance basic info error: %s", err.Error())
		h.WriteError(w,errStr , http.StatusInternalServerError)
		log.Error(errStr)
		return
	}
	if res.ID == "" {
		errStr :=fmt.Sprintf("got unexpected response of agent instance basic info: %s", util.MustToJSON(res))
		h.WriteError(w, errStr , http.StatusInternalServerError)
		log.Error(errStr)
		return
	}else{
		obj.ID = res.ID
		obj.Version = res.Version
		obj.MajorIP = res.MajorIP
		obj.Host = res.Host
		obj.IPS = res.IPS
	}

	err = orm.Create(nil, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	_, err = refreshNodesInfo(obj)
	if err != nil {
		log.Error(err)
	}

	h.WriteCreatedOKJSON(w, obj.ID)

}

func bindAgentToHostByIP(ag *agent.Instance) error{
	err, result := orm.GetBy("ip", ag.MajorIP, host.HostInfo{})
	if err != nil {
		return err
	}
	if len(result.Result) > 0 {
		buf := util.MustToJSONBytes(result.Result[0])
		hostInfo := &host.HostInfo{}
		err = util.FromJSONBytes(buf, hostInfo)
		if err != nil {
			return err
		}
		sm := common2.GetStateManager()
		if ag.Status == "" {
			_, err1 := sm.GetAgentClient().GetHostInfo(nil, ag.GetEndpoint())
			if err1 == nil {
				ag.Status = "online"
			}else{
				ag.Status = "offline"
			}
		}

		hostInfo.AgentStatus = ag.Status
		hostInfo.AgentID = ag.ID
		err = orm.Update(nil, hostInfo)
		if err != nil {
			return  err
		}

		err = sm.GetAgentClient().DiscoveredHost(nil, ag.GetEndpoint(), util.MapStr{
			"host_id": hostInfo.ID,
		})
		if err != nil {
			return  err
		}
	}
	return nil
}

func (h *APIHandler) getInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("instance_id")

	obj := agent.Instance{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"found":   true,
		"_id":     id,
		"_source": obj,
	}, 200)
}

func (h *APIHandler) deleteInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("instance_id")

	obj := agent.Instance{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	err = orm.Delete(nil, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if sm := common2.GetStateManager(); sm != nil {
		sm.DeleteAgent(obj.ID)
	}

	h.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "deleted",
	}, 200)
}

func (h *APIHandler) getInstanceStats(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var instanceIDs = []string{}
	err := h.DecodeJSON(req, &instanceIDs)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(instanceIDs) == 0 {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	q := orm.Query{
		WildcardIndex: true,
	}
	queryDSL := util.MapStr{
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
								"gte": "now-1m",
							},
						},
					},
				},
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.name": util.MapStr{
								"value": "agent",
							},
						},
					}, {
						"terms": util.MapStr{
							"agent.id": instanceIDs,
						},
					},
				},
			},
		},
	}
	q.RawQuery = util.MustToJSONBytes(queryDSL)

	err, res := orm.Search(event.Event{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	result := util.MapStr{}
	for _, item := range res.Result {
		if itemV, ok := item.(map[string]interface{}); ok {
			if agentID, ok := util.GetMapValueByKeys([]string{"agent", "id"}, itemV); ok {
				if v, ok := agentID.(string); ok {
					if ab, ok := util.GetMapValueByKeys([]string{"payload","instance", "system"}, itemV); ok{
						if abV, ok := ab.(map[string]interface{}); ok {
							result[v] = util.MapStr{
								"timestamp": itemV["timestamp"],
								"system": util.MapStr{
									"cpu": abV["cpu"],
									"mem": abV["mem"],
									"uptime_in_ms": abV["uptime_in_ms"],
									"status": "online",
								},
							}
						}
					}
				}
			}
		}

	}
	h.WriteJSON(w, result, http.StatusOK)
}


func (h *APIHandler) searchInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var (
		keyword = h.GetParameterOrDefault(req, "keyword", "")
		//queryDSL    = `{"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
		strSize      = h.GetParameterOrDefault(req, "size", "20")
		strFrom      = h.GetParameterOrDefault(req, "from", "0")
	)

	var (
		mustQ       []interface{}
	)

	if keyword != "" {
		mustQ = append(mustQ, util.MapStr{
			"query_string": util.MapStr{
				"default_field": "*",
				"query":         keyword,
			},
		})
	}
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	queryDSL := util.MapStr{
		"size": size,
		"from": from,
	}
	if len(mustQ) > 0 {
		queryDSL["query"] = util.MapStr{
			"bool": util.MapStr{
				"must": mustQ,
			},
		}
	}

	q := orm.Query{}
	q.RawQuery = util.MustToJSONBytes(queryDSL)

	err, res := orm.Search(&agent.Instance{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.Write(w, res.Raw)
}

func (h *APIHandler) getESNodesInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("instance_id")
	obj := agent.Instance{}
	obj.ID = id
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	nodesM, err := getNodesInfoFromES(obj.ID)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var nodes []*agent.ESNodeInfo
	for _, node := range nodesM {
		nodes = append(nodes, node)
	}
	h.WriteJSON(w, nodes, http.StatusOK)
}

func (h *APIHandler) refreshESNodesInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	id := ps.MustGetParameter("instance_id")
	obj := agent.Instance{}
	obj.ID = id
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	_, err = refreshNodesInfo(&obj)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteAckOKJSON(w)
}

func (h *APIHandler) authESNode(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("instance_id")
	inst := agent.Instance{}
	inst.ID = id
	exists, err := orm.Get(&inst)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	reqBody := struct {
		NodeID string `json:"node_id"`
		ESConfig *elastic.ElasticsearchConfig `json:"es_config"`
	}{}
	err = h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	oldNodeInfo := &agent.ESNodeInfo{
		ID: reqBody.NodeID,
	}
	exists, err = orm.Get(oldNodeInfo)
	if !exists || err != nil {
		h.WriteJSON(w, fmt.Sprintf("node [%s] of agent [%s] was not found", oldNodeInfo.ID, inst.Name), http.StatusInternalServerError)
		return
	}

	cfg := reqBody.ESConfig
	if cfg.Endpoint == "" {
		cfg.Endpoint = fmt.Sprintf("%s://%s", cfg.Schema, cfg.Host)
	}
	basicAuth, err := common.GetBasicAuth(cfg)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	cfg.BasicAuth = &basicAuth
	nodeInfo, err := common2.GetClient().AuthESNode(context.Background(), inst.GetEndpoint(), *cfg)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	nodeInfo.ID = oldNodeInfo.ID
	nodeInfo.AgentID = inst.ID
	clusterCfgs := getClusterConfigs()
	if nodeInfo.ClusterUuid != "" && clusterCfgs[nodeInfo.ClusterUuid] != nil {
		nodeInfo.ClusterID = clusterCfgs[nodeInfo.ClusterUuid].ID
		settings, err := common2.GetAgentSettings(inst.ID, 0)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		setting := pickAgentSettings(settings, *nodeInfo)
		if setting == nil {
			setting, err = getAgentTaskSetting(inst.ID, *nodeInfo)
			if err != nil {
				log.Error("get agent task setting error: ", err)
			}
			err = orm.Create(nil, setting)
			if err != nil {
				log.Error("save agent task setting error: ", err)
			}
		}
	}
	err = orm.Save(nil, nodeInfo)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, nodeInfo, http.StatusOK)
}

func refreshNodesInfo(inst *agent.Instance) ([]agent.ESNodeInfo, error) {
	nodesInfo, err := common2.GetClient().GetElasticsearchNodes(context.Background(), inst.GetEndpoint())
	if err != nil {
		return nil, fmt.Errorf("get elasticsearch nodes error: %w", err)
	}
	oldNodesInfo, err := getNodesInfoFromES(inst.ID)
	if err != nil {
		return nil, fmt.Errorf("get elasticsearch nodes info from es error: %w", err)
	}
	clusterCfgs := getClusterConfigs()
	oldPids := map[int]struct{}{}
	var resultNodes []agent.ESNodeInfo
	settings, err := common2.GetAgentSettings(inst.ID, 0)
	if err != nil {
		return nil, err
	}
	for _, node := range nodesInfo {
		oldNode := getNodeByPidOrUUID(oldNodesInfo, node.ProcessInfo.PID, node.NodeUUID)
		node.AgentID = inst.ID
		if oldNode != nil {
			node.ID = oldNode.ID
			//keep old validate info
			if node.ClusterUuid == "" && oldNode.ClusterUuid != "" {
				node = *oldNode
			}
			oldPids[oldNode.ProcessInfo.PID] = struct{}{}
		}else{
			node.ID = util.GetUUID()
		}
		if node.ClusterUuid != "" {
			if oldNode != nil && oldNode.ClusterID != "" {
				node.ClusterID = oldNode.ClusterID
			}else{
				if cfg := clusterCfgs[node.ClusterUuid]; cfg != nil {
					node.ClusterID = cfg.ID
					setting := pickAgentSettings(settings, node)
					if setting == nil {
						setting, err = getAgentTaskSetting(inst.ID, node)
						if err != nil {
							log.Error()
						}
						err = orm.Create(nil, setting)
						if err != nil {
							log.Error("save agent task setting error: ", err)
						}
					}
				}else{
					//cluster not registered in console
				}
			}
		}

		node.Status = "online"
		err = orm.Save(nil, node)
		if err != nil {
			log.Error("save node info error: ", err)
		}
		resultNodes = append(resultNodes, node)
	}
	for k, node := range oldNodesInfo {
		if _, ok := oldPids[k]; !ok {
			//auto delete not associated cluster
			if node.ClusterID == "" {
				log.Info("delete node with pid: ", node.ProcessInfo.PID)
				err = orm.Delete(nil, node)
				if err != nil {
					log.Error("delete node info error: ", err)
				}
				continue
			}
			node.Status = "offline"
			err = orm.Save(nil, node)
			if err != nil {
				log.Error("save node info error: ", err)
			}
			resultNodes = append(resultNodes, *node)
		}
	}
	return resultNodes, nil
}

func getNodeByPidOrUUID(nodes map[int]*agent.ESNodeInfo, pid int, uuid string) *agent.ESNodeInfo{
	if nodes[pid] != nil {
		return nodes[pid]
	}
	for _, node := range nodes {
		if node.NodeUUID != "" && node.NodeUUID == uuid {
			return node
		}
	}
	return nil
}

func getNodesInfoFromES(agentID string) (map[int]*agent.ESNodeInfo, error){
	query := util.MapStr{
		"size": 100,
		"query": util.MapStr{
			"term": util.MapStr{
				"agent_id": util.MapStr{
					"value": agentID,
				},
			},
		},
	}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}

	err, result := orm.Search(agent.ESNodeInfo{}, &q)
	if err != nil {
		return nil, err
	}
	nodesInfo := map[int]*agent.ESNodeInfo{}
	for _, row := range result.Result {
		node := agent.ESNodeInfo{}
		buf := util.MustToJSONBytes(row)
		util.MustFromJSONBytes(buf, &node)
		nodesInfo[node.ProcessInfo.PID] = &node
	}
	return nodesInfo, nil
}

func getClusterConfigs() map[string]*elastic.ElasticsearchConfig {
	cfgs := map[string]*elastic.ElasticsearchConfig{}
	elastic.WalkConfigs(func(key, value interface{}) bool {
		if cfg, ok := value.(*elastic.ElasticsearchConfig); ok {
			//todo handle clusterUUID is empty
			cfgs[cfg.ClusterUUID] = cfg
		}
		return true
	})
	return cfgs
}

func pickAgentSettings(settings []agent.Setting, nodeInfo agent.ESNodeInfo) *agent.Setting {
	for _, setting := range settings {
		if setting.Metadata.Labels["node_uuid"] == nodeInfo.NodeUUID {
			return &setting
		}
	}
	return nil
}

func getAgentTaskSetting(agentID string, node agent.ESNodeInfo) (*agent.Setting, error){
	taskSetting, err := getSettingsByClusterID(node.ClusterID)
	if err != nil {
		return  nil, err
	}
	return &agent.Setting{
		Metadata: agent.SettingsMetadata{
			Category: "agent",
			Name: "task",
			Labels: util.MapStr{
				"agent_id": agentID,
				"cluster_uuid": node.ClusterUuid,
				"cluster_id": node.ClusterID,
				"node_uuid": node.NodeUUID,
				"endpoint": fmt.Sprintf("%s://%s", node.Schema, node.PublishAddress),
			},
		},
		Payload: util.MapStr{
			"task": taskSetting,
		},
	}, nil
}

// getSettingsByClusterID query agent task settings with cluster id
func getSettingsByClusterID(clusterID string) (*common2.TaskSetting, error) {
	queryDsl := util.MapStr{
		"size": 200,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.cluster_id": util.MapStr{
								"value": clusterID,
							},
						},
					},
				},
				"should": []util.MapStr{
					{
						"term": util.MapStr{
							"payload.task.cluster_health": util.MapStr{
								"value": true,
							},
						},
					},
					{
						"term": util.MapStr{
							"payload.task.cluster_stats": util.MapStr{
								"value": true,
							},
						},
					},
					{
						"term": util.MapStr{
							"payload.task.index_stats": util.MapStr{
								"value": true,
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
		return nil, err
	}

	setting := &common2.TaskSetting{
		NodeStats: &common2.NodeStatsTask{
			Enabled: true,
		},
	}
	var (
		clusterStats = true
		indexStats = true
		clusterHealth = true
	)
	keys := []string{"payload.task.cluster_stats", "payload.task.cluster_health", "payload.task.index_stats"}
	for _, row := range result.Result {
		if v, ok := row.(map[string]interface{}); ok {
			vm := util.MapStr(v)
			for _, key := range keys {
				tv, _ := vm.GetValue(key)
				if tv  == true {
					switch key {
					case "payload.task.cluster_stats":
						clusterStats = false
					case "payload.task.index_stats":
						indexStats = false
					case "payload.task.cluster_health":
						clusterHealth = false
					}
				}
			}
		}
	}
	if clusterStats {
		setting.ClusterStats = &common2.ClusterStatsTask{
			Enabled: true,
		}
	}
	if indexStats {
		setting.IndexStats = &common2.IndexStatsTask{
			Enabled: true,
		}
	}
	if clusterHealth {
		setting.ClusterHealth = &common2.ClusterHealthTask{
			Enabled: true,
		}
	}
	return setting, nil
}