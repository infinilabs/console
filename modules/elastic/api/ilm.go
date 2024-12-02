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