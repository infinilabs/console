/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package elasticsearch

import (
	"bytes"
	"context"
	"fmt"
	"github.com/Knetic/govaluate"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"github.com/valyala/fasttemplate"
	"infini.sh/console/model/alerting"
	"infini.sh/console/service/alerting/action"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"io"
	"sort"
	"strconv"
	"strings"
	"time"
)

type Engine struct {

}

func (engine *Engine) GenerateQuery(rule *alerting.Rule) (interface{}, error) {
	filter, err := engine.GenerateRawFilter(rule)
	if err != nil {
		return nil, err
	}
	//todo generate agg
	if len(rule.Metrics.Items) == 0 {
		return nil, fmt.Errorf("metric items should not be empty")
	}
	basicAggs := util.MapStr{}
	for _, metricItem  := range rule.Metrics.Items {
		basicAggs[metricItem.Name] = engine.generateAgg(&metricItem)
	}
	timeAggs := util.MapStr{
		"date_histogram": util.MapStr{
			"field":    rule.Resource.TimeField,
			"interval": rule.Metrics.PeriodInterval,
		},
		"aggs": basicAggs,
	}
	var rootAggs util.MapStr
	groups := rule.Metrics.Items[0].Group
	if grpLength := len(groups); grpLength > 0 {
		var lastGroupAgg util.MapStr

		for i := grpLength-1; i>=0; i-- {
			groupAgg := util.MapStr{
				"terms": util.MapStr{
					"field": groups[i],
					"size": 500,
				},
			}
			groupID := util.GetUUID()
			if lastGroupAgg != nil {
				groupAgg["aggs"] = util.MapStr{
					groupID: lastGroupAgg,
				}
			}else{
				groupAgg["aggs"] = util.MapStr{
					"time_buckets": timeAggs,
				}
			}

			lastGroupAgg = groupAgg

		}
		rootAggs = util.MapStr{
			util.GetUUID(): lastGroupAgg,
		}
	}else{
		rootAggs = util.MapStr{
			"time_buckets": timeAggs,
		}
	}

	return util.MapStr{
		"size": 0,
		"query": filter,
		"aggs": rootAggs,
	}, nil
}
func (engine *Engine) generateAgg(metricItem *alerting.MetricItem) interface{}{
	var (
		aggType = "value_count"
		field = metricItem.Field
	)
	if field == "" || field == "*" {
		field = "_id"
	}
	var percent = 0.0
	switch metricItem.Statistic {
	case "max", "min", "sum", "avg":
		aggType = metricItem.Statistic
	case "count", "value_count":
		aggType = "value_count"
	case "medium":
		aggType = "median_absolute_deviation"
	case "p99", "p95","p90","p80","p50":
		aggType = "percentiles"
		percentStr := strings.TrimPrefix(metricItem.Statistic, "p")
		percent, _ = strconv.ParseFloat(percentStr, 32)
	}
	aggValue := util.MapStr{
		"field": field,
	}
	if aggType == "percentiles" {
		aggValue["percents"] = []interface{}{percent}
	}
	return util.MapStr{
		aggType: aggValue,
	}
}

func (engine *Engine) GenerateRawFilter(rule *alerting.Rule) (map[string]interface{}, error) {
	query := map[string]interface{}{}
	if rule.Resource.RawFilter != nil {
		query = rule.Resource.RawFilter
	}
	intervalDuration, err := time.ParseDuration(rule.Metrics.PeriodInterval)
	if err != nil {
		return nil, err
	}
	var (
		units string
		value int
	)
	if intervalDuration / time.Hour >= 1 {
		units = "h"
		value = int(intervalDuration / time.Hour)
	}else if intervalDuration / time.Minute >= 1{
		units = "m"
		value = int(intervalDuration / time.Minute)
	}else if intervalDuration / time.Second >= 1 {
		units = "s"
		value = int(intervalDuration / time.Second)
	}else{
		return nil, fmt.Errorf("period interval: %s is too small", rule.Metrics.PeriodInterval)
	}
	timeQuery := util.MapStr{
		"range": util.MapStr{
			rule.Resource.TimeField: util.MapStr{
				"gte": fmt.Sprintf("now-%d%s", value * 15, units),
			},
		},
	}

	if boolQ, ok := query["bool"].(map[string]interface{}); ok {
		if mustQ, ok := boolQ["must"]; ok {

			if mustArr, ok := mustQ.([]interface{}); ok {
				boolQ["must"] = append(mustArr, timeQuery)

			}else{
				return nil, fmt.Errorf("must query: %v is not valid in filter", mustQ)
			}
		}else{
			boolQ["must"] = []interface{}{
				timeQuery,
			}
		}
	}else{
		must := []interface{}{
			timeQuery,
		}
		if _, ok := query["match_all"]; !ok {
			must = append(must, query)
		}
		query = util.MapStr{
			"bool":  util.MapStr{
				"must": must,
			},
		}
	}
	return query, nil
}

