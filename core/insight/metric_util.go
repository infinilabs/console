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

package insight

import (
	"fmt"
	"sort"
	"strconv"
	"strings"

	log "github.com/cihub/seelog"
	"infini.sh/console/core/insight/function"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
)

func generateAgg(metricItem *MetricItem, timeField string) (map[string]interface{}, error) {
	var (
		aggType = "value_count"
		field   = metricItem.Field
	)
	if field == "" || field == "*" {
		if timeField != "" {
			field = timeField
		} else {
			field = "_id"
		}
	}
	var percent = 0.0
	var isPipeline = false

	switch metricItem.Statistic {
	case AggFuncMax, AggFuncMin, AggFuncSum, AggFuncAvg, AggFuncCardinality:
		aggType = metricItem.Statistic
	case AggFuncCount, AggFuncValueCount:
		aggType = "value_count"
	case AggFuncDerivative:
		aggType = "max"
		isPipeline = true
	case AggFuncMedium: // from es version 6.6
		aggType = "median_absolute_deviation"
	case AggFuncPercent99, AggFuncPercent95, AggFuncPercent90, AggFuncPercent80, AggFuncPercent50:
		aggType = "percentiles"
		percentStr := strings.TrimPrefix(metricItem.Statistic, "p")
		percent, _ = strconv.ParseFloat(percentStr, 32)
	case AggFuncLatest:
		aggType = "top_hits"
	case AggFuncPercentage:
		// percentage is a special case, it will be calculated with doc_count, juest return empty aggs
		aggType = "value_count"
	}
	aggValue := util.MapStr{}
	if aggType != "top_hits" {
		aggValue["field"] = field
	} else {
		aggValue["_source"] = util.MapStr{
			"includes": []string{field},
		}
		aggValue["sort"] = []util.MapStr{
			{
				timeField: util.MapStr{
					"order": "desc",
				},
			},
		}
		aggValue["size"] = 1
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
		return aggs, nil
	}
	pipelineAggID := util.GetUUID()
	aggs[pipelineAggID] = aggs[metricItem.Name]
	aggs[metricItem.Name] = util.MapStr{
		"derivative": util.MapStr{
			"buckets_path": pipelineAggID,
		},
	}
	return aggs, nil
}

func generateAggByFunction(metricItem *MetricItem, timeField string) (map[string]interface{}, error) {
	if metricItem.Function == nil {
		return nil, fmt.Errorf("empty function for metric item: %s", metricItem.Name)
	}
	if len(metricItem.Function) != 1 {
		return nil, fmt.Errorf("invalid function for metric item: %s: expected exactly one function name, but got zero or multiple", metricItem.Name)
	}
	var (
		funcName   string
		funcParams interface{}
	)
	for k, v := range metricItem.Function {
		funcName = k
		funcParams = v
	}
	if funcParams == nil {
		return nil, fmt.Errorf("empty params for agg func: %s", funcName)
	}
	funcName = strings.ToLower(funcName)
	buf := util.MustToJSONBytes(funcParams)
	var generator Function
	switch funcName {
	case AggFuncRate:
		generator = &function.Rate{}
	case AggFuncLatency:
		generator = &function.Latency{}
	case AggFuncSumFuncValueInGroup:
		generator = &function.SumFuncValueInGroup{}
	case AggFuncRateSumFuncValueInGroup:
		generator = &function.RateSumFuncValueInGroup{}
	case AggFuncLatencySumFuncValueInGroup:
		generator = &function.LatencySumFuncValueInGroup{}
	default:
		baseParams := function.Base{}
		util.MustFromJSONBytes(buf, &baseParams)
		newMetricItem := &MetricItem{
			Name:      metricItem.Name,
			Field:     baseParams.Field,
			Statistic: funcName,
		}
		return generateAgg(newMetricItem, timeField)
	}
	util.MustFromJSONBytes(buf, &generator)
	return generator.GenerateAggregation(metricItem.Name)
}

