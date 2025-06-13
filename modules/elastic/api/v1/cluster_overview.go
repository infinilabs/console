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
	"fmt"
	log "github.com/cihub/seelog"
	"net/http"
	"strings"
	"time"

	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/radix"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
)

func (h *APIHandler) FetchClusterInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var clusterIDs = []string{}
	h.DecodeJSON(req, &clusterIDs)

	if len(clusterIDs) == 0 {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}

	cids := make([]interface{}, 0, len(clusterIDs))
	for _, clusterID := range clusterIDs {
		cids = append(cids, clusterID)
	}
	healthMap := map[string]interface{}{}

	//fetch extra cluster status
	q1 := orm.Query{WildcardIndex: true}
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.name", "cluster_stats"),
		orm.In("metadata.labels.cluster_id", cids),
	)
	q1.Collapse("metadata.labels.cluster_id")
	q1.AddSort("timestamp", orm.DESC)
	q1.Size = len(clusterIDs) + 1

	err, results := orm.Search(&event.Event{}, &q1)
	for _, v := range results.Result {
		result, ok := v.(map[string]interface{})
		if ok {
			clusterID, ok := util.GetMapValueByKeys([]string{"metadata", "labels", "cluster_id"}, result)
			if ok {
				source := map[string]interface{}{}
				indicesCount, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "cluster_stats", "indices", "count"}, result)
				if ok {
					source["number_of_indices"] = indicesCount
				}

				docsCount, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "cluster_stats", "indices", "docs", "count"}, result)
				if ok {
					source["number_of_documents"] = docsCount
				}

				docsDeletedCount, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "cluster_stats", "indices", "docs", "deleted"}, result)
				if ok {
					source["number_of_deleted_documents"] = docsDeletedCount
				}
				fs, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "cluster_stats", "nodes", "fs"}, result)
				if ok {
					source["fs"] = fs
				}
				jvm, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "cluster_stats", "nodes", "jvm", "mem"}, result)
				if ok {
					source["jvm"] = jvm
				}
				nodeCount, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "cluster_stats", "nodes", "count", "total"}, result)
				if ok {
					source["number_of_nodes"] = nodeCount
				}
				shardCount, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "cluster_stats", "indices", "shards", "total"}, result)
				if ok {
					source["number_of_shards"] = shardCount
				}
				source["timestamp"] = result["timestamp"]

				healthMap[util.ToString(clusterID)] = source
			}
		}
	}

	//fetch cluster metrics
	bucketSize, min, max, err := h.GetMetricRangeAndBucketSize(req, clusterIDs[0], MetricTypeIndexStats, 15)
	if err != nil {
		panic(err)
	}

	query := util.MapStr{}
	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"must": []util.MapStr{
				{
					"terms": util.MapStr{
						"metadata.labels.cluster_id": clusterIDs,
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
	}

	var top = len(clusterIDs) + 1

	metricItems := []*common.MetricItem{}
	var bucketSizeStr = fmt.Sprintf("%vs", bucketSize)
	metricItem := newMetricItem("cluster_summary", 2, "cluster")
	indexLine := metricItem.AddLine("Indexing", "Total Indexing", "Number of documents being indexed for primary and replica shards.", "group1",
		"payload.elasticsearch.index_stats.total.indexing.index_total", "max", bucketSizeStr, "doc/s", "num", "0,0.[00]", "0,0.[00]", false, true)

	searchLine := metricItem.AddLine("Search", "Total Search", "Number of search requests being executed across primary and replica shards. A single search can run against multiple shards!", "group1",
		"payload.elasticsearch.index_stats.total.search.query_total", "max", bucketSizeStr, "query/s", "num", "0,0.[00]", "0,0.[00]", false, true)
	metricItems = append(metricItems, metricItem)

	bucketItem := common.NewBucketItem(
		common.TermsBucket, util.MapStr{
			"field": "metadata.labels.cluster_id",
			"size":  top,
		})

	clusterID := global.MustLookupString(elastic.GlobalSystemElasticsearchID)
	intervalField, err := getDateHistogramIntervalField(clusterID, bucketSizeStr)
	if err != nil {
		panic(err)
	}
	histgram := common.NewBucketItem(
		common.DateHistogramBucket, util.MapStr{
			"field":       "timestamp",
			intervalField: bucketSizeStr,
		})
	histgram.AddMetricItems(metricItems...)

	bucketItem.AddNestBucket(histgram)

	query["size"] = 0

	aggs := ConvertBucketItemsToAggQuery([]*common.BucketItem{bucketItem}, nil)

	util.MergeFields(query, aggs, true)

	searchR1, err := elastic.GetClient(clusterID).SearchWithRawQueryDSL(getAllMetricsIndex(), util.MustToJSONBytes(query))
	if err != nil {
		panic(err)
	}

	searchResponse := SearchResponse{}
	util.FromJSONBytes(searchR1.RawResult.Body, &searchResponse)

	m1 := ParseAggregationResult(bucketSize, searchResponse.Aggregations, bucketItem.Key, histgram.Key, indexLine.Metric.GetDataKey())
	m2 := ParseAggregationResult(bucketSize, searchResponse.Aggregations, bucketItem.Key, histgram.Key, searchLine.Metric.GetDataKey())

	//fetch recent cluster health status
	bucketItem = common.NewBucketItem(
		common.TermsBucket, util.MapStr{
			"field": "metadata.labels.cluster_id",
			"size":  top,
		})

	bucketSizeStr = "1d"
	histgram = common.NewBucketItem(
		common.DateRangeBucket, util.MapStr{
			"field":     "timestamp",
			"format":    "yyyy-MM-dd",
			"time_zone": "+08:00",
			"ranges": []util.MapStr{
				{
					"from": "now-13d/d",
					"to":   "now-12d/d",
				}, {
					"from": "now-12d/d",
					"to":   "now-11d/d",
				},
				{
					"from": "now-11d/d",
					"to":   "now-10d/d",
				},
				{
					"from": "now-10d/d",
					"to":   "now-9d/d",
				}, {
					"from": "now-9d/d",
					"to":   "now-8d/d",
				},
				{
					"from": "now-8d/d",
					"to":   "now-7d/d",
				},
				{
					"from": "now-7d/d",
					"to":   "now-6d/d",
				},
				{
					"from": "now-6d/d",
					"to":   "now-5d/d",
				}, {
					"from": "now-5d/d",
					"to":   "now-4d/d",
				},
				{
					"from": "now-4d/d",
					"to":   "now-3d/d",
				}, {
					"from": "now-3d/d",
					"to":   "now-2d/d",
				}, {
					"from": "now-2d/d",
					"to":   "now-1d/d",
				}, {
					"from": "now-1d/d",
					"to":   "now/d",
				},
				{
					"from": "now/d",
					"to":   "now",
				},
			},
		})

	termBucket := common.NewBucketItem(common.TermsBucket, util.MapStr{
		"field":   "payload.elasticsearch.cluster_health.status",
		"size":    top,
		"missing": "",
	})
	histgram.AddNestBucket(termBucket)

	bucketItem.AddNestBucket(histgram)

	aggs = ConvertBucketItemsToAggQuery([]*common.BucketItem{bucketItem}, nil)
	query = util.MapStr{}
	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"must": []util.MapStr{
				{
					"terms": util.MapStr{
						"metadata.labels.cluster_id": clusterIDs,
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
							"value": "cluster_health",
						},
					},
				},
			},
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
		},
	}
	query["size"] = 0

	util.MergeFields(query, aggs, true)

	searchR1, err = elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).SearchWithRawQueryDSL(getAllMetricsIndex(), util.MustToJSONBytes(query))
	if err != nil {
		panic(err)
	}
	searchResponse = SearchResponse{}
	util.FromJSONBytes(searchR1.RawResult.Body, &searchResponse)
	m3 := ParseAggregationBucketResult(bucketSize, searchResponse.Aggregations, bucketItem.Key, histgram.Key, termBucket.Key, nil)

	infos := util.MapStr{}
	for _, clusterID := range clusterIDs {
		result := util.MapStr{}

		//TODO update last active timestamp
		//source := hit.Source
		//source["project"]=util.MapStr{
		//	"id":"12312312",
		//	"name":"统一日志云平台v1.0",
		//}
		//source["location"]=util.MapStr{
		//	"provider" : "阿里云",
		//	"region" : "北京",
		//	"dc" : "昌平机房",
		//	"rack" : "rack-1",
		//}
		//source["owner"]=[]util.MapStr{util.MapStr{
		//	"department" : "运维部",
		//	"name":"廖石阳",
		//	"id":"123123123",
		//}}

		//result["metadata"] = source
		result["summary"] = healthMap[clusterID]
		result["metrics"] = util.MapStr{
			"status": util.MapStr{
				"metric": util.MapStr{
					"label": "Recent Cluster Status",
					"units": "day",
				},
				"data": getClusterMetrics(clusterID, m3),
			},
			"indexing": util.MapStr{
				"metric": util.MapStr{
					"label": "Indexing",
					"units": "s",
				},
				"data": getClusterMetrics(clusterID, m1),
			},
			"search": util.MapStr{
				"metric": util.MapStr{
					"label": "Search",
					"units": "s",
				},
				"data": getClusterMetrics(clusterID, m2),
			},
		}
		infos[clusterID] = result
	}

	h.WriteJSON(w, infos, 200)
}

