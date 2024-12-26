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

package v1

import (
	"context"
	"fmt"
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
	"net/http"
	"strings"
	"time"
)

func (h *APIHandler) FetchIndexInfo(w http.ResponseWriter, ctx context.Context, indexIDs []interface{}) {

	if len(indexIDs) == 0 {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	//only query first index
	indexIDs = indexIDs[0:1]
	q1 := orm.Query{WildcardIndex: true}
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.name", "index_stats"),
		orm.Eq("metadata.labels.index_id", indexIDs[0]),
	)
	//q1.Collapse("metadata.labels.index_id")
	q1.AddSort("timestamp", orm.DESC)
	q1.Size = 1

	err, results := orm.Search(&event.Event{}, &q1)
	if err != nil {
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
	}

	summaryMap := util.MapStr{}
	for _, v := range results.Result {
		result, ok := v.(map[string]interface{})
		if ok {
			if indexID, ok :=  util.GetMapValueByKeys([]string{"metadata", "labels", "index_id"}, result); ok {
				summary := map[string]interface{}{}
				if docs, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "index_stats", "total", "docs"}, result); ok {
					if docsM, ok := docs.(map[string]interface{}); ok {
						summary["docs_deleted"] = docsM["docs_deleted"]
						summary["docs_count"] = docsM["count"]
					}
				}
				if indexInfo, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "index_stats", "index_info"}, result); ok {
					if indexInfoM, ok := indexInfo.(map[string]interface{}); ok {
						summary["index"] = indexInfoM["index"]
						summary["status"] = indexInfoM["status"]
						summary["shards"] = indexInfoM["shards"]
						summary["replicas"] = indexInfoM["replicas"]
						storeInBytes, _ := util.ToBytes(indexInfoM["store_size"].(string))
						summary["store_in_bytes"] = storeInBytes
						priStoreInBytes, _ := util.ToBytes(indexInfoM["pri_store_size"].(string))
						summary["pri_store_in_bytes"] = priStoreInBytes
						summary["timestamp"] = result["timestamp"]
					}
				}
				if shardInfo, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "index_stats", "shard_info"}, result); ok {
					if sinfo, ok := shardInfo.([]interface{}); ok {
						unassignedCount := 0
						for _, item := range sinfo {
							if itemMap, ok := item.(map[string]interface{}); ok{
								if itemMap["state"] == "UNASSIGNED" {
									unassignedCount++
								}
							}

						}
						summary["unassigned_shards"] = unassignedCount
					}
				}
				summaryMap[indexID.(string)] = summary
			}
		}
	}

	indexID := indexIDs[0]
	var firstClusterID, firstIndexName string
	if v, ok := indexID.(string); ok {
		parts := strings.Split(v, ":")
		if len(parts) != 2 {
			h.WriteError(w, fmt.Sprintf("invalid index_id: %s", indexID), http.StatusInternalServerError)
			return
		}
		firstClusterID, firstIndexName = parts[0], parts[1]
	}else{
		h.WriteError(w, fmt.Sprintf("invalid index_id: %v", indexID), http.StatusInternalServerError)
		return
	}
	statusMetric, err := h.GetIndexStatusOfRecentDay(firstClusterID, firstIndexName)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	bucketSize := GetMinBucketSize()
	if bucketSize < 60 {
		bucketSize = 60
	}
	var metricLen = 15
	// 索引速率
	indexMetric:=newMetricItem("indexing", 1, OperationGroupKey)
	indexMetric.AddAxi("indexing rate","group1",common.PositionLeft,"num","0,0","0,0.[00]",5,true)
	nodeMetricItems := []GroupMetricItem{}
	nodeMetricItems=append(nodeMetricItems, GroupMetricItem{
		Key: "indexing",
		Field: "payload.elasticsearch.index_stats.primaries.indexing.index_total",
		ID: util.GetUUID(),
		IsDerivative: true,
		MetricItem: indexMetric,
		FormatType: "num",
		Units: "Indexing/s",
	})
	queryMetric:=newMetricItem("search", 2, OperationGroupKey)
	queryMetric.AddAxi("query rate","group1",common.PositionLeft,"num","0,0","0,0.[00]",5,true)
	nodeMetricItems=append(nodeMetricItems, GroupMetricItem{
		Key: "search",
		Field: "payload.elasticsearch.index_stats.total.search.query_total",
		ID: util.GetUUID(),
		IsDerivative: true,
		MetricItem: queryMetric,
		FormatType: "num",
		Units: "Search/s",
	})

	aggs:=map[string]interface{}{}
	query :=map[string]interface{}{}
	query["query"]=util.MapStr{
		"bool": util.MapStr{
			"must":  []util.MapStr{
				{
					"term": util.MapStr{
						"metadata.category": util.MapStr{
							"value": "elasticsearch",
						},
					},
				},
				{
					"term": util.MapStr{
						"metadata.name": util.MapStr{
							"value": "index_stats",
						},
					},
				},
				{
					"terms": util.MapStr{
						"metadata.labels.index_id": indexIDs,
					},
				},
			},
			"filter": []util.MapStr{
				{
					"range": util.MapStr{
						"timestamp": util.MapStr{
							"gte": fmt.Sprintf("now-%ds", metricLen * bucketSize),
						},
					},
				},
			},
		},
	}

	for _,metricItem:=range nodeMetricItems{
		aggs[metricItem.ID]=util.MapStr{
			"max":util.MapStr{
				"field": metricItem.Field,
			},
		}
		if metricItem.IsDerivative{
			aggs[metricItem.ID+"_deriv"]=util.MapStr{
				"derivative":util.MapStr{
					"buckets_path": metricItem.ID,
				},
			}
		}
	}

	bucketSizeStr := fmt.Sprintf("%ds", bucketSize)
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		panic(err)
	}
	query["size"]=0
	query["aggs"]= util.MapStr{
		"group_by_level": util.MapStr{
			"terms": util.MapStr{
				"field": "metadata.labels.index_id",
				"size":  100,
			},
			"aggs": util.MapStr{
				"dates": util.MapStr{
					"date_histogram":util.MapStr{
						"field": "timestamp",
						intervalField: bucketSizeStr,
					},
					"aggs":aggs,
				},
			},
		},
	}
	metrics, err := h.getMetrics(ctx, query, nodeMetricItems, bucketSize)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err, http.StatusInternalServerError)
		return
	}
	indexMetrics := map[string]util.MapStr{}
	for key, item := range metrics {
		for _, line := range item.Lines {
			if _, ok := indexMetrics[line.Metric.Label]; !ok{
				indexMetrics[line.Metric.Label] = util.MapStr{
				}
			}
			indexMetrics[line.Metric.Label][key] = line.Data
		}
	}
	infos := util.MapStr{}
	for _, tempIndexID := range indexIDs {
		result := util.MapStr{}

		indexID := tempIndexID.(string)

		result["summary"] = summaryMap[indexID]
		result["metrics"] = util.MapStr{
			"status": util.MapStr{
				"metric": util.MapStr{
					"label": "Recent Index Status",
					"units": "day",
				},
				"data": statusMetric[indexID],
			},
			"indexing": util.MapStr{
				"metric": util.MapStr{
					"label": "Indexing",
					"units": "s",
				},
				"data": indexMetrics[indexID]["indexing"],
			},
			"search": util.MapStr{
				"metric": util.MapStr{
					"label": "Search",
					"units": "s",
				},
				"data": indexMetrics[indexID]["search"],
			},
		}
		infos[indexID] = result
	}
	h.WriteJSON(w, infos, http.StatusOK)
}

