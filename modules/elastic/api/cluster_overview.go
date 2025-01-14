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

package api

import (
	"context"
	"errors"
	"fmt"
	cerr "infini.sh/console/core/errors"
	"infini.sh/framework/modules/elastic/adapter"
	"net/http"
	"strings"
	"time"

	log "github.com/cihub/seelog"
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
	//only query the first cluster info
	clusterIDs = clusterIDs[0:1]

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
		orm.Eq("metadata.labels.cluster_id", cids[0]),
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

	var (
		// cluster_id => cluster_uuid
		clustersM    = map[string]string{}
		clusterUUIDs []string
	)
	for _, cid := range clusterIDs {
		clusterUUID, err := adapter.GetClusterUUID(cid)
		if err != nil {
			log.Error(err)
			continue
		}
		clusterUUIDs = append(clusterUUIDs, clusterUUID)
		clustersM[cid] = clusterUUID
	}
	query := util.MapStr{
		"size": 0,
	}

	var top = len(clusterIDs) + 1

	bucketSize := GetMinBucketSize()
	if bucketSize < 60 {
		bucketSize = 60
	}
	var metricLen = 15
	var bucketSizeStr = fmt.Sprintf("%vs", bucketSize)
	indexMetricItems := []GroupMetricItem{}
	metricItem := newMetricItem("cluster_indexing", 2, "cluster")
	metricItem.OnlyPrimary = true
	indexMetricItems = append(indexMetricItems, GroupMetricItem{
		Key:          "cluster_indexing",
		Field:        "payload.elasticsearch.node_stats.indices.indexing.index_total",
		ID:           util.GetUUID(),
		IsDerivative: true,
		MetricItem:   metricItem,
		FormatType:   "num",
		Units:        "doc/s",
	})

	metricItem = newMetricItem("cluster_search", 2, "cluster")
	indexMetricItems = append(indexMetricItems, GroupMetricItem{
		Key:          "cluster_search",
		Field:        "payload.elasticsearch.node_stats.indices.search.query_total",
		ID:           util.GetUUID(),
		IsDerivative: true,
		MetricItem:   metricItem,
		FormatType:   "num",
		Units:        "query/s",
	})

	clusterID := global.MustLookupString(elastic.GlobalSystemElasticsearchID)
	intervalField, err := getDateHistogramIntervalField(clusterID, bucketSizeStr)
	if err != nil {
		panic(err)
	}

	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"must": []util.MapStr{
				{
					"term": util.MapStr{
						"metadata.labels.cluster_uuid": clusterUUIDs[0],
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
							"value": "node_stats",
						},
					},
				},
			},
			"filter": []util.MapStr{
				{
					"range": util.MapStr{
						"timestamp": util.MapStr{
							"gte": fmt.Sprintf("now-%ds", metricLen*bucketSize),
						},
					},
				},
			},
		},
	}
	aggs := map[string]interface{}{}
	sumAggs := util.MapStr{}

	for _, metricItem := range indexMetricItems {
		leafAgg := util.MapStr{
			"max": util.MapStr{
				"field": metricItem.Field,
			},
		}
		var sumBucketPath = "term_node>" + metricItem.ID
		aggs[metricItem.ID] = leafAgg

		sumAggs[metricItem.ID] = util.MapStr{
			"sum_bucket": util.MapStr{
				"buckets_path": sumBucketPath,
			},
		}
		if metricItem.IsDerivative {
			sumAggs[metricItem.ID+"_deriv"] = util.MapStr{
				"derivative": util.MapStr{
					"buckets_path": metricItem.ID,
				},
			}
		}
	}
	sumAggs["term_node"] = util.MapStr{
		"terms": util.MapStr{
			"field": "metadata.labels.node_id",
			"size":  1000,
		},
		"aggs": aggs,
	}
	query["aggs"] = util.MapStr{
		"group_by_level": util.MapStr{
			"terms": util.MapStr{
				"field": "metadata.labels.cluster_uuid",
				"size":  top,
			},
			"aggs": util.MapStr{
				"dates": util.MapStr{
					"date_histogram": util.MapStr{
						"field":       "timestamp",
						intervalField: bucketSizeStr,
					},
					"aggs": sumAggs,
				},
			},
		},
	}
	timeout := h.GetParameterOrDefault(req, "timeout", "60s")
	du, err := time.ParseDuration(timeout)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), du)
	defer cancel()
	indexMetrics, err := h.getMetrics(ctx, query, indexMetricItems, bucketSize)
	if err != nil {
		log.Error(err)
		if errors.Is(err, context.DeadlineExceeded) {
			h.WriteError(w, cerr.New(cerr.ErrTypeRequestTimeout, "", err).Error(), http.StatusRequestTimeout)
			return
		}
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	indexingMetricData := util.MapStr{}
	for _, line := range indexMetrics["cluster_indexing"].Lines {
		// remove first metric dot
		data := line.Data
		if v, ok := data.([][]interface{}); ok && len(v) > 0 {
			// remove first metric dot
			temp := v[1:]
			// // remove first last dot
			if len(temp) > 0 {
				temp = temp[0 : len(temp)-1]
			}
			data = temp
		}
		indexingMetricData[line.Metric.Label] = data
	}
	searchMetricData := util.MapStr{}
	for _, line := range indexMetrics["cluster_search"].Lines {
		data := line.Data
		if v, ok := data.([][]interface{}); ok && len(v) > 0 {
			// remove first metric dot
			temp := v[1:]
			// // remove first last dot
			if len(temp) > 0 {
				temp = temp[0 : len(temp)-1]
			}
			data = temp
		}
		searchMetricData[line.Metric.Label] = data
	}

	//fetch recent cluster health status
	bucketItem := common.NewBucketItem(
		common.TermsBucket, util.MapStr{
			"field": "metadata.labels.cluster_id",
			"size":  top,
		})

	bucketSizeStr = "1d"
	histgram := common.NewBucketItem(
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

	searchR1, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).SearchWithRawQueryDSL(getAllMetricsIndex(), util.MustToJSONBytes(query))
	if err != nil {
		panic(err)
	}
	searchResponse := SearchResponse{}
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
				"data": indexingMetricData[clustersM[clusterID]],
			},
			"search": util.MapStr{
				"metric": util.MapStr{
					"label": "Search",
					"units": "s",
				},
				"data": searchMetricData[clustersM[clusterID]],
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
	clusterUUID, err := adapter.GetClusterUUID(id)
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
						"bool": util.MapStr{
							"minimum_should_match": 1,
							"should": []util.MapStr{
								{
									"term": util.MapStr{
										"metadata.labels.cluster_id": util.MapStr{
											"value": id,
										},
									},
								},
								{
									"term": util.MapStr{
										"metadata.labels.cluster_uuid": util.MapStr{
											"value": clusterUUID,
										},
									},
								},
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
			availDisk, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "fs", "total", "available_in_bytes"}, hitM)
			totalDisk, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "fs", "total", "total_in_bytes"}, hitM)
			nodeID, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "node_id"}, hitM)
			var usedDisk string
			if v, ok := availDisk.(float64); ok {
				availDisk = util.ByteSize(uint64(v))
				if v1, ok := totalDisk.(float64); ok {
					usedDisk = util.ByteSize(uint64(v1 - v))
				}
			}

			if v, ok := nodeID.(string); ok {
				nodeInfos[v] = util.MapStr{
					"timestamp":    hitM["timestamp"],
					"shards":       totalShards,
					"cpu":          cpu,
					"load_1m":      load,
					"heap.percent": heapUsage,
					"disk.avail":   availDisk,
					"disk.used":    usedDisk,
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

func (h *APIHandler) GetRealtimeClusterNodes(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	meta := elastic.GetMetadata(id)
	if meta == nil || !meta.IsAvailable() {
		log.Debugf("cluster [%s] is not available", id)
		h.WriteJSON(w, []interface{}{}, http.StatusOK)
		return
	}
	esClient := elastic.GetClient(id)
	if esClient == nil {
		h.WriteJSON(w, util.MapStr{
			"error": "cluster not found",
		}, http.StatusNotFound)
		return
	}
	catNodesInfo, err := esClient.CatNodes("id,name,ip,port,master,heap.percent,disk.avail,disk.used,cpu,load_1m,uptime")
	if err != nil {
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	catShardsInfo, err := esClient.CatShards()
	if err != nil {
		log.Error(err)
	}
	shardCounts := map[string]int{}
	nodeM := map[string]string{}
	for _, shardInfo := range catShardsInfo {
		nodeM[shardInfo.NodeName] = shardInfo.NodeID
		if c, ok := shardCounts[shardInfo.NodeName]; ok {
			shardCounts[shardInfo.NodeName] = c + 1
		} else {
			shardCounts[shardInfo.NodeName] = 1
		}
	}
	qps, err := h.getNodeQPS(id, 20)
	if err != nil {
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}

	nodeInfos := []RealtimeNodeInfo{}
	for _, nodeInfo := range catNodesInfo {
		if len(nodeInfo.Id) == 4 { //node short id, use nodeId from shard info isnstead
			nodeInfo.Id = nodeM[nodeInfo.Name]
		}
		if c, ok := shardCounts[nodeInfo.Name]; ok {
			nodeInfo.Shards = c
		}
		info := RealtimeNodeInfo{
			CatNodeResponse: CatNodeResponse(nodeInfo),
		}
		if _, ok := qps[nodeInfo.Id]; ok {
			info.IndexQPS = qps[nodeInfo.Id]["index"]
			info.QueryQPS = qps[nodeInfo.Id]["query"]
			info.IndexBytesQPS = qps[nodeInfo.Id]["index_bytes"]
			if v, ok := qps[nodeInfo.Id]["latest_timestamp"].(float64); ok {
				info.Timestamp = uint64(v)
			}
		}
		nodeInfos = append(nodeInfos, info)
	}
	h.WriteJSON(w, nodeInfos, http.StatusOK)
}

func (h *APIHandler) GetClusterIndices(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	if GetMonitorState(id) == elastic.ModeAgentless {
		h.APIHandler.GetClusterIndices(w, req, ps)
		return
	}
	var (
		//size        = h.GetIntOrDefault(req, "size", 20)
		//from        = h.GetIntOrDefault(req, "from", 0)
		min = h.GetParameterOrDefault(req, "min", "now-15m")
		max = h.GetParameterOrDefault(req, "max", "now")
	)
	resBody := map[string]interface{}{}
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
	if GetMonitorState(id) == elastic.ModeAgentless {
		h.APIHandler.GetRealtimeClusterIndices(w, req, ps)
		return
	}
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

	qps, err := h.getIndexQPS(id, 20)
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
	Timestamp     uint64      `json:"timestamp"`
	CatNodeResponse
}

func (h *APIHandler) getIndexQPS(clusterID string, bucketSizeInSeconds int) (map[string]util.MapStr, error) {
	ver := h.Client().GetVersion()
	bucketSizeStr := fmt.Sprintf("%ds", bucketSizeInSeconds)
	intervalField, err := elastic.GetDateHistogramIntervalField(ver.Distribution, ver.Number, bucketSizeStr)
	if err != nil {
		return nil, err
	}
	clusterUUID, err := adapter.GetClusterUUID(clusterID)
	if err != nil {
		return nil, err
	}
	query := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"term_index": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.index_name",
					"size":  1000,
				},
				"aggs": util.MapStr{
					"date": util.MapStr{
						"date_histogram": util.MapStr{
							"field":       "timestamp",
							intervalField: bucketSizeStr,
						},
						"aggs": util.MapStr{
							"term_shard": util.MapStr{
								"terms": util.MapStr{
									"field": "metadata.labels.shard_id",
									"size":  1000,
								},
								"aggs": util.MapStr{
									"filter_pri": util.MapStr{
										"filter": util.MapStr{"term": util.MapStr{"payload.elasticsearch.shard_stats.routing.primary": true}},
										"aggs": util.MapStr{
											"index_total": util.MapStr{
												"max": util.MapStr{
													"field": "payload.elasticsearch.shard_stats.indexing.index_total",
												},
											},
											"index_bytes_total": util.MapStr{
												"max": util.MapStr{
													"field": "payload.elasticsearch.shard_stats.store.size_in_bytes",
												},
											},
										},
									},
									"query_total": util.MapStr{
										"max": util.MapStr{
											"field": "payload.elasticsearch.shard_stats.search.query_total",
										},
									},
								},
							},
							"index_total": util.MapStr{
								"sum_bucket": util.MapStr{
									"buckets_path": "term_shard>filter_pri>index_total",
								},
							},
							"query_total": util.MapStr{
								"sum_bucket": util.MapStr{
									"buckets_path": "term_shard>query_total",
								},
							},
							"index_bytes_total": util.MapStr{
								"sum_bucket": util.MapStr{
									"buckets_path": "term_shard>filter_pri>index_bytes_total",
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
								"gte": "now-1m",
								"lte": "now",
							},
						},
					},
				},
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.cluster_uuid": util.MapStr{
								"value": clusterUUID,
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.name": util.MapStr{
								"value": "shard_stats",
							},
						},
					},
				},
			},
		},
	}
	return h.QueryQPS(query, bucketSizeInSeconds)
}

