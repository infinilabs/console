/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"fmt"
	"infini.sh/console/service/alerting/common"
	"net/http"
	"strconv"
	"strings"
	"time"

	log "github.com/cihub/seelog"
	"infini.sh/console/model/alerting"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

func (h *AlertAPI) createChannel(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var obj = &alerting.Channel{}
	err := h.DecodeJSON(req, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	err = orm.Create(nil, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteCreatedOKJSON(w, obj.ID)

}

func (h *AlertAPI) getChannel(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("channel_id")

	obj := alerting.Channel{}
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

	h.WriteGetOKJSON(w, id, obj)
}

func (h *AlertAPI) updateChannel(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("channel_id")
	obj := alerting.Channel{}

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
	obj = alerting.Channel{}
	err = h.DecodeJSON(req, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	//protect
	obj.ID = id
	obj.Created = create
	err = orm.Update(nil, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteUpdatedOKJSON(w, id)
}

func (h *AlertAPI) deleteChannel(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	reqBody := struct {
		ChannelIDs []string `json:"ids"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if len(reqBody.ChannelIDs) == 0 {
		if err != nil {
			h.WriteError(w, "channel ids required", http.StatusInternalServerError)
			log.Error(err)
			return
		}
	}
	queryDsl := util.MapStr{
		"size": 1,
		"query": util.MapStr{
			"bool": util.MapStr{
				"minimum_should_match": 1,
				"should": []util.MapStr{
					{
						"terms": util.MapStr{
							"notification_config.normal.id": reqBody.ChannelIDs,
						},
					},
					{
						"terms": util.MapStr{
							"notification_config.escalation.id": reqBody.ChannelIDs,
						},
					},
					{
						"terms": util.MapStr{
							"recovery_notification_config.normal.id": reqBody.ChannelIDs,
						},
					},
				},
			},
		},
	}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(queryDsl),
	}
	err, result := orm.Search(alerting.Rule{}, &q)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if len(result.Result) > 0 {
		var ruleName interface{} = ""
		if m, ok := result.Result[0].(map[string]interface{}); ok {
			ruleName = m["name"]
		}
		h.WriteError(w, fmt.Sprintf("failed to delete channel since it is used by rule [%s]", ruleName), http.StatusInternalServerError)
		return
	}

	queryDsl = util.MapStr{
		"query": util.MapStr{
			"terms": util.MapStr{
				"id": reqBody.ChannelIDs,
			},
		},
	}

	err = orm.DeleteBy(alerting.Channel{}, util.MustToJSONBytes(queryDsl))
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"ids":    reqBody.ChannelIDs,
		"result": "deleted",
	}, 200)
}

func (h *AlertAPI) searchChannel(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var (
		keyword     = h.GetParameterOrDefault(req, "keyword", "")
		queryDSL    = `{"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
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

	err, res := orm.Search(&alerting.Channel{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.Write(w, res.Raw)
}

func (h *AlertAPI) testChannel(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	obj := alerting.Channel{}
	err := h.DecodeJSON(req, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	ctx := map[string]interface{}{
		"title": "INFINI platform test alert message",
		"message": "This is just a test email, do not reply!",
		"rule_id": util.GetUUID(),
		"rule_name": "test rule",
		"resource_id": util.GetUUID(),
		"resource_name": "test resource",
		"event_id": util.GetUUID(),
		"timestamp": time.Now().UnixMilli(),
		"first_group_value": "first group value",
		"first_threshold": "90",
		"priority": "critical",
		"results": []util.MapStr{
			{"threshold": "90",
				"priority": "critical",
				"group_values": []string{"first group value", "second group value"},
				"issue_timestamp": time.Now().UnixMilli()-500,
				"result_value": 90,
				"relation_values": util.MapStr{"a": 100, "b": 90},
			},
		},

	}
	_, err, _ = common.PerformChannel(&obj, ctx)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	h.WriteAckOKJSON(w)
}