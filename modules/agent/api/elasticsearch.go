// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"path/filepath"
	"regexp"
	"runtime"
	"sort"
	"strings"
	"sync/atomic"
	"time"

	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	console_common "infini.sh/console/common"
	elasticapi "infini.sh/console/modules/elastic/api"
	"infini.sh/console/plugin/managed/server"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
	"infini.sh/framework/modules/elastic/metadata"
)

// node -> binding item
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
						item.PathLogs = util.ToString(f["path_logs"])
						item.LogsPaths = extractStringSlice(f["logs_paths"])

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

func refreshNodesInfo(instanceID string) (*elastic.DiscoveryResult, error) {
	instance := model.Instance{}
	instance.ID = instanceID
	exists, err := orm.Get(&instance)
	if err != nil {
		return nil, fmt.Errorf("error on get agent instance: %w", err)
	}
	if !exists {
		return nil, fmt.Errorf("agent instance [%s] not found", instanceID)
	}

	enrolledNodesByAgent, err := GetEnrolledNodesByAgent(instanceID)
	if err != nil {
		return nil, fmt.Errorf("error on get binding nodes info: %w", err)
	}

	ctxTimeout, cancel := context.WithTimeout(context.Background(), time.Second*30)
	defer cancel()
	nodesInfo, err := GetElasticsearchNodesViaAgent(ctxTimeout, &instance)
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
				log.Errorf("agent client not found for cluster [%s]", v.ClusterID)
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
					if err != nil {
						log.Errorf("failed to get fallback node info for cluster [%s], node [%s]: %v", v.ClusterID, v.NodeUUID, err)
					} else {
						log.Errorf("fallback node info not found for cluster [%s], node [%s]", v.ClusterID, v.NodeUUID)
					}
					continue
				}

				//get node information
				nodeInfo, ok = nodeInfos[v.NodeUUID]
				if !ok {
					log.Errorf("fallback node info map missing cluster [%s], node [%s]", v.ClusterID, v.NodeUUID)
					continue
				}

				//get cluster information
				clusterInfo, err = metadata.GetClusterInformation(v.ClusterID)
				if err != nil || clusterInfo == nil {
					if err != nil {
						log.Errorf("failed to get cluster info for cluster [%s]: %v", v.ClusterID, err)
					} else {
						log.Errorf("cluster info not found for cluster [%s]", v.ClusterID)
					}
					continue
				}
			} else {
				clusterInfo, err = console_common.ClusterVersion(elastic.GetMetadata(v.ClusterID))
				if err != nil || clusterInfo == nil {
					if err != nil {
						log.Errorf("failed to resolve cluster version for cluster [%s]: %v", v.ClusterID, err)
					} else {
						log.Errorf("cluster version not found for cluster [%s]", v.ClusterID)
					}
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

// get nodes info via agent
func GetElasticsearchNodesViaAgent(ctx context.Context, instance *model.Instance) (*elastic.DiscoveryResult, error) {
	if instance == nil || instance.ID == "" {
		return nil, errors.New("invalid agent instance")
	}

	req := &util.Request{
		Method:  http.MethodGet,
		Path:    "/elasticsearch/node/_discovery",
		Context: ctx,
	}

	obj := elastic.DiscoveryResult{}
	_, err := proxyAgentRequestDirect(instance, req, &obj)
	if err == nil {
		return &obj, nil
	}
	if !IsAgentReverseChannelConnected(instance.ID) {
		return nil, err
	}

	_, reverseErr := ProxyAgentRequestViaChannel(instance.ID, req, &obj)
	if reverseErr != nil {
		if shouldFallbackToDirectAgentDiscovery(reverseErr) {
			return nil, err
		}
		return nil, reverseErr
	}

	return &obj, nil
}

func shouldFallbackToDirectAgentDiscovery(err error) bool {
	return isAgentReverseChannelRecoverableError(err)
}

type BindingItem struct {
	//infini system assigned id
	ClusterID string `json:"cluster_id"`

	ClusterUUID string   `json:"cluster_uuid"`
	NodeUUID    string   `json:"node_uuid"`
	PathHome    string   `json:"path_home,omitempty"`
	PathLogs    string   `json:"path_logs"`
	LogsPaths   []string `json:"logs_paths"`

	Updated int64 `json:"updated"`
}

type ClusterBinding struct {
	ClusterID string   `json:"cluster_id"`
	LogsPaths []string `json:"logs_paths,omitempty"`
}

func GetSearchLogFiles(ctx context.Context, instance *model.Instance, logsPaths []string) (interface{}, error) {
	body := util.MapStr{}
	switch len(logsPaths) {
	case 0:
		body["logs_path"] = ""
	case 1:
		body["logs_path"] = logsPaths[0]
	default:
		body["logs_path"] = logsPaths
	}

	reqBody := util.MustToJSONBytes(body)

	req := &util.Request{
		Method:  http.MethodPost,
		Path:    "/elasticsearch/logs/_list",
		Context: ctx,
		Body:    reqBody,
	}

	resBody := map[string]interface{}{}
	_, err := proxyAgentRequest(instance, req, &resBody)
	if err != nil {
		return nil, err
	}
	if resBody["success"] != true {
		return nil, fmt.Errorf("get search log files error: %v", resBody)
	}
	return resBody["result"], nil

}

func GetSearchLogFileContent(ctx context.Context, instance *model.Instance, body interface{}) (interface{}, error) {
	req := &util.Request{
		Method:  http.MethodPost,
		Path:    "/elasticsearch/logs/_read",
		Context: ctx,
		Body:    util.MustToJSONBytes(body),
	}
	resBody := map[string]interface{}{}
	_, err := proxyAgentRequest(instance, req, &resBody)
	if err != nil {
		return nil, err
	}
	if resBody["success"] != true {
		return nil, fmt.Errorf("get search log files error: %v", resBody)
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
	inst, logsPaths, err := getAgentByNodeID(clusterID, nodeID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("failed to resolve agent for cluster [%s], node [%s]: %v", clusterID, nodeID, err)
		return
	}
	if inst == nil {
		log.Warnf("no agent associated with cluster [%s], node [%s]", clusterID, nodeID)
		h.WriteJSON(w, util.MapStr{
			"success": false,
			"reason":  "AGENT_NOT_FOUND",
		}, http.StatusOK)
		return
	}
	logFiles, err := GetSearchLogFiles(nil, inst, logsPaths)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("failed to get log files for cluster [%s], node [%s]: %v", clusterID, nodeID, err)
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
	inst, logsPaths, err := getAgentByNodeID(clusterID, nodeID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("failed to resolve agent for cluster [%s], node [%s]: %v", clusterID, nodeID, err)
		return
	}
	if inst == nil {
		h.WriteError(w, fmt.Sprintf("can not find agent by node [%s]", nodeID), http.StatusInternalServerError)
		return
	}
	reqBody := struct {
		FileName        string `json:"file_name"`
		LogsPath        string `json:"logs_path"`
		Offset          int64  `json:"offset"`
		Lines           int    `json:"lines"`
		StartLineNumber int64  `json:"start_line_number"`
		TailLines       int    `json:"tail_lines"`
	}{}
	err = h.DecodeJSON(req, &reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("failed to decode log content request for cluster [%s], node [%s]: %v", clusterID, nodeID, err)
		return
	}
	reqBody.LogsPath, err = pickAllowedLogsPath(logsPaths, reqBody.LogsPath)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("invalid logs path for cluster [%s], node [%s]: %v", clusterID, nodeID, err)
		return
	}
	res, err := GetSearchLogFileContent(nil, inst, reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("failed to get log content for cluster [%s], node [%s]: %v", clusterID, nodeID, err)
		return
	}
	h.WriteJSON(w, res, http.StatusOK)
}

// instance, logsPaths
func getAgentByNodeID(clusterID, nodeID string) (*model.Instance, []string, error) {

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
		return nil, nil, err
	}

	nodeInfo, err := metadata.GetNodeConfig(clusterID, nodeID)
	if err != nil || nodeInfo == nil {
		if err != nil {
			log.Errorf("failed to get node config for cluster [%s], node [%s]: %v", clusterID, nodeID, err)
		} else {
			log.Errorf("node config not found for cluster [%s], node [%s]", clusterID, nodeID)
		}
		return nil, nil, err
	}

	logsPaths := normalizeLogsPaths(nil, nodeInfo.Payload.NodeInfo.GetPathLogs())

	for _, row := range result.Result {
		v, ok := row.(map[string]interface{})
		if ok {
			if payload, ok := v["payload"].(map[string]interface{}); ok {
				logsPaths = normalizeLogsPaths(extractStringSlice(payload["logs_paths"]), util.ToString(payload["path_logs"]))
				if len(logsPaths) == 0 {
					logsPaths = normalizeLogsPaths(nil, nodeInfo.Payload.NodeInfo.GetPathLogs())
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
								return nil, logsPaths, err
							}
							if inst.Name == "" {
								return nil, logsPaths, nil
							}
							return inst, logsPaths, nil
						}
					}
				}
			}
		}
	}
	return nil, nil, nil
}