func GenerateQuery(metric *Metric) (interface{}, error) {
	var timeBeforeGroup = metric.AutoTimeBeforeGroup()
	basicAggs := util.MapStr{}
	i := 0

	for _, metricItem := range metric.Items {
		if metricItem.Statistic == AggFuncPercentage {
			if len(metric.Groups) == 0 {
				return nil, fmt.Errorf("metric item %s with statistic %s requires at least one group", metricItem.Name, metricItem.Statistic)
			}
		}
	}
	for _, metricItem := range metric.Items {
		if metricItem.Name == "" {
			metricItem.Name = string(rune('a' + i))
		}
		var (
			metricAggs map[string]interface{}
			err        error
		)
		if metricItem.Function != nil {
			metricAggs, err = generateAggByFunction(&metricItem, metric.TimeField)
		} else {
			metricAggs, err = generateAgg(&metricItem, metric.TimeField)
		}
		if err != nil {
			return nil, err
		}
		if err := util.MergeFields(basicAggs, metricAggs, true); err != nil {
			return nil, err
		}
	}
	var (
		useDateHistogram     = false
		dateHistogramAgg     util.MapStr
		dateHistogramAggName string
	)
	if metric.BucketSize != "" && metric.TimeField != "" {
		useDateHistogram = true
		if metric.BucketSize == "auto" {
			dateHistogramAggName = "auto_date_histogram"
			buckets := metric.Buckets
			if buckets == 0 {
				buckets = 2
			}
			dateHistogramAgg = util.MapStr{
				"field":   metric.TimeField,
				"buckets": buckets,
			}
		} else {
			dateHistogramAggName = "date_histogram"
			verInfo := elastic.GetClient(metric.ClusterId).GetVersion()

			if verInfo.Number == "" {
				panic("invalid version")
			}

			intervalField, err := elastic.GetDateHistogramIntervalField(verInfo.Distribution, verInfo.Number, metric.BucketSize)
			if err != nil {
				return nil, fmt.Errorf("get interval field error: %w", err)
			}
			dateHistogramAgg = util.MapStr{
				"field":       metric.TimeField,
				intervalField: metric.BucketSize,
			}
		}
	}

	if useDateHistogram && !timeBeforeGroup {
		basicAggs = util.MapStr{
			"time_buckets": util.MapStr{
				dateHistogramAggName: dateHistogramAgg,
				"aggs":               basicAggs,
			},
		}
	}

	var rootAggs util.MapStr
	groups := metric.Groups
	err := metric.ValidateSortKey()
	if err != nil {
		return nil, err
	}

	if grpLength := len(groups); grpLength > 0 {
		var lastGroupAgg util.MapStr

		for i := grpLength - 1; i >= 0; i-- {
			limit := groups[i].Limit
			//top group 10
			if limit <= 0 {
				limit = 10
			}
			termsCfg := util.MapStr{
				"field": groups[i].Field,
				"size":  limit,
			}
			if i == grpLength-1 && len(metric.Sort) > 0 {
				//use bucket sort instead of terms order when time after group
				if metric.UseBucketSort() && len(metric.Sort) > 0 {
					sortKey := metric.Sort[0].Key
					if !timeBeforeGroup {
						sortKey = "sort_field"
						basicAggs[sortKey] = util.MapStr{
							"max_bucket": util.MapStr{
								"buckets_path": fmt.Sprintf("time_buckets>%s", metric.Sort[0].Key),
							},
						}
					}

					//using 65536 as a workaround for the terms aggregation limit; the actual limit is enforced in the bucket sort step
					termsCfg["size"] = 65536
					basicAggs["bucket_sorter"] = util.MapStr{
						"bucket_sort": util.MapStr{
							"size": limit,
							"sort": []util.MapStr{
								{sortKey: util.MapStr{"order": metric.Sort[0].Direction}},
							},
						},
					}
				} else {
					var termsOrder []interface{}
					percentAggs := []string{"p99", "p95", "p90", "p80", "p50"}
					for _, sortItem := range metric.Sort {
						var percent string
						for _, item := range metric.Items {
							lowerCaseStatistic := strings.ToLower(item.Statistic)
							if item.Name == sortItem.Key && util.StringInArray(percentAggs, lowerCaseStatistic) {
								percent = lowerCaseStatistic[1:]
							}
						}
						sortKey := sortItem.Key
						if percent != "" {
							sortKey = fmt.Sprintf("%s[%s]", sortItem.Key, percent)
						}
						termsOrder = append(termsOrder, util.MapStr{sortKey: sortItem.Direction})
					}
					if len(termsOrder) > 0 {
						termsCfg["order"] = termsOrder
					}
				}
			}
			groupAgg := util.MapStr{
				"terms": termsCfg,
			}
			groupID := util.GetUUID()
			if lastGroupAgg != nil {
				groupAgg["aggs"] = util.MapStr{
					groupID: lastGroupAgg,
				}
			} else {
				groupAgg["aggs"] = basicAggs
			}
			lastGroupAgg = groupAgg
		}
		if useDateHistogram && timeBeforeGroup {
			rootAggs = util.MapStr{
				"time_buckets": util.MapStr{
					dateHistogramAggName: dateHistogramAgg,
					"aggs": util.MapStr{
						util.GetUUID(): lastGroupAgg,
					},
				},
			}
		} else {
			rootAggs = util.MapStr{
				util.GetUUID(): lastGroupAgg,
			}
		}

	} else {
		if metric.BucketSize != "" && timeBeforeGroup {
			basicAggs = util.MapStr{
				"time_buckets": util.MapStr{
					dateHistogramAggName: dateHistogramAgg,
					"aggs":               basicAggs,
				},
			}
		}
		rootAggs = basicAggs
	}

	if metric.Filter != nil {
		rootAggs = util.MapStr{
			"filter_agg": util.MapStr{
				"filter": metric.Filter,
				"aggs":   rootAggs,
			},
		}
	}
	queryDsl := util.MapStr{
		"size": 0,
		"aggs": rootAggs,
	}
	if metric.TimeFilter != nil {
		queryDsl["query"] = metric.TimeFilter
	}

	return queryDsl, nil
}

