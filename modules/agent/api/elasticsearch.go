/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"bytes"
	"context"
	"fmt"
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	common2 "infini.sh/framework/modules/elastic/common"
	"infini.sh/framework/plugins/managed/common"
	"net/http"
	"time"
)

//node -> binding item
func GetEnrolledNodesByAgent(instance *model.Instance) (map[string]BindingItem, error) {

	//get nodes settings where agent id = instance id
	q := orm.Query{
		Size: 1000,
		Conds: orm.And(orm.Eq("metadata.category", "node_settings"),
			orm.Eq("metadata.name", "agent"),
			orm.Eq("metadata.labels.agent_id", instance.ID),
		),
	}

	err, result := orm.Search(model.Setting{}, &q)

	if err != nil {
		return nil, err
	}

	ids := map[string]BindingItem{}
	for _, row := range result.Result {
		v, ok := row.(map[string]interface{})
		if ok {
			x, ok := v["payload"]
			if ok {
				f, ok := x.(map[string]interface{})
				if ok {
					nodeID, ok := f["node_uuid"].(string)
					if ok {
						item := BindingItem{}
						item.ClusterID = util.ToString(f["cluster_id"])
						item.ClusterName = util.ToString(f["cluster_name"])
						item.ClusterUUID = util.ToString(f["cluster_uuid"])
						item.PublishAddress = util.ToString(f["publish_address"])
						item.NodeName = util.ToString(f["node_name"])
						item.PathHome = util.ToString(f["path_home"])
						item.PathLogs = util.ToString(f["path_logs"])
						item.NodeUUID = nodeID

						t, ok := v["updated"]
						if ok {
							layout := "2006-01-02T15:04:05.999999-07:00"
							t1, err := time.Parse(layout, util.ToString(t))
							if err == nil {
								item.Updated = t1.Unix()
							}
						}
						ids[item.NodeUUID] = item

					}
				}
			}
		}
	}
	return ids, nil
}

func refreshNodesInfo(inst *model.Instance) (*elastic.DiscoveryResult, error) {
	enrolledNodesByAgent, err := GetEnrolledNodesByAgent(inst)
	if err != nil {
		return nil, fmt.Errorf("error on get binding nodes info: %w", err)
	}

	ctxTimeout, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	nodesInfo, err := GetElasticsearchNodesViaAgent(ctxTimeout, inst)
	if err != nil {
		//TODO return already biding nodes info ??
		return nil, fmt.Errorf("error on get nodes info from agent: %w", err)
	}

	for nodeID, node := range nodesInfo.Nodes {

		v, ok := enrolledNodesByAgent[nodeID]
		if ok {
			node.ClusterID = v.ClusterID
			node.Enrolled = true
		}
	}

	////not recognized by agent, need auth?
	//for _, node := range nodesInfo.UnknownProcess{
	//	for _, v := range node.ListenAddresses {
	//		//ask user to manual enroll this node
	//		//check local credentials, if it works, get node info
	//	}
	//}

	// {
	//	//node was not recognized by agent, need auth?
	//	if node.HttpPort != "" {
	//		for _, v := range enrolledNodesByAgent {
	//			if v.PublishAddress != "" {
	//				if util.UnifyLocalAddress(v.PublishAddress) == util.UnifyLocalAddress(node.PublishAddress) {
	//					node.ClusterID = v.ClusterID
	//					node.ClusterName = v.ClusterName
	//					node.NodeUUID = v.NodeUUID
	//					node.ClusterUuid = v.ClusterUUID
	//					node.NodeName = v.NodeName
	//					node.Path.Home = v.PathHome
	//					node.Path.Logs = v.PathLogs
	//					node.AgentID = inst.ID
	//					//TODO verify node info if the node id really match, need to fetch the credentials for agent
	//					//or let manager sync configs to this agent, verify the node info after receiving the configs
	//					//report any error along with this agent and node info
	//					break
	//				}
	//			}
	//		}
	//	}
	//
	//}

	return nodesInfo, nil
}

type RemoteConfig struct {
	orm.ORMObjectBase
	Metadata model.Metadata    `json:"metadata" elastic_mapping:"metadata: { type: object }"`
	Payload  common.ConfigFile `json:"payload" elastic_mapping:"payload: { type: object}"`
}

func remoteConfigProvider(instance model.Instance) []*common.ConfigFile {

	//fetch configs from remote db
	//fetch configs assigned to (instance=_all OR instance=$instance_id ) AND application.name=$application.name

	q := orm.Query{
		Size: 1000,
		Conds: orm.And(orm.Eq("metadata.category", "app_settings"),
			orm.Eq("metadata.name", instance.Application.Name),
			orm.Eq("metadata.labels.instance", "_all"),
		),
	}

	err, searchResult := orm.Search(RemoteConfig{}, &q)
	if err != nil {
		panic(err)
	}

	result := []*common.ConfigFile{}

	for _, row := range searchResult.Result {
		v, ok := row.(map[string]interface{})
		if ok {
			x, ok := v["payload"]
			if ok {
				f, ok := x.(map[string]interface{})
				if ok {
					name, ok := f["name"].(string)
					if ok {
						item := common.ConfigFile{}
						item.Name = util.ToString(name)
						item.Location = util.ToString(f["location"])
						item.Content = util.ToString(f["content"])
						item.Version,_ = util.ToInt64(util.ToString(f["version"]))
						item.Size = int64(len(item.Content))
						item.Managed = true
						t, ok := v["updated"]
						if ok {
							layout := "2006-01-02T15:04:05.999999-07:00"
							t1, err := time.Parse(layout, util.ToString(t))
							if err == nil {
								item.Updated = t1.Unix()
							}
						}
						result=append(result,&item)
					}
				}
			}
		}
	}

	return result
}