type ClusterInfo struct {
	ClusterIDs []string         `json:"cluster_id"`
	Clusters   []ClusterBinding `json:"clusters,omitempty"`
}

var autoEnrollRunning = atomic.Bool{}

func normalizeClusterInfo(info ClusterInfo) ClusterInfo {
	clusterIDs := make([]string, 0, len(info.ClusterIDs)+len(info.Clusters))
	seen := map[string]int{}
	existingClusters := info.Clusters

	appendCluster := func(clusterID string, logsPaths []string) {
		clusterID = strings.TrimSpace(clusterID)
		if clusterID == "" {
			return
		}
		logsPaths = normalizeLogsPaths(logsPaths, "")
		if idx, exists := seen[clusterID]; exists {
			if len(logsPaths) > 0 {
				info.Clusters[idx].LogsPaths = logsPaths
			}
			return
		}
		seen[clusterID] = len(info.Clusters)
		clusterIDs = append(clusterIDs, clusterID)
		info.Clusters = append(info.Clusters, ClusterBinding{
			ClusterID: clusterID,
			LogsPaths: logsPaths,
		})
	}

	info.Clusters = make([]ClusterBinding, 0, len(info.Clusters))
	for _, clusterID := range info.ClusterIDs {
		appendCluster(clusterID, nil)
	}
	for _, item := range existingClusters {
		appendCluster(item.ClusterID, item.LogsPaths)
	}
	info.ClusterIDs = clusterIDs
	return info
}