func (h *APIHandler) getShardQPS(clusterID string, nodeUUID string, indexName string, bucketSizeInSeconds int) (map[string]util.MapStr, error) {
	ver := h.Client().GetVersion()
	bucketSizeStr := fmt.Sprintf("%ds", bucketSizeInSeconds)
	intervalField, err := elastic.GetDateHistogramIntervalField(ver.Distribution, ver.Number, bucketSizeStr)
	if err != nil {
		return nil, err
	}
	clusterUUID, err := adapter.GetClusterUUID(clusterID)
	if err != nil {
		return nil, err
	}
	must := []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.labels.cluster_uuid": util.MapStr{
					"value": clusterUUID,
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.name": util.MapStr{
					"value": "shard_stats",
				},
			},
		},
	}
	if nodeUUID != "" {
		must = append(must, util.MapStr{
			"term": util.MapStr{
				"metadata.labels.node_id": util.MapStr{
					"value": nodeUUID,
				},
			},
		})
	}
	if indexName != "" {
		must = append(must, util.MapStr{
			"term": util.MapStr{
				"metadata.labels.index_name": util.MapStr{
					"value": indexName,
				},
			},
		})
	}
	query := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"term_shard_id": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.shard_id",
					"size":  5000,
				},
				"aggs": util.MapStr{
					"date": util.MapStr{
						"date_histogram": util.MapStr{
							"field":       "timestamp",
							intervalField: bucketSizeStr,
						},
						"aggs": util.MapStr{
							"query_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.shard_stats.search.query_total",
								},
							},
							"index_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.shard_stats.indexing.index_total",
								},
							},
							"index_bytes_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.shard_stats.store.size_in_bytes",
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
								"gte": "now-1m",
								"lte": "now",
							},
						},
					},
				},
				"must": must,
			},
		},
	}
	return h.QueryQPS(query, bucketSizeInSeconds)
}