func (h *APIHandler) GetIndexInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	indexID := ps.MustGetParameter("index")
	parts := strings.Split(indexID, ":")
	if len(parts) > 1 && !h.IsIndexAllowed(req, clusterID, parts[1]) {
		h.WriteError(w,  http.StatusText(http.StatusForbidden), http.StatusForbidden)
		return
	}
	if len(parts) < 2 {
		h.WriteError(w, "invalid index id: "+ indexID, http.StatusInternalServerError)
		return
	}

	q := orm.Query{
		Size: 1,
	}
	q.Conds = orm.And(orm.Eq("metadata.index_name", parts[1]), orm.Eq("metadata.cluster_id", clusterID))
	q.AddSort("timestamp", orm.DESC)

	err, res := orm.Search(&elastic.IndexConfig{}, &q)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := elastic.SearchResponse{}
	util.FromJSONBytes(res.Raw, &response)
	if len(response.Hits.Hits) == 0 {
		log.Warnf("index [%v][%v] not found, may be you should wait several seconds", clusterID, indexID)
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	q1 := orm.Query{
		Size: 1,
		WildcardIndex: true,
	}
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.name", "index_stats"),
		orm.Eq("metadata.labels.index_name", parts[1]),
		orm.Eq("metadata.labels.cluster_id", clusterID),
	)
	q1.Collapse("metadata.labels.index_id")
	q1.AddSort("timestamp", orm.DESC)
	err, result := orm.Search(&event.Event{}, &q1)
	summary := util.MapStr{}
	hit := response.Hits.Hits[0].Source
	if aliases, ok := util.GetMapValueByKeys([]string{"metadata", "aliases"}, hit); ok {
		health, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "health_status"}, hit)
		state, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "state"}, hit)
		summary["aliases"] = aliases
		summary["timestamp"] = hit["timestamp"]
		summary["index_info"] = util.MapStr{
			"health":health,
			"status": state,
		}
	}
	//if mappings, ok := util.GetMapValueByKeys([]string{"metadata", "mappings"}, hit); ok {
	//	summary["mappings"] = mappings
	//}
	//if settings, ok := util.GetMapValueByKeys([]string{"metadata", "settings"}, hit); ok {
	//	summary["settings"] = settings
	//}
	if len(result.Result) > 0 {
		result, ok := result.Result[0].(map[string]interface{})
		if ok {
			if docs, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "index_stats", "total", "docs"}, result); ok {
				summary["docs"] = docs
			}
			if indexInfo, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "index_stats", "index_info"}, result); ok {
				if infoM, ok := indexInfo.(map[string]interface{}); ok {
					if tm, ok := result["timestamp"].(string); ok {
						issueTime, _ := time.Parse(time.RFC3339, tm)
						if time.Now().Sub(issueTime).Seconds() > 30 {
							health, _:= util.GetMapValueByKeys([]string{"metadata", "labels", "health_status"}, response.Hits.Hits[0].Source)
							infoM["health"] = health
						}
					}
					state, _:= util.GetMapValueByKeys([]string{"metadata", "labels", "state"}, response.Hits.Hits[0].Source)
					if state == "delete" {
						infoM["status"] = "delete"
						infoM["health"] = "N/A"
					}
				}
				summary["index_info"] = indexInfo
			}
			if shardInfo, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "index_stats", "shard_info"}, result); ok {
				if sinfo, ok := shardInfo.([]interface{}); ok {
					unassignedCount := 0
					for _, item := range sinfo {
						if itemMap, ok := item.(map[string]interface{}); ok{
							if itemMap["state"] == "UNASSIGNED" {
								unassignedCount++
							}
						}

					}
					summary["unassigned_shards"] = unassignedCount
				}
			}
		}
		summary["timestamp"] = result["timestamp"]
	}

	h.WriteJSON(w, summary, http.StatusOK)
}