func (engine *Engine) ExecuteQuery(rule *alerting.Rule)([]alerting.MetricData, error){
	esClient := elastic.GetClient(rule.Resource.ID)
	indexName := strings.Join(rule.Resource.Objects, ",")
	queryDsl, err := engine.GenerateQuery(rule)
	if err != nil {
		return nil, err
	}
	queryDslBytes, err := util.ToJSONBytes(queryDsl)
	if err != nil {
		return nil, err
	}
	searchRes, err := esClient.SearchWithRawQueryDSL(indexName, queryDslBytes)
	if err != nil {
		return nil, err
	}
	searchResult := map[string]interface{}{}
	err = util.FromJSONBytes(searchRes.RawResult.Body, &searchResult)
	if err != nil {
		return nil, err
	}
	metricData := []alerting.MetricData{}
	collectMetricData(searchResult["aggregations"], "", &metricData)
	return metricData, nil
}
func (engine *Engine) CheckCondition(rule *alerting.Rule)([]alerting.ConditionResult, error){
	metricData, err := engine.ExecuteQuery(rule)
	if err != nil {
		return nil, err
	}
	var conditionResults []alerting.ConditionResult
	for _, md := range metricData {
		var targetData alerting.MetricData
		if len(rule.Metrics.Items) == 1 {
			targetData = md
		}else{
			targetData = alerting.MetricData{
				GroupValues: md.GroupValues,
				Data: map[string][]alerting.TimeMetricData{},
			}
			expression, err := govaluate.NewEvaluableExpression(rule.Metrics.Formula)
			if err != nil {
				return nil, err
			}
			dataLength := 0
			for _, v := range md.Data {
				dataLength = len(v)
				break
			}
			DataLoop:
			for i := 0; i < dataLength; i++ {
				parameters := map[string]interface{}{
				}
				var timestamp interface{}
				for k, v := range md.Data {
					//drop nil value bucket
					if v[i][1] == nil {
						continue DataLoop
					}
					parameters[k] = v[i][1]
					timestamp = v[i][0]
				}
				result, err := expression.Evaluate(parameters)
				if err != nil {
					return nil, err
				}
				targetData.Data["result"] = append(targetData.Data["result"], []interface{}{timestamp, result})
			}
		}
		sort.Slice(rule.Conditions.Items, func(i, j int) bool {
			return alerting.SeverityWeights[rule.Conditions.Items[i].Severity] > alerting.SeverityWeights[rule.Conditions.Items[j].Severity]
		})
		LoopCondition:
		for _, cond := range rule.Conditions.Items {
			conditionExpression := ""
			valueLength := len(cond.Values)
			if valueLength == 0 {
				return nil, fmt.Errorf("condition values: %v should not be empty", cond.Values)
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
				if valueLength != 2 {
					return nil, fmt.Errorf("length of %s condition values should be 2", cond.Operator)
				}
				conditionExpression = fmt.Sprintf("result >= %v && result <= %v", cond.Values[0], cond.Values[1])
			default:
				return nil, fmt.Errorf("unsupport condition operator: %s", cond.Operator)
			}
			expression, err := govaluate.NewEvaluableExpression(conditionExpression)
			if err != nil {
				return nil, err
			}
			dataLength := 0
			dataKey := ""
			for k, v := range targetData.Data {
				dataLength = len(v)
				dataKey = k
			}
			triggerCount := 0
			for i := 0; i < dataLength; i++ {
				conditionResult, err := expression.Evaluate(map[string]interface{}{
					"result": targetData.Data[dataKey][i][1],
				})
				if err != nil {
					return nil, err
				}
				if conditionResult == true {
					triggerCount += 1
				}else {
					triggerCount = 0
				}
				if triggerCount >= cond.MinimumPeriodMatch {
					log.Debugf("triggered condition  %v, groups: %v\n", cond, targetData.GroupValues)
					conditionResults = append(conditionResults, alerting.ConditionResult{
						GroupValues: targetData.GroupValues,
						ConditionItem: &cond,
					})
					break LoopCondition
				}
			}

		}
	}
	return conditionResults, nil
}
func (engine *Engine) Do(rule *alerting.Rule) error {
	log.Tracef("start check condition of rule %s", rule.ID)
	conditionResults, err := engine.CheckCondition(rule)
	if err != nil {
		return err
	}
	lastAlertItem := alerting.Alert{}
	err = getLastAlert(rule.ID, rule.Resource.ID, &lastAlertItem)
	if err != nil {
		return err
	}
	var alertItem *alerting.Alert
	defer func() {
		if alertItem != nil {
			for _, actionResult := range alertItem.ActionExecutionResults {
				if actionResult.Error != "" {
					alertItem.Error = actionResult.Error
				}
			}
			if alertItem.Error != ""{
				alertItem.State = alerting.AlertStateError
			}
			err = orm.Save(alertItem)
			if err != nil {
				log.Error(err)
			}
		}
	}()
	if len(conditionResults) == 0 {
		if lastAlertItem.State != alerting.AlertStateNormal && lastAlertItem.ID != "" {
			alertItem = &alerting.Alert{
					ID: util.GetUUID(),
					Created: time.Now(),
					Updated: time.Now(),
				RuleID: rule.ID,
				ClusterID: rule.Resource.ID,
				Expression: rule.Metrics.Expression,
				Objects: rule.Resource.Objects,
				Severity: "info",
				Content: "",
				State: alerting.AlertStateNormal,
			}
		}
		return nil
	}else{
		log.Debugf("check condition result of rule %s is %v", conditionResults, rule.ID )
		var (
			severity = conditionResults[0].ConditionItem.Severity
			content string
		)
		for _, conditionResult := range conditionResults {
			if alerting.SeverityWeights[severity] < alerting.SeverityWeights[conditionResult.ConditionItem.Severity] {
				severity = conditionResult.ConditionItem.Severity
			}
			content += conditionResult.ConditionItem.Message + ";"
		}
		alertItem = &alerting.Alert{
				ID: util.GetUUID(),
				Created: time.Now(),
				Updated: time.Now(),
			RuleID: rule.ID,
			ClusterID: rule.Resource.ID,
			Expression: rule.Metrics.Expression,
			Objects: rule.Resource.Objects,
			Severity: severity,
			Content: content,
			State: alerting.AlertStateActive,
		}
	}

	if rule.Channels.AcceptTimeRange.Include(time.Now()) {
		periodDuration, err := time.ParseDuration(rule.Channels.ThrottlePeriod)
		if err != nil {
			alertItem.Error = err.Error()
			return err
		}

		if time.Now().Sub(lastAlertItem.Created) > periodDuration {
			actionResults := performChannels(rule.Channels.Normal, conditionResults)
			alertItem.ActionExecutionResults = actionResults

		}
		if rule.Channels.EscalationEnabled && lastAlertItem.State != alerting.AlertStateNormal {
			periodDuration, err = time.ParseDuration(rule.Channels.EscalationThrottlePeriod)
			if err != nil {
				return err
			}
			if time.Now().Sub(lastAlertItem.Created) > periodDuration {
				actionResults := performChannels(rule.Channels.Escalation, conditionResults)
				alertItem.ActionExecutionResults = actionResults
			}
		}
	}
	return nil
}

