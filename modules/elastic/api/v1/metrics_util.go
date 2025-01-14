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

package v1

import (
	"context"
	"fmt"
	"infini.sh/framework/core/env"
	"net/http"
	"strings"
	"time"

	log "github.com/cihub/seelog"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
)

func newMetricItem(metricKey string, order int, group string) *common.MetricItem {
	metricItem := common.MetricItem{
		Order: order,
		Key:   metricKey,
		Group: group,
	}

	//axis
	metricItem.Axis = []*common.MetricAxis{}

	//lines
	metricItem.Lines = []*common.MetricLine{}

	return &metricItem
}

type GroupMetricItem struct {
	Key          string
	Field        string
	ID           string
	IsDerivative bool
	Units        string
	FormatType   string
	MetricItem   *common.MetricItem
	Field2       string
	Calc         func(value, value2 float64) float64
}

type TreeMapNode struct {
	Name     string         `json:"name"`
	Value    float64        `json:"value,omitempty"`
	Children []*TreeMapNode `json:"children,omitempty"`
	SubKeys  map[string]int `json:"-"`
}

type MetricData map[string][][]interface{}

func generateGroupAggs(nodeMetricItems []GroupMetricItem) map[string]interface{} {
	aggs := map[string]interface{}{}

	for _, metricItem := range nodeMetricItems {
		aggs[metricItem.ID] = util.MapStr{
			"max": util.MapStr{
				"field": metricItem.Field,
			},
		}
		if metricItem.Field2 != "" {
			aggs[metricItem.ID+"_field2"] = util.MapStr{
				"max": util.MapStr{
					"field": metricItem.Field2,
				},
			}
		}

		if metricItem.IsDerivative {
			aggs[metricItem.ID+"_deriv"] = util.MapStr{
				"derivative": util.MapStr{
					"buckets_path": metricItem.ID,
				},
			}
			if metricItem.Field2 != "" {
				aggs[metricItem.ID+"_deriv_field2"] = util.MapStr{
					"derivative": util.MapStr{
						"buckets_path": metricItem.ID + "_field2",
					},
				}
			}
		}
	}
	return aggs
}