func (h *APIHandler) GetIndexShards(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	indexName := ps.MustGetParameter("index")
	q1 := orm.Query{
		Size: 1,
		WildcardIndex: true,
	}
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.name", "index_stats"),
		orm.Eq("metadata.labels.index_name", indexName),
		orm.Eq("metadata.labels.cluster_id", clusterID),
	)
	q1.Collapse("metadata.labels.index_id")
	q1.AddSort("timestamp", orm.DESC)
	err, result := orm.Search(&event.Event{}, &q1)
	if err != nil {
		h.WriteJSON(w,util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError )
		return
	}
	var shardInfo interface{} = []interface{}{}
	if len(result.Result) > 0 {
		row, ok := result.Result[0].(map[string]interface{})
		if ok {
			shardInfo, ok = util.GetMapValueByKeys([]string{"payload", "elasticsearch", "index_stats", "shard_info"}, row)
		}
	}

	h.WriteJSON(w, shardInfo, http.StatusOK)
}

const IndexHealthMetricKey = "index_health"

func (h *APIHandler) GetSingleIndexMetrics(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	indexName := ps.MustGetParameter("index")
	if !h.IsIndexAllowed(req, clusterID, indexName) {
		h.WriteJSON(w, util.MapStr{
			"error": http.StatusText(http.StatusForbidden),
		}, http.StatusForbidden)
		return
	}
	var must = []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.labels.cluster_id": util.MapStr{
					"value": clusterID,
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.category": util.MapStr{
					"value": "elasticsearch",
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.name": util.MapStr{
					"value": "index_stats",
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.labels.index_name": util.MapStr{
					"value": indexName,
				},
			},
		},
	}
	resBody := map[string]interface{}{}
	bucketSize, min, max, err := h.GetMetricRangeAndBucketSize(req, clusterID, MetricTypeIndexStats, 60)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	query := map[string]interface{}{}
	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"must": must,
			"filter": []util.MapStr{
				{
					"range": util.MapStr{
						"timestamp": util.MapStr{
							"gte": min,
							"lte": max,
						},
					},
				},
			},
		},
	}

	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	metricItems := []*common.MetricItem{}
	metricKey := h.GetParameter(req, "key")
	timeout := h.GetParameterOrDefault(req, "timeout", "60s")
	du, err := time.ParseDuration(timeout)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), du)
	defer cancel()
	metrics := map[string]*common.MetricItem{}
	if metricKey == IndexHealthMetricKey {
		healthMetric, err := h.GetIndexHealthMetric(ctx, clusterID, indexName, min, max, bucketSize)
		if err != nil {
			log.Error(err)
		}
		metrics["index_health"] = healthMetric
	}else {
		switch metricKey {
		case IndexThroughputMetricKey:
			metricItem := newMetricItem("index_throughput", 1, OperationGroupKey)
			metricItem.AddAxi("indexing", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
			metricItem.AddLine("Indexing Rate", "Primary Indexing", "Number of documents being indexed for node.", "group1", "payload.elasticsearch.index_stats.primaries.indexing.index_total", "max", bucketSizeStr, "doc/s", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItem.AddLine("Deleting Rate", "Primary Deleting", "Number of documents being deleted for node.", "group1", "payload.elasticsearch.index_stats.primaries.indexing.delete_total", "max", bucketSizeStr, "doc/s", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItems = append(metricItems, metricItem)
		case SearchThroughputMetricKey:
			metricItem := newMetricItem("search_throughput", 2, OperationGroupKey)
			metricItem.AddAxi("searching", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, false)
			metricItem.AddLine("Search Rate", "Search Rate",
				"Number of search requests being executed.",
				"group1", "payload.elasticsearch.index_stats.total.search.query_total", "max", bucketSizeStr, "query/s", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItems = append(metricItems, metricItem)
		case IndexLatencyMetricKey:
			metricItem := newMetricItem("index_latency", 3, LatencyGroupKey)
			metricItem.AddAxi("indexing", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)

			metricItem.AddLine("Indexing Latency", "Primary Indexing Latency", "Average latency for indexing documents.", "group1", "payload.elasticsearch.index_stats.primaries.indexing.index_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItem.Lines[0].Metric.Field2 = "payload.elasticsearch.index_stats.primaries.indexing.index_total"
			metricItem.Lines[0].Metric.Calc = func(value, value2 float64) float64 {
				return value / value2
			}
			metricItem.AddLine("Deleting Latency", "Primary Deleting Latency", "Average latency for delete documents.", "group1", "payload.elasticsearch.index_stats.primaries.indexing.delete_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItem.Lines[1].Metric.Field2 = "payload.elasticsearch.index_stats.primaries.indexing.delete_total"
			metricItem.Lines[1].Metric.Calc = func(value, value2 float64) float64 {
				return value / value2
			}
			metricItems = append(metricItems, metricItem)
		case SearchLatencyMetricKey:
			metricItem := newMetricItem("search_latency", 4, LatencyGroupKey)
			metricItem.AddAxi("searching", "group2", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, false)

			metricItem.AddLine("Searching", "Query Latency", "Average latency for searching query.", "group2", "payload.elasticsearch.index_stats.total.search.query_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItem.Lines[0].Metric.Field2 = "payload.elasticsearch.index_stats.total.search.query_total"
			metricItem.Lines[0].Metric.Calc = func(value, value2 float64) float64 {
				return value / value2
			}
			metricItem.AddLine("Searching", "Fetch Latency", "Average latency for searching fetch.", "group2", "payload.elasticsearch.index_stats.total.search.fetch_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItem.Lines[1].Metric.Field2 = "payload.elasticsearch.index_stats.total.search.fetch_total"
			metricItem.Lines[1].Metric.Calc = func(value, value2 float64) float64 {
				return value / value2
			}
			metricItem.AddLine("Searching", "Scroll Latency", "Average latency for searching fetch.", "group2", "payload.elasticsearch.index_stats.total.search.scroll_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItem.Lines[2].Metric.Field2 = "payload.elasticsearch.index_stats.total.search.scroll_total"
			metricItem.Lines[2].Metric.Calc = func(value, value2 float64) float64 {
				return value / value2
			}
			metricItems = append(metricItems, metricItem)
		}
		metrics, err = h.getSingleMetrics(ctx, metricItems, query, bucketSize)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err, http.StatusInternalServerError)
			return
		}
	}
	if _, ok := metrics[metricKey]; ok {
		if metrics[metricKey].HitsTotal > 0 {
			minBucketSize, err := GetMetricMinBucketSize(clusterID, MetricTypeIndexStats)
			if err != nil {
				log.Error(err)
			}else{
				metrics[metricKey].MinBucketSize = int64(minBucketSize)
			}
		}
	}
	resBody["metrics"] = metrics
	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) GetIndexHealthMetric(ctx context.Context, id, indexName string, min, max int64, bucketSize int)(*common.MetricItem, error){
	bucketSizeStr:=fmt.Sprintf("%vs",bucketSize)
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		return nil, err
	}
	query := util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.cluster_id": util.MapStr{
								"value": id,
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.category": util.MapStr{
								"value": "elasticsearch",
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.name": util.MapStr{
								"value": "index_health",
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.labels.index_name": util.MapStr{
								"value": indexName,
							},
						},
					},
				},
				"filter": []util.MapStr{
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"gte": min,
								"lte": max,
							},
						},
					},
				},
			},
		},
		"aggs": util.MapStr{
			"dates": util.MapStr{
				"date_histogram": util.MapStr{
					"field": "timestamp",
					intervalField: bucketSizeStr,
				},
				"aggs": util.MapStr{
					"group_status": util.MapStr{
						"terms": util.MapStr{
							"field": "payload.elasticsearch.index_health.status",
							"size": 5,
						},
					},
				},
			},
		},
	}
	queryDSL := util.MustToJSONBytes(query)
	response, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).QueryDSL(ctx, getAllMetricsIndex(), nil, queryDSL)
	if err != nil {
		log.Error(err)
		return nil, err
	}

	metricItem:=newMetricItem("index_health", 1, "")
	metricItem.AddLine("health","Health","","group1","payload.elasticsearch.index_health.status","max",bucketSizeStr,"%","ratio","0.[00]","0.[00]",false,false)

	metricData := []interface{}{}
	if response.StatusCode == 200 {
		metricData, err = parseHealthMetricData(response.Aggregations["dates"].Buckets)
		if err != nil {
			return nil, err
		}
	}
	metricItem.Lines[0].Data = metricData
	metricItem.Lines[0].Type = common.GraphTypeBar
	metricItem.Request = string(queryDSL)
	metricItem.HitsTotal = response.GetTotal()
	return metricItem, nil
}


