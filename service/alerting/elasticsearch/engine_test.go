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
	"net/http"
	"sort"
	"strings"
	"testing"
	"time"

	"infini.sh/console/core/insight"
	"infini.sh/console/model/alerting"
	alerting2 "infini.sh/console/service/alerting"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/adapter/elasticsearch"
)

func TestEngine(t *testing.T) {
	rule := alerting.Rule{
		ID:      util.GetUUID(),
		Created: time.Now(),
		Updated: time.Now(),
		Enabled: true,
		Resource: alerting.Resource{
			ID:        "c8i18llath2blrusdjng",
			Type:      "elasticsearch",
			Objects:   []string{".infini_metrics*"},
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
				End:   "21:00",
			},
			EscalationEnabled:        true,
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

func TestGenerateAgg(t *testing.T) {
	eng := &Engine{}
	agg := eng.generateAgg(&insight.MetricItem{
		Name:      "a",
		Field:     "cpu.percent",
		Statistic: "p99",
	})
	fmt.Println(util.MustToJSON(agg))
}

func TestAttachTitleMessageToCtxRemovesBlankLines(t *testing.T) {
	paramsCtx := map[string]interface{}{
		"priority":      "critical",
		"event_id":      "evt-1",
		"resource_name": "migrator-source",
		"objects":       []string{"migration-pmc"},
		"trigger_at":    "2026-05-20 15:00:00",
		"results": []util.MapStr{
			{
				"group_values": []string{"migration-pmc"},
				"result_value": "92.82gb",
			},
		},
	}

	err := attachTitleMessageToCtx(
		"Alert: {{.resource_name}}",
		`- Priority:{{.priority}}
- EventID: {{.event_id}}
- Target: {{.resource_name}}-{{.objects}}
- TriggerAt: {{.trigger_at}}
            
{{range .results}}
Index: {{index .group_values 0}} of Cluster: {{$.resource_name}}, Max Shard Storage: {{.result_value}}
{{end}}`,
		paramsCtx,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	got := paramsCtx[alerting2.ParamMessage].(string)
	if strings.Contains(got, "\n\n") {
		t.Fatalf("expected blank lines to be removed, got %q", got)
	}
	if !strings.Contains(got, "Index: migration-pmc of Cluster: migrator-source, Max Shard Storage: 92.82gb") {
		t.Fatalf("expected rendered content, got %q", got)
	}
}

func TestAttachTitleMessageToCtxCollapsesDuplicatedLeadingEmoji(t *testing.T) {
	paramsCtx := map[string]interface{}{
		"title": "🌈 [JVM utilization is Too High] Resolved",
	}

	err := attachTitleMessageToCtx(
		"{{.title}}",
		`[ INFINI Platform Alerting ]
🌈 {{.title}}`,
		paramsCtx,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	got := paramsCtx[alerting2.ParamMessage].(string)
	if strings.Contains(got, "🌈 🌈") {
		t.Fatalf("expected duplicated leading emoji to collapse, got %q", got)
	}
	if strings.Contains(got, "\n🌈 [JVM utilization is Too High] Resolved") {
		t.Fatalf("expected duplicated non-leading title line to be removed, got %q", got)
	}
	if !strings.Contains(got, "[ INFINI Platform Alerting ]") {
		t.Fatalf("expected remaining message content to stay, got %q", got)
	}
}

func TestAttachTitleMessageToCtxStripsDuplicatedNonLeadingTitleLine(t *testing.T) {
	paramsCtx := map[string]interface{}{
		"title": "🔥 [Cluster Metrics Collection Anomaly] Alerting",
	}

	err := attachTitleMessageToCtx(
		"{{.title}}",
		`🔥 Incident #d8h972r5aeeotbtl08ug is ongoing
{{.title}}
Priority: warning`,
		paramsCtx,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	got := paramsCtx[alerting2.ParamMessage].(string)
	if strings.Contains(got, "\n🔥 [Cluster Metrics Collection Anomaly] Alerting") {
		t.Fatalf("expected duplicated title line to be removed from message, got %q", got)
	}
	if !strings.Contains(got, "🔥 Incident #d8h972r5aeeotbtl08ug is ongoing") {
		t.Fatalf("expected incident summary to remain, got %q", got)
	}
	if !strings.Contains(got, "Priority: warning") {
		t.Fatalf("expected remaining message content to remain, got %q", got)
	}
}

func TestAttachTitleMessageToCtxAppendsRecoveryContext(t *testing.T) {
	paramsCtx := map[string]interface{}{
		"event_id":         "evt-1",
		"resource_name":    "INFINI_SYSTEM",
		"objects":          []string{".infini_metrics*"},
		"trigger_at":       "2026-06-04 10:45:25",
		"timestamp":        "2026-06-04 11:13:25",
		"duration":         "28m",
		"recovery_context": "Node: es717 of Cluster: migrator-es717, JVM Usage: 85.9%",
	}

	err := attachTitleMessageToCtx(
		"🌈 [resolved]",
		`EventID: {{.event_id}}
Target: {{.resource_name}}-{{.objects}}
TriggerAt: {{.trigger_at}}
ResolveAt: {{.timestamp}}
Duration: {{.duration}}{{if .recovery_context}}
{{.recovery_context}}{{end}}`,
		paramsCtx,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	got := paramsCtx[alerting2.ParamMessage].(string)
	if !strings.Contains(got, "Node: es717 of Cluster: migrator-es717, JVM Usage: 85.9%") {
		t.Fatalf("expected recovery context in message, got %q", got)
	}
}

func TestBuildRecoveryNotificationParamsDoesNotIncludeRecoveryContext(t *testing.T) {
	rule := &alerting.Rule{
		ID:   "rule-1",
		Name: "test-rule",
		Resource: alerting.Resource{
			ID:   "cluster-1",
			Name: "cluster-a",
		},
	}
	checkResults := &alerting.ConditionResult{}
	alertMessage := &alerting.AlertMessage{
		ID:      "evt-1",
		Created: time.Date(2026, 6, 9, 11, 45, 56, 0, time.Local),
	}
	alertItem := &alerting.Alert{
		Created: time.Date(2026, 6, 9, 11, 47, 56, 0, time.Local),
	}

	paramsCtx := buildRecoveryNotificationParams(rule, checkResults, alertMessage, alertItem)
	if _, ok := paramsCtx["recovery_context"]; ok {
		t.Fatal("expected full recovery params to omit recovery_context")
	}
	if got := paramsCtx[alerting2.ParamEventID]; got != "evt-1" {
		t.Fatalf("expected event id to be preserved, got %v", got)
	}
	if got := paramsCtx["duration"]; got != "2m" {
		t.Fatalf("expected duration to be computed from alert times, got %v", got)
	}
}

func TestNormalizeAlertTemplateTextPreservesMarkdownHardBreakSpacing(t *testing.T) {
	input := "EventID: 1  \nTarget: cluster  \nTriggerAt: now"
	got := normalizeAlertTemplateText(input)
	if got != input {
		t.Fatalf("expected markdown hard-break spaces to be preserved, got %q", got)
	}
}

func TestFormatAlertDuration(t *testing.T) {
	cases := []struct {
		name     string
		input    time.Duration
		expected string
	}{
		{name: "sub-second", input: 500 * time.Millisecond, expected: "0s"},
		{name: "minute-second", input: 5*time.Minute + 59*time.Second + 999*time.Millisecond, expected: "5m59s"},
		{name: "hour-minute", input: time.Hour + 2*time.Minute, expected: "1h2m"},
		{name: "day-hour", input: 24*time.Hour + 3*time.Hour + 4*time.Second, expected: "1d3h4s"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := formatAlertDuration(tc.input); got != tc.expected {
				t.Fatalf("expected %q, got %q", tc.expected, got)
			}
		})
	}
}

func TestDiffRecoveredConditionResultItems(t *testing.T) {
	makeItem := func(priority string, groups ...string) alerting.ConditionResultItem {
		return alerting.ConditionResultItem{
			GroupValues: groups,
			ConditionItem: &alerting.ConditionItem{
				Priority: priority,
			},
		}
	}

	previous := []alerting.ConditionResultItem{
		makeItem("low", "cluster-a", "node-1"),
		makeItem("medium", "cluster-a", "node-2"),
		makeItem("high", "cluster-a", "node-3"),
	}
	current := []alerting.ConditionResultItem{
		makeItem("high", "cluster-a", "node-3"),
	}

	recovered := diffRecoveredConditionResultItems(previous, current)
	if len(recovered) != 2 {
		t.Fatalf("expected 2 recovered items, got %d", len(recovered))
	}
	if got := strings.Join(recovered[0].GroupValues, ","); got != "cluster-a,node-1" {
		t.Fatalf("expected first recovered item to be node-1, got %s", got)
	}
	if got := strings.Join(recovered[1].GroupValues, ","); got != "cluster-a,node-2" {
		t.Fatalf("expected second recovered item to be node-2, got %s", got)
	}
}

func TestDiffRecoveredConditionResultItemsIgnoresPriorityChanges(t *testing.T) {
	makeItem := func(priority string, groups ...string) alerting.ConditionResultItem {
		return alerting.ConditionResultItem{
			GroupValues: groups,
			ConditionItem: &alerting.ConditionItem{
				Priority: priority,
			},
		}
	}

	previous := []alerting.ConditionResultItem{
		makeItem("high", "cluster-a", "node-1"),
	}
	current := []alerting.ConditionResultItem{
		makeItem("low", "cluster-a", "node-1"),
	}

	recovered := diffRecoveredConditionResultItems(previous, current)
	if len(recovered) != 0 {
		t.Fatalf("expected no recovered items when only priority changes, got %d", len(recovered))
	}
}

func TestIsIncrementalRecoveryEnabled(t *testing.T) {
	if isIncrementalRecoveryEnabled(nil) {
		t.Fatal("expected nil config to disable incremental recovery")
	}

	cfg := &alerting.RecoveryNotificationConfig{
		Enabled:                    true,
		EventEnabled:               true,
		IncrementalRecoveryEnabled: false,
	}
	if isIncrementalRecoveryEnabled(cfg) {
		t.Fatal("expected incremental recovery to stay disabled by default")
	}

	cfg.IncrementalRecoveryEnabled = true
	if !isIncrementalRecoveryEnabled(cfg) {
		t.Fatal("expected incremental recovery to be enabled when all switches are on")
	}
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
		Number:       "7.10.2",
		Major:        7,
		Distribution: elastic.Elasticsearch,
	}
	elastic.UpdateClient(cfg, &esClient)
	rule := alerting.Rule{
		ID:      util.GetUUID(),
		Created: time.Now(),
		Updated: time.Now(),
		Enabled: true,
		Resource: alerting.Resource{
			ID:        cfg.ID,
			Type:      "elasticsearch",
			Objects:   []string{".infini_metrics*"},
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
				End:   "21:00",
			},
			EscalationEnabled:        true,
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
				Field:    "metadata.category",
				Values:   []string{"elasticsearch"},
				Operator: "equals",
			},
			{
				Field:    "metadata.name",
				Values:   []string{"index_stats", "node_stats"},
				Operator: "in",
			},
			{
				Not: []alerting.FilterQuery{
					{
						Field:    "timestamp",
						Operator: "gt",
						Values:   []string{"2022-04-16T16:16:39.168605+08:00"},
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

func TestGetRelationValuesSkipsNilMetricValue(t *testing.T) {
	queryResult := &alerting.QueryResult{
		MetricData: []insight.MetricData{
			{
				Data: map[string][]insight.MetricDataItem{
					"a": {{Timestamp: int64(1), Value: float64(12)}},
					"b": {{Timestamp: int64(1), Value: nil}},
				},
			},
		},
	}

	values, ok := getRelationValues(queryResult, []insight.MetricItem{
		{Name: "a"},
		{Name: "b"},
	}, 0, 0)

	if ok {
		t.Fatalf("expected relation values with nil metric to be skipped")
	}
	if values != nil {
		t.Fatalf("expected nil relation values, got %#v", values)
	}
}

func TestGetRelationValuesReturnsValidMetricValues(t *testing.T) {
	queryResult := &alerting.QueryResult{
		MetricData: []insight.MetricData{
			{
				Data: map[string][]insight.MetricDataItem{
					"a": {{Timestamp: int64(1), Value: float64(12)}},
					"b": {{Timestamp: int64(1), Value: float64(7)}},
				},
			},
		},
	}

	values, ok := getRelationValues(queryResult, []insight.MetricItem{
		{Name: "a"},
		{Name: "b"},
	}, 0, 0)

	if !ok {
		t.Fatalf("expected relation values to be available")
	}
	if values["a"] != float64(12) || values["b"] != float64(7) {
		t.Fatalf("unexpected relation values: %#v", values)
	}
}

func TestGenerateTimeFilterIgnoreReturnsMatchAll(t *testing.T) {
	eng := &Engine{}
	rule := &alerting.Rule{
		Resource: alerting.Resource{
			IgnoreTimeFilter: true,
			TimeField:        "timestamp",
		},
	}

	timeFilter, err := eng.generateTimeFilter(rule, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if timeFilter == nil {
		t.Fatal("expected time filter map, got nil")
	}
	if _, ok := timeFilter["match_all"]; !ok {
		t.Fatalf("expected match_all query, got %#v", timeFilter)
	}
}

func TestGenerateTimeFilterReturnsRangeWhenEnabled(t *testing.T) {
	eng := &Engine{}
	rule := &alerting.Rule{
		Name: "test-rule",
		Resource: alerting.Resource{
			TimeField: "timestamp",
		},
		Metrics: alerting.Metric{
			Metric: insight.Metric{
				BucketSize: "1m",
			},
		},
	}

	timeFilter, err := eng.generateTimeFilter(rule, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	rangeQuery, ok := timeFilter["range"].(util.MapStr)
	if !ok {
		t.Fatalf("expected range query, got %#v", timeFilter)
	}
	timeFieldRange, ok := rangeQuery["timestamp"].(util.MapStr)
	if !ok {
		t.Fatalf("expected timestamp range, got %#v", rangeQuery)
	}
	if _, ok = timeFieldRange["gte"]; !ok {
		t.Fatalf("expected gte in range query, got %#v", timeFieldRange)
	}
	if _, ok = timeFieldRange["lte"]; !ok {
		t.Fatalf("expected lte in range query, got %#v", timeFieldRange)
	}
}
