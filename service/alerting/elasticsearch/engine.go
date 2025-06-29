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
	"context"
	"fmt"
	"math"
	"runtime/debug"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/Knetic/govaluate"
	log "github.com/cihub/seelog"
	"infini.sh/console/model"
	"infini.sh/console/model/alerting"
	"infini.sh/console/model/insight"
	alerting2 "infini.sh/console/service/alerting"
	"infini.sh/console/service/alerting/common"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

type Engine struct {
}

// GenerateQuery generate a final elasticsearch query dsl object
// when RawFilter of rule is not empty, priority use it, otherwise to covert from Filter of rule (todo)
// auto generate time filter query and then attach to final query
// auto generate elasticsearch aggregations by metrics of rule
// group of metric item converted to terms aggregation and TimeField of rule converted to date_histogram aggregation
// convert statistic of metric item to elasticsearch aggregation
func (engine *Engine) GenerateQuery(rule *alerting.Rule, filterParam *alerting.FilterParam) (interface{}, error) {
	filter, err := engine.GenerateRawFilter(rule, filterParam)
	if err != nil {
		return nil, err
	}
	timeFilter, err := engine.generateTimeFilter(rule, filterParam)
	if err != nil {
		return nil, err
	}
	if len(rule.Metrics.Items) == 0 {
		return nil, fmt.Errorf("metric items should not be empty")
	}
	basicAggs := util.MapStr{}
	//todo bucket sort (es 6.1) bucket script (es 2.0)
	for _, metricItem := range rule.Metrics.Items {
		metricAggs := engine.generateAgg(&metricItem)
		if err = util.MergeFields(basicAggs, metricAggs, true); err != nil {
			return nil, err
		}
	}
	verInfo := elastic.GetClient(rule.Resource.ID).GetVersion()
	var periodInterval = rule.Metrics.BucketSize
	if filterParam != nil && filterParam.BucketSize != "" {
		periodInterval = filterParam.BucketSize
	}

	if verInfo.Number == "" {
		panic("invalid version")
	}

	intervalField, err := elastic.GetDateHistogramIntervalField(verInfo.Distribution, verInfo.Number, periodInterval)
	if err != nil {
		return nil, fmt.Errorf("get interval field error: %w", err)
	}
	timeAggs := util.MapStr{
		"time_buckets": util.MapStr{
			"date_histogram": util.MapStr{
				"field":       rule.Resource.TimeField,
				intervalField: periodInterval,
			},
			"aggs": basicAggs,
		},
	}

	var rootAggs util.MapStr
	groups := rule.Metrics.Groups
	if grpLength := len(groups); grpLength > 0 {
		var lastGroupAgg util.MapStr

		for i := grpLength - 1; i >= 0; i-- {
			limit := groups[i].Limit
			//top group 10
			if limit <= 0 {
				limit = 10
			}
			groupAgg := util.MapStr{
				"terms": util.MapStr{
					"field": groups[i].Field,
					"size":  limit,
				},
			}
			groupID := util.GetUUID()
			if lastGroupAgg != nil {
				groupAgg["aggs"] = util.MapStr{
					groupID: lastGroupAgg,
				}
			} else {
				groupAgg["aggs"] = timeAggs
			}
			lastGroupAgg = groupAgg
		}
		rootAggs = util.MapStr{
			util.GetUUID(): lastGroupAgg,
		}
	} else {
		rootAggs = timeAggs
	}
	if len(filter) > 0 {
		rootAggs = util.MapStr{
			"filter_agg": util.MapStr{
				"filter": filter,
				"aggs":   rootAggs,
			},
		}
	}

	return util.MapStr{
		"size":  0,
		"query": timeFilter,
		"aggs":  rootAggs,
	}, nil
}

