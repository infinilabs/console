/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"context"
	"errors"
	"fmt"
	log "github.com/cihub/seelog"
	common2 "infini.sh/console/modules/agent/common"
	model3 "infini.sh/console/modules/agent/model"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/host"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
	"net/http"
	"net/url"
	"strings"
	"sync"
)

//func (h *APIHandler) updateInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
//	id := ps.MustGetParameter("instance_id")
//	oldInst := model.Instance{}
//	oldInst.ID = id
//	_, err := orm.Get(&oldInst)
//	if err != nil {
//		if err == elastic2.ErrNotFound {
//			h.WriteJSON(w, util.MapStr{
//				"_id":    id,
//				"result": "not_found",
//			}, http.StatusNotFound)
//			return
//		}
//		h.WriteError(w, err.Error(), http.StatusInternalServerError)
//		log.Error(err)
//		return
//	}
//
//	obj := model.Instance{}
//	err = h.DecodeJSON(req, &obj)
//	if err != nil {
//		h.WriteError(w, err.Error(), http.StatusInternalServerError)
//		log.Error(err)
//		return
//	}
//
//	oldInst.Name = obj.Name
//	oldInst.Endpoint = obj.Endpoint
//	oldInst.Description = obj.Description
//	oldInst.Tags = obj.Tags
//	oldInst.BasicAuth = obj.BasicAuth
//	err = orm.Update(&orm.Context{
//		Refresh: "wait_for",
//	}, &oldInst)
//	if err != nil {
//		h.WriteError(w, err.Error(), http.StatusInternalServerError)
//		log.Error(err)
//		return
//	}
//
//	h.WriteJSON(w, util.MapStr{
//		"_id":    obj.ID,
//		"result": "updated",
//	}, 200)
//}
//
//func (h *APIHandler) searchInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
//
//	var (
//		keyword = h.GetParameterOrDefault(req, "keyword", "")
//		//queryDSL    = `{"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
//		strSize = h.GetParameterOrDefault(req, "size", "20")
//		strFrom = h.GetParameterOrDefault(req, "from", "0")
//	)
//
//	var (
//		mustQ []interface{}
//	)
//
//	if keyword != "" {
//		mustQ = append(mustQ, util.MapStr{
//			"query_string": util.MapStr{
//				"default_field": "*",
//				"query":         keyword,
//			},
//		})
//	}
//	size, _ := strconv.Atoi(strSize)
//	if size <= 0 {
//		size = 20
//	}
//	from, _ := strconv.Atoi(strFrom)
//	if from < 0 {
//		from = 0
//	}
//
//	queryDSL := util.MapStr{
//		"size": size,
//		"from": from,
//	}
//	if len(mustQ) > 0 {
//		queryDSL["query"] = util.MapStr{
//			"bool": util.MapStr{
//				"must": mustQ,
//			},
//		}
//	}
//
//	q := orm.Query{}
//	q.RawQuery = util.MustToJSONBytes(queryDSL)
//
//	err, res := orm.Search(&model.Instance{}, &q)
//	if err != nil {
//		log.Error(err)
//		h.WriteError(w, err.Error(), http.StatusInternalServerError)
//		return
//	}
//
//	h.Write(w, res.Raw)
//}

func (h *APIHandler) getESNodesInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	id := ps.MustGetParameter("instance_id")
	obj := model.Instance{}
	obj.ID = id
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}

	nodes, err := refreshNodesInfo(&obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, nodes, http.StatusOK)
}