func getClusterMetrics(id string, data MetricData) [][]interface{} {
	return data[id]
}

func (h *APIHandler) GetClusterInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.ByName("id")
	q := &orm.Query{WildcardIndex: true, Size: 1}
	q.AddSort("timestamp", orm.DESC)
	q.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.name", "cluster_health"),
		orm.Eq("metadata.labels.cluster_id", id),
	)

	err, result := orm.Search(event.Event{}, q)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
	}
	var healthInfo interface{} = util.MapStr{}
	if len(result.Result) > 0 {
		if rowM, ok := result.Result[0].(map[string]interface{}); ok {
			healthInfo, _ = util.MapStr(rowM).GetValue("payload.elasticsearch.cluster_health")
		}
	}

	h.WriteJSON(w, healthInfo, 200)
}

func (h *APIHandler) GetClusterNodes(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		min = h.GetParameterOrDefault(req, "min", "now-15m")
		max = h.GetParameterOrDefault(req, "max", "now")
	)
	resBody := map[string]interface{}{}
	id := ps.ByName("id")
	q := &orm.Query{Size: 1000}
	q.AddSort("timestamp", orm.DESC)
	q.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.cluster_id", id),
	)

	err, result := orm.Search(elastic.NodeConfig{}, q)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
	}
	query := util.MapStr{
		"size": 1000,
		"collapse": util.MapStr{
			"field": "metadata.labels.node_id",
		},
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
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
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.category": util.MapStr{
								"value": "elasticsearch",
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.labels.cluster_id": util.MapStr{
								"value": id,
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.name": util.MapStr{
								"value": "node_stats",
							},
						},
					},
				},
			},
		},
	}
	q = &orm.Query{RawQuery: util.MustToJSONBytes(query), WildcardIndex: true}
	err, searchResult := orm.Search(event.Event{}, q)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
	}
	nodeInfos := map[string]util.MapStr{}
	for _, hit := range searchResult.Result {
		if hitM, ok := hit.(map[string]interface{}); ok {
			shardInfo, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "shard_info"}, hitM)
			var totalShards float64
			if v, ok := shardInfo.(map[string]interface{}); ok {
				shardCount := v["shard_count"]
				replicasCount := v["replicas_count"]
				if v1, ok := shardCount.(float64); ok {
					totalShards += v1
				}
				if v1, ok := replicasCount.(float64); ok {
					totalShards += v1
				}
			}
			uptime, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "jvm", "uptime_in_millis"}, hitM)
			cpu, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "os", "cpu", "percent"}, hitM)
			load, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "os", "cpu", "load_average", "1m"}, hitM)
			heapUsage, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "jvm", "mem", "heap_used_percent"}, hitM)
			freeDisk, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "fs", "total", "free_in_bytes"}, hitM)
			nodeID, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "node_id"}, hitM)
			if v, ok := freeDisk.(float64); ok {
				freeDisk = util.ByteSize(uint64(v))
			}

			if v, ok := nodeID.(string); ok {
				nodeInfos[v] = util.MapStr{
					"timestamp":    hitM["timestamp"],
					"shards":       totalShards,
					"cpu":          cpu,
					"load_1m":      load,
					"heap.percent": heapUsage,
					"disk.avail":   freeDisk,
					"uptime":       uptime,
				}

			}
		}
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
					"id":     v,
					"name":   nodeName,
					"ip":     ip,
					"port":   port,
					"status": status,
				}
				if nodeInfos[v] != nil {
					if nodeInfos[v]["timestamp"] != nil {
						if ts, ok := nodeInfos[v]["timestamp"].(string); ok {
							tt, _ := time.Parse(time.RFC3339, ts)
							if time.Now().Sub(tt).Seconds() > 30 {
								ninfo["status"] = "unavailable"
							}
						}
					}
					util.MergeFields(ninfo, nodeInfos[v], true)
				} else {
					ninfo["timestamp"] = hitM["timestamp"]
				}
				nodes = append(nodes, ninfo)
			}
		}
	}
	h.WriteJSON(w, nodes, http.StatusOK)
}