func (h *APIHandler) getNodeQPS(clusterID string, bucketSizeInSeconds int) (map[string]util.MapStr, error) {
	ver := h.Client().GetVersion()
	bucketSizeStr := fmt.Sprintf("%ds", bucketSizeInSeconds)
	intervalField, err := elastic.GetDateHistogramIntervalField(ver.Distribution, ver.Number, bucketSizeStr)
	if err != nil {
		return nil, err
	}
	clusterUUID, err := adapter.GetClusterUUID(clusterID)
	if err != nil {
		return nil, err
	}
	query := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"term_node": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.node_id",
					"size":  1000,
				},
				"aggs": util.MapStr{
					"date": util.MapStr{
						"date_histogram": util.MapStr{
							"field":       "timestamp",
							intervalField: bucketSizeStr,
						},
						"aggs": util.MapStr{
							"index_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.node_stats.indices.indexing.index_total",
								},
							},
							"index_bytes_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.node_stats.indices.store.size_in_bytes",
								},
							},
							"query_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.node_stats.indices.search.query_total",
								},
							},
							"index_rate": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "index_total",
								},
							},
							"index_bytes_rate": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "index_bytes_total",
								},
							},
							"query_rate": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "query_total",
								},
							},
							"latest_timestamp": util.MapStr{
								"max": util.MapStr{
									"field": "timestamp",
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
								"gte": "now-1m",
								"lte": "now",
							},
						},
					},
				},
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.cluster_uuid": util.MapStr{
								"value": clusterUUID,
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
	return h.QueryQPS(query, bucketSizeInSeconds)
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