func (info ClusterInfo) GetLogsPaths(clusterID string) []string {
	for _, item := range info.Clusters {
		if item.ClusterID == clusterID {
			return normalizeLogsPaths(item.LogsPaths, "")
		}
	}
	return nil
}

func hydrateAutoEnrollClusterInfo(clusterInfo ClusterInfo) (ClusterInfo, error) {
	if len(clusterInfo.ClusterIDs) == 0 {
		return clusterInfo, nil
	}

	clusters := make([]ClusterBinding, 0, len(clusterInfo.ClusterIDs))
	for _, clusterID := range clusterInfo.ClusterIDs {
		clusters = append(clusters, ClusterBinding{
			ClusterID: clusterID,
		})
	}
	clusterInfo.Clusters = clusters
	return clusterInfo, nil
}

func getAutoEnrollClusterInfo(clusterInfo ClusterInfo) (ClusterInfo, error) {
	clusterInfo = normalizeClusterInfo(clusterInfo)
	if len(clusterInfo.ClusterIDs) > 0 {
		return hydrateAutoEnrollClusterInfo(clusterInfo)
	}

	q := &orm.Query{
		Size: 1000,
		Conds: orm.And(
			orm.Eq("metric_collection_mode", elastic.ModeAgent),
			orm.Eq("enabled", true),
		),
	}
	err, res := orm.Search(&elastic.ElasticsearchConfig{}, q)
	if err != nil {
		return ClusterInfo{}, err
	}

	ids := make([]string, 0, len(res.Result))
	for _, row := range res.Result {
		item, ok := row.(map[string]interface{})
		if !ok {
			continue
		}
		id := util.ToString(item["id"])
		if id != "" {
			ids = append(ids, id)
		}
	}
	clusterInfo.ClusterIDs = ids
	clusterInfo = normalizeClusterInfo(clusterInfo)
	return hydrateAutoEnrollClusterInfo(clusterInfo)
}

