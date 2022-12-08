/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package insight

import (
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/insight"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	log "src/github.com/cihub/seelog"
	"strconv"
)

func (h *InsightAPI) createDashboard(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var obj = &insight.Dashboard{}
	err := h.DecodeJSON(req, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	err = orm.Create(obj, "")
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "created",
	}, 200)

}

func (h *InsightAPI) getDashboard(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("dashboard_id")

	obj := insight.Dashboard{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	query := util.MapStr{
		"query": util.MapStr{
			"terms": util.MapStr{
				"id": obj.Visualizations,
			},
		},
	}
	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}
	err, result := orm.Search(insight.Visualization{}, q)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	obj.Visualizations = result.Result

	h.WriteJSON(w, util.MapStr{
		"found":   true,
		"_id":     id,
		"_source": obj,
	}, 200)
}

func (h *InsightAPI) updateDashboard(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("dashboard_id")
	obj := insight.Dashboard{}

	obj.ID = id
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	id = obj.ID
	create := obj.Created
	obj = insight.Dashboard{}
	err = h.DecodeJSON(req, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	//protect
	obj.ID = id
	obj.Created = create
	err = orm.Update(&obj, "")
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "updated",
	}, 200)
}

func (h *InsightAPI) deleteDashboard(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("dashboard_id")

	obj := insight.Dashboard{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	err = orm.Delete(&obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "deleted",
	}, 200)
}

func (h *InsightAPI) searchDashboard(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		keyword        = h.GetParameterOrDefault(req, "keyword", "")
		strSize     = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		clusterID        = h.GetParameter(req, "cluster_id")
	)
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	must := []util.MapStr{}
	if keyword != "" {
		must = append(must, util.MapStr{
			"query_string": util.MapStr{
				"default_field":"*",
				"query": keyword,
			},
		})
	}

	if clusterID != "" {
		must = append(must, util.MapStr{
			"term": util.MapStr{
				"cluster_id": util.MapStr{
					"value": clusterID,
				},
			},
		})
	}

	queryDSL := util.MapStr{
		"size": size,
		"from": from,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": must,
			},
		},
	}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(queryDSL),
	}

	err, res := orm.Search(&insight.Dashboard{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.Write(w, res.Raw)
}