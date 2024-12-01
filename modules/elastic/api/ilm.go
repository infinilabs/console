/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"io"
	"net/http"
)

func (h *APIHandler) HandleGetILMPolicyAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	clusterID := ps.MustGetParameter("id")
	esClient := elastic.GetClient(clusterID)
	policies, err := esClient.GetILMPolicy("")
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, policies, http.StatusOK)
}

func (h *APIHandler) HandleSaveILMPolicyAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	clusterID := ps.MustGetParameter("id")
	policy := ps.MustGetParameter("policy")
	esClient := elastic.GetClient(clusterID)
	reqBody, err := io.ReadAll(req.Body)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = esClient.PutILMPolicy(policy, reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteAckOKJSON(w)
}

func (h *APIHandler) HandleDeleteILMPolicyAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	clusterID := ps.MustGetParameter("id")
	policy := ps.MustGetParameter("policy")
	esClient := elastic.GetClient(clusterID)
	err := esClient.DeleteILMPolicy(policy)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteAckOKJSON(w)
}