func (h *APIHandler) authESNode(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("instance_id")
	inst := model.Instance{}
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
		NodeID   string                       `json:"node_id"`
		ESConfig *elastic.ElasticsearchConfig `json:"es_config"`
	}{}
	err = h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	//node id maybe is missing
	if reqBody.NodeID != "" {
		//verify the node id, if the node is is actually the node of the instance
		oldNodeInfo := &model.ESNodeInfo{
			ID: reqBody.NodeID,
		}
		exists, err = orm.Get(oldNodeInfo)
		if !exists || err != nil {
			h.WriteJSON(w, fmt.Sprintf("node [%s] of agent [%s] was not found", oldNodeInfo.ID, inst.Name), http.StatusInternalServerError)
			return
		}
	} else {
		//find out the node id with credentials
		cfg := reqBody.ESConfig
		if cfg.Endpoint == "" {
			cfg.Endpoint = cfg.GetAnyEndpoint()
		}
		basicAuth, err := common.GetBasicAuth(cfg)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		cfg.BasicAuth = basicAuth
		nodeInfo, err := AuthESNode(context.Background(), inst.GetEndpoint(), *cfg)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}

		//host, port, err := net.SplitHostPort(nodeInfo.PublishAddress)
		//if err != nil {
		//	log.Error(err)
		//	h.WriteError(w, err.Error(), http.StatusInternalServerError)
		//	return
		//}
		//if !util.StringInArray(inst.Network.IP, host) && !net.ParseIP(host).IsLoopback() {
		//	h.WriteError(w, fmt.Sprintf("got node host %s not match any ip of %v", host, inst.Network.IP), http.StatusInternalServerError)
		//	return
		//}
		//if oldNodeInfo.HttpPort != port {
		//	h.WriteError(w, fmt.Sprintf("port mismatch, got: %s，expected: %s", port, oldNodeInfo.HttpPort), http.StatusInternalServerError)
		//	return
		//}
		//if oldNodeInfo.ProcessInfo.PID != nodeInfo.ProcessInfo.PID {
		//	h.WriteError(w, fmt.Sprintf("process id mismatch, got: %d，expected: %d", nodeInfo.ProcessInfo.PID, oldNodeInfo.ProcessInfo.PID), http.StatusInternalServerError)
		//	return
		//}

		reqBody.NodeID = nodeInfo.NodeUUID
	}

	//nodeInfo:=elastic.NodeConfig{}
	//nodeInfo.ID = reqBody.NodeID
	//nodeInfo.AgentID = inst.ID
	//err = orm.Update(nil, nodeInfo) //update node's info and agent_id
	//if err != nil {
	//	log.Error(err)
	//	h.WriteError(w, err.Error(), http.StatusInternalServerError)
	//	return
	//}
	//h.WriteJSON(w, nodeInfo, http.StatusOK)
}

func NewClusterSettings(clusterID string) *model.Setting {
	settings := model.Setting{
		Metadata: model.SettingsMetadata{
			Category: Cluster,
		},
	}
	settings.ID = fmt.Sprintf("%v_%v_%v", settings.Metadata.Category, settings.Metadata.Name, clusterID)

	settings.Metadata.Labels = util.MapStr{
		"cluster_id": clusterID,
	}

	return &settings
}

func NewNodeAgentSettings(instanceID string, item *BindingItem) *model.Setting {

	settings := model.Setting{
		Metadata: model.SettingsMetadata{
			Category: Node,
			Name:     "agent",
		},
	}
	settings.ID = fmt.Sprintf("%v_%v_%v", settings.Metadata.Category, settings.Metadata.Name, item.NodeUUID)

	settings.Metadata.Labels = util.MapStr{
		"agent_id": instanceID,
	}

	settings.Payload = util.MapStr{
		"cluster_id":      item.ClusterID,
		"cluster_name":    item.ClusterName,
		"cluster_uuid":    item.ClusterUUID,
		"node_uuid":       item.NodeUUID,
		"publish_address": item.PublishAddress,
		"node_name": item.NodeName,
		"path_home": item.PathHome,
		"path_logs": item.PathLogs,
	}

	return &settings
}

func NewIndexSettings(clusterID, nodeID, agentID, indexName, indexID string) *model.Setting {

	settings := model.Setting{
		Metadata: model.SettingsMetadata{
			Category: Index,
		},
	}
	settings.ID = fmt.Sprintf("%v_%v_%v", settings.Metadata.Category, settings.Metadata.Name, nodeID)

	settings.Metadata.Labels = util.MapStr{
		"cluster_id": clusterID,
		"node_id":    nodeID,
		"agent_id":   agentID,
		"index_name": indexName,
		"index_id":   indexID,
	}

	return &settings
}

const Cluster = "cluster_settings"
const Node = "node_settings"
const Index = "index_settings"

