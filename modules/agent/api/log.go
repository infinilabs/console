/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/console/modules/agent/client"
	"infini.sh/console/modules/agent/state"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
)

func (h *APIHandler) getLogFilesByNode(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	nodeID := ps.MustGetParameter("node_id")
	inst, node, err := getAgentByNodeID(nodeID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if inst == nil {
		log.Error(fmt.Sprintf("can not find agent by node [%s]", nodeID))
		h.WriteJSON(w, util.MapStr{
			"success": false,
			"reason": "AGENT_NOT_FOUND",
		}, http.StatusOK)
		return
	}
	logFiles, err := client.GetClient().GetElasticLogFiles(nil, inst.GetEndpoint(), node.Path.Logs)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	h.WriteJSON(w, util.MapStr{
		"success": true,
		"log_files": logFiles,
	}, http.StatusOK)
}

func (h *APIHandler) getLogFileContent(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	nodeID := ps.MustGetParameter("node_id")
	inst, node, err := getAgentByNodeID(nodeID)
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
		FileName string `json:"file_name"`
		LogsPath string `json:"logs_path"`
		Offset int `json:"offset"`
		Lines int `json:"lines"`
		StartLineNumber int64 `json:"start_line_number"`
	}{}
	err = h.DecodeJSON(req, &reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	reqBody.LogsPath = node.Path.Logs
	sm := state.GetStateManager()
	res, err := sm.GetAgentClient().GetElasticLogFileContent(nil, inst.GetEndpoint(), reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	h.WriteJSON(w, res, http.StatusOK)
}

func getAgentByNodeID(nodeID string) (*model.Instance, *model.ESNodeInfo, error){
	queryDsl := util.MapStr{
		"size":1,
		"query": util.MapStr{
			"term": util.MapStr{
				"node_uuid": util.MapStr{
					"value": nodeID,
				},
			},
		},
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
	}
	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(queryDsl),
	}
	err, result := orm.Search(model.ESNodeInfo{}, q)
	if err != nil {
		return nil,nil, err
	}
	if len(result.Result) > 0 {
		buf := util.MustToJSONBytes(result.Result[0])
		v := &model.ESNodeInfo{}
		err = util.FromJSONBytes(buf, v)
		inst := &model.Instance{}
		inst.ID = v.AgentID
		_, err = orm.Get(inst)
		if err != nil {
			return nil, v, err
		}
		if inst.Name == "" {
			return nil, v, nil
		}
		return inst, v, nil
	}
	return nil, nil, nil
}
