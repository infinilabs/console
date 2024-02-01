/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"context"
	"errors"
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
	"runtime"
	"sync/atomic"
	"time"
)

//node -> binding item
func GetEnrolledNodesByAgent(instanceID string) (map[string]BindingItem, error) {

	//get nodes settings where agent id = instance id
	q := orm.Query{
		Size: 1000,
		Conds: orm.And(orm.Eq("metadata.category", "node_settings"),
			orm.Eq("metadata.name", "agent"),
			orm.Eq("metadata.labels.agent_id", instanceID),
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

						item.ClusterUUID = util.ToString(f["cluster_uuid"])
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

func refreshNodesInfo(instanceID, instanceEndpoint string) (*elastic.DiscoveryResult, error) {
	enrolledNodesByAgent, err := GetEnrolledNodesByAgent(instanceID)
	if err != nil {
		return nil, fmt.Errorf("error on get binding nodes info: %w", err)
	}

	ctxTimeout, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	nodesInfo, err := GetElasticsearchNodesViaAgent(ctxTimeout, instanceEndpoint)
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

	var findPIDS = map[int]*elastic.NodesInfo{}

	//TODO, merge requests to one
	for k, v := range enrolledNodesByAgent {

		if _, ok := newNodes[k]; !ok {
			client := elastic.GetClientNoPanic(v.ClusterID)
			if client == nil {
				log.Error("client not found:", v.ClusterID)
				continue
			}
			status := "online"
			nodeInfo, err := client.GetNodeInfo(v.NodeUUID)
			var clusterInfo *elastic.ClusterInformation
			if err != nil || nodeInfo == nil {
				status = "offline"

				//get nodes information
				nodeInfos, err := metadata.GetNodeInformation(v.ClusterID, []string{v.NodeUUID})
				if err != nil || len(nodeInfos) == 0 {
					log.Error("node info not found:", v.ClusterID, ",", []string{v.NodeUUID}, ",", err, err != nil, len(nodeInfos) == 0)
					continue
				}

				//get node information
				nodeInfo, ok = nodeInfos[v.NodeUUID]
				if !ok {
					log.Error("node info not found:", v.ClusterID, ",", v.NodeUUID, ",", err)
					continue
				}

				//get cluster information
				clusterInfo, err = metadata.GetClusterInformation(v.ClusterID)
				if err != nil || clusterInfo == nil {
					log.Error("cluster info not found:", v.ClusterID, ",", err, clusterInfo == nil)
					continue
				}
			} else {
				clusterInfo, err = adapter.ClusterVersion(elastic.GetMetadata(v.ClusterID))
				if err != nil || clusterInfo == nil {
					log.Error(err)
					continue
				}
			}

			findPIDS[nodeInfo.Process.Id] = nodeInfo

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
	newUnknows := []model.ProcessInfo{}
	for _, v := range nodesInfo.UnknownProcess {

		if _, ok := findPIDS[v.PID]; !ok {
			newUnknows = append(newUnknows, v)
		}
	}
	nodesInfo.UnknownProcess = newUnknows
	return nodesInfo, nil
}

//get nodes info via agent
func GetElasticsearchNodesViaAgent(ctx context.Context, endpoint string) (*elastic.DiscoveryResult, error) {
	req := &util.Request{
		Method:  http.MethodGet,
		Path:    "/elasticsearch/node/_discovery",
		Context: ctx,
	}

	obj := elastic.DiscoveryResult{}
	_, err := server.ProxyAgentRequest("elasticsearch",endpoint, req, &obj)
	if err != nil {
		return nil, err
	}

	return &obj, nil
}

type BindingItem struct {
	//infini system assigned id
	ClusterID string `json:"cluster_id"`

	ClusterUUID string `json:"cluster_uuid"`
	NodeUUID    string `json:"node_uuid"`

	Updated int64 `json:"updated"`
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
	_, err := server.ProxyAgentRequest("elasticsearch",instance.GetEndpoint(), req, &resBody)
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
	_, err := server.ProxyAgentRequest("elasticsearch",instance.GetEndpoint(), req, &resBody)
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
	clusterID := ps.MustGetParameter("id")
	nodeID := ps.MustGetParameter("node_id")
	inst, pathLogs, err := getAgentByNodeID(clusterID, nodeID)
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
	clusterID := ps.MustGetParameter("id")
	nodeID := ps.MustGetParameter("node_id")
	inst, pathLogs, err := getAgentByNodeID(clusterID, nodeID)
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
func getAgentByNodeID(clusterID, nodeID string) (*model.Instance, string, error) {

	q := orm.Query{
		Size: 1000,
		Conds: orm.And(orm.Eq("metadata.category", "node_settings"),
			orm.Eq("metadata.name", "agent"),
			orm.Eq("payload.cluster_id", clusterID),
			orm.Eq("payload.node_uuid", nodeID),
		),
	}

	err, result := orm.Search(model.Setting{}, &q)
	if err != nil {
		return nil, "", err
	}

	nodeInfo, err := metadata.GetNodeConfig(clusterID, nodeID)
	if err != nil || nodeInfo == nil {
		log.Error("node info is nil")
		return nil, "", err
	}

	pathLogs := nodeInfo.Payload.NodeInfo.GetPathLogs()

	for _, row := range result.Result {
		v, ok := row.(map[string]interface{})
		if ok {

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

var autoEnrollRunning = atomic.Bool{}

func (h *APIHandler) autoEnrollESNode(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	//{"cluster_id":["infini_default_system_cluster"]}
	clusterInfo := ClusterInfo{}
	if req.Method == "POST" {
		bytes, err := h.GetRawBody(req)
		if err != nil {
			panic(err)
		}
		if len(bytes) > 0 {
			util.FromJSONBytes(bytes, &clusterInfo)
		}
	}

	if len(clusterInfo.ClusterIDs) <= 0 {
		panic(errors.New("please select cluster to enroll"))
	}

	if autoEnrollRunning.Load() {
		return
	}

	autoEnrollRunning.Swap(true)
	go func(clusterInfo ClusterInfo) {
		defer func() {
			autoEnrollRunning.Swap(false)
			if !global.Env().IsDebug {
				if r := recover(); r != nil {
					var v string
					switch r.(type) {
					case error:
						v = r.(error).Error()
					case runtime.Error:
						v = r.(runtime.Error).Error()
					case string:
						v = r.(string)
					}
					if v != "" {
						log.Error(v)
					}
				}
			}
			log.Debug("finish auto enroll")
		}()

		log.Debug("start auto enroll")
		//get instances
		q := &orm.Query{Conds: orm.And(orm.Eq("application.name", "agent"))}
		q.From = 0
		q.Size = 50000
		err, res := orm.Search(&model.Instance{}, q)
		if err != nil {
			log.Error(err)
			return
		}

		for _, v := range res.Result {
			f, ok := v.(map[string]interface{})
			if ok {
				instanceIDObj, ok1 := f["id"]
				instanceEndpointObj, ok2 := f["endpoint"]
				if ok1 && ok2 {
					instanceID, ok1 := instanceIDObj.(string)
					instanceEndpoint, ok2 := instanceEndpointObj.(string)
					if ok1 && ok2 {
						nodes, err := refreshNodesInfo(instanceID, instanceEndpoint)
						if err != nil {
							log.Error(err)
							continue
						}
						log.Debugf("instance:%v,%v, has: %v nodes, %v unknown nodes", instanceID, instanceEndpoint, len(nodes.Nodes), len(nodes.UnknownProcess))
						if len(nodes.UnknownProcess) > 0 {
							pids := h.bindInstanceToCluster(clusterInfo, nodes, instanceID, instanceEndpoint)
							log.Infof("instance:%v,%v, success enroll %v nodes", instanceID, instanceEndpoint, len(pids))
						}

						if len(nodes.Nodes)>0{
							for k,v:=range nodes.Nodes{
								log.Debug(k,v.Status,v.Enrolled)
								if !v.Enrolled{
									pids := h.bindInstanceToCluster(clusterInfo, nodes, instanceID, instanceEndpoint)
									log.Infof("instance:%v,%v, success enroll %v nodes", instanceID, instanceEndpoint, len(pids))
								}
							}
						}
					}
				}
			}
		}

	}(clusterInfo)

	//get all unknown nodes
	//check each process with cluster id

	//send this to background task

	h.WriteAckOKJSON(w)
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

	nodes, err := refreshNodesInfo(instance.ID, instance.GetEndpoint())
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
				discoveredPIDs = h.bindInstanceToCluster(clusterInfo, nodes, instance.ID, instance.GetEndpoint())
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

func (h *APIHandler) bindInstanceToCluster(clusterInfo ClusterInfo, nodes *elastic.DiscoveryResult, instanceID, instanceEndpoint string) map[int]*elastic.LocalNodeInfo {
	discoveredPIDs := map[int]*elastic.LocalNodeInfo{}
	if len(clusterInfo.ClusterIDs) > 0 {
		//try connect this node to cluster by using this cluster's agent credential
		for _, clusterID := range clusterInfo.ClusterIDs {
			meta := elastic.GetMetadata(clusterID)
			if meta != nil {
				states, err := elastic.GetClient(clusterID).GetClusterState()
				if err != nil || states == nil {
					log.Error(err)
					continue
				}

				clusterUUID := states.ClusterUUID

				//no auth or agent auth configured
				if meta.Config.AgentCredentialID != "" || meta.Config.CredentialID == "" {
					auth, err := common.GetAgentBasicAuth(meta.Config)
					if err != nil {
						panic(err)
					}

					for _,v:=range nodes.Nodes{
						if !v.Enrolled{
							if v.NodeInfo!=nil{
								pid:=v.NodeInfo.Process.Id
								nodeHost:=v.NodeInfo.GetHttpPublishHost()
								nodeInfo:=h.internalProcessBind(clusterID,clusterUUID,instanceID,instanceEndpoint,pid,nodeHost,auth)
								if nodeInfo!=nil{
									discoveredPIDs[pid] = nodeInfo
								}
							}
						}
					}

					//try connect
					for _, node := range nodes.UnknownProcess {

						pid:=node.PID

						for _, v := range node.ListenAddresses {

							ip := v.IP
							port:=v.Port

							if util.ContainStr(ip, "::") {
								ip = fmt.Sprintf("[%s]", ip)
							}
							nodeHost := fmt.Sprintf("%s:%d", ip, port)
							nodeInfo:=h.internalProcessBind(clusterID,clusterUUID,instanceID,instanceEndpoint,pid,nodeHost,auth)
							if nodeInfo!=nil{
								discoveredPIDs[pid] = nodeInfo
							}
						}
					}
				}
			}
		}
	}
	return discoveredPIDs
}

func (h *APIHandler) internalProcessBind(clusterID,clusterUUID,instanceID,instanceEndpoint string,pid int,nodeHost string,auth *model.BasicAuth) *elastic.LocalNodeInfo{
	success, tryAgain, nodeInfo := h.getESNodeInfoViaProxy(nodeHost, "http", auth, instanceEndpoint)
	if !success && tryAgain {
		//try https again
		success, tryAgain, nodeInfo = h.getESNodeInfoViaProxy(nodeHost, "https", auth, instanceEndpoint)
	}

	log.Debug(clusterUUID,nodeHost,instanceEndpoint,success, tryAgain, nodeInfo)

	if success {
		log.Debug("connect to es node success:", nodeHost, ", pid: ", pid)
		if nodeInfo.ClusterInfo.ClusterUUID != clusterUUID {
			log.Info("cluster uuid not match, cluster id: ", clusterID, ", cluster uuid: ", clusterUUID, ", node cluster uuid: ", nodeInfo.ClusterInfo.ClusterUUID)
			return nil
		}

		//enroll this node
		item := BindingItem{
			ClusterID:   clusterID,
			ClusterUUID: nodeInfo.ClusterInfo.ClusterUUID,
			NodeUUID:    nodeInfo.NodeUUID,
		}

		settings := NewNodeAgentSettings(instanceID, &item)
		err := orm.Update(&orm.Context{
			Refresh: "wait_for",
		}, settings)

		if err == nil {
			nodeInfo.ClusterID = clusterID
			nodeInfo.Enrolled = true
		}
		return nodeInfo
	}
	return nil
}


func (h *APIHandler) getESNodeInfoViaProxy(esHost string, esSchema string, auth *model.BasicAuth, endpoint string) (success, tryAgain bool, info *elastic.LocalNodeInfo) {
	esConfig := elastic.ElasticsearchConfig{Host: esHost, Schema: esSchema, BasicAuth: auth}
	return h.getESNodeInfoViaProxyWithConfig(&esConfig, auth, endpoint)
}

func (h *APIHandler) getESNodeInfoViaProxyWithConfig(cfg *elastic.ElasticsearchConfig, auth *model.BasicAuth, endpoint string) (success, tryAgain bool, info *elastic.LocalNodeInfo) {
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
	res, err := server.ProxyAgentRequest("elasticsearch",endpoint, req, &obj)
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
		"cluster_id":   item.ClusterID,
		"cluster_uuid": item.ClusterUUID,
		"node_uuid":    item.NodeUUID,
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

	success, _, _ := h.getESNodeInfoViaProxyWithConfig(meta.Config, meta.Config.BasicAuth, instance.GetEndpoint())

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