func dynamicAgentConfigProvider(instance model.Instance) []*common.ConfigFile {

	//get config files from remote db
	//get settings with this agent id
	result := []*common.ConfigFile{}
	ids, err := GetEnrolledNodesByAgent(&instance)
	if err != nil {
		panic(err)
	}

	var latestTimestamp int64
	for _, v := range ids {
		if v.Updated > latestTimestamp {
			latestTimestamp = v.Updated
		}
	}

	if len(ids) > 0 {

		cfg := common.ConfigFile{}
		cfg.Name = "generated_metrics_tasks.yml"
		cfg.Location = "generated_metrics_tasks.yml"
		cfg.Content = getConfigs(ids)
		cfg.Size = int64(len(cfg.Content))
		cfg.Version = latestTimestamp
		cfg.Managed = true
		cfg.Updated = latestTimestamp
		result = append(result, &cfg)
	}

	return result
}

func getConfigs(items map[string]BindingItem) string {
	buffer := bytes.NewBuffer([]byte("configs.template:\n  "))

	for _, v := range items {

		if v.ClusterID == "" {
			panic("cluster id is empty")
		}
		metadata := elastic.GetMetadata(v.ClusterID)
		var clusterLevelEnabled = false
		var nodeLevelEnabled = true
		var clusterEndPoint = metadata.Config.GetAnyEndpoint()
		credential, err := common2.GetCredential(metadata.Config.CredentialID)
		if err != nil {
			panic(err)
		}
		var dv interface{}
		dv, err = credential.Decode()
		if err != nil {
			panic(err)
		}
		var username = ""
		var password = ""

		if auth, ok := dv.(model.BasicAuth); ok {
			username = auth.Username
			password = auth.Password
		}

		buffer.Write([]byte(fmt.Sprintf("- name: \"%v\"\n    path: ./config/task_config.tpl\n    "+
			"variable:\n      "+
			"CLUSTER_ID: %v\n      "+
			"CLUSTER_ENDPOINT: [\"%v\"]\n      "+
			"CLUSTER_USERNAME: \"%v\"\n      "+
			"CLUSTER_PASSWORD: \"%v\"\n      "+
			"CLUSTER_LEVEL_TASKS_ENABLED: %v\n      "+
			"NODE_LEVEL_TASKS_ENABLED: %v\n      "+
			"NODE_LOGS_PATH: \"%v\"\n\n\n"+
			"#MANAGED_CONFIG_VERSION: %v\n"+
			"#MANAGED: true",
			v.NodeUUID, v.ClusterID, clusterEndPoint, username, password, clusterLevelEnabled, nodeLevelEnabled, v.PathLogs, v.Updated)))
	}

	//password: $[[keystore.$[[CLUSTER_ID]]_password]]

	return buffer.String()
}

//get nodes info via agent
func GetElasticsearchNodesViaAgent(ctx context.Context, instance *model.Instance) (*elastic.DiscoveryResult, error) {
	req := &util.Request{
		Method:  http.MethodGet,
		Path:    "/elasticsearch/nodes/_discovery",
		Context: ctx,
	}

	obj := elastic.DiscoveryResult{}
	err := doRequest(instance, req, &obj)
	if err != nil {
		return nil, err
	}

	return &obj, nil
}

func AuthESNode(ctx context.Context, agentBaseURL string, cfg elastic.ElasticsearchConfig) (*model.ESNodeInfo, error) {
	reqBody, err := util.ToJSONBytes(cfg)
	if err != nil {
		return nil, err
	}
	req := &util.Request{
		Method:  http.MethodPost,
		Path:    "/elasticsearch/_auth",
		Context: ctx,
		Body:    reqBody,
	}
	resBody := &model.ESNodeInfo{}
	err = DoRequest(req, resBody)
	if err != nil {
		return nil, err
	}
	return resBody, nil
}