func (h *APIHandler) GetClusterIndices(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		//size        = h.GetIntOrDefault(req, "size", 20)
		//from        = h.GetIntOrDefault(req, "from", 0)
		min = h.GetParameterOrDefault(req, "min", "now-15m")
		max = h.GetParameterOrDefault(req, "max", "now")
	)
	resBody := map[string]interface{}{}
	id := ps.ByName("id")
	q := &orm.Query{Size: 2000}
	q.AddSort("timestamp", orm.DESC)
	q.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.cluster_id", id),
		//orm.NotEq("metadata.labels.state", "delete"),
	)

	err, result := orm.Search(elastic.IndexConfig{}, q)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
	}
	indices, err := h.getLatestIndices(req, min, max, id, &result)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
	}

	h.WriteJSON(w, indices, http.StatusOK)
}

func (h *APIHandler) GetRealtimeClusterIndices(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.ByName("id")
	meta := elastic.GetMetadata(id)
	if meta == nil || !meta.IsAvailable() {
		h.WriteJSON(w, []interface{}{}, http.StatusOK)
		return
	}
	//filter indices
	allowedIndices, hasAllPrivilege := h.GetAllowedIndices(req, id)
	if !hasAllPrivilege && len(allowedIndices) == 0 {
		h.WriteJSON(w, []interface{}{}, http.StatusOK)
		return
	}

	esClient := elastic.GetClient(id)
	indexInfos, err := esClient.GetIndices("")
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if !hasAllPrivilege {
		filterIndices := map[string]elastic.IndexInfo{}
		pattern := radix.Compile(allowedIndices...)
		for indexName, indexInfo := range *indexInfos {
			if pattern.Match(indexName) {
				filterIndices[indexName] = indexInfo
			}
		}
		indexInfos = &filterIndices
	}

	minBucketSize, err := GetMetricMinBucketSize(id, MetricTypeIndexStats)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	qps, err := h.getIndexQPS(id, minBucketSize)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
	}
	var indices []RealtimeIndexInfo
	for _, item := range *indexInfos {
		info := RealtimeIndexInfo{
			IndexInfo: IndexInfo(item),
		}
		if _, ok := qps[item.Index]; ok {
			info.IndexQPS = qps[item.Index]["index"]
			info.QueryQPS = qps[item.Index]["query"]
			info.IndexBytesQPS = qps[item.Index]["index_bytes"]
		}
		indices = append(indices, info)
	}
	h.WriteJSON(w, indices, http.StatusOK)
}

