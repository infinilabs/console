/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"fmt"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"infini.sh/console/model/alerting"
	alerting2 "infini.sh/console/service/alerting"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func (h *AlertAPI) ignoreAlertMessage(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	body := struct {
		Messages []alerting.AlertMessage `json:"messages"`
		IgnoredReason string `json:"ignored_reason"`
		IsReset bool `json:"is_reset"`
	}{}
	err := h.DecodeJSON(req,  &body)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(body.Messages) == 0 {
		h.WriteError(w, "messages should not be empty", http.StatusInternalServerError)
		return
	}
	messageIDs := make([]string, 0, len(body.Messages))
	for _, msg := range body.Messages {
		messageIDs = append(messageIDs, msg.ID)
	}
	currentUser := h.GetCurrentUser(req)
	must := []util.MapStr{
		{
			"terms": util.MapStr{
				"_id": messageIDs,
			},
		},
	}
	var source string
	if body.IsReset {
		must = append(must, util.MapStr{
			"term": util.MapStr{
				"status": util.MapStr{
					"value": alerting.MessageStateIgnored,
				},
			},
		})
		source = fmt.Sprintf("ctx._source['status'] = '%s'", alerting.MessageStateAlerting)
	}else {
		must = append(must, util.MapStr{
			"term": util.MapStr{
				"status": util.MapStr{
					"value": alerting.MessageStateAlerting,
				},
			},
		})
		source = fmt.Sprintf("ctx._source['status'] = '%s';ctx._source['ignored_time']='%s';ctx._source['ignored_reason']='%s';ctx._source['ignored_user']='%s'", alerting.MessageStateIgnored, time.Now().Format(time.RFC3339Nano), body.IgnoredReason, currentUser)
	}
	queryDsl := util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": must,
			},
		},
		"script": util.MapStr{
			"source": source,
		},
	}
	err = orm.UpdateBy(alerting.AlertMessage{}, util.MustToJSONBytes(queryDsl))
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	//delete kv cache
	for _, msg := range body.Messages {
		_ = kv.DeleteKey(alerting2.KVLastMessageState, []byte(msg.RuleID))
	}


	h.WriteJSON(w, util.MapStr{
		"ids": messageIDs,
		"result": "updated",
	}, 200)
}

func (h *AlertAPI) getAlertMessageStats(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	must := []util.MapStr{
		{
			"terms": util.MapStr{
				"status": []string{
					alerting.MessageStateAlerting,
				},
			},
		},
	}
	clusterFilter, hasAllPrivilege := h.GetClusterFilter(req, "resource_id")
	if !hasAllPrivilege && clusterFilter == nil {
		h.WriteJSON(w, elastic.SearchResponse{}, http.StatusOK)
		return
	}
	if !hasAllPrivilege {
		must = append(must,clusterFilter)
	}
	queryDsl := util.MapStr{
		"size": 0,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": must,
			},
		},
		"aggs": util.MapStr{
			"terms_by_priority": util.MapStr{
				"terms": util.MapStr{
					"field": "priority",
					"size": 5,
				},
			},
		},
	}
	indexName := orm.GetWildcardIndexName(alerting.AlertMessage{})
	searchRes, err := esClient.SearchWithRawQueryDSL(indexName, util.MustToJSONBytes(queryDsl) )
	if err != nil {
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	statusCounts := map[string]interface{}{}
	if termsAgg, ok := searchRes.Aggregations["terms_by_priority"]; ok {
		for _, bk := range termsAgg.Buckets {
			if status, ok := bk["key"].(string); ok {
				statusCounts[status] = bk["doc_count"]
			}
		}
	}
	for _, status := range []string{"info", "low","medium","high", "critical"} {
		if _, ok := statusCounts[status]; !ok {
			statusCounts[status] = 0
		}
	}
	must[0] = util.MapStr{
		"term": util.MapStr{
			"status": util.MapStr{
				"value": alerting.MessageStateIgnored,
			},
		},
	}
	queryDsl = util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": must,
			},
		},
	}
	countRes, err := esClient.Count(nil, indexName, util.MustToJSONBytes(queryDsl))
	if err != nil {
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	statusCounts[alerting.MessageStateIgnored] = countRes.Count

	queryDsl = util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"terms_by_category": util.MapStr{
				"terms": util.MapStr{
					"field": "category",
					"size": 100,
				},
			},
			"terms_by_tags": util.MapStr{
				"terms": util.MapStr{
					"field": "tags",
					"size": 100,
				},
			},
		},
	}
	searchRes, err = esClient.SearchWithRawQueryDSL(indexName, util.MustToJSONBytes(queryDsl) )
	if err != nil {
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	categories := []string{}
	if termsAgg, ok := searchRes.Aggregations["terms_by_category"]; ok {
		for _, bk := range termsAgg.Buckets {
			if cate, ok := bk["key"].(string); ok {
				categories = append(categories, cate)
			}
		}
	}
	tags := []string{}
	if termsAgg, ok := searchRes.Aggregations["terms_by_tags"]; ok {
		for _, bk := range termsAgg.Buckets {
			if tag, ok := bk["key"].(string); ok {
				tags = append(tags, tag)
			}
		}
	}
	h.WriteJSON(w, util.MapStr{
		"alert": util.MapStr{
			"current": statusCounts,
		},
		"categories": categories,
		"tags": tags,
	}, http.StatusOK)
}


