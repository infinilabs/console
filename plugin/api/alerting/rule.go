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

/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"errors"
	"fmt"
	log "github.com/cihub/seelog"
	"github.com/r3labs/diff/v2"
	"infini.sh/console/core/security"
	"infini.sh/console/model/alerting"
	"infini.sh/console/model/insight"
	"infini.sh/console/modules/elastic/api"
	alerting2 "infini.sh/console/service/alerting"
	_ "infini.sh/console/service/alerting/elasticsearch"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/queue"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	elastic2 "infini.sh/framework/modules/elastic"
	"infini.sh/framework/modules/elastic/common"
	"net/http"
	"strings"
	"time"
)

func (alertAPI *AlertAPI) createRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	rules := []alerting.Rule{}
	err := alertAPI.DecodeJSON(req, &rules)
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	user, err := security.FromUserContext(req.Context())
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var ids []string
	for _, rule := range rules {
		exists, err := checkResourceExists(&rule)
		if err != nil || !exists {
			log.Error(err)
			alertAPI.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusInternalServerError)
			return
		}
		rule.Metrics.Expression, err = rule.Metrics.GenerateExpression()
		if err != nil {
			log.Error(err)
			alertAPI.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusInternalServerError)
			return
		}
		rule.ID = util.GetUUID()
		ids = append(ids, rule.ID)
		rule.Created = time.Now()
		rule.Updated = time.Now()
		if rule.Schedule.Interval == "" {
			rule.Schedule.Interval = "1m"
		}
		//filter empty metric group
		var groups []insight.MetricGroupItem
		for _, grp := range rule.Metrics.Groups {
			if grp.Field != "" {
				groups = append(groups, grp)
			}
		}
		rule.Metrics.Groups = groups
		if user != nil {
			rule.Creator.Name = user.Username
			rule.Creator.Id = user.UserId
		}

		err = orm.Save(nil, rule)
		if err != nil {
			log.Error(err)
			alertAPI.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusInternalServerError)
			return
		}
		saveAlertActivity("alerting_rule_change", "create", util.MapStr{
			"cluster_id":   rule.Resource.ID,
			"rule_id":      rule.ID,
			"cluster_name": rule.Resource.Name,
			"rule_name":    rule.Name,
		}, nil, &rule)
		eng := alerting2.GetEngine(rule.Resource.Type)
		if rule.Enabled {
			ruleTask := task.ScheduleTask{
				ID:          rule.ID,
				Interval:    rule.Schedule.Interval,
				Description: rule.Metrics.Expression,
				Task:        eng.GenerateTask(rule),
			}
			task.RegisterScheduleTask(ruleTask)
			task.StartTask(ruleTask.ID)
		}

	}

	alertAPI.WriteJSON(w, util.MapStr{
		"result": "created",
		"ids":    ids,
	}, http.StatusOK)
}
func (alertAPI *AlertAPI) getRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("rule_id")
	obj := alerting.Rule{}
	obj.ID = id

	_, err := orm.Get(&obj)
	if err != nil {
		if errors.Is(err, elastic2.ErrNotFound) {
			alertAPI.WriteJSON(w, util.MapStr{
				"_id":   id,
				"found": false,
			}, http.StatusNotFound)
			return
		}
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// adapter version smaller than 1.6.0
	if obj.Channels != nil && obj.NotificationConfig == nil {
		obj.NotificationConfig = obj.Channels
		for i := range obj.NotificationConfig.Normal {
			obj.NotificationConfig.Normal[i].Enabled = true
		}
		for i := range obj.NotificationConfig.Escalation {
			obj.NotificationConfig.Escalation[i].Enabled = true
		}
	}
	if obj.NotificationConfig != nil && obj.NotificationConfig.Message == "" && obj.Metrics.Message != "" {
		obj.NotificationConfig.Message = obj.Metrics.Message
		obj.NotificationConfig.Title = obj.Metrics.Title
	}

	alertAPI.WriteJSON(w, util.MapStr{
		"found":   true,
		"_id":     id,
		"_source": obj,
	}, 200)

}

