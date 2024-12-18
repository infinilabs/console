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
	"strconv"
	"strings"

	"infini.sh/framework/core/elastic"
	"infini.sh/console/model/insight"
	"infini.sh/framework/core/util"
)

func generateAgg(metricItem *insight.MetricItem, timeField string) map[string]interface{} {
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
	case "max", "min", "sum", "avg", "cardinality":
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
	case "latest":
		aggType = "top_hits"
	}
	aggValue := util.MapStr{}
	if aggType != "top_hits" {
		aggValue["field"] = field
	} else {
		aggValue["_source"] = util.MapStr{
			"includes": []string{field},
		}
		aggValue["sort"] = []util.MapStr{
			util.MapStr{
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

func GenerateQuery(metric *insight.Metric) (interface{}, error) {
	var timeBeforeGroup = metric.AutoTimeBeforeGroup()
	basicAggs := util.MapStr{}
	i := 0
	for _, metricItem := range metric.Items {
		if metricItem.Name == "" {
			metricItem.Name = string('a' + i)
		}
		metricAggs := generateAgg(&metricItem, metric.TimeField)
		if err := util.MergeFields(basicAggs, metricAggs, true); err != nil {
			return nil, err
		}
	}
	verInfo := elastic.GetClient(metric.ClusterId).GetVersion()

	if verInfo.Number == "" {
		panic("invalid version")
	}

	intervalField, err := elastic.GetDateHistogramIntervalField(verInfo.Distribution, verInfo.Number, metric.BucketSize)
	if err != nil {
		return nil, fmt.Errorf("get interval field error: %w", err)
	}
	if metric.BucketSize != "" && !timeBeforeGroup {
		basicAggs = util.MapStr{
			"time_buckets": util.MapStr{
				"date_histogram": util.MapStr{
					"field":       metric.TimeField,
					intervalField: metric.BucketSize,
				},
				"aggs": basicAggs,
			},
		}
	}

	var rootAggs util.MapStr
	groups := metric.Groups
	err = metric.ValidateSortKey()
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
			if i == grpLength - 1 && len(metric.Sort) > 0 {
				var termsOrder []interface{}
				for _, sortItem := range metric.Sort {
					termsOrder = append(termsOrder, util.MapStr{sortItem.Key: sortItem.Direction})
				}
				termsCfg["order"] = termsOrder
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
		if metric.BucketSize == "" || (metric.BucketSize != "" && !timeBeforeGroup) {
			rootAggs = util.MapStr{
				util.GetUUID(): lastGroupAgg,
			}
		} else {
			rootAggs = util.MapStr{
				"time_buckets": util.MapStr{
					"date_histogram": util.MapStr{
						"field":       metric.TimeField,
						intervalField: metric.BucketSize,
					},
					"aggs": util.MapStr{
						util.GetUUID(): lastGroupAgg,
					},
				},
			}
		}

	} else {
		if metric.BucketSize != "" && timeBeforeGroup {
			basicAggs = util.MapStr{
				"time_buckets": util.MapStr{
					"date_histogram": util.MapStr{
						"field":       metric.TimeField,
						intervalField: metric.BucketSize,
					},
					"aggs": basicAggs,
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

func CollectMetricData(agg interface{}, timeBeforeGroup bool) []insight.MetricData {
	metricData := []insight.MetricData{}
	if timeBeforeGroup {
		collectMetricDataOther(agg, nil, &metricData, nil)
	} else {
		collectMetricData(agg, nil, &metricData)
	}
	return metricData
}

// timeBeforeGroup => false
func collectMetricData(agg interface{}, groupValues []string, metricData *[]insight.MetricData) {
	if aggM, ok := agg.(map[string]interface{}); ok {
		if timeBks, ok := aggM["time_buckets"].(map[string]interface{}); ok {
			if bks, ok := timeBks["buckets"].([]interface{}); ok {
				md := insight.MetricData{
					Data:  map[string][]insight.MetricDataItem{},
					Groups: groupValues,
				}
				for _, bk := range bks {
					if bkM, ok := bk.(map[string]interface{}); ok {

						for k, v := range bkM {
							if k == "key" || k == "key_as_string" || k == "doc_count" {
								continue
							}

							if vm, ok := v.(map[string]interface{}); ok && len(k) < 5 {
								collectMetricDataItem(k, vm, &md, bkM["key"])
							}

						}
					}

				}
				*metricData = append(*metricData, md)
			}

		} else {
			md := insight.MetricData{
				Data:  map[string][]insight.MetricDataItem{},
				Groups: groupValues,
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
								newGroupValues := make([]string, 0, len(groupValues)+1)
								newGroupValues = append(newGroupValues, groupValues...)
								newGroupValues = append(newGroupValues, currentGroup)
								collectMetricData(bk, newGroupValues, metricData)
							}
						}
					} else {
						//non time series metric data
						if len(k) < 5 {
							collectMetricDataItem(k, vm, &md, nil)
						}
					}
				}
			}
			if len(md.Data) > 0 {
				*metricData = append(*metricData, md)
			}
		}
	}
}

// timeBeforeGroup => true
func collectMetricDataOther(agg interface{}, groupValues []string, metricData *[]insight.MetricData, timeKey interface{}) {
	if aggM, ok := agg.(map[string]interface{}); ok {
		if timeBks, ok := aggM["time_buckets"].(map[string]interface{}); ok {
			if bks, ok := timeBks["buckets"].([]interface{}); ok {
				md := insight.MetricData{
					Data:  map[string][]insight.MetricDataItem{},
					Groups: groupValues,
				}
				for _, bk := range bks {
					if bkM, ok := bk.(map[string]interface{}); ok {
						for k, v := range bkM {
							if k == "key" || k == "key_as_string" || k == "doc_count" {
								continue
							}
							if vm, ok := v.(map[string]interface{}); ok {
								if vm["buckets"] != nil {
									collectMetricDataOther(vm, groupValues, metricData, bkM["key"])
								} else {
									collectMetricDataItem(k, vm, &md, bkM["key"])
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
			md := insight.MetricData{
				Data:  map[string][]insight.MetricDataItem{},
				Groups: groupValues,
			}

			if bks, ok := aggM["buckets"].([]interface{}); ok {
				for _, bk := range bks {
					if bkVal, ok := bk.(map[string]interface{}); ok {
						currentGroup := util.ToString(bkVal["key"])
						if v := util.ToString(bkVal["key_as_string"]); v == "true" || v == "false" {
							currentGroup = v
						}
						newGroupValues := make([]string, 0, len(groupValues)+1)
						newGroupValues = append(newGroupValues, groupValues...)
						newGroupValues = append(newGroupValues, currentGroup)
						collectMetricDataOther(bk, newGroupValues, metricData, timeKey)
					}
				}
			} else {
				//non time series metric data
				for k, v := range aggM {
					if vm, ok := v.(map[string]interface{}); ok {
						if vm["buckets"] != nil {
							collectMetricDataOther(vm, groupValues, metricData, timeKey)
						} else {
							collectMetricDataItem(k, vm, &md, timeKey)
						}
					}
				}
			}

			if len(md.Data) > 0 {
				*metricData = append(*metricData, md)
			}
		}
	}
}

func collectMetricDataItem(key string, vm map[string]interface{}, metricData *insight.MetricData, timeKey interface{}) {
	if val, ok := vm["value"]; ok {
		metricData.Data[key] = append(metricData.Data[key], insight.MetricDataItem{
			Value:     val,
			Timestamp: timeKey,
		})
	} else if hits, ok := vm["hits"]; ok {
		if hits, ok := hits.(map[string]interface{}); ok {
			// statistic: top_hits
			if hits, ok := hits["hits"]; ok {
				if hits, ok := hits.([]interface{}); ok {
					for _, hit := range hits {
						if hit, ok := hit.(map[string]interface{}); ok {
							metricData.Data[key] = append(metricData.Data[key], insight.MetricDataItem{
								Value:     extractSomeValue(hit["_source"]),
								Timestamp: timeKey,
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
					metricData.Data[key] = append(metricData.Data[key], insight.MetricDataItem{
						Value:     valM["value"],
						Timestamp: timeKey,
					})
				}
				break
			}
		case map[string]interface{}:
			for _, val = range vm["values"].(map[string]interface{}) {
				metricData.Data[key] = append(metricData.Data[key], insight.MetricDataItem{
					Value:     val,
					Timestamp: timeKey,
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