type IndexInfo elastic.IndexInfo
type RealtimeIndexInfo struct {
	IndexQPS      interface{} `json:"index_qps"`
	QueryQPS      interface{} `json:"query_qps"`
	IndexBytesQPS interface{} `json:"index_bytes_qps"`
	IndexInfo
}
type CatNodeResponse elastic.CatNodeResponse
type RealtimeNodeInfo struct {
	IndexQPS      interface{} `json:"index_qps"`
	QueryQPS      interface{} `json:"query_qps"`
	IndexBytesQPS interface{} `json:"index_bytes_qps"`
	CatNodeResponse
}

func (h *APIHandler) getIndexQPS(clusterID string, bucketSizeInSeconds int) (map[string]util.MapStr, error) {
	ver := h.Client().GetVersion()
	bucketSizeStr := fmt.Sprintf("%ds", bucketSizeInSeconds)
	intervalField, err := elastic.GetDateHistogramIntervalField(ver.Distribution, ver.Number, bucketSizeStr)
	if err != nil {
		return nil, err
	}

	partition_num := 10
	term_index := util.MapStr{
		"field": "metadata.labels.index_name",
		"size":  1000,
	}
	if GetIndicesCount(clusterID) > 200 {
		term_index = util.MapStr{
			"field": "metadata.labels.index_name",
			"include": util.MapStr{
				"partition":      0,
				"num_partitions": partition_num,
			},
			"size": 10000,
		}
	}

	query := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"term_index": util.MapStr{
				"terms": term_index,
				"aggs": util.MapStr{
					"date": util.MapStr{
						"date_histogram": util.MapStr{
							"field":       "timestamp",
							intervalField: bucketSizeStr,
						},
						"aggs": util.MapStr{
							"index_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.index_stats.primaries.indexing.index_total",
								},
							},
							"query_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.index_stats.total.search.query_total",
								},
							},
							"index_bytes_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.index_stats.primaries.store.size_in_bytes",
								},
							},
							"index_rate": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "index_total",
								},
							},
							"query_rate": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "query_total",
								},
							},
							"index_bytes_rate": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "index_bytes_total",
								},
							},
						},
					},
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"filter": []util.MapStr{
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"gte": fmt.Sprintf("now-%ds", bucketSizeInSeconds*5),
								"lte": "now",
							},
						},
					},
				},
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.cluster_id": util.MapStr{
								"value": clusterID,
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
				},
			},
		},
	}
	return h.QueryQPS(query, bucketSizeInSeconds)
}