func (h *APIHandler) getMetrics(ctx context.Context, query map[string]interface{}, grpMetricItems []GroupMetricItem, bucketSize int) (map[string]*common.MetricItem, error) {
	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	queryDSL := util.MustToJSONBytes(query)
	response, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).QueryDSL(ctx, getAllMetricsIndex(), nil, queryDSL)
	if err != nil {
		return nil, err
	}
	grpMetricItemsIndex := map[string]int{}
	for i, item := range grpMetricItems {
		grpMetricItemsIndex[item.ID] = i
	}
	grpMetricData := map[string]MetricData{}

	var minDate, maxDate int64
	if response.StatusCode == 200 {
		if nodeAgg, ok := response.Aggregations["group_by_level"]; ok {
			for _, bucket := range nodeAgg.Buckets {
				grpKey := bucket["key"].(string)
				for _, metricItem := range grpMetricItems {
					metricItem.MetricItem.AddLine(metricItem.Key, grpKey, "", "group1", metricItem.Field, "max", bucketSizeStr, metricItem.Units, metricItem.FormatType, "0.[00]", "0.[00]", false, false)
					dataKey := metricItem.ID
					if metricItem.IsDerivative {
						dataKey = dataKey + "_deriv"
					}
					if _, ok := grpMetricData[dataKey]; !ok {
						grpMetricData[dataKey] = map[string][][]interface{}{}
					}
					grpMetricData[dataKey][grpKey] = [][]interface{}{}
				}
				if datesAgg, ok := bucket["dates"].(map[string]interface{}); ok {
					if datesBuckets, ok := datesAgg["buckets"].([]interface{}); ok {
						for _, dateBucket := range datesBuckets {
							if bucketMap, ok := dateBucket.(map[string]interface{}); ok {
								v, ok := bucketMap["key"].(float64)
								if !ok {
									panic("invalid bucket key")
								}
								dateTime := (int64(v))
								minDate = util.MinInt64(minDate, dateTime)
								maxDate = util.MaxInt64(maxDate, dateTime)

								for mk1, mv1 := range grpMetricData {
									v1, ok := bucketMap[mk1]
									if ok {
										v2, ok := v1.(map[string]interface{})
										if ok {
											v3, ok := v2["value"].(float64)
											if ok {
												metricID := mk1
												if strings.HasSuffix(mk1, "_deriv") {
													metricID = strings.TrimSuffix(mk1, "_deriv")
													if _, ok := bucketMap[mk1+"_field2"]; !ok {
														v3 = v3 / float64(bucketSize)
													}
												}
												if field2, ok := bucketMap[mk1+"_field2"]; ok {
													if idx, ok := grpMetricItemsIndex[metricID]; ok {
														if field2Map, ok := field2.(map[string]interface{}); ok {
															v4 := field2Map["value"].(float64)
															if v4 == 0 {
																v3 = 0
															} else {
																v3 = grpMetricItems[idx].Calc(v3, v4)
															}
														}
													}
												}
												if v3 < 0 {
													continue
												}
												points := []interface{}{dateTime, v3}
												mv1[grpKey] = append(mv1[grpKey], points)
											}
										}
									}
								}
							}
						}
					}

				}
			}
		}
	}

	result := map[string]*common.MetricItem{}

	hitsTotal := response.GetTotal()
	for _, metricItem := range grpMetricItems {
		for _, line := range metricItem.MetricItem.Lines {
			line.TimeRange = common.TimeRange{Min: minDate, Max: maxDate}
			dataKey := metricItem.ID
			if metricItem.IsDerivative {
				dataKey = dataKey + "_deriv"
			}
			line.Data = grpMetricData[dataKey][line.Metric.Label]
		}
		metricItem.MetricItem.Request = string(queryDSL)
		metricItem.MetricItem.HitsTotal = hitsTotal
		result[metricItem.Key] = metricItem.MetricItem
	}
	return result, nil
}

func GetMinBucketSize() int {
	metricsCfg := struct {
		MinBucketSizeInSeconds int `config:"min_bucket_size_in_seconds"`
	}{
		MinBucketSizeInSeconds: 20,
	}
	_, _ = env.ParseConfig("insight", &metricsCfg)
	if metricsCfg.MinBucketSizeInSeconds < 20 {
		metricsCfg.MinBucketSizeInSeconds = 20
	}
	return metricsCfg.MinBucketSizeInSeconds
}

const (
	MetricTypeClusterHealth = "cluster_health"
	MetricTypeClusterStats  = "cluster_stats"
	MetricTypeNodeStats     = "node_stats"
	MetricTypeIndexStats    = "index_stats"
)

// GetMetricMinBucketSize returns twice the metrics collection interval based on the cluster ID and metric type
func GetMetricMinBucketSize(clusterID, metricType string) (int, error) {
	meta := elastic.GetMetadata(clusterID)
	if meta == nil {
		return 0, fmt.Errorf("got empty metadata for cluster: %s", clusterID)
	}
	var interval string
	switch metricType {
	case MetricTypeClusterHealth:
		if meta.Config.MonitorConfigs != nil {
			interval = meta.Config.MonitorConfigs.ClusterHealth.Interval
		}
	case MetricTypeClusterStats:
		if meta.Config.MonitorConfigs != nil {
			interval = meta.Config.MonitorConfigs.ClusterStats.Interval
		}
	case MetricTypeNodeStats:
		if meta.Config.MonitorConfigs != nil {
			interval = meta.Config.MonitorConfigs.NodeStats.Interval
		}
	case MetricTypeIndexStats:
		if meta.Config.MonitorConfigs != nil {
			interval = meta.Config.MonitorConfigs.IndexStats.Interval
		}
	default:
		return 0, fmt.Errorf("invalid metric name: %s", metricType)
	}
	if interval != "" {
		du, err := util.ParseDuration(interval)
		if err != nil {
			return 0, err
		}
		return int(du.Seconds()) * 2, nil
	}
	// default to 20 seconds
	return 20, nil
}

