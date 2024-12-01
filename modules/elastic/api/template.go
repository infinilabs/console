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
	"src/github.com/buger/jsonparser"
)

func (h *APIHandler) HandleGetTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	clusterID := ps.MustGetParameter("id")
	esClient := elastic.GetClient(clusterID)
	templates, err := esClient.GetTemplate("")
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, templates, http.StatusOK)
}

func (h *APIHandler) HandleSaveTemplateAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	clusterID := ps.MustGetParameter("id")
	templateName := ps.MustGetParameter("template_name")
	esClient := elastic.GetClient(clusterID)
	reqBody, err := io.ReadAll(req.Body)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	esResBody, err := esClient.PutTemplate(templateName, reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	resErr, _, _, _ := jsonparser.Get(esResBody, "error")
	if resErr != nil {
		errStr :=  string(resErr)
		log.Errorf("put template error: %s", errStr)
		h.WriteError(w, errStr, http.StatusInternalServerError)
		return
	}
	h.WriteAckOKJSON(w)
}