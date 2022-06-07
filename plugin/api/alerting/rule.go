/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"fmt"
	log "github.com/cihub/seelog"
	"github.com/r3labs/diff/v2"
	"infini.sh/console/model/alerting"
	alerting2 "infini.sh/console/service/alerting"
	_ "infini.sh/console/service/alerting/elasticsearch"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/queue"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/api"
	"infini.sh/framework/modules/elastic/common"
	"net/http"
	"strings"
	"time"
)

func (alertAPI *AlertAPI) createRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	rules :=  []alerting.Rule{}
	err := alertAPI.DecodeJSON(req, &rules)
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
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
		if rule.Schedule.Interval == ""{
			rule.Schedule.Interval = "1m"
		}

		err = orm.Save(rule)
		if err != nil {
			log.Error(err)
			alertAPI.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusInternalServerError)
			return
		}
		saveAlertActivity("alerting_rule_change", "create",  util.MapStr{
			"cluster_id": rule.Resource.ID,
			"rule_id": rule.ID,
			"cluster_name": rule.Resource.Name,
		},nil, &rule)
		eng := alerting2.GetEngine(rule.Resource.Type)
		if rule.Enabled {
			ruleTask := task.ScheduleTask{
				ID: rule.ID,
				Interval: rule.Schedule.Interval,
				Description: rule.Metrics.Expression,
				Task: eng.GenerateTask(rule),
			}
			task.RegisterScheduleTask(ruleTask)
			task.StartTask(ruleTask.ID)
		}

	}

	alertAPI.WriteJSON(w, util.MapStr{
		"result": "created",
		"ids": ids,
	}, http.StatusOK)
}
func (alertAPI *AlertAPI) getRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("rule_id")
	obj := alerting.Rule{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
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
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	metricExpression, _ := obj.Metrics.GenerateExpression()
	for i, cond := range obj.Conditions.Items {
		expression, _ := cond.GenerateConditionExpression()
		obj.Conditions.Items[i].Expression = strings.ReplaceAll(expression, "result", metricExpression)
	}
	alertNumbers, err  := alertAPI.getRuleAlertMessageNumbers([]string{obj.ID})
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	queryDSL := util.MapStr{
		"_source": "state",
		"size": 1,
		"sort": []util.MapStr{
			{
				"created": util.MapStr{
					"order": "desc",
				},
			},
		},
		"query": util.MapStr{
			"term": util.MapStr{
				"rule_id": util.MapStr{
					"value": obj.ID,
				},
			},
		},
	}
	q := &orm.Query{
		WildcardIndex: true,
		RawQuery: util.MustToJSONBytes(queryDSL),
	}
	err, result := orm.Search(alerting.Alert{}, q)
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	var state interface{} = "N/A"
	if len(result.Result) > 0 {
		if resultM, ok := result.Result[0].(map[string]interface{}); ok {
			state = resultM["state"]
		}
	}

	detailObj := util.MapStr{
		"rule_name": obj.Name,
		"resource_name": obj.Resource.Name,
		"resource_objects": obj.Resource.Objects,
		"period_interval": obj.Metrics.PeriodInterval, //统计周期
		"updated": obj.Updated,
		"conditions": obj.Conditions,
		"message_count": alertNumbers[obj.ID], //所有关联告警消息数（包括已恢复的）
		"state": state,
		"enabled": obj.Enabled,
	}

	alertAPI.WriteJSON(w, detailObj, 200)

}

func saveActivity(activityInfo *event.Activity){
	queueConfig := queue.GetOrInitConfig("platform##activities")
	if queueConfig.Labels == nil {
		queueConfig.Labels = map[string]interface{}{
			"type":     "platform",
			"name":     "activity",
			"category": "elasticsearch",
			"activity": true,
		}
	}
	err := queue.Push(queueConfig, util.MustToJSONBytes(event.Event{
		Timestamp: time.Now(),
		Metadata: event.EventMetadata{
			Category: "elasticsearch",
			Name: "activity",
		},
		Fields: util.MapStr{
			"activity": activityInfo,
		}}))
	if err != nil {
		log.Error(err)
	}
}

