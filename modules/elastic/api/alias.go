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