// defaultBucketSize 也就是每次聚合的时间间隔
func (h *APIHandler) GetMetricRangeAndBucketSize(req *http.Request, clusterID, metricType string, defaultMetricCount int) (int, int64, int64, error) {
	if defaultMetricCount <= 0 {
		defaultMetricCount = 15 * 60
	}
	bucketSize := 0

	bucketSizeStr := h.GetParameterOrDefault(req, "bucket_size", "") //默认 10，每个 bucket 的时间范围，单位秒
	if bucketSizeStr != "" {
		du, err := util.ParseDuration(bucketSizeStr)
		if err != nil {
			return 0, 0, 0, err
		}
		bucketSize = int(du.Seconds())
	}
	metricCount := h.GetIntOrDefault(req, "metric_count", defaultMetricCount) //默认 15分钟的区间，每分钟15个指标，也就是 15*6 个 bucket //90
	//min,max are unix nanoseconds

	minStr := h.Get(req, "min", "")
	maxStr := h.Get(req, "max", "")
	var (
		minBucketSize = 0
		err           error
	)
	//clusterID may be empty when querying host metrics
	if clusterID != "" {
		minBucketSize, err = GetMetricMinBucketSize(clusterID, metricType)
		if err != nil {
			return 0, 0, 0, fmt.Errorf("failed to get min bucket size for cluster [%s]:%w", clusterID, err)
		}
	} else {
		//default to 20
		minBucketSize = 20
	}

	return GetMetricRangeAndBucketSize(minStr, maxStr, bucketSize, metricCount, minBucketSize)
}

func GetMetricRangeAndBucketSize(minStr string, maxStr string, bucketSize int, metricCount int, minBucketSize int) (int, int64, int64, error) {
	var min, max int64
	var rangeFrom, rangeTo time.Time
	var err error
	var useMinMax = bucketSize == 0
	now := time.Now()
	if minStr == "" {
		rangeFrom = now.Add(-time.Second * time.Duration(bucketSize*metricCount+1))
	} else {
		//try 2021-08-21T14:06:04.818Z
		rangeFrom, err = util.ParseStandardTime(minStr)
		if err != nil {
			//try 1629637500000
			v, err := util.ToInt64(minStr)
			if err != nil {
				log.Error("invalid timestamp:", minStr, err)
				rangeFrom = now.Add(-time.Second * time.Duration(bucketSize*metricCount+1))
			} else {
				rangeFrom = util.FromUnixTimestamp(v / 1000)
			}
		}
	}

	if maxStr == "" {
		rangeTo = now.Add(-time.Second * time.Duration(int(1*(float64(bucketSize)))))
	} else {
		rangeTo, err = util.ParseStandardTime(maxStr)
		if err != nil {
			v, err := util.ToInt64(maxStr)
			if err != nil {
				log.Error("invalid timestamp:", maxStr, err)
				rangeTo = now.Add(-time.Second * time.Duration(int(1*(float64(bucketSize)))))
			} else {
				rangeTo = util.FromUnixTimestamp(int64(v) / 1000)
			}
		}
	}

	min = rangeFrom.UnixNano() / 1e6
	max = rangeTo.UnixNano() / 1e6
	hours := rangeTo.Sub(rangeFrom).Hours()

	if useMinMax {

		if hours <= 0.25 {
			bucketSize = GetMinBucketSize()
		} else if hours <= 0.5 {
			bucketSize = 30
		} else if hours <= 2 {
			bucketSize = 60
		} else if hours < 3 {
			bucketSize = 90
		} else if hours < 6 {
			bucketSize = 120
		} else if hours < 12 {
			bucketSize = 60 * 3
		} else if hours < 25 { //1day
			bucketSize = 60 * 5 * 2
		} else if hours <= 7*24+1 { //7days
			bucketSize = 60 * 15 * 2
		} else if hours <= 15*24+1 { //15days
			bucketSize = 60 * 30 * 2
		} else if hours < 30*24+1 { //<30 days
			bucketSize = 60 * 60 //hourly
		} else if hours <= 30*24+1 { //<30days
			bucketSize = 12 * 60 * 60 //half daily
		} else if hours >= 30*24+1 { //>30days
			bucketSize = 60 * 60 * 24 //daily bucket
		}
		if bucketSize < minBucketSize {
			bucketSize = minBucketSize
		}
	}

	return bucketSize, min, max, nil
}

