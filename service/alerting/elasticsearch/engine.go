/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package elasticsearch

import (
	"bytes"
	"context"
	"fmt"
	"github.com/Knetic/govaluate"
	log "github.com/cihub/seelog"
	"infini.sh/console/model/alerting"
	alerting2 "infini.sh/console/service/alerting"
	"infini.sh/console/service/alerting/action"
	"infini.sh/console/service/alerting/funcs"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"math"
	"runtime/debug"
	"sort"
	"strconv"
	"strings"
	"text/template"
	"time"
)

type Engine struct {

}
//GenerateQuery generate a final elasticsearch query dsl object
//when RawFilter of rule is not empty, priority use it, otherwise to covert from Filter of rule (todo)
//auto generate time filter query and then attach to final query
//auto generate elasticsearch aggregations by metrics of rule
//group of metric item converted to terms aggregation and TimeField of rule converted to date_histogram aggregation
//convert statistic of metric item to elasticsearch aggregation
func (engine *Engine) GenerateQuery(rule *alerting.Rule, filterParam *alerting.FilterParam) (interface{}, error) {
	filter, err := engine.GenerateRawFilter(rule, filterParam)
	if err != nil {
		return nil, err
	}
	if len(rule.Metrics.Items) == 0 {
		return nil, fmt.Errorf("metric items should not be empty")
	}
	basicAggs := util.MapStr{}
	//todo bucket sort (es 6.1) bucket script (es 2.0)
	for _, metricItem  := range rule.Metrics.Items {
		metricAggs := engine.generateAgg(&metricItem)
		if err = util.MergeFields(basicAggs, metricAggs, true); err != nil {
			return nil, err
		}
	}
	targetESVersion := elastic.GetMetadata(rule.Resource.ID).Config.Version
	intervalField, err := elastic.GetDateHistogramIntervalField(targetESVersion)
	if err != nil {
		return nil, fmt.Errorf("get interval field error: %w", err)
	}
	var periodInterval = rule.Metrics.PeriodInterval
	if filterParam != nil && filterParam.BucketSize != "" {
		periodInterval =  filterParam.BucketSize
	}
	timeAggs := util.MapStr{
		"date_histogram": util.MapStr{
			"field":    rule.Resource.TimeField,
			intervalField: periodInterval,
		},
		"aggs": basicAggs,
	}
	var rootAggs util.MapStr
	groups := rule.Metrics.Items[0].Group
	limit := rule.Metrics.Items[0].Limit
	//top group 10
	if limit <= 0 {
		limit = 10
	}
	if grpLength := len(groups); grpLength > 0 {
		var lastGroupAgg util.MapStr

		for i := grpLength-1; i>=0; i-- {
			groupAgg := util.MapStr{
				"terms": util.MapStr{
					"field": groups[i],
					"size": limit,
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
//generateAgg convert statistic of metric item to elasticsearch aggregation
func (engine *Engine) generateAgg(metricItem *alerting.MetricItem) map[string]interface{}{
	var (
		aggType = "value_count"
		field = metricItem.Field
	)
	if field == "" || field == "*" {
		field = "_id"
	}
	var percent = 0.0
	var isPipeline = false
	switch metricItem.Statistic {
	case "max", "min", "sum", "avg":
		aggType = metricItem.Statistic
	case "count", "value_count":
		aggType = "value_count"
	case "rate":
		aggType = "max"
		isPipeline = true
	case "medium": // from es version 6.6
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
	aggs := util.MapStr{
		metricItem.Name: util.MapStr{
			aggType: aggValue,
		},
	}
	if !isPipeline{
		return aggs
	}
	pipelineAggID := util.GetUUID()
	aggs[pipelineAggID] = aggs[metricItem.Name]
	aggs[metricItem.Name] = util.MapStr{
		"derivative": util.MapStr{
			"buckets_path": pipelineAggID,
		},
	}
	return aggs
}

func (engine *Engine) ConvertFilterQueryToDsl(fq *alerting.FilterQuery) (map[string]interface{}, error){
	if !fq.IsComplex(){
		q := map[string]interface{}{}
		if len(fq.Values) == 0 {
			return nil, fmt.Errorf("values should not be empty")
		}
		//equals/gte/gt/lt/lte/in/match/regexp/wildcard/range/prefix/suffix/contain/
		switch fq.Operator {
		case "equals":
			q["term"] = util.MapStr{
				fq.Field: util.MapStr{
					"value": fq.Values[0],
				},
			}
		case "in":
			q["terms"] = util.MapStr{
				fq.Field: fq.Values,
			}
		case "match":
			q[fq.Operator] = util.MapStr{
				fq.Field: fq.Values[0],
			}
		case "gte", "gt", "lt", "lte":
			q["range"] = util.MapStr{
				fq.Field: util.MapStr{
					fq.Operator: fq.Values[0],
				},
			}
		case "range":
			if len(fq.Values) != 2 {
				return nil, fmt.Errorf("values length of range query must be 2, but got %d", len(fq.Values))
			}
			q["range"] = util.MapStr{
				fq.Field: util.MapStr{
					"gte": fq.Values[0],
					"lte": fq.Values[1],
				},
			}
		case "prefix":
			q["prefix"] = util.MapStr{
				fq.Field: fq.Values[0],
			}
		case "regexp", "wildcard":
			q[fq.Operator] = util.MapStr{
				fq.Field: util.MapStr{
					"value": fq.Values[0],
				},
			}
		default:
			return nil, fmt.Errorf("unsupport query operator %s", fq.Operator)
		}
		return q, nil
	}
	if fq.Or != nil && fq.And != nil {
		return nil, fmt.Errorf("filter format error: or, and bool operation in same level")
	}
	if fq.Or != nil && fq.Not != nil {
		return nil, fmt.Errorf("filter format error: or, not bool operation in same level")
	}
	if fq.And != nil && fq.Not != nil {
		return nil, fmt.Errorf("filter format error: and, not bool operation in same level")
	}
	var (
		boolOperator  string
		filterQueries []alerting.FilterQuery
	)

	if len(fq.Not) >0 {
		boolOperator = "must_not"
		filterQueries = fq.Not

	}else if len(fq.Or) > 0 {
		boolOperator = "should"
		filterQueries = fq.Or
	}else {
		boolOperator = "must"
		filterQueries = fq.And
	}
	var subQueries []interface{}
	for _, subQ := range filterQueries {
		subQuery, err := engine.ConvertFilterQueryToDsl(&subQ)
		if err != nil {
			return nil, err
		}
		subQueries = append(subQueries, subQuery)
	}
	boolQuery := util.MapStr{
		boolOperator: subQueries,
	}
	if boolOperator == "should" {
		boolQuery["minimum_should_match"] = 1
	}
	resultQuery := map[string]interface{}{
		"bool": boolQuery,
	}

	return resultQuery, nil
}

func (engine *Engine) GenerateRawFilter(rule *alerting.Rule, filterParam *alerting.FilterParam) (map[string]interface{}, error) {
	query := map[string]interface{}{}
	var err error
	if rule.Resource.RawFilter != nil {
		query = util.DeepCopy(rule.Resource.RawFilter).(map[string]interface{})
	}else{
		if !rule.Resource.Filter.IsEmpty(){
			query, err = engine.ConvertFilterQueryToDsl(&rule.Resource.Filter)
			if err != nil {
				return nil, err
			}
		}
	}
	var (
		timeStart interface{}
		timeEnd interface{}
	)
	if filterParam != nil {
		timeStart = filterParam.Start
		timeEnd = filterParam.End
	}else{
		var (
			units string
			value int
		)
		intervalDuration, err := time.ParseDuration(rule.Metrics.PeriodInterval)
		if err != nil {
			return nil, err
		}
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
		bucketCount := rule.Conditions.GetMinimumPeriodMatch() + 1
		if bucketCount <= 0 {
			bucketCount = 1
		}
		duration, err := time.ParseDuration(fmt.Sprintf("%d%s", value * bucketCount, units))
		if err != nil {
			return nil, err
		}
		timeStart = time.Now().Add(-duration).Format(time.RFC3339Nano)
		timeEnd = time.Now().Format(time.RFC3339Nano)
	}

	timeQuery := util.MapStr{
		"range": util.MapStr{
			rule.Resource.TimeField: util.MapStr{
				"gte": timeStart,
				"lte": timeEnd,
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
		if len(query) > 0 {
			if _, ok = query["match_all"]; !ok {
				must = append(must, query)
			}
		}
		query = util.MapStr{
			"bool":  util.MapStr{
				"must": must,
			},
		}
	}
	return query, nil
}

func (engine *Engine) ExecuteQuery(rule *alerting.Rule, filterParam *alerting.FilterParam)(*alerting.QueryResult, error){
	esClient := elastic.GetClient(rule.Resource.ID)
	queryResult := &alerting.QueryResult{}
	indexName := strings.Join(rule.Resource.Objects, ",")
	//todo cache queryDsl
	queryDsl, err := engine.GenerateQuery(rule, filterParam)
	if err != nil {
		return nil, err
	}
	queryDslBytes, err := util.ToJSONBytes(queryDsl)
	if err != nil {
		return nil, err
	}
	queryResult.Query = string(queryDslBytes)
	searchRes, err := esClient.SearchWithRawQueryDSL(indexName, queryDslBytes)
	if err != nil {
		return nil, err
	}
	if searchRes.StatusCode != 200 {
		return nil, fmt.Errorf("search error: %s", string(searchRes.RawResult.Body))
	}
	queryResult.Raw = string(searchRes.RawResult.Body)
	searchResult := map[string]interface{}{}
	err = util.FromJSONBytes(searchRes.RawResult.Body, &searchResult)
	if err != nil {
		return nil, err
	}
	metricData := []alerting.MetricData{}
	collectMetricData(searchResult["aggregations"], "", &metricData)
	queryResult.MetricData = metricData
	return queryResult, nil
}
func (engine *Engine) GetTargetMetricData(rule *alerting.Rule, isFilterNaN bool, filterParam *alerting.FilterParam)([]alerting.MetricData, *alerting.QueryResult, error){
	queryResult, err := engine.ExecuteQuery(rule, filterParam)
	if err != nil {
		return nil, queryResult, err
	}
	var targetMetricData []alerting.MetricData
	for _, md := range queryResult.MetricData {
		var targetData alerting.MetricData
		if len(rule.Metrics.Items) == 1 {
			targetData = md
		} else {
			targetData = alerting.MetricData{
				GroupValues: md.GroupValues,
				Data:        map[string][]alerting.TimeMetricData{},
			}
			expression, err := govaluate.NewEvaluableExpression(rule.Metrics.Formula)
			if err != nil {
				return nil, queryResult, err
			}
			dataLength := 0
			for _, v := range md.Data {
				dataLength = len(v)
				break
			}
		DataLoop:
			for i := 0; i < dataLength; i++ {
				parameters := map[string]interface{}{}
				var timestamp interface{}
				for k, v := range md.Data {
					if len(k) == 20 {
						continue
					}
					//drop nil value bucket
					if len(v[i]) < 2 {
						continue DataLoop
					}
					if _, ok := v[i][1].(float64); !ok {
						continue DataLoop
					}
					parameters[k] = v[i][1]
					timestamp = v[i][0]
				}
				result, err := expression.Evaluate(parameters)
				if err != nil {
					return nil, queryResult, err
				}
				if r, ok := result.(float64); ok {
					if math.IsNaN(r) || math.IsInf(r, 0 ){
						if !isFilterNaN {
							targetData.Data["result"] = append(targetData.Data["result"], []interface{}{timestamp, math.NaN()})
						}
						continue
					}
				}

				targetData.Data["result"] = append(targetData.Data["result"], []interface{}{timestamp, result})
			}
		}
		targetMetricData = append(targetMetricData, targetData)
	}
	return targetMetricData, queryResult, nil
}
//CheckCondition check whether rule conditions triggered or not
//if triggered returns an ConditionResult
//sort conditions by severity desc  before check , and then if condition is true, then continue check another group
func (engine *Engine) CheckCondition(rule *alerting.Rule)(*alerting.ConditionResult, error){
	var resultItems []alerting.ConditionResultItem
	targetMetricData, queryResult, err := engine.GetTargetMetricData(rule, false, nil)
	conditionResult := &alerting.ConditionResult{
		QueryResult: queryResult,
	}
	if err != nil {
		return conditionResult, err
	}
	for idx, targetData := range targetMetricData {
		if idx == 0 {
			sort.Slice(rule.Conditions.Items, func(i, j int) bool {
				return alerting.SeverityWeights[rule.Conditions.Items[i].Severity] > alerting.SeverityWeights[rule.Conditions.Items[j].Severity]
			})
		}
		LoopCondition:
		for _, cond := range rule.Conditions.Items {
			conditionExpression, err := cond.GenerateConditionExpression()
			if err != nil {
				return conditionResult, err
			}
			expression, err := govaluate.NewEvaluableExpression(conditionExpression)
			if err != nil {
				return conditionResult, err
			}
			dataLength := 0
			dataKey := ""
			for k, v := range targetData.Data {
				dataLength = len(v)
				dataKey = k
			}
			triggerCount := 0
			for i := 0; i < dataLength; i++ {
				//clear nil value
				if targetData.Data[dataKey][i][1] == nil {
					continue
				}
				if r, ok :=  targetData.Data[dataKey][i][1].(float64); ok {
					if math.IsNaN(r){
						continue
					}
				}
				evaluateResult, err := expression.Evaluate(map[string]interface{}{
					"result": targetData.Data[dataKey][i][1],
				})
				if err != nil {
					return conditionResult, fmt.Errorf("evaluate rule [%s] error: %w", rule.ID, err)
				}
				if evaluateResult == true {
					triggerCount += 1
				}else {
					triggerCount = 0
				}
				if triggerCount >= cond.MinimumPeriodMatch {
					log.Debugf("triggered condition  %v, groups: %v\n", cond, targetData.GroupValues)
					resultItem := alerting.ConditionResultItem{
						GroupValues: targetData.GroupValues,
						ConditionItem: &cond,
						ResultValue: targetData.Data[dataKey][i][1],
						IssueTimestamp: targetData.Data[dataKey][i][0],
						RelationValues: map[string]interface{}{},
					}
					for _, metric := range rule.Metrics.Items{
						resultItem.RelationValues[metric.Name] = queryResult.MetricData[idx].Data[metric.Name][i][1]
					}
					resultItems = append(resultItems, resultItem)
					break LoopCondition
				}
			}

		}
	}
	conditionResult.QueryResult.MetricData = targetMetricData
	conditionResult.ResultItems = resultItems
	return conditionResult, nil
}
func (engine *Engine) Do(rule *alerting.Rule) error {

	var (
		alertItem *alerting.Alert
		err error
	)
	defer func() {
		if err != nil && alertItem == nil {
			alertItem = &alerting.Alert{
				ID: util.GetUUID(),
				Created: time.Now(),
				Updated: time.Now(),
				RuleID: rule.ID,
				RuleName: rule.Name,
				ResourceID: rule.Resource.ID,
				ResourceName: rule.Resource.Name,
				Expression: rule.Metrics.Expression,
				Objects: rule.Resource.Objects,
				State: alerting.AlertStateError,
				Error: err.Error(),
			}
		}
		if alertItem != nil {
			if err != nil{
				alertItem.State = alerting.AlertStateError
				alertItem.Error = err.Error()
			}else {
				for _, actionResult := range alertItem.ActionExecutionResults {
					if actionResult.Error != "" {
						alertItem.Error = actionResult.Error
						alertItem.State = alerting.AlertStateError
					}
				}
			}

			err = orm.Save(alertItem)
			if err != nil {
				log.Error(err)
			}
		}
	}()
	log.Tracef("start check condition of rule %s", rule.ID)

	alertItem = &alerting.Alert{
		ID: util.GetUUID(),
		Created: time.Now(),
		Updated: time.Now(),
		RuleID: rule.ID,
		RuleName: rule.Name,
		ResourceID: rule.Resource.ID,
		ResourceName: rule.Resource.Name,
		Expression: rule.Metrics.Expression,
		Objects: rule.Resource.Objects,
		Conditions: rule.Conditions,
		State: alerting.AlertStateOK,
	}
	checkResults, err := engine.CheckCondition(rule)
	alertItem.ConditionResult = checkResults
	if err != nil {
		return err
	}
	alertMessage, err := getLastAlertMessage(rule.ID, 2 * time.Minute)
	if err != nil {
		return fmt.Errorf("get alert message error: %w", err)
	}
	conditionResults := checkResults.ResultItems
	var paramsCtx map[string]interface{}
	if len(conditionResults) == 0 {
		alertItem.Severity = "info"
		alertItem.State =  alerting.AlertStateOK
		if alertMessage != nil  &&  alertMessage.Status != alerting.MessageStateRecovered {
			alertMessage.Status = alerting.MessageStateRecovered
			alertMessage.Updated = time.Now()
			err = saveAlertMessage(alertMessage)
			if err != nil {
				return fmt.Errorf("save alert message error: %w", err)
			}
		}
		return nil
	}
	alertItem.State = alerting.AlertStateAlerting

	var (
		severity = conditionResults[0].ConditionItem.Severity
	)
	for _, conditionResult := range conditionResults {
		if alerting.SeverityWeights[severity] < alerting.SeverityWeights[conditionResult.ConditionItem.Severity] {
			severity = conditionResult.ConditionItem.Severity
		}
	}
	paramsCtx = newParameterCtx(rule, checkResults, util.MapStr{
		alerting2.ParamEventID: alertItem.ID,
		alerting2.ParamTimestamp:  alertItem.Created.Unix(),
	})

	alertItem.Severity = severity
	err = attachTitleMessageToCtx(rule, paramsCtx)
	if err != nil {
		return err
	}
	alertItem.Message = paramsCtx[alerting2.ParamMessage].(string)
	alertItem.Title = paramsCtx[alerting2.ParamTitle].(string)
	if alertMessage == nil || alertMessage.Status == alerting.MessageStateRecovered {
		msg := &alerting.AlertMessage{
			RuleID: rule.ID,
			Created: time.Now(),
			Updated: time.Now(),
			ID: util.GetUUID(),
			Status: alerting.MessageStateAlerting,
			Severity: severity,
			Title: alertItem.Title,
			Message: alertItem.Message,
		}
		err = saveAlertMessage(msg)
		if err != nil {
			return fmt.Errorf("save alert message error: %w", err)
		}
	}else{
		alertMessage.Title = alertItem.Title
		alertMessage.Message = alertItem.Message
		err = saveAlertMessage(alertMessage)
		if err != nil {
			return fmt.Errorf("save alert message error: %w", err)
		}
	}
	log.Debugf("check condition result of rule %s is %v", conditionResults, rule.ID )

	// if alert message status equals ignored , then skip sending message to channel
	if alertMessage != nil && alertMessage.Status == alerting.MessageStateIgnored {
		return nil
	}
	// if channel is not enabled return
	if !rule.Channels.Enabled {
		return nil
	}

	if rule.Channels.AcceptTimeRange.Include(time.Now()) {
		periodDuration, err := time.ParseDuration(rule.Channels.ThrottlePeriod)
		if err != nil {
			alertItem.Error = err.Error()
			return err
		}
		if rule.LastNotificationTime.IsZero() {
			tm, err := readTimeFromKV(alerting2.KVLastNotificationTime, []byte(rule.ID))
			if err != nil {
				return fmt.Errorf("get last notification time from kv error: %w", err)
			}
			if !tm.IsZero(){
				rule.LastNotificationTime = tm
			}
		}
		period := time.Now().Sub(rule.LastNotificationTime.Local())

		//log.Error(lastAlertItem.ID, period, periodDuration)
		if paramsCtx == nil {
			paramsCtx = newParameterCtx(rule, checkResults, util.MapStr{
				alerting2.ParamEventID: alertItem.ID,
				alerting2.ParamTimestamp:  alertItem.Created.Unix(),
				"severity": severity,
			})
		}

		if alertMessage == nil || period > periodDuration {
			actionResults, errCount := performChannels(rule.Channels.Normal, paramsCtx)
			alertItem.ActionExecutionResults = actionResults
			//change and save last notification time in local kv store when action error count equals zero
			if errCount == 0 {
				rule.LastNotificationTime = time.Now()
				strTime := time.Now().UTC().Format(time.RFC3339)
				kv.AddValue(alerting2.KVLastNotificationTime, []byte(rule.ID), []byte(strTime))
				alertItem.IsNotified = true
			}
		}

		if rule.Channels.EscalationEnabled {
			throttlePeriod, err := time.ParseDuration(rule.Channels.EscalationThrottlePeriod)
			if err != nil {
				return err
			}

			rule.LastTermStartTime = time.Now()
			if alertMessage != nil {
				rule.LastTermStartTime = alertMessage.Created
			}
			if time.Now().Sub(rule.LastTermStartTime.Local()) > throttlePeriod {
				if rule.LastEscalationTime.IsZero(){
					tm, err := readTimeFromKV(alerting2.KVLastEscalationTime, []byte(rule.ID))
					if err != nil {
						return fmt.Errorf("get last escalation time from kv error: %w", err)
					}
					if !tm.IsZero(){
						rule.LastEscalationTime = tm
					}
				}
				if time.Now().Sub(rule.LastEscalationTime.Local()) > periodDuration {
					actionResults, errCount := performChannels(rule.Channels.Escalation, paramsCtx)
					alertItem.ActionExecutionResults = actionResults
					//todo init last escalation time when create task (by last alert item is escalated)
					if errCount == 0 {
						rule.LastEscalationTime = time.Now()
						alertItem.IsEscalated = true
						strTime := rule.LastEscalationTime.UTC().Format(time.RFC3339)
						kv.AddValue(alerting2.KVLastEscalationTime, []byte(rule.ID), []byte(strTime))
					}
				}

			}
		}
	}
	return nil
}

func attachTitleMessageToCtx(rule *alerting.Rule, paramsCtx map[string]interface{}) error{
	var (
		tplBytes []byte
		err error
	)
	tplBytes, err = resolveMessage(rule.Metrics.Message, paramsCtx)
	if err != nil {
		return fmt.Errorf("resolve message template error: %w", err)
	}
	paramsCtx[alerting2.ParamMessage] = string(tplBytes)
	tplBytes, err = resolveMessage(rule.Metrics.Title, paramsCtx)
	if err != nil {
		return fmt.Errorf("resolve title template error: %w", err)
	}
	paramsCtx[alerting2.ParamTitle] = string(tplBytes)
	return nil
}

func newParameterCtx(rule *alerting.Rule, checkResults *alerting.ConditionResult, extraParams map[string]interface{} ) map[string]interface{}{
	var (
		conditionParams []util.MapStr
		firstGroupValue string
		firstThreshold  string
		severity string
	)
	if len(checkResults.ResultItems) > 0 {
		severity = checkResults.ResultItems[0].ConditionItem.Severity
		sort.Slice(checkResults.ResultItems, func(i, j int) bool {
			if  alerting.SeverityWeights[checkResults.ResultItems[i].ConditionItem.Severity] > alerting.SeverityWeights[checkResults.ResultItems[j].ConditionItem.Severity] {
				return true
			}
			return false
		})
		sort.Slice(checkResults.ResultItems, func(i, j int) bool {
			if  vi, ok := checkResults.ResultItems[i].ResultValue.(float64); ok {
				if vj, ok := checkResults.ResultItems[j].ResultValue.(float64); ok {
					return vi > vj
				}
			}
			return false
		})
	}

	for i, resultItem := range checkResults.ResultItems {

		if i == 0 {
			firstGroupValue = strings.Join(resultItem.GroupValues, ",")
			firstThreshold = strings.Join(resultItem.ConditionItem.Values, ",")
		}
		conditionParams = append(conditionParams, util.MapStr{
			alerting2.ParamThreshold:      resultItem.ConditionItem.Values,
			alerting2.Severity:            resultItem.ConditionItem.Severity,
			alerting2.ParamGroupValues:    resultItem.GroupValues,
			alerting2.ParamIssueTimestamp: resultItem.IssueTimestamp,
			alerting2.ParamResultValue:    resultItem.ResultValue,
			alerting2.ParamRelationValues: resultItem.RelationValues,
		})
	}
	paramsCtx := util.MapStr{
		alerting2.ParamRuleID:       rule.ID,
		alerting2.ParamResourceID:   rule.Resource.ID,
		alerting2.ParamResourceName: rule.Resource.Name,
		alerting2.ParamResults:      conditionParams,
		"first_group_value":         firstGroupValue,
		"first_threshold":           firstThreshold,
		"rule_name": rule.Name,
		"severity": severity,
	}
	err := util.MergeFields(paramsCtx, extraParams, true)
	if err != nil {
		log.Errorf("merge template params error: %v", err)
	}
	return paramsCtx
}

func (engine *Engine) Test(rule *alerting.Rule) ([]alerting.ActionExecutionResult, error) {
	checkResults, err := engine.CheckCondition(rule)
	if err != nil {
		return nil, fmt.Errorf("check condition error:%w", err)
	}
	var actionResults []alerting.ActionExecutionResult

	paramsCtx := newParameterCtx(rule, checkResults,util.MapStr{
		alerting2.ParamEventID: util.GetUUID(),
		alerting2.ParamTimestamp:  time.Now().Unix(),
	} )
	err = attachTitleMessageToCtx(rule, paramsCtx)
	if err != nil {
		return nil, err
	}
	if len(rule.Channels.Normal) > 0 {
		actionResults, _ = performChannels(rule.Channels.Normal, paramsCtx)
	}else if len(rule.Channels.Escalation) > 0{
		actionResults, _ = performChannels(rule.Channels.Escalation, paramsCtx)
	}else{
		return nil, fmt.Errorf("no useable channel")
	}
	return actionResults, nil
}

func performChannels(channels []alerting.Channel, ctx map[string]interface{}) ([]alerting.ActionExecutionResult, int) {
	var errCount int
	var actionResults []alerting.ActionExecutionResult
	for _, channel := range channels {
		resBytes, err, messageBytes := performChannel(&channel, ctx)
		var errStr string
		if err != nil {
			errCount++
			errStr = err.Error()
		}
		actionResults = append(actionResults, alerting.ActionExecutionResult{
			Result:        string(resBytes),
			Error:         errStr,
			Message:       string(messageBytes),
			ExecutionTime: int(time.Now().UnixNano()/1e6),
			ChannelType:   channel.Type,
			ChannelName:   channel.Name,
		})
	}
	return actionResults, errCount
}

func resolveMessage(messageTemplate string, ctx map[string]interface{}) ([]byte, error){
	msg :=  messageTemplate
	tmpl, err := template.New("alert-message").Funcs(funcs.GenericFuncMap()).Parse(msg)
	if err !=nil {
		return nil, fmt.Errorf("parse message temlate error: %w", err)
	}
	msgBuffer := &bytes.Buffer{}
	err = tmpl.Execute(msgBuffer, ctx)
	return msgBuffer.Bytes(), err
}

func performChannel(channel *alerting.Channel, ctx map[string]interface{}) ([]byte, error, []byte) {
	var (
		act action.Action
		message []byte
		err error
	)
	switch channel.Type {

	case alerting.ChannelWebhook:
		message, err = resolveMessage(channel.Webhook.Body, ctx)
		if err != nil {
			return nil, err, message
		}
		act = &action.WebhookAction{
			Data:    channel.Webhook,
			Message: string(message),
		}
	default:
		return nil, fmt.Errorf("unsupported action type: %s", channel.Type), message
	}
	executeResult, err := act.Execute()
	return executeResult, err, message
}
func (engine *Engine) GenerateTask(rule *alerting.Rule) func(ctx context.Context) {
	return func(ctx context.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Error(err)
				debug.PrintStack()
			}
		}()
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

func getLastAlertMessageFromES(ruleID string) (*alerting.AlertMessage, error) {
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
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(queryDsl),
	}
	err, searchResult := orm.Search(alerting.AlertMessage{}, &q )
	if err != nil {
		return  nil, err
	}
	if len(searchResult.Result) == 0 {
		return  nil, nil
	}
	messageBytes := util.MustToJSONBytes(searchResult.Result[0])
	message := &alerting.AlertMessage{}
	err =  util.FromJSONBytes(messageBytes, message)
	return message, err
}

func getLastAlertMessage(ruleID string, duration time.Duration) (*alerting.AlertMessage, error ){
	messageBytes, err := kv.GetValue(alerting2.KVLastMessageState, []byte(ruleID))
	if err != nil {
		return nil, err
	}
	message := &alerting.AlertMessage{}
	if messageBytes != nil {

		err = util.FromJSONBytes(messageBytes, message)
		if err != nil {
			return nil, err
		}
		if time.Now().Sub(message.Updated) <= duration {
			return message, nil
		}
	}
	message, err = getLastAlertMessageFromES(ruleID)
	return message, err
}

func saveAlertMessageToES(message *alerting.AlertMessage) error {
	message.Updated = time.Now()
	return orm.Save(message)
}

func saveAlertMessage(message *alerting.AlertMessage) error {
	//todo diff message if not change , then skip save to es ?
	err := saveAlertMessageToES(message)
	if err != nil {
		return err
	}

	messageBytes, err := util.ToJSONBytes(message)
	if err != nil {
		return err
	}
	err = kv.AddValue(alerting2.KVLastMessageState, []byte(message.RuleID), messageBytes)
	return err
}


func readTimeFromKV(bucketKey string, key []byte)(time.Time, error){
	timeBytes, err := kv.GetValue(bucketKey, key)
	zeroTime := time.Time{}
	if err != nil {
		return zeroTime, err
	}
	timeStr :=  string(timeBytes)
	if timeStr != ""{
		return time.ParseInLocation(time.RFC3339, string(timeBytes), time.UTC)
	}
	return zeroTime, nil
}
