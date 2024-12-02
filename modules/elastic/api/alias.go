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

package api

import (
	"fmt"
	log "github.com/cihub/seelog"
	"github.com/segmentio/encoding/json"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"net/http"
)

func (h *APIHandler) HandleAliasAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	targetClusterID := ps.ByName("id")
	exists,client,err:=h.GetClusterClient(targetClusterID)

	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !exists{
		errStr := fmt.Sprintf("cluster [%s] not found",targetClusterID)
		log.Error(errStr)
		h.WriteError(w, errStr, http.StatusInternalServerError)
		return
	}

	var aliasReq = &elastic.AliasRequest{}

	err = h.DecodeJSON(req, aliasReq)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	esVersion := elastic.GetMetadata(targetClusterID).Config.Version
	if r, _ := util.VersionCompare(esVersion, "6.4"); r == -1 {
		for i := range aliasReq.Actions {
			for k, v := range aliasReq.Actions[i] {
				if v != nil && v["is_write_index"] != nil {
					delete(aliasReq.Actions[i][k], "is_write_index")
					log.Warnf("elasticsearch aliases api of version [%s] not supports parameter is_write_index", esVersion)
				}
			}
		}
	}

	bodyBytes, _ := json.Marshal(aliasReq)

	err = client.Alias(bodyBytes)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteAckOKJSON(w)
}

func (h *APIHandler) HandleGetAliasAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	exists, client, err := h.GetClusterClient(targetClusterID)

	if err != nil {
		log.Error(err)
		h.WriteJSON(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !exists {
		errStr := fmt.Sprintf("cluster [%s] not found", targetClusterID)
		log.Error(errStr)
		h.WriteError(w, errStr, http.StatusInternalServerError)
		return
	}
	res, err := client.GetAliasesDetail()
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, res, http.StatusOK)
}