// 获取单个指标，可以包含多条曲线
func (h *APIHandler) getSingleMetrics(ctx context.Context, metricItems []*common.MetricItem, query map[string]interface{}, bucketSize int) (map[string]*common.MetricItem, error) {
	metricData := map[string][][]interface{}{}

	aggs := map[string]interface{}{}
	metricItemsMap := map[string]*common.MetricLine{}

	for _, metricItem := range metricItems {
		for _, line := range metricItem.Lines {
			metricItemsMap[line.Metric.GetDataKey()] = line
			metricData[line.Metric.GetDataKey()] = [][]interface{}{}

			aggs[line.Metric.ID] = util.MapStr{
				line.Metric.MetricAgg: util.MapStr{
					"field": line.Metric.Field,
				},
			}
			if line.Metric.Field2 != "" {
				aggs[line.Metric.ID+"_field2"] = util.MapStr{
					line.Metric.MetricAgg: util.MapStr{
						"field": line.Metric.Field2,
					},
				}
			}

			if line.Metric.IsDerivative {
				//add which metric keys to extract
				aggs[line.Metric.ID+"_deriv"] = util.MapStr{
					"derivative": util.MapStr{
						"buckets_path": line.Metric.ID,
					},
				}
				if line.Metric.Field2 != "" {
					aggs[line.Metric.ID+"_deriv_field2"] = util.MapStr{
						"derivative": util.MapStr{
							"buckets_path": line.Metric.ID + "_field2",
						},
					}
				}
			}
		}
	}
	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)

	clusterID := global.MustLookupString(elastic.GlobalSystemElasticsearchID)
	intervalField, err := getDateHistogramIntervalField(clusterID, bucketSizeStr)
	if err != nil {
		return nil, err
	}
	query["size"] = 0
	query["aggs"] = util.MapStr{
		"dates": util.MapStr{
			"date_histogram": util.MapStr{
				"field":       "timestamp",
				intervalField: bucketSizeStr,
			},
			"aggs": aggs,
		},
	}
	queryDSL := util.MustToJSONBytes(query)
	response, err := elastic.GetClient(clusterID).QueryDSL(ctx, getAllMetricsIndex(), nil, queryDSL)
	if err != nil {
		return nil, err
	}

	var minDate, maxDate int64
	if response.StatusCode == 200 {
		for _, v := range response.Aggregations {
			for _, bucket := range v.Buckets {
				v, ok := bucket["key"].(float64)
				if !ok {
					panic("invalid bucket key")
				}
				dateTime := (int64(v))
				minDate = util.MinInt64(minDate, dateTime)
				maxDate = util.MaxInt64(maxDate, dateTime)
				for mk1, mv1 := range metricData {
					v1, ok := bucket[mk1]
					if ok {
						v2, ok := v1.(map[string]interface{})
						if ok {
							v3, ok := v2["value"].(float64)
							if ok {
								if strings.HasSuffix(mk1, "_deriv") {
									if _, ok := bucket[mk1+"_field2"]; !ok {
										v3 = v3 / float64(bucketSize)
									}
								}
								if field2, ok := bucket[mk1+"_field2"]; ok {
									if line, ok := metricItemsMap[mk1]; ok {
										if field2Map, ok := field2.(map[string]interface{}); ok {
											v4 := field2Map["value"].(float64)
											if v4 == 0 {
												v3 = 0
											} else {
												v3 = line.Metric.Calc(v3, v4)
											}
										}
									}
								}
								if v3 < 0 {
									continue
								}
								points := []interface{}{dateTime, v3}
								metricData[mk1] = append(mv1, points)
							}

						}
					}
				}
			}
		}
	}

	result := map[string]*common.MetricItem{}

	hitsTotal := response.GetTotal()
	for _, metricItem := range metricItems {
		for _, line := range metricItem.Lines {
			line.TimeRange = common.TimeRange{Min: minDate, Max: maxDate}
			line.Data = metricData[line.Metric.GetDataKey()]
		}
		metricItem.Request = string(queryDSL)
		metricItem.HitsTotal = hitsTotal
		result[metricItem.Key] = metricItem
	}

	return result, nil
}