func (alertAPI *AlertAPI) getRuleDetail(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("rule_id")
	obj := alerting.Rule{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		if errors.Is(err, elastic2.ErrNotFound) {
			alertAPI.WriteJSON(w, util.MapStr{
				"_id":   id,
				"found": false,
			}, http.StatusNotFound)
			return
		}
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	metricExpression, _ := obj.Metrics.GenerateExpression()
	conditions := obj.Conditions
	if obj.BucketConditions != nil {
		conditions = *obj.BucketConditions
	}
	for i, cond := range conditions.Items {
		expression, _ := cond.GenerateConditionExpression()
		conditions.Items[i].Expression = strings.ReplaceAll(expression, "result", metricExpression)
	}
	alertNumbers, err := alertAPI.getRuleAlertMessageNumbers([]string{obj.ID})
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	queryDSL := util.MapStr{
		"size": 1,
		"sort": []util.MapStr{
			{
				"created": util.MapStr{
					"order": "desc",
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"rule_id": util.MapStr{
								"value": obj.ID,
							},
						},
					},
					{
						"term": util.MapStr{
							"status": util.MapStr{
								"value": alerting.MessageStateAlerting,
							},
						},
					},
				},
			},
		},
	}
	q := &orm.Query{
		WildcardIndex: true,
		RawQuery:      util.MustToJSONBytes(queryDSL),
	}
	err, result := orm.Search(alerting.AlertMessage{}, q)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var state interface{} = "N/A"
	var alertingMessageItem interface{}
	if len(result.Result) > 0 {
		alertingMessageItem = result.Result[0]
		if resultM, ok := result.Result[0].(map[string]interface{}); ok {
			state = resultM["status"]
		}
	}
	var channelIDs []interface{}
	if obj.NotificationConfig != nil {
		for _, ch := range obj.NotificationConfig.Normal {
			channelIDs = append(channelIDs, ch.ID)
		}
		for _, ch := range obj.NotificationConfig.Escalation {
			channelIDs = append(channelIDs, ch.ID)
		}
	}
	if obj.RecoveryNotificationConfig != nil {
		for _, ch := range obj.RecoveryNotificationConfig.Normal {
			channelIDs = append(channelIDs, ch.ID)
		}
	}
	q = &orm.Query{
		Size: len(channelIDs),
	}
	q.Conds = append(q.Conds, orm.In("id", channelIDs))
	err, result = orm.Search(alerting.Channel{}, q)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	chm := map[string]alerting.Channel{}
	for _, row := range result.Result {
		buf := util.MustToJSONBytes(row)
		ch := alerting.Channel{}
		util.MustFromJSONBytes(buf, &ch)
		chm[ch.ID] = ch
	}
	if obj.NotificationConfig != nil {
		for i, ch := range obj.NotificationConfig.Normal {
			if v, ok := chm[ch.ID]; ok {
				obj.NotificationConfig.Normal[i].Enabled = v.Enabled && ch.Enabled
				obj.NotificationConfig.Normal[i].Type = v.SubType
				obj.NotificationConfig.Normal[i].Name = v.Name
			}
		}
		for i, ch := range obj.NotificationConfig.Escalation {
			if v, ok := chm[ch.ID]; ok {
				obj.NotificationConfig.Escalation[i].Enabled = v.Enabled && ch.Enabled
				obj.NotificationConfig.Escalation[i].Type = v.SubType
				obj.NotificationConfig.Escalation[i].Name = v.Name
			}
		}
	}
	if obj.RecoveryNotificationConfig != nil {
		for i, ch := range obj.RecoveryNotificationConfig.Normal {
			if v, ok := chm[ch.ID]; ok {
				obj.RecoveryNotificationConfig.Normal[i].Enabled = v.Enabled && ch.Enabled
				obj.RecoveryNotificationConfig.Normal[i].Type = v.SubType
				obj.RecoveryNotificationConfig.Normal[i].Name = v.Name
			}
		}
	}

	detailObj := util.MapStr{
		"rule_name":                    obj.Name,
		"resource_name":                obj.Resource.Name,
		"resource_id":                  obj.Resource.ID,
		"resource_objects":             obj.Resource.Objects,
		"resource_time_field":          obj.Resource.TimeField,
		"resource_raw_filter":          obj.Resource.RawFilter,
		"metrics":                      obj.Metrics,
		"bucket_size":                  obj.Metrics.BucketSize, //统计周期
		"updated":                      obj.Updated,
		"conditions":                   obj.Conditions,
		"bucket_conditions":            obj.BucketConditions,
		"message_count":                alertNumbers[obj.ID], //所有关联告警消息数（包括已恢复的）
		"state":                        state,
		"enabled":                      obj.Enabled,
		"created":                      obj.Created,
		"creator":                      obj.Creator,
		"tags":                         obj.Tags,
		"alerting_message":             alertingMessageItem,
		"expression":                   obj.Metrics.Expression,
		"notification_config":          obj.NotificationConfig,
		"recovery_notification_config": obj.RecoveryNotificationConfig,
	}

	alertAPI.WriteJSON(w, detailObj, 200)

}