// CollectMetricData collects metric data from the search result based on the metric definition.
// It processes the aggregations and returns a slice of MetricData along with the interval string.
func CollectMetricData(metric *Metric, searchResult map[string]interface{}) ([]MetricData, string) {
	var agg = searchResult["aggregations"]
	if metric.Filter != nil {
		if aggM, ok := agg.(map[string]interface{}); ok {
			agg = aggM["filter_agg"]
		}
	}
	// AutoTimeBeforeGroup determines if the metric should be grouped before or after the time bucket
	timeBeforeGroup := metric.AutoTimeBeforeGroup()
	metricData := []MetricData{}
	var interval string
	if timeBeforeGroup {
		interval = collectMetricDataOther(agg, nil, &metricData, nil, nil)
	} else {
		interval = collectMetricData(agg, nil, &metricData)
	}
	derivedAggs := metric.GetDerivedAggregations()
	for _, aggName := range derivedAggs {
		if aggregation, ok := GetDerivedAggregation(aggName); ok {
			if err := aggregation.Calculate(metric, searchResult, &metricData); err != nil {
				log.Errorf("calculate derived aggregation %s error: %v", aggName, err)
				return metricData, interval
			}
		}
	}
	if timeBeforeGroup && metric.TimeField != "" && metric.MergeDataByGroup {
		metricData = MergeGroupValues(metricData)
	}
	return metricData, interval
}