func startAutoEnroll(clusterInfo ClusterInfo) error {
	clusterInfo, err := getAutoEnrollClusterInfo(clusterInfo)
	if err != nil {
		return err
	}
	if len(clusterInfo.ClusterIDs) <= 0 {
		return nil
	}
	if autoEnrollRunning.Load() {
		return errors.New("auto_enroll is already running in background")
	}

	autoEnrollRunning.Swap(true)
	go runAutoEnroll(clusterInfo)
	return nil
}

func runAutoEnroll(clusterInfo ClusterInfo) {
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
					log.Errorf("auto enroll panic recovered: %s", v)
				}
			}
		}
		log.Debug("finish auto enroll")
	}()

	log.Debug("start auto enroll")
	q := &orm.Query{Conds: orm.And(orm.Eq("application.name", "agent"))}
	q.From = 0
	q.Size = 50000
	err, res := orm.Search(&model.Instance{}, q)
	if err != nil {
		log.Errorf("failed to search agent instances during auto enroll: %v", err)
		return
	}

	for _, v := range res.Result {
		f, ok := v.(map[string]interface{})
		if !ok {
			continue
		}
		instanceIDObj, ok1 := f["id"]
		instanceEndpointObj, ok2 := f["endpoint"]
		if !ok1 || !ok2 {
			continue
		}
		instanceID, ok1 := instanceIDObj.(string)
		instanceEndpoint, ok2 := instanceEndpointObj.(string)
		if !ok1 || !ok2 {
			continue
		}
		nodes, err := refreshNodesInfo(instanceID)
		if err != nil {
			log.Errorf("failed to refresh nodes for agent instance [%s] at [%s]: %v", maskLogToken(instanceID), maskLogEndpoint(instanceEndpoint), err)
			continue
		}
		log.Debugf("instance:%v,%v, has: %v nodes, %v unknown nodes", maskLogToken(instanceID), maskLogEndpoint(instanceEndpoint), len(nodes.Nodes), len(nodes.UnknownProcess))
		if len(nodes.UnknownProcess) > 0 {
			pids := bindInstanceToCluster(clusterInfo, nodes, instanceID, instanceEndpoint)
			if len(pids) > 0 {
				log.Infof("instance:%v,%v, success enroll %v nodes", maskLogToken(instanceID), maskLogEndpoint(instanceEndpoint), len(pids))
			}
		}

		if len(nodes.Nodes) > 0 {
			for k, v := range nodes.Nodes {
				log.Tracef("node status, id=%s, status=%v, enrolled=%v", maskLogToken(k), v.Status, v.Enrolled)
				if !v.Enrolled {
					pids := bindInstanceToCluster(clusterInfo, nodes, instanceID, instanceEndpoint)
					if len(pids) > 0 {
						log.Infof("instance:%v,%v, success enroll %v nodes", maskLogToken(instanceID), maskLogEndpoint(instanceEndpoint), len(pids))
					}
					break
				}
			}
		}
	}
}

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

	clusterInfo = normalizeClusterInfo(clusterInfo)
	if len(clusterInfo.ClusterIDs) <= 0 {
		panic(errors.New("please select cluster to enroll"))
	}

	if err := startAutoEnroll(clusterInfo); err != nil {
		panic(err)
	}

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

	nodes, err := refreshNodesInfo(instance.ID)
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
				clusterInfo = normalizeClusterInfo(clusterInfo)
				discoveredPIDs = bindInstanceToCluster(clusterInfo, nodes, instance.ID, instance.GetEndpoint())
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