func (h *APIHandler) QueryQPS(query util.MapStr, bucketSizeInSeconds int) (map[string]util.MapStr, error) {
	esClient := h.Client()
	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetWildcardIndexName(event.Event{}), util.MustToJSONBytes(query))
	if err != nil {
		return nil, err
	}
	indexQPS := map[string]util.MapStr{}

	for _, agg := range searchRes.Aggregations {
		for _, bk := range agg.Buckets {
			if k, ok := bk["key"].(string); ok {
				indexQPS[k] = util.MapStr{}
				if dateAgg, ok := bk["date"].(map[string]interface{}); ok {
					if bks, ok := dateAgg["buckets"].([]interface{}); ok {
						var (
							maxIndexRate      float64
							maxQueryRate      float64
							maxIndexBytesRate float64
							preIndexTotal     float64
							dropNext          bool
							maxTimestamp      float64
						)

						var preBucketSize, curBucketSize int
						for _, dateBk := range bks {
							if dateBkVal, ok := dateBk.(map[string]interface{}); ok {
								// check bucket size between previous and current
								preBucketSize = curBucketSize
								aggResult, aggExists := dateBkVal["term_shard"].(map[string]interface{})
								if aggExists {
									buckets, bucketsOk := aggResult["buckets"].([]interface{})
									if bucketsOk {
										curBucketSize = len(buckets)
									}
								}

								// skip: if the number of shard in the previous and current buckets is not equal
								if preBucketSize > 0 && curBucketSize > 0 && preBucketSize != curBucketSize {
									log.Debugf("Skipping index %s, bucket size changed from %d to %d", k, preBucketSize, curBucketSize)
									continue
								}

								if indexTotal, ok := dateBkVal["index_total"].(map[string]interface{}); ok {
									if indexTotalVal, ok := indexTotal["value"].(float64); ok {
										if dropNext {
											preIndexTotal = indexTotalVal
											// reset dropNext flag
											dropNext = false
											continue
										}
										if preIndexTotal > 0 {
											//if value of indexTotal is decreasing, drop the next value,
											//and we will drop current and next qps value
											if indexTotalVal-preIndexTotal < 0 {
												dropNext = true
												preIndexTotal = indexTotalVal
												continue
											}
										}
										preIndexTotal = indexTotalVal
									}
								}
								if indexRate, ok := dateBkVal["index_rate"].(map[string]interface{}); ok {
									if indexRateVal, ok := indexRate["value"].(float64); ok && indexRateVal > maxIndexRate {
										maxIndexRate = indexRateVal
									}
								}
								if queryRate, ok := dateBkVal["query_rate"].(map[string]interface{}); ok {
									if queryRateVal, ok := queryRate["value"].(float64); ok && queryRateVal > maxQueryRate {
										maxQueryRate = queryRateVal
									}
								}
								if indexBytesRate, ok := dateBkVal["index_bytes_rate"].(map[string]interface{}); ok {
									if indexBytesRateVal, ok := indexBytesRate["value"].(float64); ok && indexBytesRateVal > maxIndexBytesRate {
										maxIndexBytesRate = indexBytesRateVal
									}
								}
								if latestTime, ok := dateBkVal["latest_timestamp"].(map[string]interface{}); ok {
									if latestTimeVal, ok := latestTime["value"].(float64); ok && latestTimeVal > maxTimestamp {
										maxTimestamp = latestTimeVal
									}
								}
							}
						}
						indexQPS[k]["index"] = util.ToFixed(maxIndexRate/float64(bucketSizeInSeconds), 2)
						indexQPS[k]["query"] = util.ToFixed(maxQueryRate/float64(bucketSizeInSeconds), 2)
						indexQPS[k]["index_bytes"] = util.ToFixed(maxIndexBytesRate/float64(bucketSizeInSeconds), 2)
						indexQPS[k]["latest_timestamp"] = maxTimestamp
					}
				}
			}
		}
	}
	return indexQPS, nil
}