// timeBeforeGroup => false
func collectMetricData(agg interface{}, groups []MetricDataGroup, metricData *[]MetricData) (interval string) {
	if aggM, ok := agg.(map[string]interface{}); ok {
		if timeBks, ok := aggM["time_buckets"].(map[string]interface{}); ok {
			interval, _ = timeBks["interval"].(string)
			if bks, ok := timeBks["buckets"].([]interface{}); ok {
				md := MetricData{
					Data:   map[string][]MetricDataItem{},
					Groups: groups,
				}
				for _, bk := range bks {
					if bkM, ok := bk.(map[string]interface{}); ok {

						for k, v := range bkM {
							if k == "key" || k == "key_as_string" || k == "doc_count" {
								continue
							}

							if vm, ok := v.(map[string]interface{}); ok {
								collectMetricDataItem(k, vm, &md, bkM["key"], bkM["doc_count"], nil)
							}

						}
					}

				}
				*metricData = append(*metricData, md)
			}

		} else {
			md := MetricData{
				Data:   map[string][]MetricDataItem{},
				Groups: groups,
			}
			for k, v := range aggM {
				if k == "key" || k == "doc_count" {
					continue
				}
				if vm, ok := v.(map[string]interface{}); ok {
					if bks, ok := vm["buckets"].([]interface{}); ok {
						for _, bk := range bks {
							if bkVal, ok := bk.(map[string]interface{}); ok {
								var currentGroup = fmt.Sprintf("%v", bkVal["key"])
								newGroupValues := make([]MetricDataGroup, 0, len(groups)+1)
								newGroupValues = append(newGroupValues, groups...)
								newGroupValues = append(newGroupValues, MetricDataGroup{
									Value:    currentGroup,
									DocCount: uint32(bkVal["doc_count"].(float64)),
								})
								interval = collectMetricData(bk, newGroupValues, metricData)
							}
						}
					} else {
						//non time series metric data
						collectMetricDataItem(k, vm, &md, nil, nil, vm["doc_count"])
					}
				}
			}
			if len(md.Data) > 0 {
				*metricData = append(*metricData, md)
			}
		}
	}
	return
}

// timeBeforeGroup => true
func collectMetricDataOther(agg interface{}, groups []MetricDataGroup, metricData *[]MetricData, timeKey, timeBucketDocCount interface{}) (interval string) {
	if aggM, ok := agg.(map[string]interface{}); ok {
		if timeBks, ok := aggM["time_buckets"].(map[string]interface{}); ok {
			interval, _ = timeBks["interval"].(string)
			if bks, ok := timeBks["buckets"].([]interface{}); ok {
				md := MetricData{
					Data:   map[string][]MetricDataItem{},
					Groups: groups,
				}
				for _, bk := range bks {
					if bkM, ok := bk.(map[string]interface{}); ok {
						for k, v := range bkM {
							if k == "key" || k == "key_as_string" || k == "doc_count" {
								continue
							}
							if vm, ok := v.(map[string]interface{}); ok {
								if vm["buckets"] != nil {
									timeBucketDocCount = bkM["doc_count"]
									interval = collectMetricDataOther(vm, groups, metricData, bkM["key"], timeBucketDocCount)
								} else {
									collectMetricDataItem(k, vm, &md, bkM["key"], bkM["doc_count"], timeBucketDocCount)
								}
							}
						}
					}
				}
				if len(md.Data) > 0 {
					*metricData = append(*metricData, md)
				}
			}
		} else {
			md := MetricData{
				Data:   map[string][]MetricDataItem{},
				Groups: groups,
			}

			if bks, ok := aggM["buckets"].([]interface{}); ok {
				for _, bk := range bks {
					if bkVal, ok := bk.(map[string]interface{}); ok {
						currentGroup := util.ToString(bkVal["key"])
						if v := util.ToString(bkVal["key_as_string"]); v == "true" || v == "false" {
							currentGroup = v
						}
						newGroupValues := make([]MetricDataGroup, 0, len(groups)+1)
						newGroupValues = append(newGroupValues, groups...)
						newGroupValues = append(newGroupValues, MetricDataGroup{
							Value:    currentGroup,
							DocCount: uint32(bkVal["doc_count"].(float64)),
						})
						interval = collectMetricDataOther(bk, newGroupValues, metricData, timeKey, timeBucketDocCount)
					}
				}
			} else {
				//non time series metric data
				for k, v := range aggM {
					if vm, ok := v.(map[string]interface{}); ok {
						if vm["buckets"] != nil {
							interval = collectMetricDataOther(vm, groups, metricData, timeKey, timeBucketDocCount)
						} else {
							collectMetricDataItem(k, vm, &md, timeKey, timeBucketDocCount, aggM["doc_count"])
						}
					}
				}
			}

			if len(md.Data) > 0 {
				*metricData = append(*metricData, md)
			}
		}
	}
	return
}

