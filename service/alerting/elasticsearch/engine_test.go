/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package elasticsearch

import (
	"fmt"
	"infini.sh/console/model/alerting"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"sort"
	"testing"
	"time"
)

func TestEngine( t *testing.T)  {
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
			Filter: alerting.Filter{
				And: []alerting.FilterQuery{
					{Field: "timestamp", Operator: "gte", Values: []string{"now-15m"}},
					//{Field: "payload.elasticsearch.cluster_health.status", Operator: "equals", Values: []string{"red"}},
				},
			},
			RawFilter: map[string]interface{}{
				"bool": util.MapStr{
					"must": []util.MapStr{
						//{
						//	"range": util.MapStr{
						//		"timestamp": util.MapStr{
						//			"gte": "now-15m",
						//		},
						//	},
						//},
						{
							"term": util.MapStr{
								"metadata.labels.cluster_id": util.MapStr{
									"value": "xxx",
								},
							},
						},
					},
				},
			},
		},

		Metrics: alerting.Metric{
			PeriodInterval: "1m",
			MaxPeriods:     15,
			Items: []alerting.MetricItem{
				{Name: "a", Field: "payload.elasticsearch.node_stats.fs.total.free_in_bytes", Statistic: "min", Group: []string{"metadata.labels.cluster_id", "metadata.labels.node_id"}},
				{Name: "b", Field: "payload.elasticsearch.node_stats.fs.total.total_in_bytes", Statistic: "max", Group: []string{"metadata.labels.cluster_id", "metadata.labels.node_id"}},
			},
			Formula: "a/b*100",
			//Expression: "min(fs.free_in_bytes)/max(fs.total_in_bytes)*100",
		},
		Conditions: alerting.Condition{
			Operator: "any",
			Items: []alerting.ConditionItem{
				{MinimumPeriodMatch: 1, Operator: "lte", Values: []string{"10"}, Severity: "error", Message: "磁盘可用率小于10%"},
				{MinimumPeriodMatch: 1, Operator: "lte", Values: []string{"20"}, Severity: "warning", Message: "磁盘可用率小于20%"},
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
	//eng := &Engine{}
	//filter, err := eng.GenerateQuery(&rule)
	////result, err := eng.ExecuteQuery(&rule)
	//if err != nil {
	//	t.Fatal(err)
	//}
	sort.Slice(rule.Conditions.Items, func(i, j int) bool {
		return alerting.SeverityWeights[rule.Conditions.Items[i].Severity] > alerting.SeverityWeights[rule.Conditions.Items[j].Severity]
	})
	fmt.Println(rule.Conditions.Items)

	//fmt.Println(util.MustToJSON(filter))
}