func (h *APIHandler) SearchClusterMetadata(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := util.MapStr{}
	reqBody := struct {
		Keyword      string                       `json:"keyword"`
		Size         int                          `json:"size"`
		From         int                          `json:"from"`
		Aggregations []elastic.SearchAggParam     `json:"aggs"`
		Highlight    elastic.SearchHighlightParam `json:"highlight"`
		Filter       elastic.SearchFilterParam    `json:"filter"`
		Sort         []string                     `json:"sort"`
		SearchField  string                       `json:"search_field"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	var should []util.MapStr
	if reqBody.SearchField != "" {
		should = []util.MapStr{
			{
				"prefix": util.MapStr{
					reqBody.SearchField: util.MapStr{
						"value": reqBody.Keyword,
						"boost": 20,
					},
				},
			},
			{
				"match": util.MapStr{
					reqBody.SearchField: util.MapStr{
						"query":          reqBody.Keyword,
						"fuzziness":      "AUTO",
						"max_expansions": 10,
						"prefix_length":  2,
						"boost":          2,
					},
				},
			},
		}
	} else {
		should = []util.MapStr{
			{
				"prefix": util.MapStr{
					"name": util.MapStr{
						"value": reqBody.Keyword,
						"boost": 20,
					},
				},
			},
			{
				"prefix": util.MapStr{
					"host": util.MapStr{
						"value": reqBody.Keyword,
						"boost": 20,
					},
				},
			},
			{
				"prefix": util.MapStr{
					"version": util.MapStr{
						"value": reqBody.Keyword,
						"boost": 15,
					},
				},
			},
			{
				"match_phrase_prefix": util.MapStr{
					"name.text": util.MapStr{
						"query": reqBody.Keyword,
						"boost": 6,
					},
				},
			},
			{
				"match": util.MapStr{
					"search_text": util.MapStr{
						"query":          reqBody.Keyword,
						"fuzziness":      "AUTO",
						"max_expansions": 10,
						"prefix_length":  2,
						"boost":          2,
					},
				},
			},
			{
				"query_string": util.MapStr{
					"fields":                 []string{"*"},
					"query":                  reqBody.Keyword,
					"fuzziness":              "AUTO",
					"fuzzy_prefix_length":    2,
					"fuzzy_max_expansions":   10,
					"allow_leading_wildcard": false,
				},
			},
		}
	}

	clusterFilter, hasAllPrivilege := h.GetClusterFilter(req, "_id")
	if !hasAllPrivilege && clusterFilter == nil {
		h.WriteJSON(w, elastic.SearchResponse{}, http.StatusOK)
		return
	}
	must := []interface{}{}
	if !hasAllPrivilege && clusterFilter != nil {
		must = append(must, clusterFilter)
	}
	query := util.MapStr{
		"aggs":      elastic.BuildSearchTermAggregations(reqBody.Aggregations),
		"size":      reqBody.Size,
		"from":      reqBody.From,
		"highlight": elastic.BuildSearchHighlight(&reqBody.Highlight),
		"query": util.MapStr{
			"bool": util.MapStr{
				"filter": elastic.BuildSearchTermFilter(reqBody.Filter),
				"should": should,
				"must":   must,
			},
		},
		"sort": []util.MapStr{
			{
				"updated": util.MapStr{
					"order": "desc",
				},
			},
		},
	}
	if len(reqBody.Sort) > 1 {
		query["sort"] = []util.MapStr{
			{
				reqBody.Sort[0]: util.MapStr{
					"order": reqBody.Sort[1],
				},
			},
		}
	}
	dsl := util.MustToJSONBytes(query)
	response, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).SearchWithRawQueryDSL(orm.GetIndexName(elastic.ElasticsearchConfig{}), dsl)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	w.Write(util.MustToJSONBytes(response))
}
