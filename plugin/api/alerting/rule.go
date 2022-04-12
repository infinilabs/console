/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/model/alerting"
	alerting2 "infini.sh/console/service/alerting"
	"infini.sh/console/service/alerting/elasticsearch"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	"net/http"
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
	rule := alerting.Rule{
		ORMObjectBase: orm.ORMObjectBase{
			ID: util.GetUUID(),
			Created: time.Now(),
			Updated: time.Now(),
		},
		Enabled: true,
		Resource: alerting.Resource{
			ID: "c8i18llath2blrusdjng",
			Type: "elasticsearch",
			Objects: []string{".infini_metrics*"},
			TimeField: "timestamp",
			RawFilter: map[string]interface{}{
				"bool": util.MapStr{
					"must": []util.MapStr{
						//{
						//	"term": util.MapStr{
						//		"metadata.labels.cluster_id": util.MapStr{
						//			"value": "xxx",
						//		},
						//	},
						//},
					},
				},
			},
		},

		Metrics: alerting.Metric{
			PeriodInterval: "1m",
			MaxPeriods:     15,
			Items: []alerting.MetricItem{
				{Name: "a", Field: "payload.elasticsearch.node_stats.fs.total.free_in_bytes", Statistic: "min", Group: []string{"metadata.labels.cluster_id", "metadata.labels.node_id"}},
				{Name: "b", Field: "payload.elasticsearch.node_stats.fs.total.total_in_bytes", Statistic: "max",Group: []string{"metadata.labels.cluster_id", "metadata.labels.node_id"}},
			},
			Formula: "a/b*100",
			//Expression: "min(fs.free_in_bytes)/max(fs.total_in_bytes)*100",
		},
		Conditions: alerting.Condition{
			Operator: "any",
			Items: []alerting.ConditionItem{
				{MinimumPeriodMatch: 10, Operator: "lte", Values: []string{"76"}, Severity: "warning", Message: "磁盘可用率小于20%"},
				{MinimumPeriodMatch: 1, Operator: "lte", Values: []string{"75"}, Severity: "error", Message: "磁盘可用率小于10%"},
			},
		},

		Channels: alerting.RuleChannel{
			Normal: []alerting.Channel{
				{Name: "钉钉", Type: alerting.ChannelWebhook, Webhook: &alerting.CustomWebhook{
					HeaderParams: map[string]string{
						"Content-Type": "application/json",
					},
					Body:   `{"msgtype": "text","text": {"content":"告警通知: {{ctx.message}}"}}`,
					Method: http.MethodPost,
					URL:    "https://oapi.dingtalk.com/robot/send?access_token=XXXXXX",
				}},
			},
			Escalation: []alerting.Channel{
				{Type: alerting.ChannelWebhook, Name: "微信", Webhook: &alerting.CustomWebhook{
					HeaderParams: map[string]string{
						"Content-Type": "application/json",
					},
					Body:   `{"msgtype": "text","text": {"content":"告警通知: {{ctx.message}}"}}`,
					Method: http.MethodPost,
					URL:    "https://oapi.weixin.com/robot/send?access_token=XXXXXX",
				}},
			},
			ThrottlePeriod: "1h",
			AcceptTimeRange: alerting.TimeRange{
				Start: "8:00",
				End: "21:00",
			},
			EscalationEnabled: true,
			EscalationThrottlePeriod: "30m",
		},
	}
	eng := &elasticsearch.Engine{}
	result, err := eng.ExecuteQuery(&rule)
	if err != nil {
		log.Error(err)
	}
	alertAPI.WriteJSON(w, result, http.StatusOK)

}