func (h *APIHandler) GetIndexStatusOfRecentDay(clusterID, indexName string)(map[string][]interface{}, error){
	q := orm.Query{
		WildcardIndex: true,
	}
	query := util.MapStr{
		"aggs": util.MapStr{
			"time_histogram": util.MapStr{
				"date_range": util.MapStr{
					"field":     "timestamp",
					"format":    "yyyy-MM-dd",
					"time_zone": "+08:00",
					"ranges": []util.MapStr{
						{
							"from": "now-13d/d",
							"to": "now-12d/d",
						}, {
							"from": "now-12d/d",
							"to": "now-11d/d",
						},
						{
							"from": "now-11d/d",
							"to": "now-10d/d",
						},
						{
							"from": "now-10d/d",
							"to": "now-9d/d",
						}, {
							"from": "now-9d/d",
							"to": "now-8d/d",
						},
						{
							"from": "now-8d/d",
							"to": "now-7d/d",
						},
						{
							"from": "now-7d/d",
							"to": "now-6d/d",
						},
						{
							"from": "now-6d/d",
							"to": "now-5d/d",
						}, {
							"from": "now-5d/d",
							"to": "now-4d/d",
						},
						{
							"from": "now-4d/d",
							"to": "now-3d/d",
						},{
							"from": "now-3d/d",
							"to": "now-2d/d",
						}, {
							"from": "now-2d/d",
							"to": "now-1d/d",
						}, {
							"from": "now-1d/d",
							"to": "now/d",
						},
						{
							"from": "now/d",
							"to": "now",
						},
					},
				},
				"aggs": util.MapStr{
					"term_health": util.MapStr{
						"terms": util.MapStr{
							"field": "payload.elasticsearch.index_health.status",
						},
					},
				},
			},
		},
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
		"size": 0,
		"query": util.MapStr{
			"bool": util.MapStr{
				"filter": []util.MapStr{
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"gte": "now-15d",
								"lte": "now",
							},
						},
					},
				},
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.name": util.MapStr{
								"value": "index_health",
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.labels.cluster_id": clusterID,
						},
					},
					{
						"term": util.MapStr{
							"metadata.labels.index_name": indexName,
						},
					},
				},
			},
		},
	}
	q.RawQuery = util.MustToJSONBytes(query)

	err, res := orm.Search(&event.Event{}, &q)
	if err != nil {
		return nil, err
	}

	response := elastic.SearchResponse{}
	util.FromJSONBytes(res.Raw, &response)
	recentStatus := map[string][]interface{}{}
	for _, bkVal := range response.Aggregations["time_histogram"].Buckets {
		if termHealth, ok := bkVal["term_health"].(map[string]interface{}); ok {
			if healthBks, ok := termHealth["buckets"].([]interface{}); ok {
				if len(healthBks) == 0 {
					continue
				}
				healthMap := map[string]int{}
				status := "unknown"
				for _, hbkItem := range  healthBks {
					if hitem, ok := hbkItem.(map[string]interface{}); ok {
						healthMap[hitem["key"].(string)] = 1
					}
				}
				if _, ok = healthMap["red"]; ok {
					status = "red"
				}else if _, ok = healthMap["yellow"]; ok {
					status = "yellow"
				}else if _, ok = healthMap["green"]; ok {
					status = "green"
				}
				key := fmt.Sprintf("%s:%s", clusterID, indexName)
				recentStatus[key] = append(recentStatus[key], []interface{}{bkVal["key"], status})
			}
		}
	}
	return recentStatus, nil
}

