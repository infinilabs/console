/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"context"
	"fmt"
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/adapter"
	"infini.sh/framework/modules/elastic/common"
	"infini.sh/framework/modules/elastic/metadata"
	"infini.sh/framework/plugins/managed/server"
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

	newNodes := map[string]*elastic.LocalNodeInfo{}
	//binding nodes info with agent
	for nodeID, node := range nodesInfo.Nodes {
		v, ok := enrolledNodesByAgent[nodeID]
		node.Status = "online"
		if ok {
			node.ClusterID = v.ClusterID
			node.Enrolled = true

			//output
			newNodes[nodeID] = node
		} else {
			newNodes[nodeID] = node
		}
	}

	//TODO, merge requests to one
	for k, v := range enrolledNodesByAgent {
		if _, ok := newNodes[k]; !ok {
			client := elastic.GetClient(v.ClusterID)
			status := "online"
			nodeInfo, err := client.GetNodeInfo(v.NodeUUID)
			var clusterInfo *elastic.ClusterInformation
			if err != nil ||nodeInfo == nil {
				status= "offline"

				//get nodes information
				nodeInfos, err := metadata.GetNodeInformation(v.ClusterID,[]string{v.NodeUUID})
				if err!=nil||len(nodeInfos)==0{
					log.Error("node info not found:",v.ClusterID,",",[]string{v.NodeUUID},",",err,err!=nil,len(nodeInfos)==0)
					continue
				}

				nodeInfo=nodeInfos[0]

				//get cluster information
				clusterInfo,err=metadata.GetClusterInformation(v.ClusterID)
				if err!=nil||clusterInfo==nil{
					log.Error("cluster info not found:",v.ClusterID,",",err,clusterInfo==nil)
					continue
				}


			}else{
				clusterInfo, err = adapter.ClusterVersion(elastic.GetMetadata(v.ClusterID))
				if err != nil || clusterInfo == nil{
					log.Error(err)
					continue
				}
			}

			newNodes[k] = &elastic.LocalNodeInfo{
				Status:      status,
				ClusterID:   v.ClusterID,
				NodeUUID:    v.NodeUUID,
				Enrolled:    true,
				NodeInfo:    nodeInfo,
				ClusterInfo: clusterInfo,
			}
		}
	}

	nodesInfo.Nodes = newNodes

	return nodesInfo, nil
}

