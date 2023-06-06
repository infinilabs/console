package task_manager

import (
	"net/http"

	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
)

func (h *APIHandler) getIndexPartitionInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		index     = ps.MustGetParameter("index")
		clusterID = ps.MustGetParameter("id")
	)
	client := elastic.GetClient(clusterID)
	pq := &elastic.PartitionQuery{
		IndexName: index,
	}
	err := h.DecodeJSON(req, pq)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	partitions, err := elastic.GetPartitions(pq, client)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, partitions, http.StatusOK)
}

func (h *APIHandler) countDocuments(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		index     = ps.MustGetParameter("index")
		clusterID = ps.MustGetParameter("id")
	)
	client := elastic.GetClient(clusterID)
	reqBody := struct {
		Filter interface{} `json:"filter"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var query []byte
	if reqBody.Filter != nil {
		query = util.MustToJSONBytes(util.MapStr{
			"query": reqBody.Filter,
		})
	}

	ctx := req.Context()

	countRes, err := client.Count(ctx, index, query)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, countRes, http.StatusOK)
}

func (h *APIHandler) refreshIndex(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		index     = ps.MustGetParameter("index")
		clusterID = ps.MustGetParameter("id")
	)
	client := elastic.GetClient(clusterID)
	err := client.Refresh(index)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, 200)
}

type InitIndexRequest struct {
	Mappings map[string]interface{} `json:"mappings"`
	Settings map[string]interface{} `json:"settings"`
}

func (h *APIHandler) initIndex(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.MustGetParameter("id")
	indexName := ps.MustGetParameter("index")
	reqBody := &InitIndexRequest{}
	err := h.DecodeJSON(req, reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	client := elastic.GetClient(targetClusterID)
	exists, err := client.Exists(indexName)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if exists {
		if len(reqBody.Settings) > 0 {
			err = client.UpdateIndexSettings(indexName, reqBody.Settings)
			if err != nil {
				log.Error(err)
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}
		if ml := len(reqBody.Mappings); ml > 0 {
			var (
				docType             = ""
				mapping interface{} = reqBody.Mappings
			)
			if ml == 1 {
				for key, _ := range reqBody.Mappings {
					if key != "properties" {
						docType = key
						mapping = reqBody.Mappings[key]
					}
				}
			}
			mappingBytes := util.MustToJSONBytes(mapping)
			_, err = client.UpdateMapping(indexName, docType, mappingBytes)
			if err != nil {
				log.Error(err)
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}
	} else {
		indexSettings := map[string]interface{}{}
		if len(reqBody.Settings) > 0 {
			indexSettings["settings"] = reqBody.Settings
		}
		if len(reqBody.Mappings) > 0 {
			indexSettings["mappings"] = reqBody.Mappings
		}
		err = client.CreateIndex(indexName, indexSettings)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	h.WriteJSON(w, util.MapStr{
		"success": true,
	}, http.StatusOK)
}
