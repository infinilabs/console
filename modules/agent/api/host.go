/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"fmt"
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/host"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"strings"
	"time"
)

func (h *APIHandler) enrollHost(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var reqBody []struct {
		AgentID  string `json:"agent_id"`
		HostName string `json:"host_name"`
		IP       string `json:"ip"`
		Source   string `json:"source"`
		OSName string `json:"os_name"`
		OSArch string `json:"os_arch"`
		NodeID string `json:"node_uuid"`
	}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	errors := util.MapStr{}
	for i, hi := range reqBody {
		var (
			hostInfo *host.HostInfo
		)
		switch hi.Source {
		case "agent":
			obj := model.Instance{}
			obj.ID = hi.AgentID
			exists, err := orm.Get(&obj)
			if !exists || err != nil {
				continue
			}
			hostInfo = &host.HostInfo{}
			hostInfo.IP = hi.IP
			hostInfo.AgentID = hi.AgentID
			err = orm.Create(nil, hostInfo)
			if err != nil {
				errors[hi.IP] = util.MapStr{
					"error": err.Error(),
				}
				log.Error(err)
				continue
			}
		case "es_node":
			hostInfo = &host.HostInfo{
				IP: hi.IP,
				OSInfo: host.OS{
					Platform: hi.OSName,
					KernelArch: hi.OSArch,
				},
				NodeID: hi.NodeID,
			}
		default:
			errors[hi.IP] = util.MapStr{
				"error": fmt.Errorf("unkonow source type"),
			}
			continue
		}
		hostInfo.Timestamp = time.Now()
		var ctx *orm.Context
		if i == len(reqBody) - 1 {
			ctx = &orm.Context{
				Refresh: "wait_for",
			}
		}
		hostInfo.OSInfo.Platform = strings.ToLower(hostInfo.OSInfo.Platform)
		err = orm.Create(ctx, hostInfo)
		if err != nil {
			errors[hi.IP] = util.MapStr{
				"error": err.Error(),
			}
			log.Error(err)
			continue
		}
	}
	resBody :=  util.MapStr{
		"success": true,
	}
	if len(errors) > 0 {
		resBody["errors"] = errors
		resBody["success"] = false
	}

	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) deleteHost(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	hostID := ps.MustGetParameter("host_id")
	hostInfo, err := getHost(hostID)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ctx := orm.Context{
		Refresh: "wait_for",
	}
	err = orm.Delete(&ctx, hostInfo)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteDeletedOKJSON(w, hostID)
}

func (h *APIHandler) GetHostAgentInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	hostID := ps.MustGetParameter("host_id")
	hostInfo, err := getHost(hostID)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if hostInfo.AgentID == "" {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}

	obj := model.Instance{}
	obj.ID = hostInfo.AgentID
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   hostInfo.AgentID,
			"found": false,
		}, http.StatusNotFound)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"host_id": hostID,
		"agent_id": obj.ID,
		"version": obj.Application.Version,
		"status": hostInfo.AgentStatus,
		"endpoint": obj.GetEndpoint(),
	}, http.StatusOK)
}

func getHost(hostID string) (*host.HostInfo, error){
	hostInfo := &host.HostInfo{}
	hostInfo.ID = hostID
	exists, err := orm.Get(hostInfo)
	if err != nil {
		return nil, fmt.Errorf("get host info error: %w", err)
	}
	if !exists {
		return nil, fmt.Errorf("host [%s] not found", hostID)
	}
	return hostInfo, nil
}

func (h *APIHandler) GetHostElasticProcess(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	hostID := ps.MustGetParameter("host_id")
	hostInfo := &host.HostInfo{}
	hostInfo.ID = hostID
	exists, err := orm.Get(hostInfo)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !exists {
		h.WriteError(w, fmt.Sprintf("host [%s] not found", hostID), http.StatusNotFound)
		return
	}
	if hostInfo.AgentID == "" {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}

	obj := model.Instance{}
	obj.ID = hostInfo.AgentID
	exists, err = orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   hostInfo.AgentID,
			"found": false,
		}, http.StatusNotFound)
		return
	}

	//esNodesInfo, err := GetElasticsearchNodesViaAgent(context.Background(), &obj)
	//if err != nil {
	//	log.Error(err)
	//	h.WriteError(w, err.Error(), http.StatusInternalServerError)
	//	return
	//}
	//var processes []util.MapStr
	//for _, node := range esNodesInfo {
	//	processes = append(processes, util.MapStr{
	//		"pid":          node.ProcessInfo.PID,
	//		"pid_status":   node.ProcessInfo.Status,
	//		"cluster_name": node.ClusterName,
	//		"cluster_uuid": node.ClusterUuid,
	//		"cluster_id":  node.ClusterID,
	//		"node_id":      node.NodeUUID,
	//		"node_name":    node.NodeName,
	//		"uptime_in_ms": time.Now().UnixMilli() - node.ProcessInfo.CreateTime,
	//	})
	//}
	h.WriteJSON(w, util.MapStr{
		//"elastic_processes": processes,
	}, http.StatusOK)
}