/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"fmt"
	"infini.sh/console/model/alerting"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	log "src/github.com/cihub/seelog"
	"strconv"
	"strings"
)

func (h *AlertAPI) getAlert(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("alert_id")

	obj := alerting.Alert{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"found":   true,
		"_id":     id,
		"_source": obj,
	}, 200)
}

func (h *AlertAPI) acknowledgeAlert(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	body := struct {
		AlertIDs []string `json:"ids"`
	}{}
	err := h.DecodeJSON(req,  &body)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(body.AlertIDs) == 0 {
		h.WriteError(w, "alert ids should not be empty", http.StatusInternalServerError)
		return
	}
	queryDsl := util.MapStr{
		"query": util.MapStr{
			"terms": util.MapStr{
				"_id": body.AlertIDs,
			},
		},
		"script": util.MapStr{
			"source": fmt.Sprintf("ctx._source['state'] = '%s'", alerting.AlertStateAcknowledge),
		},
	}
	err = orm.UpdateBy(alerting.Alert{}, util.MustToJSONBytes(queryDsl))
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"ids": body.AlertIDs,
		"result": "updated",
	}, 200)
}


func (h *AlertAPI) searchAlert(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var (
		keyword        = h.GetParameterOrDefault(req, "keyword", "")
		queryDSL    = `{"sort":[{"created":{ "order": "desc"}}],"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
		strSize     = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		mustBuilder = &strings.Builder{}
	)
	if keyword != "" {
		mustBuilder.WriteString(fmt.Sprintf(`{"query_string":{"default_field":"*","query": "%s"}}`, keyword))
	}
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	q := orm.Query{}
	queryDSL = fmt.Sprintf(queryDSL, mustBuilder.String(), size, from)
	q.RawQuery = []byte(queryDSL)

	err, res := orm.Search(&alerting.Alert{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.Write(w, res.Raw)
}