func performChannels(channels []alerting.Channel, conditionResults []alerting.ConditionResult) []alerting.ActionExecutionResult {
	var message string
	for _, conditionResult := range conditionResults {
		message += fmt.Sprintf("severity: %s\t message:%s\t groups:%v\t timestamp: %v;", conditionResult.ConditionItem.Severity, conditionResult.ConditionItem.Message, conditionResult.GroupValues, time.Now())
	}
	ctx := util.MapStr{
		"ctx": util.MapStr{
			"message": message,
		},
	}
	var actionResults []alerting.ActionExecutionResult
	for _, channel := range channels {
		resBytes, err := performChannel(&channel, util.MustToJSONBytes(ctx))
		var errStr string
		if err != nil {
			errStr = err.Error()
		}
		actionResults = append(actionResults, alerting.ActionExecutionResult{
			Result: string(resBytes),
			Error: errStr,
			LastExecutionTime: int(time.Now().UnixNano()/1e6),
		})
	}
	return actionResults
}

func resolveMessage(messageTemplate string, ctx []byte) ([]byte, error){
	msg :=  messageTemplate
	tpl := fasttemplate.New(msg, "{{", "}}")
	msgBuffer := bytes.NewBuffer(nil)
	_, err := tpl.ExecuteFunc(msgBuffer, func(writer io.Writer, tag string)(int, error){
		keyParts := strings.Split(tag,".")
		value, _, _, err := jsonparser.Get(ctx, keyParts...)
		if err != nil {
			return 0, err
		}
		return writer.Write(value)
	})
	return msgBuffer.Bytes(), err
}