func getNodeByPidOrUUID(nodes map[int]*model.ESNodeInfo, pid int, uuid string, port string) *model.ESNodeInfo {
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

type BindingItem struct {
	ClusterName    string `json:"cluster_name"`
	ClusterUUID    string `json:"cluster_uuid"`
	NodeUUID       string `json:"node_uuid"`
	PublishAddress string `json:"publish_address"`
	NodeName       string `json:"node_name"`
	PathLogs       string `json:"path_logs"`
	PathHome       string `json:"path_home"`

	//infini system assigned id
	ClusterID string `json:"cluster_id"`
	Updated   int64  `json:"updated"`
}

func getUnAssociateNodes() (map[string][]model.ESNodeInfo, error) {
	query := util.MapStr{
		"size": 3000,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must_not": []util.MapStr{
					{
						"exists": util.MapStr{
							"field": "cluster_id",
						},
					},
				},
			},
		},
	}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}

	err, result := orm.Search(model.ESNodeInfo{}, &q)
	if err != nil {
		return nil, err
	}
	nodesInfo := map[string][]model.ESNodeInfo{}
	for _, row := range result.Result {
		node := model.ESNodeInfo{}
		buf := util.MustToJSONBytes(row)
		util.MustFromJSONBytes(buf, &node)
		nodesInfo[node.AgentID] = append(nodesInfo[node.AgentID], node)
	}
	return nodesInfo, nil
}

func GetElasticLogFiles(ctx context.Context, instance *model.Instance, logsPath string) (interface{}, error) {

	reqBody := util.MustToJSONBytes(util.MapStr{
		"logs_path": logsPath,
	})
	req := &util.Request{
		Method:  http.MethodPost,
		Path:    "/elasticsearch/logs/_list",
		Context: ctx,
		Body:    reqBody,
	}
	resBody := map[string]interface{}{}
	err := doRequest(instance, req, &resBody)
	if err != nil {
		return nil, err
	}
	if resBody["success"] != true {
		return nil, fmt.Errorf("get elasticsearch log files error: %v", resBody)
	}
	return resBody["result"], nil
}

func GetElasticLogFileContent(ctx context.Context, instance *model.Instance, body interface{}) (interface{}, error) {
	req := &util.Request{
		Method:  http.MethodPost,
		Path:    "/elasticsearch/logs/_read",
		Context: ctx,
		Body:    util.MustToJSONBytes(body),
	}
	resBody := map[string]interface{}{}
	err := doRequest(instance, req, &resBody)
	if err != nil {
		return nil, err
	}
	if resBody["success"] != true {
		return nil, fmt.Errorf("get elasticsearch log files error: %v", resBody["error"])
	}
	var hasMore bool
	if v, ok := resBody["EOF"].(bool); ok && !v {
		hasMore = true
	}
	return map[string]interface{}{
		"lines":    resBody["result"],
		"has_more": hasMore,
	}, nil
}

func (h *APIHandler) getLogFilesByNode(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	nodeID := ps.MustGetParameter("node_id")
	inst, pathLogs, err := getAgentByNodeID(nodeID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if inst == nil {
		log.Error(fmt.Sprintf("can not find agent by node [%s]", nodeID))
		h.WriteJSON(w, util.MapStr{
			"success": false,
			"reason":  "AGENT_NOT_FOUND",
		}, http.StatusOK)
		return
	}
	logFiles, err := GetElasticLogFiles(nil, inst, pathLogs)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	h.WriteJSON(w, util.MapStr{
		"success":   true,
		"log_files": logFiles,
	}, http.StatusOK)
}

func (h *APIHandler) getLogFileContent(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	nodeID := ps.MustGetParameter("node_id")
	inst, pathLogs, err := getAgentByNodeID(nodeID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if inst == nil {
		h.WriteError(w, fmt.Sprintf("can not find agent by node [%s]", nodeID), http.StatusInternalServerError)
		return
	}
	reqBody := struct {
		FileName        string `json:"file_name"`
		LogsPath        string `json:"logs_path"`
		Offset          int    `json:"offset"`
		Lines           int    `json:"lines"`
		StartLineNumber int64  `json:"start_line_number"`
	}{}
	err = h.DecodeJSON(req, &reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	reqBody.LogsPath = pathLogs
	res, err := GetElasticLogFileContent(nil, inst, reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	h.WriteJSON(w, res, http.StatusOK)
}

//instance, pathLogs
func getAgentByNodeID(nodeID string) (*model.Instance, string, error) {

	q := orm.Query{
		Size: 1000,
		Conds: orm.And(orm.Eq("metadata.category", "node_settings"),
			orm.Eq("metadata.name", "agent"),
			orm.Eq("payload.node_uuid", nodeID),
		),
	}

	err, result := orm.Search(model.Setting{}, &q)
	if err != nil {
		return nil, "", err
	}

	for _, row := range result.Result {
		v, ok := row.(map[string]interface{})
		if ok {
			pathLogs := ""
			payload, ok := v["payload"]
			if ok {
				payloadMap, ok := payload.(map[string]interface{})
				if ok {
					pathLogs = util.ToString(payloadMap["path_logs"])
				}
			}

			x, ok := v["metadata"]
			if ok {
				f, ok := x.(map[string]interface{})
				if ok {
					labels, ok := f["labels"].(map[string]interface{})
					if ok {
						id, ok := labels["agent_id"]
						if ok {
							inst := &model.Instance{}
							inst.ID = util.ToString(id)
							_, err = orm.Get(inst)
							if err != nil {
								return nil, pathLogs, err
							}
							if inst.Name == "" {
								return nil, pathLogs, nil
							}
							return inst, pathLogs, nil
						}
					}
				}
			}
		}
	}
	return nil, "", nil
}
