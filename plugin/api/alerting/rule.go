/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"fmt"
	"infini.sh/console/model/alerting"
	alerting2 "infini.sh/console/service/alerting"
	_ "infini.sh/console/service/alerting/elasticsearch"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	"net/http"
	log "src/github.com/cihub/seelog"
	"time"
)

func (alertAPI *AlertAPI) createRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	rules :=  []alerting.Rule{}
	err := alertAPI.DecodeJSON(req, &rules)
	if err != nil {
		alertAPI.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	var ids []string
	for _, rule := range rules {
		exists, err := checkResourceExists(&rule)
		if err != nil || !exists {
			alertAPI.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusInternalServerError)
			return
		}
		err = rule.Metrics.RefreshExpression()
		if err != nil {
			alertAPI.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusInternalServerError)
			return
		}
		rule.ID = util.GetUUID()
		ids = append(ids, rule.ID)
		rule.Created = time.Now()
		rule.Updated = time.Now()
		rule.Metrics.MaxPeriods = 15
		if rule.Schedule.Interval == ""{
			rule.Schedule.Interval = "1m"
		}

		err = orm.Save(rule)
		if err != nil {
			alertAPI.WriteJSON(w, util.MapStr{
				"error": err.Error(),
			}, http.StatusInternalServerError)
			return
		}
		eng := alerting2.GetEngine(rule.Resource.Type)
		if rule.Enabled {
			ruleTask := task.ScheduleTask{
				ID: rule.ID,
				Interval: rule.Schedule.Interval,
				Description: rule.Metrics.Expression,
				Task: eng.GenerateTask(&rule),
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
		alertAPI.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	if err != nil {
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	alertAPI.WriteJSON(w, util.MapStr{
		"found":   true,
		"_id":     id,
		"_source": obj,
	}, 200)

}

func (alertAPI *AlertAPI) updateRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("rule_id")
	obj := alerting.Rule{}

	obj.ID = id
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		alertAPI.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	id = obj.ID
	create := obj.Created
	obj = alerting.Rule{}
	err = alertAPI.DecodeJSON(req, &obj)
	if err != nil {
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	//protect
	obj.ID = id
	obj.Created = create
	obj.Updated = time.Now()
	err = orm.Update(&obj)
	if err != nil {
		alertAPI.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	if obj.Enabled {
		//update task
		task.StopTask(id)
		eng := alerting2.GetEngine(obj.Resource.Type)
		ruleTask := task.ScheduleTask{
			ID:          obj.ID,
			Interval:    obj.Schedule.Interval,
			Description: obj.Metrics.Expression,
			Task:        eng.GenerateTask(&obj),
		}
		task.RegisterScheduleTask(ruleTask)
		task.StartTask(ruleTask.ID)
	}else{
		task.DeleteTask(id)
	}

	alertAPI.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "updated",
	}, 200)
}

func (alertAPI *AlertAPI) deleteRule(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("rule_id")

	obj := alerting.Rule{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
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
	task.DeleteTask(obj.ID)

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

	w.Write(searchResult.Raw)
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
		return ok && obj.Name != "", nil
	default:
		return false, fmt.Errorf("unsupport resource type: %s", rule.Resource.Type)
	}
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
//				{MinimumPeriodMatch: 5, Operator: "gte", Values: []string{"90"}, Severity: "error", Message: "cpu使用率大于90%"},
//			},
//		},
//
//		Channels: alerting.RuleChannel{
//			Normal: []alerting.Channel{
//				{Name: "钉钉", Type: alerting.ChannelWebhook, Webhook: &alerting.CustomWebhook{
//					HeaderParams: map[string]string{
//						"Content-Type": "application/json",
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