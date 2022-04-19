/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

type Condition struct {
	Operator string `json:"operator"`
	Items []ConditionItem `json:"items"`
}

type ConditionItem struct {
	//MetricName             string `json:"metric"`
	MinimumPeriodMatch int    `json:"minimum_period_match"`
	Operator           string `json:"operator"`
	Values []string `json:"values"`
	Severity string `json:"severity"`
	Message string `json:"message"`
}

type ConditionResult struct {
	ResultItems []ConditionResultItem `json:"result_items"`
	QueryResult *QueryResult `json:"query_result"`
}
type ConditionResultItem struct {
	GroupValues []string `json:"group_values"`
	ConditionItem *ConditionItem `json:"condition_item"`
}

type Severity string

var SeverityWeights = map[string]int{
	"verbose": 1,
	"info": 2,
	"warning": 3,
	"error": 4,
	"critical": 5,
}