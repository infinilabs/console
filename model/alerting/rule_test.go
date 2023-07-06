/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"fmt"
	"infini.sh/framework/core/util"
	"net/http"
	"testing"
	"time"
)

func TestCreateRule( t *testing.T)  {
	rule := Rule{
		//ORMObjectBase: orm.ORMObjectBase{
		//	ID: util.GetUUID(),
		//	Created: time.Now(),
		//	Updated: time.Now(),
		//},
		Enabled: true,
		Resource: Resource{
			ID: "c8i18llath2blrusdjng",
			Type: "elasticsearch",
			Objects: []string{".infini_metrics*"},
			TimeField: "timestamp",
			Filter: FilterQuery{
				And: []FilterQuery{
					//{Field: "timestamp", Operator: "gte", Values: []string{"now-15m"}},
					//{Field: "payload.elasticsearch.cluster_health.status", Operator: "equals", Values: []string{"red"}},
				},
			},
			RawFilter: map[string]interface{}{
				"bool": util.MapStr{
					"must": []util.MapStr{
						{
							"range": util.MapStr{
								"timestamp": util.MapStr{
									"gte": "now-15m",
								},
							},
						},
					},
				},
			},
		},
				//Metrics: Metric{
				//	PeriodInterval: "1m",
				//	MaxPeriods:     15,
				//	Items: []MetricItem{
				//		{Name: "red_health", Field: "*", Statistic: "count", Group: []string{"metadata.labels.cluster_id"}},
				//	},
				//},
				//Conditions: Condition{
				//	Operator: "any",
				//	Items: []ConditionItem{
				//		{ MinimumPeriodMatch: 1, Operator: "gte", Values: []string{"1"}, Priority: "error", AlertMessage: "集群健康状态为 Red"},
				//	},
				//},

				Metrics: Metric{
					PeriodInterval: "1m",
					Items: []MetricItem{
						{Name: "a", Field: "payload.elasticsearch.node_stats.fs.total.free_in_bytes", Statistic: "min", Group: []string{"metadata.labels.cluster_id", "metadata.labels.node_id"}},
						{Name: "b", Field: "payload.elasticsearch.node_stats.fs.total.total_in_bytes", Statistic: "max", Group: []string{"metadata.labels.cluster_id", "metadata.labels.node_id"}},
					},
					Formula: "a/b*100",
					//Expression: "min(fs.free_in_bytes)/max(fs.total_in_bytes)*100",
				},
				Conditions: Condition{
					Operator: "any",
					Items: []ConditionItem{
						{MinimumPeriodMatch: 1, Operator: "lte", Values: []string{"76"}, Priority: "error", Message: "磁盘可用率小于10%"},
					},
				},

			Channels: NotificationConfig{
				Normal: []Channel{
					{Name: "钉钉", Type: ChannelWebhook, Webhook: &CustomWebhook{
						HeaderParams: map[string]string{
							"Message-Type": "application/json",
						},
						Body:   `{"msgtype": "text","text": {"content":"告警通知: {{ctx.message}}"}}`,
						Method: http.MethodPost,
						URL:    "https://oapi.dingtalk.com/robot/send?access_token=XXXXXX",
					}},
				},
				Escalation: []Channel{
					{Type: ChannelWebhook, Name: "微信", Webhook: &CustomWebhook{
						HeaderParams: map[string]string{
							"Message-Type": "application/json",
						},
						Body:   `{"msgtype": "text","text": {"content":"告警通知: {{ctx.message}}"}}`,
						Method: http.MethodPost,
						URL:    "https://oapi.weixin.com/robot/send?access_token=6a5c7c9454ff74537a6de493153b1da68860942d4b0aeb33797cb68b5111b077",
					}},
				},
				ThrottlePeriod: "1h",
				AcceptTimeRange: TimeRange{
					Start: "8:00",
					End: "21:00",
				},
				EscalationEnabled: false,
				EscalationThrottlePeriod: "30m",
			},
	}
	//err := rule.Metrics.GenerateExpression()
	//if err != nil {
	//	t.Fatal(err)
	//}
	exp, err := rule.GetOrInitExpression()
	if err != nil {
		t.Fatal(err)
	}

	//fmt.Println(util.MustToJSON(rule))
	fmt.Println(exp)
}




func TestTimeRange_Include( t *testing.T) {
	tr := TimeRange{
		Start: "08:00",
		End: "18:31",
	}
	fmt.Println(tr.Include(time.Now()))
	ti,_ := time.Parse(time.RFC3339, "2022-04-11T10:31:38.911000504Z")
	fmt.Println(time.Now().Sub(ti))
}