func saveActivity(activityInfo *event.Activity) {
	queueConfig := queue.GetOrInitConfig("platform##activities")
	if queueConfig.Labels == nil {
		queueConfig.ReplaceLabels(util.MapStr{
			"type":     "platform",
			"name":     "activity",
			"category": "elasticsearch",
			"activity": true,
		})
	}
	err := queue.Push(queueConfig, util.MustToJSONBytes(event.Event{
		Timestamp: time.Now(),
		Metadata: event.EventMetadata{
			Category: "elasticsearch",
			Name:     "activity",
		},
		Fields: util.MapStr{
			"activity": activityInfo,
		}}))
	if err != nil {
		log.Error(err)
	}
}

func saveAlertActivity(name, typ string, labels map[string]interface{}, changelog diff.Changelog, oldState interface{}) {
	activityInfo := &event.Activity{
		ID:        util.GetUUID(),
		Timestamp: time.Now(),
		Metadata: event.ActivityMetadata{
			Category: "elasticsearch",
			Group:    "platform",
			Name:     name,
			Type:     typ,
			Labels:   labels,
		},
		Changelog: changelog,
		Fields: util.MapStr{
			"rule": oldState,
		},
	}
	saveActivity(activityInfo)
}

func (alertAPI *AlertAPI) updateRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("rule_id")
	oldRule := &alerting.Rule{}

	oldRule.ID = id
	exists, err := orm.Get(oldRule)
	if !exists || err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	id = oldRule.ID
	create := oldRule.Created
	rule := &alerting.Rule{}
	err = alertAPI.DecodeJSON(req, rule)
	if err != nil {
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	rule.Metrics.Expression, err = rule.Metrics.GenerateExpression()
	if err != nil {
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	changeLog, err := util.DiffTwoObject(oldRule, rule)
	if err != nil {
		log.Error(err)
	}

	//protect
	rule.ID = id
	rule.Created = create
	rule.Updated = time.Now()

	//filter empty metric group
	var groups []insight.MetricGroupItem
	for _, grp := range rule.Metrics.Groups {
		if grp.Field != "" {
			groups = append(groups, grp)
		}
	}
	rule.Metrics.Groups = groups

	err = orm.Update(nil, rule)
	if err != nil {
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	saveAlertActivity("alerting_rule_change", "update", util.MapStr{
		"cluster_id":   rule.Resource.ID,
		"rule_id":      rule.ID,
		"rule_name":    rule.Name,
		"cluster_name": rule.Resource.Name,
	}, changeLog, oldRule)

	if rule.Enabled {
		exists, err = checkResourceExists(rule)
		if err != nil || !exists {
			log.Error(err)
			alertAPI.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusInternalServerError)
			return
		}
		//update task
		task.StopTask(id)
		clearKV(rule.ID)
		eng := alerting2.GetEngine(rule.Resource.Type)
		ruleTask := task.ScheduleTask{
			ID:          rule.ID,
			Interval:    rule.Schedule.Interval,
			Description: rule.Metrics.Expression,
			Task:        eng.GenerateTask(*rule),
		}
		task.RegisterScheduleTask(ruleTask)
		task.StartTask(ruleTask.ID)
	} else {
		task.DeleteTask(id)
	}

	alertAPI.WriteJSON(w, util.MapStr{
		"_id":    rule.ID,
		"result": "updated",
	}, 200)
}

func clearKV(ruleID string) {
	_ = kv.DeleteKey(alerting2.KVLastNotificationTime, []byte(ruleID))
	_ = kv.DeleteKey(alerting2.KVLastEscalationTime, []byte(ruleID))
	_ = kv.DeleteKey(alerting2.KVLastMessageState, []byte(ruleID))
}

func (alertAPI *AlertAPI) deleteRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("rule_id")

	obj := alerting.Rule{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	err = orm.Delete(nil, &obj)
	if err != nil {
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	saveAlertActivity("alerting_rule_change", "delete", util.MapStr{
		"cluster_id":   obj.Resource.ID,
		"rule_id":      obj.ID,
		"cluster_name": obj.Resource.Name,
		"rule_name":    obj.Name,
	}, nil, &obj)
	task.DeleteTask(obj.ID)
	clearKV(obj.ID)

	delDsl := util.MapStr{
		"query": util.MapStr{
			"term": util.MapStr{
				"rule_id": util.MapStr{
					"value": id,
				},
			},
		},
	}
	err = orm.DeleteBy(alerting.AlertMessage{}, util.MustToJSONBytes(delDsl))
	if err != nil {
		log.Error(err)
	}
	err = orm.DeleteBy(alerting.Alert{}, util.MustToJSONBytes(delDsl))
	if err != nil {
		log.Error(err)
	}

	alertAPI.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "deleted",
	}, 200)
}