func collectMetricDataItem(key string, vm map[string]interface{}, metricData *MetricData, timeKey, timeBucketDocCount, groupDocCount interface{}) {
	var timeBucketDocumentCunt uint32
	if dc, ok := timeBucketDocCount.(float64); ok {
		timeBucketDocumentCunt = uint32(dc)
	}
	var groupDocumentCunt uint32
	if dc, ok := groupDocCount.(float64); ok {
		groupDocumentCunt = uint32(dc)
	}
	if val, ok := vm["value"]; ok {
		metricData.Data[key] = append(metricData.Data[key], MetricDataItem{
			Value:              val,
			Timestamp:          timeKey,
			DocCount:           groupDocumentCunt,
			TimeBucketDocCount: timeBucketDocumentCunt,
		})
	} else if hits, ok := vm["hits"]; ok {
		if hits, ok := hits.(map[string]interface{}); ok {
			// statistic: top_hits
			if hits, ok := hits["hits"]; ok {
				if hits, ok := hits.([]interface{}); ok {
					for _, hit := range hits {
						if hit, ok := hit.(map[string]interface{}); ok {
							metricData.Data[key] = append(metricData.Data[key], MetricDataItem{
								Value:              extractSomeValue(hit["_source"]),
								Timestamp:          timeKey,
								DocCount:           groupDocumentCunt,
								TimeBucketDocCount: timeBucketDocumentCunt,
							})
						}
					}
				}
			}
		}
	} else {
		//percentiles agg type
		switch vm["values"].(type) {
		case []interface{}:
			for _, val := range vm["values"].([]interface{}) {
				if valM, ok := val.(map[string]interface{}); ok {
					metricData.Data[key] = append(metricData.Data[key], MetricDataItem{
						Value:              valM["value"],
						Timestamp:          timeKey,
						DocCount:           groupDocumentCunt,
						TimeBucketDocCount: timeBucketDocumentCunt,
					})
				}
				break
			}
		case map[string]interface{}:
			for _, val = range vm["values"].(map[string]interface{}) {
				metricData.Data[key] = append(metricData.Data[key], MetricDataItem{
					Value:              val,
					Timestamp:          timeKey,
					DocCount:           groupDocumentCunt,
					TimeBucketDocCount: timeBucketDocumentCunt,
				})
				break
			}
		}
	}
}

func extractSomeValue(v interface{}) interface{} {
	if vm, ok := v.(map[string]interface{}); ok {
		for _, v := range vm {
			return extractSomeValue(v)
		}
		return nil
	}
	return v
}

func MergeGroupValues(metricData []MetricData) []MetricData {
	// skip if no data or no groups, in this case, metricData is already merged
	if len(metricData) == 0 || len(metricData[0].Groups) == 0 {
		return metricData
	}
	grpMd := map[string]MetricData{}
	for _, md := range metricData {
		if len(md.Groups) == 0 {
			continue
		}
		groupValues := make([]string, 0, len(md.Groups))
		for _, group := range md.Groups {
			groupValues = append(groupValues, group.Value)
		}
		groupKey := strings.Join(groupValues, "|")
		if existingMd, ok := grpMd[groupKey]; ok {
			for k, v := range md.Data {
				if existingItems, exists := existingMd.Data[k]; exists {
					// Merge items with the same key
					existingMd.Data[k] = append(existingItems, v...)
				} else {
					// Add new key with its items
					existingMd.Data[k] = v
				}
			}
		} else {
			grpMd[groupKey] = md
		}
	}
	// sort the merged metric data by timestamp
	for _, md := range grpMd {
		if len(md.Data) > 0 {
			for _, items := range md.Data {
				sort.Slice(items, func(i, j int) bool {
					if items[i].Timestamp == nil || items[j].Timestamp == nil {
						return false
					}
					return items[i].Timestamp.(float64) < items[j].Timestamp.(float64)
				})
			}
		}
	}
	// Convert map to slice
	mergedMetricData := make([]MetricData, 0, len(grpMd))
	for _, md := range grpMd {
		mergedMetricData = append(mergedMetricData, md)
	}
	return mergedMetricData
}