//func (h *APIHandler) executeQuery(query map[string]interface{}, bucketItems *[]common.BucketItem, bucketSize int) map[string]*common.MetricItem {
//	response, err := elastic.GetClient(h.Config.Elasticsearch).SearchWithRawQueryDSL(getAllMetricsIndex(), util.MustToJSONBytes(query))
//
//}

func (h *APIHandler) getBucketMetrics(query map[string]interface{}, bucketItems *[]common.BucketItem, bucketSize int) map[string]*common.MetricItem {
	//bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	response, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).SearchWithRawQueryDSL(getAllMetricsIndex(), util.MustToJSONBytes(query))
	if err != nil {
		log.Error(err)
		panic(err)
	}
	//grpMetricItemsIndex := map[string]int{}
	for _, item := range *bucketItems {
		//grpMetricItemsIndex[item.Key] = i

		agg, ok := response.Aggregations[item.Key]
		if ok {
			fmt.Println(len(agg.Buckets))
		}

	}
	//grpMetricData := map[string]MetricData{}

	//var minDate, maxDate int64
	//if response.StatusCode == 200 {
	//	if nodeAgg, ok := response.Aggregations["group_by_level"]; ok {
	//		for _, bucket := range nodeAgg.Buckets {
	//			grpKey := bucket["key"].(string)
	//			for _, metricItem := range *bucketItems {
	//				metricItem.MetricItem.AddLine(metricItem.Key, grpKey, "", "group1", metricItem.Field, "max", bucketSizeStr, metricItem.Units, metricItem.FormatType, "0.[00]", "0.[00]", false, false)
	//				dataKey := metricItem.Key
	//				if metricItem.IsDerivative {
	//					dataKey = dataKey + "_deriv"
	//				}
	//				if _, ok := grpMetricData[dataKey]; !ok {
	//					grpMetricData[dataKey] = map[string][][]interface{}{}
	//				}
	//				grpMetricData[dataKey][grpKey] = [][]interface{}{}
	//			}
	//			if datesAgg, ok := bucket["dates"].(map[string]interface{}); ok {
	//				if datesBuckets, ok := datesAgg["buckets"].([]interface{}); ok {
	//					for _, dateBucket := range datesBuckets {
	//						if bucketMap, ok := dateBucket.(map[string]interface{}); ok {
	//							v, ok := bucketMap["key"].(float64)
	//							if !ok {
	//								panic("invalid bucket key")
	//							}
	//							dateTime := (int64(v))
	//							minDate = util.MinInt64(minDate, dateTime)
	//							maxDate = util.MaxInt64(maxDate, dateTime)
	//
	//							for mk1, mv1 := range grpMetricData {
	//								v1, ok := bucketMap[mk1]
	//								if ok {
	//									v2, ok := v1.(map[string]interface{})
	//									if ok {
	//										v3, ok := v2["value"].(float64)
	//										if ok {
	//											if strings.HasSuffix(mk1, "_deriv") {
	//												v3 = v3 / float64(bucketSize)
	//											}
	//											if field2, ok := bucketMap[mk1+"_field2"]; ok {
	//												if idx, ok := grpMetricItemsIndex[mk1]; ok {
	//													if field2Map, ok := field2.(map[string]interface{}); ok {
	//														v3 = grpMetricItems[idx].Calc(v3, field2Map["value"].(float64))
	//													}
	//												}
	//											}
	//											if v3 < 0 {
	//												continue
	//											}
	//											points := []interface{}{dateTime, v3}
	//											mv1[grpKey] = append(mv1[grpKey], points)
	//										}
	//									}
	//								}
	//							}
	//						}
	//					}
	//				}
	//
	//			}
	//		}
	//	}
	//}
	//
	//result := map[string]*common.MetricItem{}
	//
	//for _, metricItem := range grpMetricItems {
	//	for _, line := range metricItem.MetricItem.Lines {
	//		line.TimeRange = common.TimeRange{Min: minDate, Max: maxDate}
	//		dataKey := metricItem.ID
	//		if metricItem.IsDerivative {
	//			dataKey = dataKey + "_deriv"
	//		}
	//		line.Data = grpMetricData[dataKey][line.ElasticsearchMetric.Label]
	//	}
	//	result[metricItem.Key] = metricItem.MetricItem
	//}
	return nil
}

