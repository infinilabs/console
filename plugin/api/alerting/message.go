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
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func (h *AlertAPI) ignoreAlertMessage(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	body := struct {
		MessageIDs []string `json:"ids"`
	}{}
	err := h.DecodeJSON(req,  &body)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(body.MessageIDs) == 0 {
		h.WriteError(w, "alert ids should not be empty", http.StatusInternalServerError)
		return
	}
	queryDsl := util.MapStr{
		"query": util.MapStr{
			"terms": util.MapStr{
				"_id": body.MessageIDs,
			},
		},
		"script": util.MapStr{
			"source": fmt.Sprintf("ctx._source['status'] = '%s';ctx._source['ignored_time']='%s'", alerting.MessageStateIgnored, time.Now().Format(time.RFC3339Nano)),
		},
	}
	err = orm.UpdateBy(alerting.AlertMessage{}, util.MustToJSONBytes(queryDsl))
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"ids": body.MessageIDs,
		"result": "updated",
	}, 200)
}

func (h *AlertAPI) getAlertMessageStats(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	esClient := elastic.GetClient(h.Config.Elasticsearch)
	queryDsl := util.MapStr{
		"size": 0,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must_not": []util.MapStr{
					{
						"terms": util.MapStr{
							"status": []string{
								alerting.MessageStateRecovered,
							},
						},
					},
				},
			},
		},
		"aggs": util.MapStr{
			"terms_by_severity": util.MapStr{
				"terms": util.MapStr{
					"field": "severity",
					"size": 5,
				},
			},
		},
	}

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetWildcardIndexName(alerting.AlertMessage{}), util.MustToJSONBytes(queryDsl) )
	if err != nil {
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	statusCounts := map[string]interface{}{}
	if termsAgg, ok := searchRes.Aggregations["terms_by_severity"]; ok {
		for _, bk := range termsAgg.Buckets {
			if status, ok := bk["key"].(string); ok {
				statusCounts[status] = bk["doc_count"]
			}
		}
	}
	for _, status := range []string{"warning", "error", "critical"} {
		if _, ok := statusCounts[status]; !ok {
			statusCounts[status] = 0
		}
	}
	h.WriteJSON(w, util.MapStr{
		"alert": util.MapStr{
			"current": statusCounts,
		},
	}, http.StatusOK)
}


func (h *AlertAPI) searchAlertMessage(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var (
		queryDSL    = `{"sort":[%s],"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
		strSize     = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		status = h.GetParameterOrDefault(req, "status", "")
		severity = h.GetParameterOrDefault(req, "severity", "")
		sort = h.GetParameterOrDefault(req, "sort", "")
		ruleID        = h.GetParameterOrDefault(req, "rule_id", "")
		min        = h.GetParameterOrDefault(req, "min", "now-1d")
		max        = h.GetParameterOrDefault(req, "max", "now")
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

	if status != "" {
		mustBuilder.WriteString(",")
		mustBuilder.WriteString(fmt.Sprintf(`{"term":{"status":{"value":"%s"}}}`, status))
	}
	if severity != "" {
		mustBuilder.WriteString(",")
		mustBuilder.WriteString(fmt.Sprintf(`{"term":{"severity":{"value":"%s"}}}`, severity))
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
	queryDSL = fmt.Sprintf(queryDSL, sortBuilder.String(), mustBuilder.String(), size, from)
	q.RawQuery = []byte(queryDSL)

	err, res := orm.Search(&alerting.AlertMessage{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	esRes := elastic.SearchResponse{}
	err = util.FromJSONBytes(res.Raw, &esRes)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	for _, hit := range esRes.Hits.Hits {
		created, _ := parseTime(hit.Source["created"], time.RFC3339)
		updated, _ := parseTime(hit.Source["updated"], time.RFC3339)
		if !created.IsZero() && !updated.IsZero() {
			endTime := time.Now()
			if hit.Source["status"] == alerting.MessageStateRecovered {
				endTime = updated
			}
			hit.Source["duration"] = endTime.Sub(created).Milliseconds()
		}

	}
	h.WriteJSON(w, esRes, http.StatusOK)
}

func parseTime( t interface{}, layout string) (time.Time, error){
	switch t.(type) {
	case string:
		return time.Parse(layout, t.(string))
	default:
		return time.Time{}, fmt.Errorf("unsupport time type")
	}
}

func (h *AlertAPI) getAlertMessage(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	message :=  &alerting.AlertMessage{
		ID: ps.ByName("message_id"),
	}
	exists, err := orm.Get(message)
	if !exists || err != nil {
		log.Error(err)
		h.WriteJSON(w, util.MapStr{
			"_id":   message.ID,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	rule := &alerting.Rule{
		ID: message.RuleID,
	}
	exists, err = orm.Get(rule)
	if !exists || err != nil {
		log.Error(err)
		h.WriteError(w, fmt.Sprintf("rule [%s] not found", rule.ID), http.StatusInternalServerError)
		return
	}
	metricExpression, _ := rule.Metrics.GenerateExpression()
	for i, cond := range rule.Conditions.Items {
		expression, _ := cond.GenerateConditionExpression()
		rule.Conditions.Items[i].Expression = strings.ReplaceAll(expression, "result", metricExpression)
	}
	var duration time.Duration
	if message.Status == alerting.MessageStateRecovered {
		duration = message.Updated.Sub(message.Created)
	}else{
		duration = time.Now().Sub(message.Created)
	}
	detailObj := util.MapStr{
		"message_id": message.ID,
		"rule_id": message.RuleID,
		"title": message.Title,
		"message": message.Message,
		"severity": message.Severity,
		"created": message.Created,
		"updated": message.Updated,
		"resource_name": rule.Resource.Name,
		"resource_objects": rule.Resource.Objects,
		"conditions": rule.Conditions,
		"duration": duration.Milliseconds(),
		"ignored_time": message.IgnoredTime,
		"status": message.Status,
	}
	h.WriteJSON(w, detailObj, http.StatusOK)
}