func (alertAPI *AlertAPI) batchDeleteRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var ruleIDs = []string{}
	err := alertAPI.DecodeJSON(req, &ruleIDs)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(ruleIDs) == 0 {
		alertAPI.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	rules, err := getRulesByID(ruleIDs)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var newIDs []string
	for _, rule := range rules {
		saveAlertActivity("alerting_rule_change", "delete", util.MapStr{
			"cluster_id":   rule.Resource.ID,
			"rule_id":      rule.ID,
			"cluster_name": rule.Resource.Name,
			"rule_name":    rule.Name,
		}, nil, &rule)
		task.DeleteTask(rule.ID)
		clearKV(rule.ID)
		newIDs = append(newIDs, rule.ID)
	}
	if len(newIDs) > 0 {
		q := util.MapStr{
			"query": util.MapStr{
				"terms": util.MapStr{
					"id": newIDs,
				},
			},
		}
		err = orm.DeleteBy(alerting.Rule{}, util.MustToJSONBytes(q))
		if err != nil {
			log.Error(err)
			alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		delDsl := util.MapStr{
			"query": util.MapStr{
				"terms": util.MapStr{
					"rule_id": newIDs,
				},
			},
		}
		err = orm.DeleteBy(alerting.AlertMessage{}, util.MustToJSONBytes(delDsl))
		if err != nil {
			log.Error(err)
		}
		err = orm.DeleteBy(alerting.Alert{}, util.MustToJSONBytes(delDsl))
		if err != nil {
			log.Error(err)
		}
	}
	alertAPI.WriteAckOKJSON(w)
}

func (alertAPI *AlertAPI) searchRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		keyword = alertAPI.GetParameterOrDefault(req, "keyword", "")
		from    = alertAPI.GetIntOrDefault(req, "from", 0)
		size    = alertAPI.GetIntOrDefault(req, "size", 20)
	)

	mustQuery := []util.MapStr{}
	clusterFilter, hasAllPrivilege := alertAPI.GetClusterFilter(req, "resource.resource_id")
	if !hasAllPrivilege && clusterFilter == nil {
		alertAPI.WriteJSON(w, elastic.SearchResponse{}, http.StatusOK)
		return
	}
	if !hasAllPrivilege {
		mustQuery = append(mustQuery, clusterFilter)
	}
	if keyword != "" {
		mustQuery = append(mustQuery, util.MapStr{
			"match": util.MapStr{
				"search_text": util.MapStr{
					"query":                keyword,
					"fuzziness":            "AUTO",
					"max_expansions":       10,
					"prefix_length":        2,
					"fuzzy_transpositions": true,
					"boost":                50,
				},
			},
		})
	}
	queryDSL := util.MapStr{
		"sort": []util.MapStr{
			{
				"created": util.MapStr{
					"order": "desc",
				},
			},
		},
		"from": from,
		"size": size,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": mustQuery,
			},
		},
	}
	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(queryDSL),
	}
	err, searchResult := orm.Search(alerting.Rule{}, q)
	if err != nil {
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	searchRes := elastic.SearchResponse{}
	err = util.FromJSONBytes(searchResult.Raw, &searchRes)
	if err != nil {
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	for _, hit := range searchRes.Hits.Hits {
		hitRule := alerting.Rule{}
		hitBytes, _ := util.ToJSONBytes(hit.Source)
		util.FromJSONBytes(hitBytes, &hitRule)
		metricExpression, _ := hitRule.Metrics.GenerateExpression()
		for i, cond := range hitRule.Conditions.Items {
			expression, _ := cond.GenerateConditionExpression()
			hitRule.Conditions.Items[i].Expression = strings.ReplaceAll(expression, "result", metricExpression)
		}
		hit.Source["conditions"] = hitRule.Conditions
	}

	alertAPI.WriteJSON(w, searchRes, http.StatusOK)
}

func (alertAPI *AlertAPI) getRuleAlertMessageNumbers(ruleIDs []string) (map[string]interface{}, error) {

	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	queryDsl := util.MapStr{
		"size": 0,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"terms": util.MapStr{
							"rule_id": ruleIDs,
						},
					},
					//{
					//	"terms": util.MapStr{
					//		"status": []string{alerting.MessageStateAlerting, alerting.MessageStateIgnored},
					//	},
					//},
				},
			},
		},
		"aggs": util.MapStr{
			"terms_rule_id": util.MapStr{
				"terms": util.MapStr{
					"field": "rule_id",
				},
			},
		},
	}

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetWildcardIndexName(alerting.AlertMessage{}), util.MustToJSONBytes(queryDsl))
	if err != nil {
		return nil, err
	}

	ruleAlertNumbers := map[string]interface{}{}
	if termRules, ok := searchRes.Aggregations["terms_rule_id"]; ok {
		for _, bk := range termRules.Buckets {
			key := bk["key"].(string)
			ruleAlertNumbers[key] = bk["doc_count"]
		}
	}
	return ruleAlertNumbers, nil
}