func ConvertMetricItemsToAggQuery(metricItems []*common.MetricItem) map[string]interface{} {
	aggs := map[string]interface{}{}
	for _, metricItem := range metricItems {
		for _, line := range metricItem.Lines {
			aggs[line.Metric.ID] = util.MapStr{
				"max": util.MapStr{
					"field": line.Metric.Field,
				},
			}
			if line.Metric.IsDerivative {
				//add which metric keys to extract
				aggs[line.Metric.ID+"_deriv"] = util.MapStr{
					"derivative": util.MapStr{
						"buckets_path": line.Metric.ID,
					},
				}
			}
		}
	}
	return aggs
}

func ConvertBucketItemsToAggQuery(bucketItems []*common.BucketItem, metricItems []*common.MetricItem) util.MapStr {
	aggs := util.MapStr{}

	var currentAgg = util.MapStr{}
	for _, bucketItem := range bucketItems {

		bucketAgg := util.MapStr{}

		switch bucketItem.Type {
		case "terms":
			bucketAgg = util.MapStr{
				"terms": bucketItem.Parameters,
			}
			break
		case "date_histogram":
			bucketAgg = util.MapStr{
				"date_histogram": bucketItem.Parameters,
			}
			break
		case "date_range":
			bucketAgg = util.MapStr{
				"date_range": bucketItem.Parameters,
			}
			break
		}

		//if bucketItem.Buckets!=nil&&len(bucketItem.Buckets)>0{
		nestedAggs := ConvertBucketItemsToAggQuery(bucketItem.Buckets, bucketItem.Metrics)
		if len(nestedAggs) > 0 {
			util.MergeFields(bucketAgg, nestedAggs, true)
		}
		//}
		currentAgg[bucketItem.Key] = bucketAgg
	}

	if metricItems != nil && len(metricItems) > 0 {
		metricAggs := ConvertMetricItemsToAggQuery(metricItems)
		util.MergeFields(currentAgg, metricAggs, true)
	}

	aggs = util.MapStr{
		"aggs": currentAgg,
	}

	return aggs
}

type BucketBase map[string]interface{}

func (receiver BucketBase) GetChildBucket(name string) (map[string]interface{}, bool) {
	bks, ok := receiver[name]
	if ok {
		bks2, ok := bks.(map[string]interface{})
		return bks2, ok
	}
	return nil, false
}

type Bucket struct {
	BucketBase //子 buckets

	KeyAsString             string      `json:"key_as_string,omitempty"`
	Key                     interface{} `json:"key,omitempty"`
	DocCount                int64       `json:"doc_count,omitempty"`
	DocCountErrorUpperBound int64       `json:"doc_count_error_upper_bound,omitempty"`
	SumOtherDocCount        int64       `json:"sum_other_doc_count,omitempty"`

	Buckets []Bucket `json:"buckets,omitempty"` //本 buckets
}

