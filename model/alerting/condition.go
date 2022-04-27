/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import "fmt"

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
func (cond *ConditionItem) GenerateConditionExpression()(conditionExpression string, err error){
	valueLength := len(cond.Values)
	if valueLength == 0 {
		return conditionExpression, fmt.Errorf("condition values: %v should not be empty", cond.Values)
	}
	switch cond.Operator {
	case "equals":
		conditionExpression = fmt.Sprintf("result == %v", cond.Values[0])
	case "gte":
		conditionExpression = fmt.Sprintf("result >= %v", cond.Values[0])
	case "lte":
		conditionExpression = fmt.Sprintf("result <= %v", cond.Values[0])
	case "gt":
		conditionExpression = fmt.Sprintf("result > %v", cond.Values[0])
	case "lt":
		conditionExpression = fmt.Sprintf("result < %v", cond.Values[0])
	case "range":
		if len(cond.Values) != 2 {
			return conditionExpression, fmt.Errorf("length of %s condition values should be 2", cond.Operator)
		}
		conditionExpression = fmt.Sprintf("result >= %v && result <= %v", cond.Values[0], cond.Values[1])
	default:
		return conditionExpression, fmt.Errorf("unsupport condition operator: %s", cond.Operator)
	}
	return
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