func (alertAPI *AlertAPI) fetchAlertInfos(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var ruleIDs = []string{}
	alertAPI.DecodeJSON(req, &ruleIDs)

	if len(ruleIDs) == 0 {
		alertAPI.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	queryDsl := util.MapStr{
		"_source": []string{"state", "rule_id"},
		"sort": []util.MapStr{
			{
				"created": util.MapStr{
					"order": "desc",
				},
			},
		},
		"collapse": util.MapStr{
			"field": "rule_id",
		},
		"query": util.MapStr{
			"terms": util.MapStr{
				"rule_id": ruleIDs,
			},
		},
	}

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetWildcardIndexName(alerting.Alert{}), util.MustToJSONBytes(queryDsl))
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(searchRes.Hits.Hits) == 0 {
		alertAPI.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}

	latestAlertInfos := map[string]util.MapStr{}
	for _, hit := range searchRes.Hits.Hits {
		if ruleID, ok := hit.Source["rule_id"].(string); ok {
			latestAlertInfos[ruleID] = util.MapStr{
				"status": hit.Source["state"],
			}
		}
	}
	queryDsl = util.MapStr{
		"_source": []string{"created", "rule_id"},
		"sort": []util.MapStr{
			{
				"created": util.MapStr{
					"order": "desc",
				},
			},
		},
		"collapse": util.MapStr{
			"field": "rule_id",
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"terms": util.MapStr{
							"rule_id": ruleIDs,
						},
					},
					{
						"term": util.MapStr{
							"state": util.MapStr{
								"value": alerting.AlertStateAlerting,
							},
						},
					},
				},
			},
		},
	}
	searchRes, err = esClient.SearchWithRawQueryDSL(orm.GetWildcardIndexName(alerting.Alert{}), util.MustToJSONBytes(queryDsl))
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	for _, hit := range searchRes.Hits.Hits {
		if ruleID, ok := hit.Source["rule_id"].(string); ok {
			if _, ok = latestAlertInfos[ruleID]; ok {
				latestAlertInfos[ruleID]["last_notification_time"] = hit.Source["created"]
			}
		}

	}
	alertAPI.WriteJSON(w, latestAlertInfos, http.StatusOK)
}