func (h *APIHandler) getClusterMonitorState(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	collectionMode := GetMonitorState(id)
	ret := util.MapStr{
		"cluster_id":             id,
		"metric_collection_mode": collectionMode,
	}
	queryDSL := util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.cluster_id": id,
						},
					},
					{
						"term": util.MapStr{
							"metadata.category": "elasticsearch",
						},
					},
				},
			},
		},
		"size": 0,
		"aggs": util.MapStr{
			"grp_name": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.name",
					"size":  10,
				},
				"aggs": util.MapStr{
					"max_timestamp": util.MapStr{
						"max": util.MapStr{
							"field": "timestamp",
						},
					},
				},
			},
		},
	}
	dsl := util.MustToJSONBytes(queryDSL)
	response, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).SearchWithRawQueryDSL(getAllMetricsIndex(), dsl)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	for _, bk := range response.Aggregations["grp_name"].Buckets {
		key := bk["key"].(string)
		if tv, ok := bk["max_timestamp"].(map[string]interface{}); ok {
			if collectionMode == elastic.ModeAgentless {
				if util.StringInArray([]string{"index_stats", "cluster_health", "cluster_stats", "node_stats"}, key) {
					ret[key] = getCollectionStats(tv["value"])
				}
			} else {
				if util.StringInArray([]string{"shard_stats", "cluster_health", "cluster_stats", "node_stats"}, key) {
					ret[key] = getCollectionStats(tv["value"])
				}
			}
		}

	}
	h.WriteJSON(w, ret, http.StatusOK)
}

func getCollectionStats(lastActiveAt interface{}) util.MapStr {
	stats := util.MapStr{
		"last_active_at": lastActiveAt,
		"status":         "active",
	}
	if timestamp, ok := lastActiveAt.(float64); ok {
		t := time.Unix(int64(timestamp/1000), 0)
		if time.Now().Sub(t) > 5*time.Minute {
			stats["status"] = "warning"
		} else {
			stats["status"] = "ok"
		}
	}
	return stats
}
