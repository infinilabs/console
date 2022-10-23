/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/console/model/alerting"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
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

func (h *AlertAPI) searchAlert(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var (
		keyword        = h.GetParameterOrDefault(req, "keyword", "")
		queryDSL    = `{"sort":[%s],"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
		strSize     = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		state    = h.GetParameterOrDefault(req, "state", "")
		priority = h.GetParameterOrDefault(req, "priority", "")
		sort     = h.GetParameterOrDefault(req, "sort", "")
		ruleID        = h.GetParameterOrDefault(req, "rule_id", "")
		min        = h.GetParameterOrDefault(req, "min", "")
		max        = h.GetParameterOrDefault(req, "max", "")
		mustBuilder = &strings.Builder{}
		sortBuilder = strings.Builder{}
	)
	mustBuilder.WriteString(fmt.Sprintf(`{"range":{"created":{"gte":"%s", "lte": "%s"}}}`, min, max))
	if ruleID != "" {
		mustBuilder.WriteString(fmt.Sprintf(`,{"term":{"rule_id":{"value":"%s"}}}`, ruleID))
	}

	if sort != "" {
		sortParts := strings.Split(sort, ",")
		if len(sortParts) == 2 && sortParts[1] != "created" {
			sortBuilder.WriteString(fmt.Sprintf(`{"%s":{ "order": "%s"}},`, sortParts[0], sortParts[1]))
		}
	}
	sortBuilder.WriteString(`{"created":{ "order": "desc"}}`)

	if keyword != "" {
		mustBuilder.WriteString(fmt.Sprintf(`{"query_string":{"default_field":"*","query": "%s"}}`, keyword))
	}
	if state != "" {
		mustBuilder.WriteString(",")
		mustBuilder.WriteString(fmt.Sprintf(`{"term":{"state":{"value":"%s"}}}`, state))
	}
	if priority != "" {
		mustBuilder.WriteString(",")
		mustBuilder.WriteString(fmt.Sprintf(`{"term":{"priority":{"value":"%s"}}}`, priority))
	}
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	q := orm.Query{
		WildcardIndex: true,
	}
	queryDSL = fmt.Sprintf(queryDSL, sortBuilder.String(), mustBuilder.String(), size, from)
	q.RawQuery = []byte(queryDSL)

	err, res := orm.Search(&alerting.Alert{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.Write(w, res.Raw)
}

func (h *AlertAPI) getAlertStats(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	queryDsl := util.MapStr{
		"size": 0,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must_not": []util.MapStr{
					{
						"terms": util.MapStr{
							"state": []string{
								"acknowledged",
								"normal",
								"",
							},
						},
					},
				},
			},
		},
		"aggs": util.MapStr{
			"terms_by_state": util.MapStr{
				"terms": util.MapStr{
					"field": "priority",
					"size": 5,
				},
			},
		},
	}

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetWildcardIndexName(alerting.Alert{}), util.MustToJSONBytes(queryDsl) )
	if err != nil {
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	priorityAlerts := map[string]interface{}{}
	if termsAgg, ok := searchRes.Aggregations["terms_by_state"]; ok {
		for _, bk := range termsAgg.Buckets {
			if priority, ok := bk["key"].(string); ok {
				priorityAlerts[priority] = bk["doc_count"]
			}
		}
	}
	for priority, _ := range alerting.PriorityWeights {
		if _, ok := priorityAlerts[priority]; !ok {
			priorityAlerts[priority] = 0
		}
	}
	h.WriteJSON(w, util.MapStr{
		"alert": util.MapStr{
			"current": priorityAlerts,
		},
	}, http.StatusOK)
}