func (alertAPI *AlertAPI) enableRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	reqObj := alerting.Rule{}
	err := alertAPI.DecodeJSON(req, &reqObj)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, fmt.Sprintf("request format error:%v", err), http.StatusInternalServerError)
		return
	}
	id := ps.MustGetParameter("rule_id")
	obj := alerting.Rule{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}
	if reqObj.Enabled {
		enableRule(&obj)
	} else {
		disableRule(&obj)
	}
	obj.Enabled = reqObj.Enabled
	err = orm.Save(nil, obj)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, fmt.Sprintf("save rule error:%v", err), http.StatusInternalServerError)
		return
	}
	alertAPI.WriteJSON(w, util.MapStr{
		"result": "updated",
		"_id":    id,
	}, http.StatusOK)
}

func enableRule(obj *alerting.Rule) {
	eng := alerting2.GetEngine(obj.Resource.Type)
	ruleTask := task.ScheduleTask{
		ID:          obj.ID,
		Interval:    obj.Schedule.Interval,
		Description: obj.Metrics.Expression,
		Task:        eng.GenerateTask(*obj),
	}
	task.DeleteTask(ruleTask.ID)
	clearKV(ruleTask.ID)
	task.RegisterScheduleTask(ruleTask)
	task.StartTask(ruleTask.ID)
}
func disableRule(obj *alerting.Rule) {
	task.DeleteTask(obj.ID)
	clearKV(obj.ID)
}

func (alertAPI *AlertAPI) sendTestMessage(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	typ := alertAPI.GetParameterOrDefault(req, "type", "notification")
	rule := alerting.Rule{}
	err := alertAPI.DecodeJSON(req, &rule)
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	if rule.ID == "" {
		rule.ID = util.GetUUID()
	}
	eng := alerting2.GetEngine(rule.Resource.Type)
	actionResults, err := eng.Test(&rule, typ)
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	alertAPI.WriteJSON(w, util.MapStr{
		"action_results": actionResults,
	}, http.StatusOK)

}
func checkResourceExists(rule *alerting.Rule) (bool, error) {
	if rule.Resource.ID == "" {
		return false, fmt.Errorf("resource id can not be empty")
	}
	switch rule.Resource.Type {
	case "elasticsearch":
		obj := elastic.ElasticsearchConfig{}
		obj.ID = rule.Resource.ID
		ok, err := orm.Get(&obj)
		if err != nil {
			return false, err
		}
		if rule.Resource.Name == "" {
			rule.Resource.Name = obj.Name
		}
		return ok && obj.Name != "", nil
	default:
		return false, fmt.Errorf("unsupport resource type: %s", rule.Resource.Type)
	}
}

func (alertAPI *AlertAPI) getTemplateParams(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	alertAPI.WriteJSON(w, util.MapStr{
		"template_params": alerting2.GetTemplateParameters(),
	}, http.StatusOK)
}

func (alertAPI *AlertAPI) getPreviewMetricData(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	rule := &alerting.Rule{}
	err := alertAPI.DecodeJSON(req, rule)
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	var (
		minStr = alertAPI.Get(req, "min", "")
		maxStr = alertAPI.Get(req, "max", "")
	)
	var bkSize float64 = 60
	if rule.Metrics.BucketSize != "" {
		duration, err := time.ParseDuration(rule.Metrics.BucketSize)
		if err != nil {
			log.Error(err)
			alertAPI.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusInternalServerError)
			return
		}
		bkSize = duration.Seconds()
	}

	bucketSize, min, max, err := api.GetMetricRangeAndBucketSize(minStr, maxStr, int(bkSize), 15)
	filterParam := &alerting.FilterParam{
		Start:      min,
		End:        max,
		BucketSize: fmt.Sprintf("%ds", bucketSize),
	}
	metricItem, _, err := getRuleMetricData(rule, filterParam)
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	alertAPI.WriteJSON(w, util.MapStr{
		"metric": metricItem,
	}, http.StatusOK)
}