func (h *APIHandler) revokeESNode(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	//agent id
	instID := ps.MustGetParameter("instance_id")
	item := BindingItem{}
	err := h.DecodeJSON(req, &item)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	settings := NewNodeAgentSettings(instID, &item)
	err = orm.Delete(&orm.Context{
		Refresh: "wait_for",
	}, settings)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (h *APIHandler) enrollESNode(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	//agent id
	instID := ps.MustGetParameter("instance_id")

	//node id and cluster id
	item := BindingItem{}
	err := h.DecodeJSON(req, &item)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	//update node's setting
	settings := NewNodeAgentSettings(instID, &item)
	err = orm.Update(&orm.Context{
		Refresh: "wait_for",
	}, settings)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteAckOKJSON(w)
}

func (h *APIHandler) autoAssociateESNode(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	reqBody := struct {
		ClusterIDs []string `json:"cluster_ids"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// query not associated nodes info
	nodesM, err := getUnAssociateNodes()
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(nodesM) == 0 {
		h.WriteAckOKJSON(w)
		return
	}
	agentIds := make([]string, 0, len(nodesM))
	for agentID := range nodesM {
		agentIds = append(agentIds, agentID)
	}
	agents, err := getAgentByIds(agentIds)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	for _, clusterID := range reqBody.ClusterIDs {
		// query cluster basicauth
		cfg := elastic.GetConfig(clusterID)
		basicAuth, err := common.GetBasicAuth(cfg)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		taskSetting, err := getSettingsByClusterID(cfg.ID)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		for agentID, nodes := range nodesM {
			var (
				inst *model.Instance
				ok   bool
			)
			if inst, ok = agents[agentID]; !ok {
				log.Warnf("agent [%v] was not found", agentID)
				continue
			}
			settings, err := common2.GetAgentSettings(agentID, 0)
			if err != nil {
				log.Error(err)
				continue
			}
			for _, v := range nodes {
				host := v.PublishAddress
				var endpoint string
				if strings.HasPrefix(host, "::") { //for ipv6
					instURL, err := url.Parse(inst.Endpoint)
					if err != nil {
						log.Error(err)
						continue
					}
					host = instURL.Hostname()
					endpoint = fmt.Sprintf("%s://[%s]:%s", v.Schema, host, v.HttpPort)
				} else {
					endpoint = fmt.Sprintf("%s://%s", v.Schema, host)
				}
				escfg := elastic.ElasticsearchConfig{
					Endpoint:  endpoint,
					BasicAuth: basicAuth,
				}
				nodeInfo, err := AuthESNode(context.Background(), inst.GetEndpoint(), escfg)
				if err != nil {
					log.Warn(err)
					continue
				}
				//matched
				if nodeInfo.ClusterUuid == cfg.ClusterUUID {
					//update node info
					nodeInfo.ID = v.ID
					nodeInfo.AgentID = inst.ID
					nodeInfo.ClusterID = cfg.ID
					err = orm.Save(nil, nodeInfo)
					if err != nil {
						log.Error(err)
						continue
					}
					setting := pickAgentSettings(settings, v)
					if setting == nil {
						tsetting := model3.TaskSetting{
							NodeStats: &model3.NodeStatsTask{
								Enabled: true,
							},
							Logs: &model3.LogsTask{
								Enabled:  true,
								LogsPath: nodeInfo.Path.Logs,
							},
						}
						if taskSetting.IndexStats != nil {
							tsetting.IndexStats = taskSetting.IndexStats
							taskSetting.IndexStats = nil
						}
						if taskSetting.ClusterHealth != nil {
							tsetting.ClusterHealth = taskSetting.ClusterHealth
							taskSetting.ClusterHealth = nil
						}
						if taskSetting.ClusterStats != nil {
							tsetting.ClusterStats = taskSetting.ClusterStats
							taskSetting.ClusterStats = nil
						}
						setting = &model.Setting{
							Metadata: model.SettingsMetadata{
								Category: "agent",
								Name:     "task",
								Labels: util.MapStr{
									"agent_id":     agentID,
									"cluster_uuid": nodeInfo.ClusterUuid,
									"cluster_id":   nodeInfo.ClusterID,
									"node_uuid":    nodeInfo.NodeUUID,
									"endpoint":     fmt.Sprintf("%s://%s", nodeInfo.Schema, nodeInfo.PublishAddress),
								},
							},
							Payload: util.MapStr{
								"task": tsetting,
							},
						}
						err = orm.Create(nil, setting)
						if err != nil {
							log.Error("save agent task setting error: ", err)
							h.WriteError(w, err.Error(), http.StatusInternalServerError)
							return
						}
					}
				}
			}

		}
	}
	h.WriteAckOKJSON(w)
}

func getAgentByIds(agentIDs []string) (map[string]*model.Instance, error) {
	query := util.MapStr{
		"size": len(agentIDs),
		"query": util.MapStr{
			"terms": util.MapStr{
				"id": agentIDs,
			},
		},
	}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}
	err, result := orm.Search(model.Instance{}, &q)
	if err != nil {
		return nil, err
	}
	agents := map[string]*model.Instance{}
	for _, row := range result.Result {
		inst := model.Instance{}
		buf := util.MustToJSONBytes(row)
		util.MustFromJSONBytes(buf, &inst)
		agents[inst.ID] = &inst
	}
	return agents, nil
}

func (h *APIHandler) deleteESNode(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("instance_id")
	nodeIDs := []string{}
	err := h.DecodeJSON(req, &nodeIDs)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(nodeIDs) > 0 {
		q := util.MapStr{
			"query": util.MapStr{
				"bool": util.MapStr{
					"must": []util.MapStr{
						{
							"terms": util.MapStr{
								"id": nodeIDs,
							},
						},
						{
							"term": util.MapStr{
								"agent_id": util.MapStr{
									"value": id,
								},
							},
						},
					},
				},
			},
		}
		err = orm.DeleteBy(model.ESNodeInfo{}, util.MustToJSONBytes(q))
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		q = util.MapStr{
			"query": util.MapStr{
				"bool": util.MapStr{
					"must": []util.MapStr{
						{
							"terms": util.MapStr{
								"metadata.labels.node_uuid": nodeIDs,
							},
						},
						{
							"term": util.MapStr{
								"metadata.labels.agent_id": util.MapStr{
									"value": id,
								},
							},
						},
					},
				},
			},
		}
	}
	h.WriteAckOKJSON(w)
}

//
//func (h *APIHandler) tryConnect(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
//	var reqBody = struct {
//		Endpoint  string `json:"endpoint"`
//		BasicAuth model.BasicAuth
//	}{}
//	err := h.DecodeJSON(req, &reqBody)
//	if err != nil {
//		h.WriteError(w, err.Error(), http.StatusInternalServerError)
//		return
//	}
//	connectRes, err := client.GetClient().GetInstanceBasicInfo(context.Background(), reqBody.Endpoint)
//	if err != nil {
//		h.WriteError(w, err.Error(), http.StatusInternalServerError)
//		return
//	}
//	h.WriteJSON(w, connectRes, http.StatusOK)
//}

func pickAgentSettings(settings []model.Setting, nodeInfo model.ESNodeInfo) *model.Setting {
	for _, setting := range settings {
		if setting.Metadata.Labels["node_uuid"] == nodeInfo.NodeUUID {
			return &setting
		}
	}
	return nil
}

func getAgentTaskSetting(agentID string, v model.ESNodeInfo) (*model.Setting, error) {
	taskSetting, err := getSettingsByClusterID(v.ClusterID)
	if err != nil {
		return nil, err
	}
	taskSetting.Logs = &model3.LogsTask{
		Enabled:  true,
		LogsPath: v.Path.Logs,
	}
	return &model.Setting{
		Metadata: model.SettingsMetadata{
			Category: "agent",
			Name:     "task",
			Labels: util.MapStr{
				"agent_id":     agentID,
				"cluster_uuid": v.ClusterUuid,
				"cluster_id":   v.ClusterID,
				"node_uuid":    v.NodeUUID,
				"endpoint":     fmt.Sprintf("%s://%s", v.Schema, v.PublishAddress),
			},
		},
		Payload: util.MapStr{
			"task": taskSetting,
		},
	}, nil
}

// getSettingsByClusterID query agent task settings with cluster id
func getSettingsByClusterID(clusterID string) (*model3.TaskSetting, error) {
	err, result := querySettingsByClusterID(clusterID)
	if err != nil {
		return nil, err
	}

	setting := &model3.TaskSetting{
		NodeStats: &model3.NodeStatsTask{
			Enabled: true,
		},
	}
	var (
		clusterStats  = true
		indexStats    = true
		clusterHealth = true
	)
	keys := []string{"payload.task.cluster_stats.enabled", "payload.task.cluster_health.enabled", "payload.task.index_stats.enabled"}
	for _, row := range result.Result {
		if v, ok := row.(map[string]interface{}); ok {
			vm := util.MapStr(v)
			for _, key := range keys {
				tv, _ := vm.GetValue(key)
				if tv == true {
					switch key {
					case "payload.task.cluster_stats.enabled":
						clusterStats = false
					case "payload.task.index_stats.enabled":
						indexStats = false
					case "payload.task.cluster_health.enabled":
						clusterHealth = false
					}
				}
			}
		}
	}
	if clusterStats {
		setting.ClusterStats = &model3.ClusterStatsTask{
			Enabled: true,
		}
	}
	if indexStats {
		setting.IndexStats = &model3.IndexStatsTask{
			Enabled: true,
		}
	}
	if clusterHealth {
		setting.ClusterHealth = &model3.ClusterHealthTask{
			Enabled: true,
		}
	}
	return setting, nil
}

func querySettingsByClusterID(clusterID string) (error, orm.Result) {
	queryDsl := util.MapStr{
		"size": 500,
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
				"minimum_should_match": 1,
				"should": []util.MapStr{
					{
						"term": util.MapStr{
							"payload.task.cluster_health.enabled": util.MapStr{
								"value": true,
							},
						},
					},
					{
						"term": util.MapStr{
							"payload.task.cluster_stats.enabled": util.MapStr{
								"value": true,
							},
						},
					},
					{
						"term": util.MapStr{
							"payload.task.index_stats.enabled": util.MapStr{
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
	return orm.Search(model.Setting{}, &q)
}

func GetHostInfo(ctx context.Context, agentBaseURL string) (*host.HostInfo, error) {
	req := &util.Request{
		Method:  http.MethodGet,
		Path:    "/agent/host/_basic",
		Context: ctx,
	}
	resBody := struct {
		Success  bool           `json:"success"`
		Error    string         `json:"error"`
		HostInfo *host.HostInfo `json:"result"`
	}{}

	req.Body = util.MustToJSONBytes(resBody)

	err := DoRequest(req, &resBody)
	if err != nil {
		return nil, err
	}

	if resBody.Success != true {
		return nil, fmt.Errorf("enroll error from client: %v", resBody.Error)
	}
	return resBody.HostInfo, nil
}

func GetElasticProcess(ctx context.Context, agentBaseURL string, agentID string) (interface{}, error) {
	req := &util.Request{
		Method:  http.MethodGet,
		Path:    fmt.Sprintf("/elasticsearch/%s/process/_elastic", agentID),
		Context: ctx,
	}
	resBody := map[string]interface{}{}
	err := DoRequest(req, &resBody)
	if err != nil {
		return nil, err
	}
	if resBody["success"] != true {
		return nil, fmt.Errorf("discover host callback error: %v", resBody["error"])
	}
	return resBody["elastic_process"], nil
}

func GetInstanceBasicInfo(ctx context.Context, agentBaseURL string) (*model.Instance, error) {
	req := &util.Request{
		Method:  http.MethodGet,
		Path:    "/_info",
		Context: ctx,
	}
	resBody := &model.Instance{}
	err := DoRequest(req, &resBody)
	return resBody, err
}

func RegisterElasticsearch(ctx context.Context, agentBaseURL string, cfgs []elastic.ElasticsearchConfig) error {
	reqBody, err := util.ToJSONBytes(cfgs)
	if err != nil {
		return err
	}
	req := &util.Request{
		Method:  http.MethodPost,
		Path:    "/elasticsearch/_register",
		Context: ctx,
		Body:    reqBody,
	}
	resBody := util.MapStr{}
	err = DoRequest(req, &resBody)
	if err != nil {
		return err
	}
	if resBody["acknowledged"] != true {
		return fmt.Errorf("%v", resBody["error"])
	}
	return nil
}

func CreatePipeline(ctx context.Context, agentBaseURL string, body []byte) error {
	req := &util.Request{
		Method:  http.MethodPost,
		Path:    "/pipeline/tasks/",
		Body:    body,
		Context: ctx,
	}
	resBody := util.MapStr{}
	return DoRequest(req, &resBody)
}

func DeletePipeline(ctx context.Context, agentBaseURL, pipelineID string) error {
	req := &util.Request{
		Method:  http.MethodDelete,
		Path:    fmt.Sprintf("/pipeline/task/%s", pipelineID),
		Context: ctx,
	}
	return DoRequest(req, nil)
}

func DoRequest(req *util.Request, obj interface{}) error {
	panic("implement me")
}

var mTLSClient *http.Client //TODO get mTLSClient
var initOnce = sync.Once{}

func doRequest(instance *model.Instance, req *util.Request, obj interface{}) error {
	var err error
	var res *util.Result

	initOnce.Do(func() {
		if global.Env().SystemConfig.Configs.TLSConfig.TLSEnabled && global.Env().SystemConfig.Configs.TLSConfig.TLSCAFile != "" {

			//init client
			hClient, err := util.NewMTLSClient(
				global.Env().SystemConfig.Configs.TLSConfig.TLSCAFile,
				global.Env().SystemConfig.Configs.TLSConfig.TLSCertFile,
				global.Env().SystemConfig.Configs.TLSConfig.TLSKeyFile)
			if err != nil {
				panic(err)
			}
			mTLSClient = hClient
		}
	})

	req.Url, err = url.JoinPath(instance.GetEndpoint(), req.Path)
	res, err = util.ExecuteRequestWithCatchFlag(mTLSClient, req, true)
	if err != nil || res.StatusCode != 200 {
		body := ""
		if res != nil {
			body = string(res.Body)
		}
		return errors.New(fmt.Sprintf("request error: %v, %v", err, body))
	}

	if res != nil {
		if res.Body != nil {
			return util.FromJSONBytes(res.Body, obj)
		}
	}

	return nil
}