func bindInstanceToCluster(clusterInfo ClusterInfo, nodes *elastic.DiscoveryResult, instanceID, instanceEndpoint string) map[int]*elastic.LocalNodeInfo {
	discoveredPIDs := map[int]*elastic.LocalNodeInfo{}
	if len(clusterInfo.ClusterIDs) > 0 {
		//try connect this node to cluster by using this cluster's agent credential
		for _, clusterID := range clusterInfo.ClusterIDs {
			preparedConf, err := elasticapi.PrepareClusterForAgentCollection(clusterID)
			if err != nil {
				log.Errorf("failed to prepare cluster [%s] for agent collection: %v", maskLogToken(clusterID), err)
				continue
			}
			meta := elastic.GetMetadata(clusterID)
			if meta != nil {
				states, err := elastic.GetClient(clusterID).GetClusterState()
				if err != nil || states == nil {
					if err != nil {
						log.Errorf("failed to get cluster state for cluster [%s]: %v", maskLogToken(clusterID), err)
					} else {
						log.Errorf("cluster state is empty for cluster [%s]", maskLogToken(clusterID))
					}
					continue
				}

				clusterUUID := states.ClusterUUID
				auth, err := common.GetAgentBasicAuth(preparedConf)
				if err != nil {
					log.Errorf("failed to get agent credential for cluster [%s]: %v", maskLogToken(clusterID), err)
					continue
				}
				if auth == nil || auth.Username == "" {
					log.Errorf("cluster [%s] has no available agent credential", maskLogToken(clusterID))
					continue
				}

				for _, v := range nodes.Nodes {
					if !v.Enrolled {
						if v.NodeInfo != nil {
							pid := v.NodeInfo.Process.Id
							nodeHost := v.NodeInfo.GetHttpPublishHost()
							nodeInfo := (&APIHandler{}).internalProcessBind(clusterID, clusterUUID, instanceID, instanceEndpoint, pid, nodeHost, auth, "")
							if nodeInfo != nil {
								discoveredPIDs[pid] = nodeInfo
							}
						}
					}
				}

				for _, node := range nodes.UnknownProcess {
					pid := node.PID

					for _, v := range prioritizeListenAddresses(node.ListenAddresses) {
						nodeHost := fmt.Sprintf("%s:%d", normalizeListenHostIP(v.IP), v.Port)
						nodeInfo := (&APIHandler{}).internalProcessBind(clusterID, clusterUUID, instanceID, instanceEndpoint, pid, nodeHost, auth, node.Cmdline)
						if nodeInfo != nil {
							discoveredPIDs[pid] = nodeInfo
							break
						}
					}
				}
			}
		}
	}
	return discoveredPIDs
}

func normalizeListenHostIP(ip string) string {
	ip = strings.TrimSpace(ip)
	if ip == "" || util.ContainStr(ip, "*") || ip == util.LocalIpv6Address {
		return util.LocalAddress
	}

	rawIP := strings.Trim(ip, "[]")
	if parsed := net.ParseIP(rawIP); parsed != nil {
		if parsed.IsUnspecified() || parsed.IsLoopback() {
			return util.LocalAddress
		}
		if parsed.To4() == nil {
			return fmt.Sprintf("[%s]", rawIP)
		}
		return rawIP
	}

	if strings.Contains(ip, ":") && !strings.HasPrefix(ip, "[") {
		return fmt.Sprintf("[%s]", ip)
	}
	return ip
}