func (alertAPI *AlertAPI) getMetricData(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	rule := &alerting.Rule{
		ID: ps.ByName("rule_id"),
	}
	exists, err := orm.Get(rule)
	if !exists || err != nil {
		alertAPI.WriteJSON(w, util.MapStr{
			"_id":   rule.ID,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	var (
		minStr = alertAPI.Get(req, "min", "")
		maxStr = alertAPI.Get(req, "max", "")
	)
	bucketSize, min, max, err := api.GetMetricRangeAndBucketSize(minStr, maxStr, 60, 15)
	filterParam := &alerting.FilterParam{
		Start:      min,
		End:        max,
		BucketSize: fmt.Sprintf("%ds", bucketSize),
	}
	metricItem, queryResult, err := getRuleMetricData(rule, filterParam)
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	resBody := util.MapStr{
		"metric":       metricItem,
		"bucket_label": rule.Metrics.BucketLabel,
	}
	if alertAPI.GetParameter(req, "debug") == "1" {
		resBody["query"] = queryResult.Query
	}
	alertAPI.WriteJSON(w, resBody, http.StatusOK)
}

func getRuleMetricData(rule *alerting.Rule, filterParam *alerting.FilterParam) (*alerting.AlertMetricItem, *alerting.QueryResult, error) {
	eng := alerting2.GetEngine(rule.Resource.Type)
	metricData, queryResult, err := eng.GetTargetMetricData(rule, true, filterParam)
	if err != nil {
		return nil, queryResult, err
	}

	formatType := "num"
	if rule.Metrics.FormatType != "" {
		formatType = rule.Metrics.FormatType
	}
	var metricItem = alerting.AlertMetricItem{
		MetricItem: common.MetricItem{
			Group: rule.ID,
			Key:   rule.ID,
			Axis: []*common.MetricAxis{
				{ID: util.GetUUID(), Group: rule.ID, Title: "", FormatType: formatType, Position: "left", ShowGridLines: true,
					TickFormat: "0,0.[00]",
					Ticks:      5},
			},
		},
	}
	//var (
	//	clusterIDsM = map[string]struct{}{}
	//	nodeIDsM = map[string]struct{}{}
	//)
	//for _, md := range metricData {
	//	for i, gv := range  md.GroupValues {
	//		switch rule.Metrics.Groups[i].Field {
	//		case "metadata.labels.cluster_id", "metadata.cluster_id":
	//			clusterIDsM[gv] = struct{}{}
	//		case "metadata.node_id", "metadata.labels.node_id":
	//			nodeIDsM[gv] = struct{}{}
	//		default:
	//		}
	//	}
	//}
	//var (
	//	clusterIDs []string
	//	nodeIDs []string
	//	clusterIDToNames = map[string]string{}
	//	nodeIDToNames = map[string]string{}
	//)
	//if len(clusterIDsM) > 0 {
	//	for k, _ := range clusterIDsM {
	//		clusterIDs = append(clusterIDs, k)
	//	}
	//	clusterIDToNames, err = common2.GetClusterNames(clusterIDs)
	//	if err != nil {
	//		return nil,queryResult, err
	//	}
	//}
	//if len(nodeIDsM) > 0 {
	//	for k, _ := range nodeIDsM {
	//		nodeIDs = append(nodeIDs, k)
	//	}
	//	nodeIDToNames, err = common2.GetNodeNames(nodeIDs)
	//	if err != nil {
	//		return nil,queryResult, err
	//	}
	//}

	for _, md := range metricData {
		if len(md.Data) == 0 {
			continue
		}
		targetData := md.Data["result"]
		if len(rule.Metrics.Items) == 1 {
			for k, _ := range md.Data {
				targetData = md.Data[k]
				break
			}
		}

		//displayGroupValues := make([]string, len(md.GroupValues))
		//for i, gv := range  md.GroupValues {
		//	switch rule.Metrics.Groups[i].Field {
		//	case "metadata.labels.cluster_id", "metadata.cluster_id":
		//		if name, ok := clusterIDToNames[gv]; ok && name != "" {
		//			displayGroupValues[i] = name
		//		}else{
		//			displayGroupValues[i] = gv
		//		}
		//	case "metadata.node_id", "metadata.labels.node_id":
		//		if name, ok := nodeIDToNames[gv]; ok && name != "" {
		//			displayGroupValues[i] = name
		//		}else{
		//			displayGroupValues[i] = gv
		//		}
		//	default:
		//		displayGroupValues[i] = gv
		//	}
		//}

		var label = strings.Join(md.GroupValues, "-")
		if label == "" {
			label, _ = rule.GetOrInitExpression()
		}
		metricItem.BucketGroups = append(metricItem.BucketGroups, md.GroupValues)
		metricItem.Lines = append(metricItem.Lines, &common.MetricLine{
			Data:       targetData,
			BucketSize: filterParam.BucketSize,
			Metric: common.MetricSummary{
				Label:      label,
				Group:      rule.ID,
				TickFormat: "0,0.[00]",
				FormatType: formatType,
			},
		})
	}
	return &metricItem, queryResult, nil
}

func (alertAPI *AlertAPI) batchEnableRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var ruleIDs = []string{}
	err := alertAPI.DecodeJSON(req, &ruleIDs)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(ruleIDs) == 0 {
		alertAPI.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	rules, err := getRulesByID(ruleIDs)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var newIDs []string
	for _, rule := range rules {
		if !rule.Enabled {
			enableRule(&rule)
			newIDs = append(newIDs, rule.ID)
		}
	}
	if len(newIDs) > 0 {
		q := util.MapStr{
			"query": util.MapStr{
				"terms": util.MapStr{
					"id": newIDs,
				},
			},
			"script": util.MapStr{
				"source": fmt.Sprintf("ctx._source['enabled'] = %v", true),
			},
		}
		err = orm.UpdateBy(alerting.Rule{}, util.MustToJSONBytes(q))
		if err != nil {
			log.Error(err)
			alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	alertAPI.WriteAckOKJSON(w)
}

func (alertAPI *AlertAPI) batchDisableRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var ruleIDs = []string{}
	err := alertAPI.DecodeJSON(req, &ruleIDs)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(ruleIDs) == 0 {
		alertAPI.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	rules, err := getRulesByID(ruleIDs)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var newIDs []string
	for _, rule := range rules {
		if rule.Enabled {
			disableRule(&rule)
			newIDs = append(newIDs, rule.ID)
		}
	}
	if len(newIDs) > 0 {
		q := util.MapStr{
			"query": util.MapStr{
				"terms": util.MapStr{
					"id": newIDs,
				},
			},
			"script": util.MapStr{
				"source": fmt.Sprintf("ctx._source['enabled'] = %v", false),
			},
		}
		log.Info(util.MustToJSON(q))
		err = orm.UpdateBy(alerting.Rule{}, util.MustToJSONBytes(q))
		if err != nil {
			log.Error(err)
			alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	alertAPI.WriteAckOKJSON(w)
}

func (alertAPI *AlertAPI) searchFieldValues(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var keyword = alertAPI.GetParameterOrDefault(req, "keyword", "")
	var field = alertAPI.GetParameterOrDefault(req, "field", "category")
	items, err := searchListItems(field, keyword, 20)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	alertAPI.WriteJSON(w, items, http.StatusOK)
}

func searchListItems(field, keyword string, size int) ([]string, error) {
	query := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"items": util.MapStr{
				"terms": util.MapStr{
					"field": field,
					"size":  size,
				},
			},
		},
	}
	if v := strings.TrimSpace(keyword); v != "" {
		query["query"] = util.MapStr{
			"query_string": util.MapStr{
				"default_field": field,
				"query":         fmt.Sprintf("*%s*", v),
			},
		}
	}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}
	err, result := orm.Search(alerting.Rule{}, &q)
	if err != nil {
		return nil, err
	}
	searchRes := elastic.SearchResponse{}
	err = util.FromJSONBytes(result.Raw, &searchRes)
	if err != nil {
		return nil, err
	}
	items := []string{}
	for _, bk := range searchRes.Aggregations["items"].Buckets {
		if v, ok := bk["key"].(string); ok {
			if strings.Contains(v, keyword) {
				items = append(items, v)
			}
		}
	}
	return items, nil
}

func getRulesByID(ruleIDs []string) ([]alerting.Rule, error) {
	if len(ruleIDs) == 0 {
		return nil, nil
	}
	query := util.MapStr{
		"size": len(ruleIDs),
		"query": util.MapStr{
			"terms": util.MapStr{
				"id": ruleIDs,
			},
		},
	}
	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}
	err, result := orm.Search(alerting.Rule{}, q)
	if err != nil {
		return nil, err
	}
	var rules []alerting.Rule
	for _, row := range result.Result {
		buf := util.MustToJSONBytes(row)
		rule := alerting.Rule{}
		util.MustFromJSONBytes(buf, &rule)
		rules = append(rules, rule)
	}
	return rules, nil
}