//get nodes info via agent
func GetElasticsearchNodesViaAgent(ctx context.Context, instance *model.Instance) (*elastic.DiscoveryResult, error) {
	req := &util.Request{
		Method:  http.MethodGet,
		Path:    "/elasticsearch/node/_discovery",
		Context: ctx,
	}

	obj := elastic.DiscoveryResult{}
	_, err := server.ProxyAgentRequest(instance.GetEndpoint(), req, &obj)
	if err != nil {
		return nil, err
	}

	return &obj, nil
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
	_, err := server.ProxyAgentRequest(instance.GetEndpoint(), req, &resBody)
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
	_, err := server.ProxyAgentRequest(instance.GetEndpoint(), req, &resBody)
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

type ClusterInfo struct {
	ClusterIDs []string `json:"cluster_id"`
}

func (h *APIHandler) discoveryESNodesInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	id := ps.MustGetParameter("instance_id")
	instance := model.Instance{}
	instance.ID = id
	exists, err := orm.Get(&instance)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}

	nodes, err := refreshNodesInfo(&instance)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(nodes.UnknownProcess) > 0 {

		var discoveredPIDs map[int]*elastic.LocalNodeInfo = make(map[int]*elastic.LocalNodeInfo)

		if req.Method == "POST" {
			bytes, err := h.GetRawBody(req)
			if err != nil {
				panic(err)
			}
			if len(bytes) > 0 {
				clusterInfo := ClusterInfo{}
				util.FromJSONBytes(bytes, &clusterInfo)
				if len(clusterInfo.ClusterIDs) > 0 {
					//try connect this node to cluster by using this cluster's agent credential
					for _, clusterID := range clusterInfo.ClusterIDs {
						meta := elastic.GetMetadata(clusterID)
						if meta != nil {
							if meta.Config.AgentCredentialID != "" {
								auth, err := common.GetAgentBasicAuth(meta.Config)
								if err != nil {
									panic(err)
								}
								if auth != nil {
									//try connect
									for _, node := range nodes.UnknownProcess {
										for _, v := range node.ListenAddresses {
											ip := v.IP
											if util.ContainStr(v.IP, "::") {
												ip = fmt.Sprintf("[%s]", v.IP)
											}
											nodeHost := fmt.Sprintf("%s:%d", ip, v.Port)
											success, tryAgain, nodeInfo := h.getESNodeInfoViaProxy(nodeHost, "http", auth, &instance)
											if !success && tryAgain {
												//try https again
												success, tryAgain, nodeInfo = h.getESNodeInfoViaProxy(nodeHost, "https", auth, &instance)
											}
											if success {
												log.Error("connect to es node success:", nodeHost)
												discoveredPIDs[node.PID] = nodeInfo
												break
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}

		newUnknownProcess := []model.ProcessInfo{}
		if len(discoveredPIDs) > 0 {
			for _, node := range nodes.UnknownProcess {
				if item, ok := discoveredPIDs[node.PID]; !ok {
					newUnknownProcess = append(newUnknownProcess, node)
				} else {
					nodes.Nodes[item.NodeUUID] = item
				}
			}
			nodes.UnknownProcess = newUnknownProcess
		}
	}

	h.WriteJSON(w, nodes, http.StatusOK)
}

func (h *APIHandler) getESNodeInfoViaProxy(esHost string, esSchema string, auth *model.BasicAuth, instance *model.Instance) (success, tryAgain bool, info *elastic.LocalNodeInfo) {
	esConfig := elastic.ElasticsearchConfig{Host: esHost, Schema: esSchema, BasicAuth: auth}
	return h.getESNodeInfoViaProxyWithConfig(&esConfig, auth, instance)
}

func (h *APIHandler) getESNodeInfoViaProxyWithConfig(cfg *elastic.ElasticsearchConfig, auth *model.BasicAuth, instance *model.Instance) (success, tryAgain bool, info *elastic.LocalNodeInfo) {
	body := util.MustToJSONBytes(cfg)
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	req := &util.Request{
		Method:  http.MethodPost,
		Path:    "/elasticsearch/node/_info",
		Context: ctx,
		Body:    body,
	}
	if auth != nil {
		req.SetBasicAuth(auth.Username, auth.Password)
	}

	obj := elastic.LocalNodeInfo{}
	res, err := server.ProxyAgentRequest(instance.GetEndpoint(), req, &obj)
	if err != nil {
		if global.Env().IsDebug {
			log.Error(err)
		}
		return false, true, nil
	}

	if res != nil && res.StatusCode == http.StatusForbidden {
		return false, false, nil
	}

	if res != nil && res.StatusCode == http.StatusOK {
		node := elastic.LocalNodeInfo{}
		err := util.FromJSONBytes(res.Body, &node)
		if err != nil {
			panic(err)
		}
		return true, false, &node
	}

	return false, true, nil
}

func NewClusterSettings(clusterID string) *model.Setting {
	settings := model.Setting{
		Metadata: model.Metadata{
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
		Metadata: model.Metadata{
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
		"node_name":       item.NodeName,
		"path_home":       item.PathHome,
		"path_logs":       item.PathLogs,
	}

	return &settings
}

func NewIndexSettings(clusterID, nodeID, agentID, indexName, indexID string) *model.Setting {

	settings := model.Setting{
		Metadata: model.Metadata{
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
	h.WriteAckOKJSON(w)
}

func (h *APIHandler) enrollESNode(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	//agent id
	instID := ps.MustGetParameter("instance_id")

	exists, instance, err := server.GetRuntimeInstanceByID(instID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !exists {
		h.WriteError(w, "instance not found", http.StatusInternalServerError)
	}

	//node id and cluster id
	item := BindingItem{}
	err = h.DecodeJSON(req, &item)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	//check if the cluster's agent credential is valid
	meta := elastic.GetMetadata(item.ClusterID)
	if meta == nil {
		h.WriteError(w, "cluster not found", http.StatusInternalServerError)
		return
	}

	//use agent credential to access the node
	meta.Config.BasicAuth, _ = common.GetAgentBasicAuth(meta.Config)

	success, _, _ := h.getESNodeInfoViaProxyWithConfig(meta.Config, meta.Config.BasicAuth, instance)

	if success {
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
	} else {
		h.WriteError(w, "failed to access this node", http.StatusInternalServerError)
	}
}