func prioritizeListenAddresses(addresses []model.ListenAddr) []model.ListenAddr {
	if len(addresses) <= 1 {
		return addresses
	}

	items := append([]model.ListenAddr(nil), addresses...)
	sort.SliceStable(items, func(i, j int) bool {
		left := listenAddressPriority(items[i])
		right := listenAddressPriority(items[j])
		if left != right {
			return left < right
		}
		return items[i].Port < items[j].Port
	})
	return items
}

func listenAddressPriority(addr model.ListenAddr) int {
	switch addr.Port {
	case 9200:
		return 0
	case 443, 80:
		return 1
	case 9300:
		return 3
	default:
		return 2
	}
}

func maskLogToken(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "<empty>"
	}

	if len(value) <= 4 {
		return "***"
	}

	if len(value) <= 8 {
		return value[:1] + "***" + value[len(value)-1:]
	}

	return value[:2] + "***" + value[len(value)-2:]
}

func maskLogHost(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "<empty>"
	}

	host, port, err := net.SplitHostPort(value)
	if err == nil {
		_ = host
		return "***:" + port
	}

	return "***"
}

func maskLogEndpoint(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "<empty>"
	}

	parsed, err := url.Parse(value)
	if err == nil && parsed.Host != "" {
		host := "***"
		if port := parsed.Port(); port != "" {
			host = host + ":" + port
		}
		if parsed.Scheme != "" {
			return parsed.Scheme + "://" + host
		}
		return host
	}

	if strings.Contains(value, "://") {
		return "***"
	}

	return maskLogHost(value)
}

func (h *APIHandler) internalProcessBind(clusterID, clusterUUID, instanceID, instanceEndpoint string, pid int, nodeHost string, auth *model.BasicAuth, cmdline string) *elastic.LocalNodeInfo {
	success, tryAgain, nodeInfo := h.getESNodeInfoViaProxy(nodeHost, "http", auth, instanceID)
	if !success && tryAgain {
		//try https again
		success, tryAgain, nodeInfo = h.getESNodeInfoViaProxy(nodeHost, "https", auth, instanceID)
	}

	if success {
		log.Tracef("connect to es node success: cluster_uuid=%s, node=%s, instance=%s", maskLogToken(clusterUUID), maskLogHost(nodeHost), maskLogEndpoint(instanceEndpoint))
		if nodeInfo.ClusterInfo.ClusterUUID != clusterUUID {
			log.Infof("cluster uuid not match, cluster=%s, cluster_uuid=%s, node_cluster_uuid=%s", maskLogToken(clusterID), maskLogToken(clusterUUID), maskLogToken(nodeInfo.ClusterInfo.ClusterUUID))
			return nil
		}

		//enroll this node
		item := BindingItem{
			ClusterID:   clusterID,
			ClusterUUID: nodeInfo.ClusterInfo.ClusterUUID,
			NodeUUID:    nodeInfo.NodeUUID,
			PathHome:    extractNodePathHome(nodeInfo.NodeInfo),
			LogsPaths:   deriveLogsPathsFromCmdline(cmdline, extractNodePathHome(nodeInfo.NodeInfo)),
		}
		item.PathLogs = firstString(item.LogsPaths)

		settings := NewNodeAgentSettings(instanceID, &item)
		err := orm.Save(&orm.Context{
			Refresh: "wait_for",
		}, settings)

		if err == nil {
			nodeInfo.ClusterID = clusterID
			nodeInfo.Enrolled = true
		}
		return nodeInfo
	}

	log.Tracef("failed to connect to es node via agent proxy: cluster_uuid=%s, node=%s, instance=%s, retry_https=%v", maskLogToken(clusterUUID), maskLogHost(nodeHost), maskLogEndpoint(instanceEndpoint), tryAgain)
	return nil
}