func (h *APIHandler) getIndexNodes(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string] interface{}{}
	id := ps.ByName("id")
	indexName := ps.ByName("index")
	if !h.IsIndexAllowed(req, id, indexName) {
		h.WriteJSON(w, util.MapStr{
			"error": http.StatusText(http.StatusForbidden),
		}, http.StatusForbidden)
		return
	}
	q := &orm.Query{ Size: 1}
	q.AddSort("timestamp", orm.DESC)
	q.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.labels.cluster_id", id),
		orm.Eq("metadata.labels.index_name", indexName),
		orm.Eq("metadata.name", "index_routing_table"),
	)

	err, result := orm.Search(event.Event{}, q)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w,resBody, http.StatusInternalServerError )
	}
	namesM := util.MapStr{}
	if len(result.Result) > 0 {
		if data, ok := result.Result[0].(map[string]interface{}); ok {
			if routingTable, exists := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "index_routing_table"}, data); exists {
				if table, ok := routingTable.(map[string]interface{}); ok{
					if shardsM, ok := table["shards"].(map[string]interface{}); ok {
						for _, rows := range shardsM {
							if rowsArr, ok := rows.([]interface{}); ok {
								for _, rowsInner := range rowsArr {
									if rowsInnerM, ok := rowsInner.(map[string]interface{}); ok {
										if v, ok := rowsInnerM["node"].(string); ok {
											namesM[v] = true
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

	//node uuid
	nodeIds := make([]interface{}, 0, len(namesM) )
	for name, _ := range namesM {
		nodeIds = append(nodeIds, name)
	}

	q1 := &orm.Query{ Size: 100}
	q1.AddSort("timestamp", orm.DESC)
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.cluster_id", id),
		orm.In("metadata.node_id", nodeIds),
	)
	err, result = orm.Search(elastic.NodeConfig{}, q1)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w,resBody, http.StatusInternalServerError )
	}
	nodes := []interface{}{}
	for _, hit := range result.Result {
		if hitM, ok := hit.(map[string]interface{}); ok {
			nodeId, _ := util.GetMapValueByKeys([]string{"metadata", "node_id"}, hitM)
			nodeName, _ := util.GetMapValueByKeys([]string{"metadata", "node_name"}, hitM)
			status, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "status"}, hitM)
			ip, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "ip"}, hitM)
			transportAddress, _ := util.GetMapValueByKeys([]string{"payload", "node_state", "transport_address"}, hitM)
			var port string
			if v, ok := transportAddress.(string); ok {
				parts := strings.Split(v, ":")
				if len(parts) > 1 {
					port = parts[1]
				}
			}

			if v, ok := nodeId.(string); ok {
				ninfo := util.MapStr{
					"id": v,
					"name": nodeName,
					"ip": ip,
					"port": port,
					"status": status,
					"timestamp": hitM["timestamp"],
				}
				nodes = append(nodes, ninfo)
			}
		}
	}

	h.WriteJSON(w, nodes, http.StatusOK)
}