func (h *AlertAPI) searchAlertMessage(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var (
		queryDSL    = `{"sort":[%s],"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
		strSize     = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		status   = h.GetParameterOrDefault(req, "status", "")
		priority = h.GetParameterOrDefault(req, "priority", "")
		sort     = h.GetParameterOrDefault(req, "sort", "")
		ruleID        = h.GetParameterOrDefault(req, "rule_id", "")
		min        = h.GetParameterOrDefault(req, "min", "now-30d")
		max        = h.GetParameterOrDefault(req, "max", "now")
		mustBuilder = &strings.Builder{}
		sortBuilder = strings.Builder{}
		category = h.GetParameterOrDefault(req, "category", "")
		tags = h.GetParameterOrDefault(req, "tags", "")
	)
	mustBuilder.WriteString(fmt.Sprintf(`{"range":{"created":{"gte":"%s", "lte": "%s"}}}`, min, max))
	if ruleID != "" {
		mustBuilder.WriteString(fmt.Sprintf(`,{"term":{"rule_id":{"value":"%s"}}}`, ruleID))
	}
	clusterFilter, hasAllPrivilege := h.GetClusterFilter(req, "resource_id")
	if !hasAllPrivilege && clusterFilter == nil {
		h.WriteJSON(w, elastic.SearchResponse{}, http.StatusOK)
		return
	}
	if !hasAllPrivilege {
		mustBuilder.WriteString(",")
		mustBuilder.Write(util.MustToJSONBytes(clusterFilter))
	}

	if sort != "" {
		sortParts := strings.Split(sort, ",")
		if len(sortParts) == 2 && sortParts[1] != "updated" {
			sortBuilder.WriteString(fmt.Sprintf(`{"%s":{ "order": "%s"}},`, sortParts[0], sortParts[1]))
		}
	}
	sortBuilder.WriteString(`{"updated":{ "order": "desc"}}`)

	if status != "" {
		mustBuilder.WriteString(",")
		mustBuilder.WriteString(fmt.Sprintf(`{"term":{"status":{"value":"%s"}}}`, status))
	}
	if priority != "" {
		mustBuilder.WriteString(",")
		mustBuilder.WriteString(fmt.Sprintf(`{"term":{"priority":{"value":"%s"}}}`, priority))
	}
	if category != "" {
		mustBuilder.WriteString(",")
		mustBuilder.WriteString(fmt.Sprintf(`{"term":{"category":{"value":"%s"}}}`, category))
	}
	if tags != "" {
		mustBuilder.WriteString(",")
		mustBuilder.WriteString(fmt.Sprintf(`{"term":{"tags":{"value":"%s"}}}`, tags))
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
	var hitCondition string
	for i, cond := range rule.Conditions.Items {
		expression, _ := cond.GenerateConditionExpression()
		if cond.Priority == message.Priority {
			hitCondition = strings.ReplaceAll(expression, "result", "")
		}
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
		"rule_name": rule.Name,
		"rule_enabled": rule.Enabled,
		"title": message.Title,
		"message": message.Message,
		"priority": message.Priority,
		"created": message.Created,
		"updated": message.Updated,
		"resource_name": rule.Resource.Name,
		"resource_id": rule.Resource.ID,
		"resource_objects": rule.Resource.Objects,
		"conditions": rule.Conditions,
		"duration": duration.Milliseconds(),
		"ignored_time": message.IgnoredTime,
		"ignored_reason": message.IgnoredReason,
		"ignored_user": message.IgnoredUser,
		"status": message.Status,
		"expression": rule.Metrics.Expression,
		"hit_condition": hitCondition,
	}
	h.WriteJSON(w, detailObj, http.StatusOK)
}

func (h *AlertAPI) getMessageNotificationInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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
	notificationInfo := util.MapStr{}
	if rule.NotificationConfig == nil && rule.RecoveryNotificationConfig == nil {
		notificationInfo["is_empty"] = true
		h.WriteJSON(w, notificationInfo, http.StatusOK)
		return
	}
	stats, err := getMessageNotificationStats(message)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if rule.NotificationConfig != nil {
		notificationInfo["alerting"] = util.MapStr{
			"accept_time_range": rule.NotificationConfig.AcceptTimeRange,
			"throttle_period": rule.NotificationConfig.ThrottlePeriod,
			"escalation_enabled":  rule.NotificationConfig.EscalationEnabled,
			"escalation_throttle_period": rule.NotificationConfig.EscalationThrottlePeriod,
			"normal_stats": stats["normal"],
			"escalation_stats": stats["escalation"],
		}
	}
	if rule.RecoveryNotificationConfig != nil {
		notificationInfo["recovery"] = util.MapStr{
			"stats": stats["recovery"],
		}
	}
	h.WriteJSON(w, notificationInfo, http.StatusOK)
}

func getMessageNotificationStats(msg *alerting.AlertMessage )(util.MapStr, error){
	rangeQ := util.MapStr{
		"gte": msg.Created.UnixMilli(),
	}
	if msg.Status == alerting.MessageStateRecovered {
		rangeQ["lte"] = msg.Updated.UnixMilli()
	}
	aggs := util.MapStr{
		"grp_normal_channel": util.MapStr{
			"terms": util.MapStr{
				"field": "action_execution_results.channel_type",
				"size": 20,
			},
			"aggs": util.MapStr{
				"top": util.MapStr{
					"top_hits": util.MapStr{
						"sort": []util.MapStr{
							{
								"created": util.MapStr{
									"order": "desc",
								},
							},
						},
						"_source": util.MapStr{
							"includes": []string{"created", "action_execution_results.channel_name", "action_execution_results.channel_type"},
						},
						"size": 1,
					},
				},
			},
		},
		"grp_escalation_channel": util.MapStr{
			"terms": util.MapStr{
				"field": "escalation_action_results.channel_type",
				"size": 20,
			},
			"aggs": util.MapStr{
				"top": util.MapStr{
					"top_hits": util.MapStr{
						"sort": []util.MapStr{
							{
								"created": util.MapStr{
									"order": "desc",
								},
							},
						},
						"_source": util.MapStr{
							"includes": []string{"created", "escalation_action_results.channel_name", "escalation_action_results.channel_type"},
						},
						"size": 1,
					},
				},
			},
		},
	}
	if msg.Status == alerting.MessageStateRecovered {
		aggs["grp_recover_channel"] = util.MapStr{
			"terms": util.MapStr{
				"field": "recover_action_results.channel_type",
				"size": 20,
			},
			"aggs": util.MapStr{
				"top": util.MapStr{
					"top_hits": util.MapStr{
						"sort": []util.MapStr{
							{
								"created": util.MapStr{
									"order": "desc",
								},
							},
						},
						"_source": util.MapStr{
							"includes": []string{"created", "recover_action_results.channel_name", "recover_action_results.channel_type"},
						},
						"size": 1,
					},
				},
			},
		}
	}
	query := util.MapStr{
		"size": 0,
		"aggs": aggs,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"range": util.MapStr{
							"created": rangeQ,
						},
					},
					{
						"term": util.MapStr{
							"rule_id": util.MapStr{
								"value": msg.RuleID,
							},
						},
					},
				},
			},
		},
	}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}
	err, result := orm.Search(alerting.Alert{}, &q)
	if err != nil {
		return nil, err
	}

	var normalStats = extractStatsFromRaw(result.Raw, "grp_normal_channel", "action_execution_results")
	var escalationStats = extractStatsFromRaw(result.Raw, "grp_escalation_channel", "escalation_action_results")
	stats := util.MapStr{
		"normal": normalStats,
		"escalation": escalationStats,
	}
	if msg.Status == alerting.MessageStateRecovered {
		recoverStats := extractStatsFromRaw(result.Raw, "grp_recover_channel", "recover_action_results")
		stats["recovery"] = recoverStats
	}

	return stats, nil
}
func extractStatsFromRaw(searchRawRes []byte, grpKey string, actionKey string) []util.MapStr {
	var stats []util.MapStr
	jsonparser.ArrayEach(searchRawRes, func(value []byte, dataType jsonparser.ValueType, offset int, err error) {
		statsItem := util.MapStr{}
		statsItem["channel_type"], _ = jsonparser.GetString(value, "key")
		statsItem["count"], _ = jsonparser.GetInt(value, "doc_count")
		jsonparser.ArrayEach(value, func(v []byte, dataType jsonparser.ValueType, offset int, err error) {
			ck, _ := jsonparser.GetString(v,  "channel_type")
			cn, _ := jsonparser.GetString(v,  "channel_name")
			if ck == statsItem["channel_type"] {
				statsItem["channel_name"] = cn
			}
		}, "top", "hits","hits", "[0]", "_source",actionKey)
		statsItem["last_time"], _ =  jsonparser.GetString(value, "top", "hits","hits", "[0]", "_source","created")
		stats = append(stats, statsItem)
	}, "aggregations", grpKey, "buckets")
	return stats
}