func saveAlertActivity(name, typ string, labels map[string]interface{}, changelog diff.Changelog, oldState interface{}){
	activityInfo := &event.Activity{
		ID: util.GetUUID(),
		Timestamp: time.Now(),
		Metadata: event.ActivityMetadata{
			Category: "elasticsearch",
			Group: "platform",
			Name: name,
			Type: typ,
			Labels: labels,
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
	rule := &alerting.Rule{
	}
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

	err = orm.Update(rule)
	if err != nil {
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	saveAlertActivity("alerting_rule_change", "update",  util.MapStr{
		"cluster_id": rule.Resource.ID,
		"rule_id": rule.ID,
		"cluster_name": rule.Resource.Name,
	},changeLog, oldRule)

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
		eng := alerting2.GetEngine(rule.Resource.Type)
		ruleTask := task.ScheduleTask{
			ID:          rule.ID,
			Interval:    rule.Schedule.Interval,
			Description: rule.Metrics.Expression,
			Task:        eng.GenerateTask(*rule),
		}
		task.RegisterScheduleTask(ruleTask)
		task.StartTask(ruleTask.ID)
	}else{
		task.DeleteTask(id)
	}
	clearKV(rule.ID)

	alertAPI.WriteJSON(w, util.MapStr{
		"_id":    rule.ID,
		"result": "updated",
	}, 200)
}

func clearKV(ruleID string){
	_ = kv.DeleteKey(alerting2.KVLastNotificationTime, []byte(ruleID))
	_ = kv.DeleteKey(alerting2.KVLastEscalationTime, []byte(ruleID))
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

	err = orm.Delete(&obj)
	if err != nil {
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	saveAlertActivity("alerting_rule_change", "delete",  util.MapStr{
		"cluster_id": obj.Resource.ID,
		"rule_id": obj.ID,
		"cluster_name": obj.Resource.Name,
	},nil, &obj)
	task.DeleteTask(obj.ID)
	clearKV(obj.ID)

	delDsl := util.MapStr{
		"query": util.MapStr{
			"term": util.MapStr{
				"rule_id": id,
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

func (alertAPI *AlertAPI) searchRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		keyword = alertAPI.GetParameterOrDefault(req, "keyword", "")
		from = alertAPI.GetIntOrDefault(req, "from", 0)
		size = alertAPI.GetIntOrDefault(req, "size", 20)
	)

	mustQuery := []util.MapStr{
	}
	clusterFilter, hasAllPrivilege := alertAPI.GetClusterFilter(req, "resource.resource_id")
	if !hasAllPrivilege && clusterFilter == nil {
		alertAPI.WriteJSON(w, elastic.SearchResponse{
		}, http.StatusOK)
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

func (alertAPI *AlertAPI) getRuleAlertMessageNumbers(ruleIDs []string) ( map[string]interface{},error) {
	esClient := elastic.GetClient(alertAPI.Config.Elasticsearch)
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

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetWildcardIndexName(alerting.AlertMessage{}), util.MustToJSONBytes(queryDsl) )
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
	esClient := elastic.GetClient(alertAPI.Config.Elasticsearch)
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

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetWildcardIndexName(alerting.Alert{}), util.MustToJSONBytes(queryDsl) )
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
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
				"status":      hit.Source["state"],
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
		eng := alerting2.GetEngine(obj.Resource.Type)
		ruleTask := task.ScheduleTask{
			ID:          obj.ID,
			Interval:    obj.Schedule.Interval,
			Description: obj.Metrics.Expression,
			Task:        eng.GenerateTask(obj),
		}
		task.RegisterScheduleTask(ruleTask)
		task.StartTask(ruleTask.ID)
	}else{
		task.DeleteTask(id)
	}
	obj.Enabled = reqObj.Enabled
	err = orm.Save(obj)
	if err != nil {
		log.Error(err)
		alertAPI.WriteError(w, fmt.Sprintf("save rule error:%v", err), http.StatusInternalServerError)
		return
	}
	alertAPI.WriteJSON(w, util.MapStr{
		"result": "updated",
		"_id": id,
	}, http.StatusOK)
}

func (alertAPI *AlertAPI) sendTestMessage(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	rule :=  alerting.Rule{}
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
	actionResults, err :=  eng.Test(&rule)
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

	bucketSize, min, max, err := api.GetMetricRangeAndBucketSize(minStr, maxStr, 60, 15)
	filterParam := &alerting.FilterParam{
		Start: min,
		End: max,
		BucketSize: fmt.Sprintf("%ds", bucketSize),
	}
	metricItem, _, err := getRuleMetricData(rule,  filterParam)
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
	rule :=  &alerting.Rule{
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
		Start: min,
		End: max,
		BucketSize: fmt.Sprintf("%ds", bucketSize),
	}
	metricItem, queryResult, err := getRuleMetricData(rule,  filterParam)
	if err != nil {
		log.Error(err)
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	resBody :=  util.MapStr{
		"metric": metricItem,
	}
	if alertAPI.GetParameter(req, "debug") == "1" {
		resBody["query"] = queryResult.Query
	}
	alertAPI.WriteJSON(w,resBody, http.StatusOK)
}

func getRuleMetricData( rule *alerting.Rule, filterParam *alerting.FilterParam) (*common.MetricItem, *alerting.QueryResult, error) {
	eng := alerting2.GetEngine(rule.Resource.Type)
	metricData, queryResult, err := eng.GetTargetMetricData(rule, true, filterParam)
	if err != nil {
		return nil,queryResult, err
	}
	//var filteredMetricData []alerting.MetricData
	//title := rule.Metrics.Formula
	//if title == "" && len( rule.Conditions.Items) > 0{
	//	title,_ = rule.Conditions.Items[0].GenerateConditionExpression()
	//}
	var metricItem = common.MetricItem{
		Group: rule.ID,
		Key:   rule.ID,
		Axis: []*common.MetricAxis{
			{ID: util.GetUUID(), Group: rule.ID, Title: "", FormatType: "num", Position: "left", ShowGridLines: true,
				TickFormat: "0,0.[00]",
				Ticks:      5},
		},
	}
	var sampleData []alerting.TimeMetricData
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
		if sampleData == nil {
			sampleData = targetData
		}
		var label = strings.Join(md.GroupValues, "-")
		if label == "" {
			label, _ = rule.GetOrInitExpression()
		}
		metricItem.Lines = append(metricItem.Lines, &common.MetricLine{
			Data:  targetData,
			BucketSize: filterParam.BucketSize,
			Metric: common.MetricSummary{
				Label:      label,
				Group:      rule.ID,
				TickFormat: "0,0.[00]",
				FormatType: "num",
			},
		})
	}
	//add guidelines
	//for _, cond := range rule.Conditions.Items {
	//	if len(cond.Values) > 0 {
	//		val, err := strconv.ParseFloat(cond.Values[0], 64)
	//		if err != nil {
	//			log.Errorf("parse condition value error: %v", err)
	//			continue
	//		}
	//		if sampleData != nil {
	//			newData := make([]alerting.TimeMetricData, 0, len(sampleData))
	//			for _, td := range sampleData {
	//				if len(td) < 2 {
	//					continue
	//				}
	//				newData = append(newData, alerting.TimeMetricData{
	//					td[0], val,
	//				})
	//			}
	//			metricItem.Lines = append(metricItem.Lines, &common.MetricLine{
	//				Data:       newData,
	//				BucketSize: filterParam.BucketSize,
	//				Metric: common.MetricSummary{
	//					Label:      "",
	//					Group:      rule.ID,
	//					TickFormat: "0,0.[00]",
	//					FormatType: "num",
	//				},
	//			})
	//		}
	//	}
	//}
	return &metricItem,queryResult, nil
}


//func (alertAPI *AlertAPI) testRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
//	rule := alerting.Rule{
//		ID: util.GetUUID(),
//		Created: time.Now(),
//		Updated: time.Now(),
//		Enabled: true,
//		Resource: alerting.Resource{
//			ID: "c8i18llath2blrusdjng",
//			Type: "elasticsearch",
//			Objects: []string{".infini_metrics*"},
//			TimeField: "timestamp",
//			RawFilter: map[string]interface{}{
//				"bool": util.MapStr{
//					"must": []util.MapStr{},
//				},
//			},
//		},
//
//		Metrics: alerting.Metric{
//			PeriodInterval: "1m",
//			MaxPeriods:     15,
//			Items: []alerting.MetricItem{
//				{Name: "a", Field: "payload.elasticsearch.node_stats.os.cpu.percent", Statistic: "p99", Group: []string{"metadata.labels.cluster_id", "metadata.labels.node_id"}},
//			},
//		},
//		Conditions: alerting.Condition{
//			Operator: "any",
//			Items: []alerting.ConditionItem{
//				{MinimumPeriodMatch: 5, Operator: "gte", Values: []string{"90"}, Severity: "error", AlertMessage: "cpu使用率大于90%"},
//			},
//		},
//
//		Channels: alerting.RuleChannel{
//			Normal: []alerting.Channel{
//				{Name: "钉钉", Type: alerting.ChannelWebhook, Webhook: &alerting.CustomWebhook{
//					HeaderParams: map[string]string{
//						"Message-Type": "application/json",
//					},
//					Body:   `{"msgtype": "text","text": {"content":"告警通知: {{ctx.message}}"}}`,
//					Method: http.MethodPost,
//					URL:    "https://oapi.dingtalk.com/robot/send?access_token=XXXXXX",
//				}},
//			},
//			ThrottlePeriod: "1h",
//			AcceptTimeRange: alerting.TimeRange{
//				Start: "8:00",
//				End: "21:00",
//			},
//			EscalationEnabled: true,
//			EscalationThrottlePeriod: "30m",
//		},
//	}
//	eng := alerting2.GetEngine(rule.Resource.Type)
//	data, err := eng.ExecuteQuery(&rule)
//	if err != nil {
//		log.Error(err)
//	}
//	alertAPI.WriteJSON(w, data, http.StatusOK)
//}