func (h *APIHandler) getESNodeInfoViaProxy(esHost string, esSchema string, auth *model.BasicAuth, instanceID string) (success, tryAgain bool, info *elastic.LocalNodeInfo) {
	esConfig := elastic.ElasticsearchConfig{Host: esHost, Schema: esSchema, BasicAuth: auth}
	return h.getESNodeInfoViaProxyWithConfig(&esConfig, instanceID)
}

func (h *APIHandler) getESNodeInfoViaProxyWithConfig(cfg *elastic.ElasticsearchConfig, instanceID string) (success, tryAgain bool, info *elastic.LocalNodeInfo) {
	body := util.MustToJSONBytes(cfg)
	if cfg.BasicAuth != nil {
		body, _ = jsonparser.Set(body, []byte(`"`+cfg.BasicAuth.Password.Get()+`"`), "basic_auth", "password")
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	req := &util.Request{
		Method:  http.MethodPost,
		Path:    "/elasticsearch/node/_info",
		Context: ctx,
		Body:    body,
	}

	exists, instance, err := server.GetRuntimeInstanceByID(instanceID)
	if err != nil || !exists || instance == nil {
		if global.Env().IsDebug && err != nil {
			log.Errorf("failed to load agent instance [%s] for node info proxy: %v", instanceID, err)
		}
		return false, true, nil
	}

	obj := elastic.LocalNodeInfo{}
	res, err := proxyAgentRequest(instance, req, &obj)
	if isForbiddenAgentReverseResult(res) {
		return false, false, nil
	}
	if err != nil {
		if global.Env().IsDebug {
			log.Errorf("failed to proxy elasticsearch node info via agent [%s]: %v", instanceID, err)
		}
		return false, true, nil
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

func shouldFallbackToDirectAgentNodeInfo(err error) bool {
	return isAgentReverseChannelRecoverableError(err)
}

func isForbiddenAgentReverseResult(res *util.Result) bool {
	return res != nil && res.StatusCode == http.StatusForbidden
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
	logsPaths := normalizeLogsPaths(item.LogsPaths, item.PathLogs)

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
		"path_logs":    firstString(logsPaths),
		"logs_paths":   logsPaths,
	}

	return &settings
}

func extractStringSlice(value interface{}) []string {
	switch v := value.(type) {
	case nil:
		return nil
	case []string:
		return normalizeLogsPaths(v, "")
	case []interface{}:
		items := make([]string, 0, len(v))
		for _, item := range v {
			items = append(items, util.ToString(item))
		}
		return normalizeLogsPaths(items, "")
	default:
		return nil
	}
}

func normalizeLogsPaths(paths []string, fallback string) []string {
	items := paths
	if len(items) == 0 && fallback != "" {
		items = []string{fallback}
	}

	seen := map[string]struct{}{}
	result := make([]string, 0, len(items))
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		if _, exists := seen[item]; exists {
			continue
		}
		seen[item] = struct{}{}
		result = append(result, item)
	}
	return result
}

var (
	cmdlinePathHomeRegx = regexp.MustCompile(`(?:^|\s)-D(?:es|opensearch)\.path\.home=([^\s]+)`)
	cmdlinePathLogsRegx = regexp.MustCompile(`(?:^|\s)-D(?:es|opensearch)\.path\.logs=([^\s]+)`)
	cmdlineGCFileRegx   = regexp.MustCompile(`(?:^|\s)-Xlog:[^\s]*?file=([^\s]+)`)
)

func deriveLogsPathsFromCmdline(cmdline, fallbackHome string) []string {
	pathHome := extractCmdlineValue(cmdlinePathHomeRegx, cmdline)
	if pathHome == "" {
		pathHome = strings.TrimSpace(fallbackHome)
	}

	currentLogsPath := extractCmdlineValue(cmdlinePathLogsRegx, cmdline)
	if currentLogsPath == "" && pathHome != "" {
		currentLogsPath = filepath.Join(pathHome, "logs")
	}

	result := make([]string, 0, 2)
	result = appendLogsDir(result, currentLogsPath, pathHome)
	result = appendLogsFileDir(result, trimGCLogFileValue(extractCmdlineValue(cmdlineGCFileRegx, cmdline)), pathHome)
	return result
}

func extractCmdlineValue(reg *regexp.Regexp, cmdline string) string {
	matches := reg.FindStringSubmatch(cmdline)
	if len(matches) > 1 {
		return trimCmdlinePathValue(matches[1])
	}
	return ""
}

func appendLogsDir(paths []string, value, base string) []string {
	if len(paths) >= 2 {
		return paths
	}
	resolved := resolveCmdlinePath(value, base)
	if resolved == "" {
		return paths
	}
	for _, item := range paths {
		if item == resolved {
			return paths
		}
	}
	return append(paths, resolved)
}

func appendLogsFileDir(paths []string, value, base string) []string {
	resolved := resolveCmdlinePath(value, base)
	if resolved == "" {
		return paths
	}
	return appendLogsDir(paths, filepath.Dir(resolved), "")
}

func resolveCmdlinePath(value, base string) string {
	value = trimCmdlinePathValue(value)
	if value == "" {
		return ""
	}
	if !filepath.IsAbs(value) {
		if base == "" {
			return ""
		}
		value = filepath.Join(base, value)
	}
	return filepath.Clean(value)
}

func trimCmdlinePathValue(value string) string {
	return strings.Trim(strings.TrimSpace(value), `"'`)
}

func trimGCLogFileValue(value string) string {
	value = trimCmdlinePathValue(value)
	if value == "" {
		return ""
	}
	searchFrom := 0
	if len(value) > 1 && value[1] == ':' {
		searchFrom = 2
	}
	if idx := strings.Index(value[searchFrom:], ":"); idx >= 0 {
		value = value[:searchFrom+idx]
	}
	return value
}

func extractNodePathHome(nodeInfo *elastic.NodesInfo) string {
	if nodeInfo == nil {
		return ""
	}
	path, ok := nodeInfo.Settings["path"]
	if !ok {
		return ""
	}
	pathObj, ok := path.(map[string]interface{})
	if !ok {
		return ""
	}
	return strings.TrimSpace(util.ToString(pathObj["home"]))
}

func firstString(items []string) string {
	if len(items) == 0 {
		return ""
	}
	return items[0]
}

func pickAllowedLogsPath(allowed []string, requested string) (string, error) {
	allowed = normalizeLogsPaths(allowed, "")
	if len(allowed) == 0 {
		return "", fmt.Errorf("no logs path configured")
	}
	if requested == "" {
		return allowed[0], nil
	}
	requested = strings.TrimSpace(requested)
	for _, item := range allowed {
		if item == requested {
			return item, nil
		}
	}
	return "", fmt.Errorf("invalid logs path: %s", requested)
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
	preparedConf, err := elasticapi.PrepareClusterForAgentCollection(item.ClusterID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	//use agent credential to access the node
	preparedConf.BasicAuth, err = common.GetAgentBasicAuth(preparedConf)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if preparedConf.BasicAuth == nil || preparedConf.BasicAuth.Username == "" {
		h.WriteError(w, "cluster has no available agent credential", http.StatusInternalServerError)
		return
	}

	success, _, nodeInfo := h.getESNodeInfoViaProxyWithConfig(preparedConf, instance.ID)

	if success {
		if item.PathHome == "" {
			item.PathHome = extractNodePathHome(nodeInfo.NodeInfo)
		}
		item.LogsPaths = deriveLogsPathsFromCmdline("", item.PathHome)
		item.PathLogs = firstString(item.LogsPaths)
		// Save will create the binding on first manual enroll and update it on subsequent enrolls.
		settings := NewNodeAgentSettings(instID, &item)
		err = orm.Save(&orm.Context{
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
