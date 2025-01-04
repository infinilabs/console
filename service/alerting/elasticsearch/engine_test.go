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

package elasticsearch

import (
	"fmt"
	"infini.sh/console/model/alerting"
	"infini.sh/console/model/insight"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/adapter/elasticsearch"
	"net/http"
	"sort"
	"testing"
	"time"
)

func TestEngine( t *testing.T)  {
	rule := alerting.Rule{
		ID: util.GetUUID(),
		Created: time.Now(),
		Updated: time.Now(),
		Enabled: true,
		Resource: alerting.Resource{
			ID: "c8i18llath2blrusdjng",
			Type: "elasticsearch",
			Objects: []string{".infini_metrics*"},
			TimeField: "timestamp",
			Filter: alerting.FilterQuery{
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
			Metric: insight.Metric{
				BucketSize: "1m",
				Items: []insight.MetricItem{
					{Name: "a", Field: "payload.elasticsearch.node_stats.fs.total.free_in_bytes", Statistic: "min"},
					{Name: "b", Field: "payload.elasticsearch.node_stats.fs.total.total_in_bytes", Statistic: "max"},
				},
				Formula: "a/b*100",
			},

			//Expression: "min(fs.free_in_bytes)/max(fs.total_in_bytes)*100",
		},
		Conditions: alerting.Condition{
			Operator: "any",
			Items: []alerting.ConditionItem{
				{MinimumPeriodMatch: 1, Operator: "lte", Values: []string{"10"}, Priority: "error"},
				{MinimumPeriodMatch: 1, Operator: "lte", Values: []string{"20"}, Priority: "warning"},
			},
		},

		Channels: &alerting.NotificationConfig{
			Normal: []alerting.Channel{
				{Name: "钉钉", Type: alerting.ChannelWebhook, Webhook: &alerting.CustomWebhook{
					HeaderParams: map[string]string{
						"Message-Type": "application/json",
					},
					Body:   `{"msgtype": "text","text": {"content":"告警通知: {{ctx.message}}"}}`,
					Method: http.MethodPost,
					URL:    "https://oapi.dingtalk.com/robot/send?access_token=XXXXXX",
				}},
			},
			Escalation: []alerting.Channel{
				{Type: alerting.ChannelWebhook, Name: "微信", Webhook: &alerting.CustomWebhook{
					HeaderParams: map[string]string{
						"Message-Type": "application/json",
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
		return alerting.PriorityWeights[rule.Conditions.Items[i].Priority] > alerting.PriorityWeights[rule.Conditions.Items[j].Priority]
	})
	fmt.Println(rule.Conditions.Items)

	//fmt.Println(util.MustToJSON(filter))
}

func TestGenerateAgg(t *testing.T)  {
	eng := &Engine{}
	agg := eng.generateAgg(&insight.MetricItem{
		Name: "a",
		Field: "cpu.percent",
		Statistic: "p99",
	})
	fmt.Println(util.MustToJSON(agg))
}

func TestGeneratePercentilesAggQuery(t *testing.T) {
	//rule := alerting.Rule{
	//	ID: util.GetUUID(),
	//	Created: time.Now(),
	//	Updated: time.Now(),
	//	Enabled: true,
	//	Resource: alerting.Resource{
	//		ID: "c8i18llath2blrusdjng",
	//		Type: "elasticsearch",
	//		Objects: []string{".infini_metrics*"},
	//		TimeField: "timestamp",
	//		RawFilter: map[string]interface{}{
	//			"match_all": util.MapStr{
	//
	//			},
	//		},
	//	},
	//
	//	Metrics: alerting.Metric{
	//		PeriodInterval: "1m",
	//		MaxPeriods:     15,
	//		Items: []alerting.MetricItem{
	//			{Name: "a", Field: "payload.elasticsearch.node_stats.os.cpu.percent", Statistic: "p99", Group: []string{"metadata.labels.cluster_id", "metadata.labels.node_id"}},
	//		},
	//	},
	//	Conditions: alerting.Condition{
	//		Operator: "any",
	//		Items: []alerting.ConditionItem{
	//			{MinimumPeriodMatch: 5, Operator: "gte", Values: []string{"90"}, Priority: "error", AlertMessage: "cpu使用率大于90%"},
	//		},
	//	},
	//
	//	Channels: alerting.NotificationConfig{
	//		Normal: []alerting.Channel{
	//			{Name: "钉钉", Type: alerting.ChannelWebhook, Webhook: &alerting.CustomWebhook{
	//				HeaderParams: map[string]string{
	//					"Message-Type": "application/json",
	//				},
	//				Body:   `{"msgtype": "text","text": {"content":"告警通知: {{ctx.message}}"}}`,
	//				Method: http.MethodPost,
	//				URL:    "https://oapi.dingtalk.com/robot/send?access_token=XXXXXX",
	//			}},
	//		},
	//		ThrottlePeriod: "1h",
	//		AcceptTimeRange: alerting.TimeRange{
	//			Start: "8:00",
	//			End: "21:00",
	//		},
	//		EscalationEnabled: true,
	//		EscalationThrottlePeriod: "30m",
	//	},
	//}
	cfg := elastic.ElasticsearchConfig{}
	cfg.ID = "test"
	esClient := elasticsearch.ESAPIV7{}
	esClient.Elasticsearch = cfg.ID
	esClient.Version = elastic.Version{
		Number: "7.10.2",
		Major: 7,
		Distribution: elastic.Elasticsearch,
	}
	elastic.UpdateClient(cfg, &esClient)
	rule := alerting.Rule{
		ID: util.GetUUID(),
		Created: time.Now(),
		Updated: time.Now(),
		Enabled: true,
		Resource: alerting.Resource{
			ID: cfg.ID,
			Type: "elasticsearch",
			Objects: []string{".infini_metrics*"},
			TimeField: "timestamp",
			RawFilter: map[string]interface{}{
				"bool": map[string]interface{}{
					"must": []interface{}{
						util.MapStr{
							"term": util.MapStr{
								"metadata.name": util.MapStr{
									"value": "index_stats",
								},
							},
						},
					},
				},
			},
		},

		Metrics: alerting.Metric{
			Metric: insight.Metric{
				BucketSize: "1m",
				Items: []insight.MetricItem{
					{Name: "a", Field: "payload.elasticsearch.index_stats.total.search.query_total", Statistic: "rate"},
					{Name: "b", Field: "payload.elasticsearch.index_stats.total.search.query_time_in_millis", Statistic: "rate"},
				},
				Formula: "b/a",
			},
		},
		Conditions: alerting.Condition{
			Operator: "any",
			Items: []alerting.ConditionItem{
				{MinimumPeriodMatch: 1, Operator: "gte", Values: []string{"10"}, Priority: "warning"},
			},
		},

		Channels: &alerting.NotificationConfig{
			Normal: []alerting.Channel{
				{Name: "钉钉", Type: alerting.ChannelWebhook, Webhook: &alerting.CustomWebhook{
					HeaderParams: map[string]string{
						"Message-Type": "application/json",
					},
					Body:   `{"msgtype": "text","text": {"content":"告警通知: {{ctx.message}}"}}`,
					Method: http.MethodPost,
					URL:    "https://oapi.dingtalk.com/robot/send?access_token=XXXXXX",
				}},
			},
			ThrottlePeriod: "1h",
			AcceptTimeRange: alerting.TimeRange{
				Start: "08:00",
				End: "21:00",
			},
			EscalationEnabled: true,
			EscalationThrottlePeriod: "30m",
		},
	}
	eng := &Engine{}
	q, err := eng.GenerateQuery(&rule, nil)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(util.MustToJSON(q))
}

func TestConvertFilterQuery(t *testing.T) {
	fq := alerting.FilterQuery{
		And: []alerting.FilterQuery{
			{
				Field: "metadata.category",
				Values: []string{"elasticsearch"},
				Operator: "equals",
			},
			{
				Field: "metadata.name",
				Values: []string{"index_stats", "node_stats"},
				Operator: "in",
			},
			{
				Not: []alerting.FilterQuery{
					{
						Field: "timestamp",
						Operator: "gt",
						Values: []string{"2022-04-16T16:16:39.168605+08:00"},
					},
				},
			},
		},
	}
	var targetDsl = `{"bool":{"must":[{"term":{"metadata.category":{"value":"elasticsearch"}}},{"terms":{"metadata.name":["index_stats","node_stats"]}},{"bool":{"must_not":[{"range":{"timestamp":{"gt":"2022-04-16T16:16:39.168605+08:00"}}}]}}]}}`
	eng := &Engine{}
	q, err := eng.ConvertFilterQueryToDsl(&fq)
	if err != nil {
		t.Fatal(err)
	}
	if dsl := util.MustToJSON(q); dsl != targetDsl {
		t.Errorf("expect dsl %s but got %s", targetDsl, dsl)
	}
}