type SearchResponse struct {
	Took     int  `json:"took"`
	TimedOut bool `json:"timed_out"`
	Hits     struct {
		Total    interface{} `json:"total"`
		MaxScore float32     `json:"max_score"`
	} `json:"hits"`
	Aggregations util.MapStr `json:"aggregations,omitempty"`
}

func ParseAggregationBucketResult(bucketSize int, aggsData util.MapStr, groupKey, resultLabelKey, resultValueKey string, resultItemHandle func()) MetricData {

	metricData := MetricData{}
	for k, v := range aggsData {
		if k == groupKey {
			//start to collect metric for each bucket
			objcs, ok := v.(map[string]interface{})
			if ok {

				bks, ok := objcs["buckets"].([]interface{})
				if ok {
					for _, bk := range bks {
						//check each bucket, collecting metrics
						bkMap, ok := bk.(map[string]interface{})
						if ok {

							groupKeyValue, ok := bkMap["key"]
							if ok {
							}
							bkHitMap, ok := bkMap[resultLabelKey]
							if ok {
								//hit label, 说明匹配到时间范围了
								labelMap, ok := bkHitMap.(map[string]interface{})
								if ok {
									labelBks, ok := labelMap["buckets"]
									if ok {
										labelBksMap, ok := labelBks.([]interface{})
										if ok {
											for _, labelItem := range labelBksMap {
												metrics, ok := labelItem.(map[string]interface{})

												labelKeyValue, ok := metrics["to"] //TODO config
												if !ok {
													labelKeyValue, ok = metrics["from"] //TODO config
												}
												if !ok {
													labelKeyValue, ok = metrics["key"] //TODO config
												}

												metric, ok := metrics[resultValueKey]
												if ok {
													metricMap, ok := metric.(map[string]interface{})
													if ok {
														t := "bucket" //metric, bucket
														if t == "metric" {
															metricValue, ok := metricMap["value"]
															if ok {
																saveMetric(&metricData, groupKeyValue.(string), labelKeyValue, metricValue, bucketSize)
																continue
															}
														} else {
															metricValue, ok := metricMap["buckets"]
															if ok {
																buckets, ok := metricValue.([]interface{})
																if ok {
																	var result string = "unavailable"
																	for _, v := range buckets {
																		x, ok := v.(map[string]interface{})
																		if ok {
																			if x["key"] == "red" {
																				result = "red"
																				break
																			}
																			if x["key"] == "yellow" {
																				result = "yellow"
																			} else {
																				if result != "yellow" {
																					result = x["key"].(string)
																				}
																			}
																		}
																	}

																	v, ok := (metricData)[groupKeyValue.(string)]
																	if !ok {
																		v = [][]interface{}{}
																	}
																	v2 := []interface{}{}
																	v2 = append(v2, labelKeyValue)
																	v2 = append(v2, result)
																	v = append(v, v2)

																	(metricData)[groupKeyValue.(string)] = v
																}

																continue
															}
														}
													}
												}
											}
										}

									}
								}

							}
						}
					}
				}
			}

		}

	}

	return metricData
}