// generateAgg convert statistic of metric item to elasticsearch aggregation
func (engine *Engine) generateAgg(metricItem *insight.MetricItem) map[string]interface{} {
	var (
		aggType = "value_count"
		field   = metricItem.Field
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
	case "derivative":
		aggType = "max"
		isPipeline = true
	case "medium": // from es version 6.6
		aggType = "median_absolute_deviation"
	case "p99", "p95", "p90", "p80", "p50":
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
	if !isPipeline {
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

func (engine *Engine) ConvertFilterQueryToDsl(fq *alerting.FilterQuery) (map[string]interface{}, error) {
	if !fq.IsComplex() {
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

	if len(fq.Not) > 0 {
		boolOperator = "must_not"
		filterQueries = fq.Not

	} else if len(fq.Or) > 0 {
		boolOperator = "should"
		filterQueries = fq.Or
	} else {
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

func getQueryTimeRange(rule *alerting.Rule, filterParam *alerting.FilterParam) (start, end interface{}) {
	var (
		timeStart interface{}
		timeEnd   interface{}
	)
	if filterParam != nil {
		timeStart = filterParam.Start
		timeEnd = filterParam.End
	} else {
		var (
			units string
			value int
		)
		intervalDuration, err := time.ParseDuration(rule.Metrics.BucketSize)
		if err != nil {
			return nil, fmt.Errorf("parse bucket size of rule [%s] error: %v", rule.Name, err)
		}
		if intervalDuration/time.Hour >= 1 {
			units = "h"
			value = int(intervalDuration / time.Hour)
		} else if intervalDuration/time.Minute >= 1 {
			units = "m"
			value = int(intervalDuration / time.Minute)
		} else if intervalDuration/time.Second >= 1 {
			units = "s"
			value = int(intervalDuration / time.Second)
		} else {
			return nil, fmt.Errorf("period interval: %s is too small", rule.Metrics.BucketSize)
		}
		var bucketCount int
		if rule.BucketConditions != nil {
			bucketCount = rule.BucketConditions.GetMaxBucketCount()
			//for removing first and last time bucket
			bucketCount += 2
		} else {
			bucketCount = rule.Conditions.GetMinimumPeriodMatch() + 1
		}
		if bucketCount <= 0 {
			bucketCount = 2
		}
		duration, err := time.ParseDuration(fmt.Sprintf("%d%s", value*bucketCount, units))
		if err != nil {
			return nil, err
		}
		timeStart = time.Now().Add(-duration).UnixMilli() //.Format(time.RFC3339Nano)
		timeEnd = time.Now().UnixMilli()
	}
	return timeStart, timeEnd
}

func (engine *Engine) generateTimeFilter(rule *alerting.Rule, filterParam *alerting.FilterParam) (map[string]interface{}, error) {
	timeStart, timeEnd := getQueryTimeRange(rule, filterParam)
	timeQuery := util.MapStr{
		"range": util.MapStr{
			rule.Resource.TimeField: util.MapStr{
				"gte": timeStart,
				"lte": timeEnd,
			},
		},
	}
	return timeQuery, nil
}

func (engine *Engine) GenerateRawFilter(rule *alerting.Rule, filterParam *alerting.FilterParam) (map[string]interface{}, error) {
	query := map[string]interface{}{}
	var err error
	if rule.Resource.RawFilter != nil {
		query = util.DeepCopy(rule.Resource.RawFilter).(map[string]interface{})
	} else {
		if !rule.Resource.Filter.IsEmpty() {
			query, err = engine.ConvertFilterQueryToDsl(&rule.Resource.Filter)
			if err != nil {
				return nil, err
			}
		}
	}
	//timeQuery, err := engine.generateTimeFilter(rule, filterParam)
	//if err != nil {
	//	return nil, err
	//}
	//
	//if boolQ, ok := query["bool"].(map[string]interface{}); ok {
	//	if mustQ, ok := boolQ["must"]; ok {
	//
	//		if mustArr, ok := mustQ.([]interface{}); ok {
	//			boolQ["must"] = append(mustArr, timeQuery)
	//
	//		}else{
	//			return nil, fmt.Errorf("must query: %v is not valid in filter", mustQ)
	//		}
	//	}else{
	//		boolQ["must"] = []interface{}{
	//			timeQuery,
	//		}
	//	}
	//}else{
	//	must := []interface{}{
	//		timeQuery,
	//	}
	//	if len(query) > 0 {
	//		if _, ok = query["match_all"]; !ok {
	//			must = append(must, query)
	//		}
	//	}
	//	query = util.MapStr{
	//		"bool":  util.MapStr{
	//			"must": must,
	//		},
	//	}
	//}
	return query, nil
}

func (engine *Engine) ExecuteQuery(rule *alerting.Rule, filterParam *alerting.FilterParam) (*alerting.QueryResult, error) {
	esClient := elastic.GetClient(rule.Resource.ID)
	queryResult := &alerting.QueryResult{}
	indexName := strings.Join(rule.Resource.Objects, ",")
	//todo cache queryDsl
	queryDsl, err := engine.GenerateQuery(rule, filterParam)
	if err != nil {
		return nil, err
	}
	if vm, ok := queryDsl.(util.MapStr); ok {
		queryResult.Min, err = vm.GetValue(fmt.Sprintf("query.range.%s.gte", rule.Resource.TimeField))
		queryResult.Max, _ = vm.GetValue(fmt.Sprintf("query.range.%s.lte", rule.Resource.TimeField))
	}
	queryDslBytes, err := util.ToJSONBytes(queryDsl)
	if err != nil {
		return nil, err
	}
	queryResult.Query = string(queryDslBytes)
	searchRes, err := esClient.SearchWithRawQueryDSL(indexName, queryDslBytes)
	if err != nil {
		return queryResult, err
	}
	if searchRes.GetTotal() == 0 {
		queryResult.Nodata = true
	}
	if searchRes.StatusCode != 200 {
		return queryResult, fmt.Errorf("search error: %s", string(searchRes.RawResult.Body))
	}
	queryResult.Raw = string(searchRes.RawResult.Body)
	searchResult := map[string]interface{}{}
	err = util.FromJSONBytes(searchRes.RawResult.Body, &searchResult)
	if err != nil {
		return queryResult, err
	}
	metricData := []alerting.MetricData{}
	CollectMetricData(searchResult["aggregations"], "", &metricData)
	//将 derivative 求导数据 除以 bucket size (单位 /s)
	//statisticM := map[string] string{}
	//for _, mi := range rule.Metrics.Items {
	//	statisticM[mi.Name] = mi.Statistic
	//}
	//var periodInterval = rule.Metrics.PeriodInterval
	//if filterParam != nil && filterParam.BucketSize != "" {
	//	periodInterval =  filterParam.BucketSize
	//}
	//interval, err := time.ParseDuration(periodInterval)
	//if err != nil {
	//	log.Error(err)
	//}
	//for i, _ := range metricData {
	//	for k, d := range metricData[i].Data {
	//		if statisticM[k] == "derivative" {
	//			for _, td := range d {
	//				if len(td) > 1 {
	//					if v, ok := td[1].(float64); ok {
	//						td[1] = v / interval.Seconds()
	//					}
	//				}
	//			}
	//		}
	//	}
	//}
	queryResult.MetricData = metricData
	return queryResult, nil
}
func (engine *Engine) GetTargetMetricData(rule *alerting.Rule, isFilterNaN bool, filterParam *alerting.FilterParam) ([]alerting.MetricData, *alerting.QueryResult, error) {
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
				Data:        map[string][]alerting.MetricDataItem{},
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
					if len(v) < dataLength {
						continue
					}

					//drop nil value bucket
					if v == nil {
						continue DataLoop
					}
					if _, ok := v[i].Value.(float64); !ok {
						continue DataLoop
					}
					parameters[k] = v[i].Value
					timestamp = v[i].Timestamp
				}
				if len(parameters) == 0 {
					continue
				}

				result, err := expression.Evaluate(parameters)
				if err != nil {
					return nil, queryResult, err
				}
				if r, ok := result.(float64); ok {
					if math.IsNaN(r) || math.IsInf(r, 0) {
						if !isFilterNaN {
							targetData.Data["result"] = append(targetData.Data["result"], alerting.MetricDataItem{Timestamp: timestamp, Value: math.NaN()})
						}
						continue
					}
				}

				targetData.Data["result"] = append(targetData.Data["result"], alerting.MetricDataItem{Timestamp: timestamp, Value: result})
			}
		}
		targetMetricData = append(targetMetricData, targetData)
	}
	return targetMetricData, queryResult, nil
}

// CheckCondition check whether rule conditions triggered or not
// if triggered returns an ConditionResult
// sort conditions by priority desc  before check , and then if condition is true, then continue check another group
func (engine *Engine) CheckCondition(rule *alerting.Rule) (*alerting.ConditionResult, error) {
	var resultItems []alerting.ConditionResultItem
	targetMetricData, queryResult, err := engine.GetTargetMetricData(rule, true, nil)
	conditionResult := &alerting.ConditionResult{
		QueryResult: queryResult,
	}
	if err != nil {
		return conditionResult, err
	}
	if rule.BucketConditions != nil {
		return engine.CheckBucketCondition(rule, targetMetricData, queryResult)
	}
	valueExpression, err := govaluate.NewEvaluableExpression(rule.Metrics.Formula)
	if err != nil {
		return conditionResult, fmt.Errorf("generate value expression: %s error: %w", rule.Metrics.Formula, err)
	}
	for idx, targetData := range targetMetricData {
		if idx == 0 {
			sort.Slice(rule.Conditions.Items, func(i, j int) bool {
				return alerting.PriorityWeights[rule.Conditions.Items[i].Priority] > alerting.PriorityWeights[rule.Conditions.Items[j].Priority]
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
				if targetData.Data[dataKey][i].Value == nil {
					continue
				}
				if r, ok := targetData.Data[dataKey][i].Value.(float64); ok {
					if math.IsNaN(r) {
						continue
					}
				}
				relationValues := map[string]interface{}{}
				for _, metric := range rule.Metrics.Items {
					relationValues[metric.Name] = queryResult.MetricData[idx].Data[metric.Name][i].Value
				}
				valueExpressionResult, err := valueExpression.Evaluate(relationValues)
				if err != nil {
					return conditionResult, fmt.Errorf("evaluate value expression: %s error: %w", rule.Metrics.Formula, err)
				}
				if v, ok := valueExpressionResult.(float64); ok {
					valueExpressionResult = util.ToFixed(v, 1)
				}
				evaluateResult, err := expression.Evaluate(map[string]interface{}{
					"result": valueExpressionResult,
				})
				if err != nil {
					return conditionResult, fmt.Errorf("evaluate rule [%s] error: %w", rule.ID, err)
				}
				if evaluateResult == true {
					triggerCount += 1
				} else {
					triggerCount = 0
				}
				if triggerCount >= cond.MinimumPeriodMatch {
					log.Debugf("triggered condition  %v, groups: %v\n", cond, targetData.GroupValues)
					resultItem := alerting.ConditionResultItem{
						GroupValues:    targetData.GroupValues,
						ConditionItem:  &cond,
						ResultValue:    valueExpressionResult,
						IssueTimestamp: targetData.Data[dataKey][i].Timestamp,
						RelationValues: relationValues,
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

type BucketDiffState struct {
	ContentChangeState int
	DocCount           int
}

func (engine *Engine) CheckBucketCondition(rule *alerting.Rule, targetMetricData []alerting.MetricData, queryResult *alerting.QueryResult) (*alerting.ConditionResult, error) {
	var resultItems []alerting.ConditionResultItem
	conditionResult := &alerting.ConditionResult{
		QueryResult: queryResult,
	}
	//transform targetMetricData
	var (
		times   = map[int64]struct{}{}
		buckets = map[string]map[int64]int{}
		maxTime int64
		minTime = time.Now().UnixMilli()
	)
	for _, targetData := range targetMetricData {
		for _, v := range targetData.Data {
			for _, item := range v {
				if tv, ok := item.Timestamp.(float64); ok {
					timestamp := int64(tv)
					if timestamp < minTime {
						minTime = timestamp
					}
					if timestamp > maxTime {
						maxTime = timestamp
					}
					if _, ok = times[timestamp]; !ok {
						times[timestamp] = struct{}{}
					}
					bucketKey := strings.Join(targetData.GroupValues, "*")
					if _, ok = buckets[bucketKey]; !ok {
						buckets[bucketKey] = map[int64]int{}
					}
					buckets[bucketKey][timestamp] = item.DocCount
				} else {
					log.Warnf("invalid timestamp type: %T", item.Timestamp)
				}
			}
		}
	}
	var timesArr []int64
	for t := range times {
		timesArr = append(timesArr, t)
	}
	sort.Slice(timesArr, func(i, j int) bool {
		return timesArr[i] < timesArr[j] // Ascending order
	})

	// Remove the first bucket if its timestamp equals minTime, and
	// the last bucket if its timestamp equals maxTime
	if len(timesArr) > 0 && timesArr[0] == minTime {
		// Remove first bucket if timestamp matches minTime
		timesArr = timesArr[1:]
	}
	if len(timesArr) > 0 && timesArr[len(timesArr)-1] == maxTime {
		// Remove last bucket if timestamp matches maxTime
		timesArr = timesArr[:len(timesArr)-1]
	}

	//check bucket diff
	diffResult := map[string]map[int64]BucketDiffState{}
	for grps, bk := range buckets {
		hasPre := false
		if _, ok := diffResult[grps]; !ok {
			diffResult[grps] = map[int64]BucketDiffState{}
		}
		for i, t := range timesArr {
			if v, ok := bk[t]; !ok {
				if hasPre {
					diffResult[grps][t] = BucketDiffState{
						ContentChangeState: -1,
					}
				}
				// reset hasPre to false
				hasPre = false
			} else {
				if !hasPre {
					if i > 0 {
						diffResult[grps][t] = BucketDiffState{
							ContentChangeState: 1,
						}
					}
				} else {
					diffResult[grps][t] = BucketDiffState{
						ContentChangeState: 0,
						DocCount:           v - bk[timesArr[i-1]],
					}
				}
				hasPre = true
			}
		}
	}

	sort.Slice(rule.BucketConditions.Items, func(i, j int) bool {
		return alerting.PriorityWeights[rule.BucketConditions.Items[i].Priority] > alerting.PriorityWeights[rule.BucketConditions.Items[j].Priority]
	})

	for grps, states := range diffResult {
	LoopCondition:
		for _, cond := range rule.BucketConditions.Items {
			conditionExpression, err := cond.GenerateConditionExpression()
			if err != nil {
				return conditionResult, err
			}
			expression, err := govaluate.NewEvaluableExpression(conditionExpression)
			if err != nil {
				return conditionResult, err
			}
			triggerCount := 0
			for t, state := range states {
				resultValue := state.DocCount
				if cond.Type == alerting.BucketDiffTypeContent {
					resultValue = state.ContentChangeState
				}
				evaluateResult, err := expression.Evaluate(map[string]interface{}{
					"result": resultValue,
				})
				if err != nil {
					return conditionResult, fmt.Errorf("evaluate rule [%s] error: %w", rule.ID, err)
				}
				if evaluateResult == true {
					triggerCount += 1
				} else {
					triggerCount = 0
				}
				if triggerCount >= cond.MinimumPeriodMatch {
					groupValues := strings.Split(grps, "*")
					log.Debugf("triggered condition  %v, groups: %v\n", cond, groupValues)
					resultItem := alerting.ConditionResultItem{
						GroupValues:    groupValues,
						ConditionItem:  &cond,
						ResultValue:    resultValue,
						IssueTimestamp: t,
						RelationValues: map[string]interface{}{},
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
		err       error
	)
	defer func() {
		if err != nil && alertItem == nil {
			alertItem = &alerting.Alert{
				ID:           util.GetUUID(),
				Created:      time.Now(),
				Updated:      time.Now(),
				RuleID:       rule.ID,
				RuleName:     rule.Name,
				ResourceID:   rule.Resource.ID,
				ResourceName: rule.Resource.Name,
				Expression:   rule.Metrics.Expression,
				Objects:      rule.Resource.Objects,
				State:        alerting.AlertStateError,
				//Priority: "undefine",
				Error: err.Error(),
			}
		}
		if alertItem != nil {
			if err != nil {
				alertItem.State = alerting.AlertStateError
				alertItem.Error = err.Error()
			} else {
				for _, actionResult := range alertItem.ActionExecutionResults {
					if actionResult.Error != "" {
						alertItem.Error = actionResult.Error
						alertItem.State = alerting.AlertStateError
					}
				}
			}

			err = orm.Save(nil, alertItem)
			if err != nil {
				log.Error(err)
			}
		}
	}()
	log.Tracef("start check condition of rule %s", rule.ID)

	//todo do only once when rule not change
	metricExpression, _ := rule.Metrics.GenerateExpression()
	for i, cond := range rule.Conditions.Items {
		expression, _ := cond.GenerateConditionExpression()
		rule.Conditions.Items[i].Expression = strings.ReplaceAll(expression, "result", metricExpression)
	}
	alertItem = &alerting.Alert{
		ID:           util.GetUUID(),
		Created:      time.Now(),
		Updated:      time.Now(),
		RuleID:       rule.ID,
		RuleName:     rule.Name,
		ResourceID:   rule.Resource.ID,
		ResourceName: rule.Resource.Name,
		Expression:   rule.Metrics.Expression,
		Objects:      rule.Resource.Objects,
		Conditions:   rule.Conditions,
		State:        alerting.AlertStateOK,
	}
	checkResults, err := engine.CheckCondition(rule)
	alertItem.ConditionResult = checkResults
	if err != nil {
		return err
	}
	alertMessage, err := getLastAlertMessage(rule.ID, 2*time.Minute)
	if err != nil {
		return fmt.Errorf("get alert message error: %w", err)
	}
	conditionResults := checkResults.ResultItems
	var paramsCtx map[string]interface{}
	if len(conditionResults) == 0 {
		alertItem.Priority = ""
		if checkResults.QueryResult.Nodata {
			alertItem.State = alerting.AlertStateNodata
		}

		if alertMessage != nil && alertMessage.Status != alerting.MessageStateRecovered && !checkResults.QueryResult.Nodata {
			alertMessage.Status = alerting.MessageStateRecovered
			alertMessage.ResourceID = rule.Resource.ID
			alertMessage.ResourceName = rule.Resource.Name
			err = saveAlertMessage(alertMessage)
			if err != nil {
				return fmt.Errorf("save alert message error: %w", err)
			}
			// todo add recover notification to inner system message
			// send recover message to channel
			recoverCfg := rule.RecoveryNotificationConfig
			if recoverCfg != nil && recoverCfg.EventEnabled && recoverCfg.Enabled {
				paramsCtx = newParameterCtx(rule, checkResults, util.MapStr{
					alerting2.ParamEventID:   alertMessage.ID,
					alerting2.ParamTimestamp: alertItem.Created.Unix(),
					"duration":               alertItem.Created.Sub(alertMessage.Created).String(),
					"trigger_at":             alertMessage.Created.Unix(),
				})
				err = attachTitleMessageToCtx(recoverCfg.Title, recoverCfg.Message, paramsCtx)
				if err != nil {
					return err
				}
				actionResults, _ := performChannels(recoverCfg.Normal, paramsCtx, false)
				alertItem.RecoverActionResults = actionResults
				//clear history notification time
				rule.LastNotificationTime = time.Time{}
				rule.LastEscalationTime = time.Time{}
				_ = kv.DeleteKey(alerting2.KVLastNotificationTime, []byte(rule.ID))
				_ = kv.DeleteKey(alerting2.KVLastEscalationTime, []byte(rule.ID))
			}
		}
		return nil
	}
	alertItem.State = alerting.AlertStateAlerting

	var (
		priority = conditionResults[0].ConditionItem.Priority
	)
	for _, conditionResult := range conditionResults {
		if alerting.PriorityWeights[priority] < alerting.PriorityWeights[conditionResult.ConditionItem.Priority] {
			priority = conditionResult.ConditionItem.Priority
		}
	}
	triggerAt := alertItem.Created
	if alertMessage != nil {
		triggerAt = alertMessage.Created
	}
	paramsCtx = newParameterCtx(rule, checkResults, util.MapStr{
		alerting2.ParamTimestamp: alertItem.Created.Unix(),
		"duration":               alertItem.Created.Sub(triggerAt).String(),
		"trigger_at":             triggerAt.Unix(),
	})

	alertItem.Priority = priority
	var newAlertMessage *alerting.AlertMessage
	if alertMessage == nil || alertMessage.Status == alerting.MessageStateRecovered {
		newAlertMessage = &alerting.AlertMessage{
			RuleID:       rule.ID,
			Created:      alertItem.Created,
			Updated:      time.Now(),
			ID:           util.GetUUID(),
			ResourceID:   rule.Resource.ID,
			ResourceName: rule.Resource.Name,
			Status:       alerting.MessageStateAlerting,
			Priority:     priority,
			Tags:         rule.Tags,
			Category:     rule.Category,
		}
		paramsCtx[alerting2.ParamEventID] = newAlertMessage.ID
	} else {
		paramsCtx[alerting2.ParamEventID] = alertMessage.ID
	}
	title, message := rule.GetNotificationTitleAndMessage()
	err = attachTitleMessageToCtx(title, message, paramsCtx)
	if err != nil {
		return err
	}
	alertItem.Message = paramsCtx[alerting2.ParamMessage].(string)
	alertItem.Title = paramsCtx[alerting2.ParamTitle].(string)
	if newAlertMessage != nil {
		alertMessage = newAlertMessage
		alertMessage.Title = alertItem.Title
		alertMessage.Message = alertItem.Message
		err = saveAlertMessage(newAlertMessage)
		if err != nil {
			return fmt.Errorf("save alert message error: %w", err)
		}
		userID := rule.Creator.Id
		if userID == "" {
			userID = "*"
		}
		notification := &model.Notification{
			UserId:      util.ToString(userID),
			Type:        model.NotificationTypeNotification,
			MessageType: model.MessageTypeAlerting,
			Status:      model.NotificationStatusNew,
			Title:       alertItem.Title,
			Body:        alertItem.Message,
			Link:        "/alerting/message",
		}
		err = orm.Create(nil, notification)
		if err != nil {
			return fmt.Errorf("failed to create notification, err: %w", err)
		}
	} else {
		alertMessage.Title = alertItem.Title
		alertMessage.Message = alertItem.Message
		alertMessage.ResourceID = rule.Resource.ID
		alertMessage.ResourceName = rule.Resource.Name
		alertMessage.Priority = priority
		err = saveAlertMessage(alertMessage)
		if err != nil {
			return fmt.Errorf("save alert message error: %w", err)
		}
	}
	log.Debugf("check condition result of rule %s is %v", conditionResults, rule.ID)

	// if alert message status equals ignored , then skip sending message to channel
	if alertMessage.Status == alerting.MessageStateIgnored {
		return nil
	}
	if paramsCtx != nil {
		paramsCtx[alerting2.ParamEventID] = alertMessage.ID
	}
	// if channel is not enabled return
	notifyCfg := rule.GetNotificationConfig()
	if notifyCfg == nil || !notifyCfg.Enabled {
		return nil
	}

	if notifyCfg.AcceptTimeRange.Include(time.Now()) {
		periodDuration, err := time.ParseDuration(notifyCfg.ThrottlePeriod)
		if err != nil {
			alertItem.Error = err.Error()
			return err
		}
		if rule.LastNotificationTime.IsZero() {
			tm, err := readTimeFromKV(alerting2.KVLastNotificationTime, []byte(rule.ID))
			if err != nil {
				return fmt.Errorf("get last notification time from kv error: %w", err)
			}
			if !tm.IsZero() {
				rule.LastNotificationTime = tm
			}
		}
		period := time.Now().Sub(rule.LastNotificationTime.Local())

		//log.Error(lastAlertItem.ID, period, periodDuration)
		if paramsCtx == nil {
			paramsCtx = newParameterCtx(rule, checkResults, util.MapStr{
				alerting2.ParamTimestamp: alertItem.Created.Unix(),
				"priority":               priority,
				"duration":               alertItem.Created.Sub(alertMessage.Created).String(),
				"trigger_at":             alertMessage.Created.Unix(),
			})
			if alertMessage != nil {
				paramsCtx[alerting2.ParamEventID] = alertMessage.ID
			}
		}

		if alertMessage == nil || period > periodDuration {
			actionResults, _ := performChannels(notifyCfg.Normal, paramsCtx, false)
			alertItem.ActionExecutionResults = actionResults
			//change and save last notification time in local kv store when action error count equals zero
			rule.LastNotificationTime = time.Now()
			strTime := time.Now().UTC().Format(time.RFC3339)
			kv.AddValue(alerting2.KVLastNotificationTime, []byte(rule.ID), []byte(strTime))
			alertItem.IsNotified = true
		}

		if notifyCfg.EscalationEnabled {
			throttlePeriod, err := time.ParseDuration(notifyCfg.EscalationThrottlePeriod)
			if err != nil {
				return err
			}

			rule.LastTermStartTime = time.Now()
			if alertMessage != nil {
				rule.LastTermStartTime = alertMessage.Created
			}
			if time.Now().Sub(rule.LastTermStartTime.Local()) > throttlePeriod {
				if rule.LastEscalationTime.IsZero() {
					tm, err := readTimeFromKV(alerting2.KVLastEscalationTime, []byte(rule.ID))
					if err != nil {
						return fmt.Errorf("get last escalation time from kv error: %w", err)
					}
					if !tm.IsZero() {
						rule.LastEscalationTime = tm
					}
				}
				if time.Now().Sub(rule.LastEscalationTime.Local()) > periodDuration {
					actionResults, _ := performChannels(notifyCfg.Escalation, paramsCtx, false)
					alertItem.EscalationActionResults = actionResults
					//todo init last escalation time when create task (by last alert item is escalated)
					rule.LastEscalationTime = time.Now()
					alertItem.IsEscalated = true
					strTime := rule.LastEscalationTime.UTC().Format(time.RFC3339)
					kv.AddValue(alerting2.KVLastEscalationTime, []byte(rule.ID), []byte(strTime))
				}

			}
		}
	}
	return nil
}

func attachTitleMessageToCtx(title, message string, paramsCtx map[string]interface{}) error {
	var (
		tplBytes []byte
		err      error
	)
	tplBytes, err = common.ResolveMessage(message, paramsCtx)
	if err != nil {
		return fmt.Errorf("resolve message template error: %w", err)
	}
	paramsCtx[alerting2.ParamMessage] = string(tplBytes)
	tplBytes, err = common.ResolveMessage(title, paramsCtx)
	if err != nil {
		return fmt.Errorf("resolve title template error: %w", err)
	}
	paramsCtx[alerting2.ParamTitle] = string(tplBytes)
	return nil
}

func newParameterCtx(rule *alerting.Rule, checkResults *alerting.ConditionResult, extraParams map[string]interface{}) map[string]interface{} {
	var (
		conditionParams []util.MapStr
		firstGroupValue string
		firstThreshold  string
		priority        string
	)
	if len(checkResults.ResultItems) > 0 {
		priority = checkResults.ResultItems[0].ConditionItem.Priority
		sort.Slice(checkResults.ResultItems, func(i, j int) bool {
			if alerting.PriorityWeights[checkResults.ResultItems[i].ConditionItem.Priority] > alerting.PriorityWeights[checkResults.ResultItems[j].ConditionItem.Priority] {
				return true
			}
			return false
		})
		sort.Slice(checkResults.ResultItems, func(i, j int) bool {
			if vi, ok := checkResults.ResultItems[i].ResultValue.(float64); ok {
				if vj, ok := checkResults.ResultItems[j].ResultValue.(float64); ok {
					return vi > vj
				}
			}
			return false
		})
	}

	for i, resultItem := range checkResults.ResultItems {
		if i >= 10 {
			break
		}
		if i == 0 {
			firstGroupValue = strings.Join(resultItem.GroupValues, ",")
			firstThreshold = strings.Join(resultItem.ConditionItem.Values, ",")
		}
		conditionParams = append(conditionParams, util.MapStr{
			alerting2.ParamThreshold:      resultItem.ConditionItem.Values,
			alerting2.Priority:            resultItem.ConditionItem.Priority,
			alerting2.ParamGroupValues:    resultItem.GroupValues,
			alerting2.ParamIssueTimestamp: resultItem.IssueTimestamp,
			alerting2.ParamResultValue:    resultItem.ResultValue,
			alerting2.ParamRelationValues: resultItem.RelationValues,
		})
	}
	envVariables, err := alerting2.GetEnvVariables()
	if err != nil {
		log.Errorf("get env variables error: %v", err)
	}
	var (
		min interface{}
		max interface{}
	)
	if checkResults.QueryResult != nil {
		min = checkResults.QueryResult.Min
		max = checkResults.QueryResult.Max
		if v, ok := min.(int64); ok {
			//expand 60s
			min = time.UnixMilli(v).Add(-time.Second * 60).UTC().Format("2006-01-02T15:04:05.999Z")
		}
		if v, ok := max.(int64); ok {
			max = time.UnixMilli(v).Add(time.Second * 60).UTC().Format("2006-01-02T15:04:05.999Z")
		}
	}
	paramsCtx := util.MapStr{
		alerting2.ParamRuleID:       rule.ID,
		alerting2.ParamResourceID:   rule.Resource.ID,
		alerting2.ParamResourceName: rule.Resource.Name,
		alerting2.ParamResults:      conditionParams,
		"objects":                   rule.Resource.Objects,
		"first_group_value":         firstGroupValue,
		"first_threshold":           firstThreshold,
		"rule_name":                 rule.Name,
		"priority":                  priority,
		"min":                       min,
		"max":                       max,
		"env":                       envVariables,
	}
	err = util.MergeFields(paramsCtx, extraParams, true)
	if err != nil {
		log.Errorf("merge template params error: %v", err)
	}
	return paramsCtx
}

func (engine *Engine) Test(rule *alerting.Rule, msgType string) ([]alerting.ActionExecutionResult, error) {
	checkResults, err := engine.CheckCondition(rule)
	if err != nil {
		return nil, fmt.Errorf("check condition error:%w", err)
	}
	alertMessage, err := getLastAlertMessage(rule.ID, 2*time.Minute)
	if err != nil {
		return nil, fmt.Errorf("get alert message error: %w", err)
	}
	var actionResults []alerting.ActionExecutionResult

	now := time.Now()
	triggerAt := now
	if alertMessage != nil {
		triggerAt = alertMessage.Created
	}
	paramsCtx := newParameterCtx(rule, checkResults, util.MapStr{
		alerting2.ParamEventID:   util.GetUUID(),
		alerting2.ParamTimestamp: now.Unix(),
		"duration":               now.Sub(triggerAt).String(),
		"trigger_at":             triggerAt.Unix(),
	})
	if msgType == "escalation" || msgType == "notification" {
		title, message := rule.GetNotificationTitleAndMessage()
		err = attachTitleMessageToCtx(title, message, paramsCtx)
		if err != nil {
			return nil, err
		}
	} else if msgType == "recover_notification" {
		if rule.RecoveryNotificationConfig == nil {
			return nil, fmt.Errorf("recovery notification must not be empty")
		}
		err = attachTitleMessageToCtx(rule.RecoveryNotificationConfig.Title, rule.RecoveryNotificationConfig.Message, paramsCtx)
		if err != nil {
			return nil, err
		}
	} else {
		return nil, fmt.Errorf("unkonwn parameter msg type")
	}

	var channels []alerting.Channel
	switch msgType {
	case "escalation":
		notifyCfg := rule.GetNotificationConfig()
		if notifyCfg == nil {
			return nil, nil
		}
		channels = notifyCfg.Escalation
	case "recover_notification":
		if rule.RecoveryNotificationConfig != nil {
			channels = rule.RecoveryNotificationConfig.Normal
		}
	case "notification":
		notifyCfg := rule.GetNotificationConfig()
		if notifyCfg == nil {
			return nil, nil
		}
		channels = notifyCfg.Normal
	}
	if len(channels) > 0 {
		actionResults, _ = performChannels(channels, paramsCtx, true)
	} else {
		return nil, fmt.Errorf("no useable channel")
	}
	return actionResults, nil
}

func performChannels(channels []alerting.Channel, ctx map[string]interface{}, raiseChannelEnabledErr bool) ([]alerting.ActionExecutionResult, int) {
	var errCount int
	var actionResults []alerting.ActionExecutionResult
	for _, channel := range channels {
		var (
			errStr       string
			resBytes     []byte
			messageBytes []byte
		)
		_, err := common.RetrieveChannel(&channel, raiseChannelEnabledErr)
		if err != nil {
			log.Error(err)
			errCount++
			errStr = err.Error()
		} else {
			if !channel.Enabled {
				continue
			}
			resBytes, err, messageBytes = common.PerformChannel(&channel, ctx)
			if err != nil {
				errCount++
				errStr = err.Error()
			}
		}
		actionResults = append(actionResults, alerting.ActionExecutionResult{
			Result:        string(resBytes),
			Error:         errStr,
			Message:       string(messageBytes),
			ExecutionTime: int(time.Now().UnixNano() / 1e6),
			ChannelType:   channel.SubType,
			ChannelName:   channel.Name,
			ChannelID:     channel.ID,
		})
	}
	return actionResults, errCount
}

func (engine *Engine) GenerateTask(rule alerting.Rule) func(ctx context.Context) {
	return func(ctx context.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Error(err)
				debug.PrintStack()
			}
		}()
		err := engine.Do(&rule)
		if err != nil {
			log.Error(err)
		}
	}
}

func CollectMetricData(agg interface{}, groupValues string, metricData *[]alerting.MetricData) {
	if aggM, ok := agg.(map[string]interface{}); ok {
		if targetAgg, ok := aggM["filter_agg"]; ok {
			collectMetricData(targetAgg, groupValues, metricData)
		} else {
			collectMetricData(aggM, groupValues, metricData)
		}
	}
}

func collectMetricData(agg interface{}, groupValues string, metricData *[]alerting.MetricData) {
	if aggM, ok := agg.(map[string]interface{}); ok {
		if timeBks, ok := aggM["time_buckets"].(map[string]interface{}); ok {
			if bks, ok := timeBks["buckets"].([]interface{}); ok {
				md := alerting.MetricData{
					Data:        map[string][]alerting.MetricDataItem{},
					GroupValues: strings.Split(groupValues, "*"),
				}
				for _, bk := range bks {
					if bkM, ok := bk.(map[string]interface{}); ok {

						var docCount int
						if v, ok := bkM["doc_count"]; ok {
							docCount = int(v.(float64))
						}
						for k, v := range bkM {
							if k == "key" || k == "key_as_string" || k == "doc_count" {
								continue
							}
							if len(k) > 5 { //just store a,b,c
								continue
							}
							if vm, ok := v.(map[string]interface{}); ok {
								if metricVal, ok := vm["value"]; ok {
									md.Data[k] = append(md.Data[k], alerting.MetricDataItem{Timestamp: bkM["key"], Value: metricVal, DocCount: docCount})
								} else {
									//percentiles agg type
									switch vm["values"].(type) {
									case []interface{}:
										for _, val := range vm["values"].([]interface{}) {
											if valM, ok := val.(map[string]interface{}); ok {
												md.Data[k] = append(md.Data[k], alerting.MetricDataItem{Timestamp: bkM["key"], Value: valM["value"], DocCount: docCount})
											}
											break
										}
									case map[string]interface{}:
										for _, val := range vm["values"].(map[string]interface{}) {
											md.Data[k] = append(md.Data[k], alerting.MetricDataItem{Timestamp: bkM["key"], Value: val, DocCount: docCount})
											break
										}
									}

								}

							}

						}
					}

				}
				*metricData = append(*metricData, md)
			}

		} else {
			for k, v := range aggM {
				if k == "key" || k == "doc_count" {
					continue
				}
				if vm, ok := v.(map[string]interface{}); ok {
					if bks, ok := vm["buckets"].([]interface{}); ok {
						for _, bk := range bks {
							if bkVal, ok := bk.(map[string]interface{}); ok {
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
	err, searchResult := orm.Search(alerting.AlertMessage{}, &q)
	if err != nil {
		return nil, err
	}
	if len(searchResult.Result) == 0 {
		return nil, nil
	}
	messageBytes := util.MustToJSONBytes(searchResult.Result[0])
	message := &alerting.AlertMessage{}
	err = util.FromJSONBytes(messageBytes, message)
	return message, err
}

func getLastAlertMessage(ruleID string, duration time.Duration) (*alerting.AlertMessage, error) {
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
	return orm.Save(nil, message)
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

func readTimeFromKV(bucketKey string, key []byte) (time.Time, error) {
	timeBytes, err := kv.GetValue(bucketKey, key)
	zeroTime := time.Time{}
	if err != nil {
		return zeroTime, err
	}
	timeStr := string(timeBytes)
	if timeStr != "" {
		return time.ParseInLocation(time.RFC3339, string(timeBytes), time.UTC)
	}
	return zeroTime, nil
}