func performChannel(channel *alerting.Channel, ctx []byte) ([]byte, error) {
	var act action.Action
	switch channel.Type {

	case alerting.ChannelWebhook:
		message, err := resolveMessage(channel.Webhook.Body, ctx)
		if err != nil {
			return nil, err
		}
		act = &action.WebhookAction{
			Data:    channel.Webhook,
			Message: string(message),
		}
	default:
		return nil, fmt.Errorf("unsupported action type: %s", channel.Type)
	}
	return act.Execute()
}
func (engine *Engine) GenerateTask(rule *alerting.Rule) func(ctx context.Context) {
	return func(ctx context.Context) {
		err := engine.Do(rule)
		if err != nil {
			log.Error(err)
		}
	}
}


func collectMetricData(agg interface{}, groupValues string, metricData *[]alerting.MetricData){
	if aggM, ok := agg.(map[string]interface{}); ok {
		if timeBks, ok := aggM["time_buckets"].(map[string]interface{}); ok {
			if bks, ok := timeBks["buckets"].([]interface{}); ok {
				md := alerting.MetricData{
					Data: map[string][]alerting.TimeMetricData{},
					GroupValues: strings.Split(groupValues, "*"),
				}
				for _, bk := range bks {
					if bkM, ok := bk.(map[string]interface{}); ok{

						for k, v := range bkM {
							if k == "key" || k == "key_as_string" || k== "doc_count"{
								continue
							}
							if vm, ok := v.(map[string]interface{}); ok {
								if metricVal, ok := vm["value"]; ok {
									md.Data[k] = append(md.Data[k], alerting.TimeMetricData{bkM["key"], metricVal})
								}else{
									//percentiles agg type
									switch  vm["values"].(type) {
									case []interface{}:
										for _, val := range vm["values"].([]interface{}) {
											if valM, ok := val.(map[string]interface{}); ok {
												md.Data[k] = append(md.Data[k], alerting.TimeMetricData{bkM["key"], valM["value"]})
											}
											break
										}
									case map[string]interface{}:
										for _, val := range vm["values"].(map[string]interface{}) {
												md.Data[k] = append(md.Data[k], alerting.TimeMetricData{bkM["key"], val})
											break
										}
									}

								}

							}

						}
					}

				}
				*metricData = append(*metricData,md)
			}

		}else{
			for k, v := range aggM {
				if k == "key" || k== "doc_count"{
					continue
				}
				if vm, ok := v.(map[string]interface{}); ok {
					if bks, ok := vm["buckets"].([]interface{}); ok {
						for _, bk := range bks {
							if bkVal, ok :=  bk.(map[string]interface{}); ok {
								currentGroup := bkVal["key"].(string)
								newGroupValues := currentGroup
								if groupValues != "" {
									newGroupValues = fmt.Sprintf("%s*%s", groupValues, currentGroup)
								}
								collectMetricData(bk, newGroupValues, metricData)
							}

						}
					}
				}
				break
			}
		}
	}
}

func getLastAlert(ruleID, clusterID string, alertItem *alerting.Alert) error {
	esClient := elastic.GetClient(clusterID)
	queryDsl := util.MapStr{
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
					"value": ruleID,
				},
			},
		},
	}
	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetWildcardIndexName(alertItem), util.MustToJSONBytes(queryDsl) )
	if err != nil {
		return err
	}
	if len(searchRes.Hits.Hits) == 0 {
		return nil
	}
	alertBytes := util.MustToJSONBytes(searchRes.Hits.Hits[0].Source)
	return util.FromJSONBytes(alertBytes, alertItem)
}