func ParseAggregationResult(bucketSize int, aggsData util.MapStr, groupKey, metricLabelKey, metricValueKey string) MetricData {

	metricData := MetricData{}
	//group bucket key: key1, 获取 key 的 buckets 作为分组的内容 map[group][]{Label，MetricValue}
	//metric Label Key: key2, 获取其 key 作为 时间指标
	//metric Value Key: c7qgjrqi4h92sqdaa9b0, 获取其 value 作为 point 内容

	//groupKey:="key1"
	//metricLabelKey:="key2"
	//metricValueKey:="c7qi5hii4h935v9bs920"

	//fmt.Println(groupKey," => ",metricLabelKey," => ",metricValueKey)

	for k, v := range aggsData {
		//fmt.Println("k:",k)
		//fmt.Println("v:",v)

		if k == groupKey {
			//fmt.Println("hit group key")
			//start to collect metric for each bucket
			objcs, ok := v.(map[string]interface{})
			if ok {

				bks, ok := objcs["buckets"].([]interface{})
				if ok {
					for _, bk := range bks {
						//check each bucket, collecting metrics
						//fmt.Println("check bucket:",bk)

						bkMap, ok := bk.(map[string]interface{})
						if ok {

							groupKeyValue, ok := bkMap["key"]
							if ok {
								//fmt.Println("collecting bucket::",groupKeyValue)
							}
							bkHitMap, ok := bkMap[metricLabelKey]
							if ok {
								//hit label, 说明匹配到时间范围了
								labelMap, ok := bkHitMap.(map[string]interface{})
								if ok {
									//fmt.Println("bkHitMap",bkHitMap)

									labelBks, ok := labelMap["buckets"]
									if ok {

										labelBksMap, ok := labelBks.([]interface{})
										//fmt.Println("get label buckets",ok)
										if ok {
											//fmt.Println("get label buckets",ok)

											for _, labelItem := range labelBksMap {
												metrics, ok := labelItem.(map[string]interface{})

												//fmt.Println(labelItem)
												labelKeyValue, ok := metrics["key"]
												if ok {
													//fmt.Println("collecting metric label::",int64(labelKeyValue.(float64)))
												}

												metric, ok := metrics[metricValueKey]
												if ok {
													metricMap, ok := metric.(map[string]interface{})
													if ok {
														metricValue, ok := metricMap["value"]
														if ok {
															//fmt.Println("collecting metric value::",metricValue.(float64))

															saveMetric(&metricData, groupKeyValue.(string), labelKeyValue, metricValue, bucketSize)
															continue
														}
													}
												}
											}
										}

									}
								}

							}
						}
					}
				}
			}

		}

	}

	//for k,v:=range bucketItems{
	//	fmt.Println("k:",k)
	//	fmt.Println("v:",v)
	//	aggObect:=aggsData[v.Key]
	//	fmt.Println("",aggObect)
	//	//fmt.Println(len(aggObect.Buckets))
	//	//for _,bucket:=range aggObect.Buckets{
	//	//	fmt.Println(bucket.Key)
	//	//	fmt.Println(bucket.GetChildBucket("key2"))
	//	//	//children,ok:=bucket.GetChildBucket()
	//	//	//if ok{
	//	//	//
	//	//	//}
	//	//}
	//}

	return metricData
}

func saveMetric(metricData *MetricData, group string, label, value interface{}, bucketSize int) {

	if value == nil {
		return
	}

	v3, ok := value.(float64)
	if ok {
		value = v3 / float64(bucketSize)
	}

	v, ok := (*metricData)[group]
	if !ok {
		v = [][]interface{}{}
	}
	v2 := []interface{}{}
	v2 = append(v2, label)
	v2 = append(v2, value)
	v = append(v, v2)

	(*metricData)[group] = v
	//fmt.Printf("save:%v, %v=%v\n",group,label,value)
}

func parseHealthMetricData(buckets []elastic.BucketBase) ([]interface{}, error) {
	metricData := []interface{}{}
	var minDate, maxDate int64
	for _, bucket := range buckets {
		v, ok := bucket["key"].(float64)
		if !ok {
			log.Error("invalid bucket key")
			return nil, fmt.Errorf("invalid bucket key")
		}
		dateTime := int64(v)
		minDate = util.MinInt64(minDate, dateTime)
		maxDate = util.MaxInt64(maxDate, dateTime)
		totalCount := bucket["doc_count"].(float64)
		if grpStatus, ok := bucket["group_status"].(map[string]interface{}); ok {
			if statusBks, ok := grpStatus["buckets"].([]interface{}); ok {
				for _, statusBk := range statusBks {
					if bkMap, ok := statusBk.(map[string]interface{}); ok {
						statusKey := bkMap["key"].(string)
						count := bkMap["doc_count"].(float64)
						metricData = append(metricData, map[string]interface{}{
							"x": dateTime,
							"y": count / totalCount * 100,
							"g": statusKey,
						})
					}
				}
			}
		}
	}
	return metricData, nil
}