func (h APIHandler) ListIndex(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterIds := h.GetParameterOrDefault(req, "ids", "")
	keyword := h.GetParameterOrDefault(req, "keyword", "")
	ids := strings.Split(clusterIds, ",")
	if len(ids) == 0 {
		h.Error400(w, "cluster id is required")
		return
	}
	var must = []util.MapStr{}

	if !util.StringInArray(ids, "*"){

		must = append(must, util.MapStr{
			"terms": util.MapStr{
				"metadata.cluster_id": ids,
			},
		})
	}

	if keyword != "" {
		must = append(must, util.MapStr{
			"wildcard":util.MapStr{
				"metadata.index_name":
				util.MapStr{"value": fmt.Sprintf("*%s*", keyword)},
			},
		})
	}
	var dsl = util.MapStr{
		"_source": []string{"metadata.index_name"},
		"collapse": util.MapStr{
			"field": "metadata.index_name",
		},
		"size": 100,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": must,
				"must_not": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.state": util.MapStr{
								"value": "delete",
							},
						},
					},
				},
			},
		},
	}


	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	indexName := orm.GetIndexName(elastic.IndexConfig{})
	resp, err := esClient.SearchWithRawQueryDSL(indexName, util.MustToJSONBytes(dsl))
	if err != nil {

		return
	}
	list := resp.Hits.Hits
	var indexNames []string
	for _, v := range list {
		m := v.Source["metadata"].(map[string]interface{})
		indexNames = append(indexNames, m["index_name"].(string))

	}
	m := make(map[string]interface{})
	m["indexnames"] = indexNames
	h.WriteOKJSON(w, m)

	return
}
