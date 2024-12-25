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

package api

import (
	"context"
	"fmt"
	log "github.com/cihub/seelog"
	v1 "infini.sh/console/modules/elastic/api/v1"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/radix"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
	"net/http"
	"time"
)

func (h *APIHandler) SearchNodeMetadata(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody:=util.MapStr{}
	reqBody := struct{
		Keyword string `json:"keyword"`
		Size int `json:"size"`
		From int `json:"from"`
		Aggregations []elastic.SearchAggParam `json:"aggs"`
		Highlight elastic.SearchHighlightParam `json:"highlight"`
		Filter elastic.SearchFilterParam `json:"filter"`
		Sort []string `json:"sort"`
		SearchField string `json:"search_field"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w,resBody, http.StatusInternalServerError )
		return
	}
	aggs := elastic.BuildSearchTermAggregations(reqBody.Aggregations)
	aggs["term_cluster_id"] = util.MapStr{
		"terms": util.MapStr{
			"field": "metadata.cluster_id",
				"size": 1000,
		},
		"aggs": util.MapStr{
			"term_cluster_name": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.cluster_name",
						"size": 1,
				},
			},
		},
	}
	var should =[]util.MapStr{}
	if reqBody.SearchField != ""{
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
						"query":                reqBody.Keyword,
						"fuzziness":            "AUTO",
						"max_expansions":       10,
						"prefix_length":        2,
						"fuzzy_transpositions": true,
						"boost":                2,
					},
				},
			},
		}
	}else{
		should = []util.MapStr{
			{
				"prefix": util.MapStr{
					"metadata.node_name": util.MapStr{
						"value": reqBody.Keyword,
						"boost": 20,
					},
				},
			},
			{
				"prefix": util.MapStr{
					"metadata.host": util.MapStr{
						"value": reqBody.Keyword,
						"boost": 20,
					},
				},
			},
			{
				"prefix": util.MapStr{
					"metadata.cluster_name": util.MapStr{
						"value": reqBody.Keyword,
						"boost": 15,
					},
				},
			},
			{
				"match": util.MapStr{
					"search_text": util.MapStr{
						"query":                reqBody.Keyword,
						"fuzziness":            "AUTO",
						"max_expansions":       10,
						"prefix_length":        2,
						"fuzzy_transpositions": true,
						"boost":                2,
					},
				},
			},
		}
	}
	clusterFilter, hasPrivilege := h.GetClusterFilter(req, "metadata.cluster_id")
	if !hasPrivilege && clusterFilter == nil {
		h.WriteJSON(w, elastic.SearchResponse{

		}, http.StatusOK)
		return
	}
	must := []interface{}{
	}
	if !hasPrivilege && clusterFilter != nil {
		must = append(must, clusterFilter)
	}



	query := util.MapStr{
		"aggs":      aggs,
		"size":      reqBody.Size,
		"from": reqBody.From,
		"highlight": elastic.BuildSearchHighlight(&reqBody.Highlight),
		"query": util.MapStr{
			"bool": util.MapStr{
				"minimum_should_match": 1,
				"filter": elastic.BuildSearchTermFilter(reqBody.Filter),
				"should": should,
				"must": must,
			},
		},
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
	}
	if len(reqBody.Sort) > 1 {
		query["sort"] =  []util.MapStr{
			{
				reqBody.Sort[0]: util.MapStr{
					"order": reqBody.Sort[1],
				},
			},
		}
	}
	dsl := util.MustToJSONBytes(query)
	response, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).SearchWithRawQueryDSL(orm.GetIndexName(elastic.NodeConfig{}), dsl)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w,resBody, http.StatusInternalServerError )
		return
	}
	w.Write(util.MustToJSONBytes(response))
}

func (h *APIHandler) FetchNodeInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var nodeIDs = []string{}
	h.DecodeJSON(req, &nodeIDs)

	if len(nodeIDs) == 0 {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	//only query one node info for fast response
	nodeIDs = nodeIDs[0:1]
	timeout := h.GetParameterOrDefault(req, "timeout", "60s")
	du, err := time.ParseDuration(timeout)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), du)
	defer cancel()

	q1 := orm.Query{WildcardIndex: true}
	query := util.MapStr{
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
		"collapse": util.MapStr{
			"field": "metadata.labels.node_id",
		},
		"query": util.MapStr{
			"bool": util.MapStr{
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
							"metadata.name": util.MapStr{
								"value": "node_stats",
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.labels.node_id": nodeIDs[0],
						},
					},
				},
			},
		},
	}
	q1.RawQuery = util.MustToJSONBytes(query)

	err, results := orm.Search(&event.Event{}, &q1)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	statusMap := map[string]interface{}{}
	for _, v := range results.Result {
		result, ok := v.(map[string]interface{})
		if ok {
			nodeID, ok := util.GetMapValueByKeys([]string{"metadata", "labels", "node_id"}, result)
			if ok {
				source := map[string]interface{}{}
				//timestamp, ok := result["timestamp"].(string)
				uptime, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "jvm", "uptime_in_millis"}, result)
				if ok {
					source["uptime"] = uptime
				}

				fsTotal, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "fs", "total"}, result)
				if ok {
					source["fs"] = util.MapStr{
						"total": fsTotal,
					}
				}

				jvmMem, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "jvm", "mem"}, result)
				if ok {
					source["jvm"] = util.MapStr{
						"mem": jvmMem,
					}
				}
				indices := util.MapStr{}
				docs, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "indices", "docs"}, result)
				if ok {
					indices["docs"] = docs
				}
				source["indices"] = indices
				shardInfo, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "shard_info"}, result)
				if ok {
					source["shard_info"] = shardInfo
				}
				if tempClusterID, ok := util.GetMapValueByKeys([]string{"metadata", "labels", "cluster_id"}, result); ok {
					if clusterID, ok :=  tempClusterID.(string); ok {
						if meta := elastic.GetMetadata(clusterID); meta != nil && meta.ClusterState != nil {
							source["is_master_node"] = meta.ClusterState.MasterNode == nodeID
						}
					}
				}

				statusMap[util.ToString(nodeID)] = source
			}
		}
	}
	statusMetric, err := getNodeOnlineStatusOfRecentDay(nodeIDs)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// 索引速率
	indexMetric:=newMetricItem("indexing", 1, OperationGroupKey)
	indexMetric.AddAxi("indexing rate","group1",common.PositionLeft,"num","0,0","0,0.[00]",5,true)
	nodeMetricItems := []GroupMetricItem{}
	nodeMetricItems=append(nodeMetricItems, GroupMetricItem{
		Key: "indexing",
		Field: "payload.elasticsearch.node_stats.indices.indexing.index_total",
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
		Field: "payload.elasticsearch.node_stats.indices.search.query_total",
		ID: util.GetUUID(),
		IsDerivative: true,
		MetricItem: queryMetric,
		FormatType: "num",
		Units: "Search/s",
	})

	bucketSize := GetMinBucketSize()
	if bucketSize < 60 {
		bucketSize = 60
	}
	var metricLen = 15
	aggs:=map[string]interface{}{}
	query=map[string]interface{}{}
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
							"value": "node_stats",
						},
					},
				},
				{
					"term": util.MapStr{
						"metadata.labels.node_id": nodeIDs[0],
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
				"field": "metadata.labels.node_id",
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
	result := util.MapStr{}
	for _, nodeID := range nodeIDs {
		source := util.MapStr{}

		source["summary"] = statusMap[nodeID]
		source["metrics"] = util.MapStr{
			"status": util.MapStr{
				"metric": util.MapStr{
					"label": "Recent Node Status",
					"units": "day",
				},
				"data": statusMetric[nodeID],
			},
			"indexing": util.MapStr{
				"metric": util.MapStr{
					"label": "Indexing",
					"units": "s",
				},
				"data": indexMetrics[nodeID]["indexing"],
			},
			"search": util.MapStr{
				"metric": util.MapStr{
					"label": "Search",
					"units": "s",
				},
				"data": indexMetrics[nodeID]["search"],
			},
		}
		result[nodeID] = source
	}
	h.WriteJSON(w, result, http.StatusOK)
}

func (h *APIHandler) GetNodeInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	nodeID := ps.MustGetParameter("node_id")

	q := orm.Query{
		Size: 1,
	}
	q.AddSort("timestamp", orm.DESC)
	q.Conds = orm.And(orm.Eq("metadata.node_id", nodeID), orm.Eq("metadata.cluster_id", clusterID))

	err, res := orm.Search(&elastic.NodeConfig{}, &q)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := elastic.SearchResponse{}
	util.FromJSONBytes(res.Raw, &response)
	//if len(response.Hits.Hits) == 0 {
	//	h.WriteError(w, "", http.StatusNotFound)
	//	return
	//}
	q1 := orm.Query{
		Size: 1,
		WildcardIndex: true,
	}
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.name", "node_stats"),
		orm.Eq("metadata.labels.node_id", nodeID),
	)
	q1.Collapse("metadata.labels.node_id")
	q1.AddSort("timestamp", orm.DESC)
	err, result := orm.Search(&event.Event{}, &q1)
	kvs := util.MapStr{}
	if len(result.Result) > 0 {
		vresult, ok := result.Result[0].(map[string]interface{})
		if ok {
			transportAddress, ok := util.GetMapValueByKeys([]string{"metadata", "labels", "transport_address"}, vresult)
			if ok {
				kvs["transport_address"] = transportAddress
			}
			kvs["timestamp"] = vresult["timestamp"]
			if vresult["timestamp"] != nil {
				if ts, ok := vresult["timestamp"].(string); ok {
					tt, _ := time.Parse(time.RFC3339, ts)
					if time.Now().Sub(tt).Seconds() > 30 {
						kvs["status"] = "unavailable"
					}else{
						kvs["status"] = "available"
					}
				}
			}
			roles, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "roles"}, vresult)
			if ok {
				kvs["roles"] = roles
			}
			fsTotal, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "fs", "total"}, vresult)
			if ok {
				kvs["fs"] = util.MapStr{
					"total": fsTotal,
				}
			}

			jvm, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "jvm"}, vresult)
			if ok {
				if jvmVal, ok := jvm.(map[string]interface{});ok {
					kvs["jvm"] = util.MapStr{
						"mem": jvmVal["mem"],
						"uptime": jvmVal["uptime_in_millis"],
					}
				}
			}
			indices := util.MapStr{}
			docs, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "indices", "docs"}, vresult)
			if ok {
				indices["docs"] = docs
			}
			store, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "indices", "store"}, vresult)
			if ok {
				indices["store"] = store
			}
			kvs["indices"] = indices
			shardInfo, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "shard_info"}, vresult)
			if ok {
				kvs["shard_info"] = shardInfo
			}
		}
	}
	if len( response.Hits.Hits) > 0 {
		hit := response.Hits.Hits[0]
		innerMetaData, _ := util.GetMapValueByKeys([]string{"metadata", "labels"}, hit.Source)
		if mp, ok := innerMetaData.(map[string]interface{}); ok {
			kvs["transport_address"] = mp["transport_address"]
			kvs["roles"] = mp["roles"]
			if kvs["status"] != "available" {
				kvs["status"] = mp["status"]
				kvs["timestamp"] = hit.Source["timestamp"]
			}
		}
	}

	if meta := elastic.GetMetadata(clusterID); meta != nil && meta.ClusterState != nil {
		kvs["is_master_node"] = meta.ClusterState.MasterNode == nodeID
	}
	h.WriteJSON(w, kvs, http.StatusOK)
}

const (
	NodeCPUJVMMetricKey = "jvm"
	NodeHealthMetricKey = "node_health"
	ShardStateMetricKey = "shard_state"
)

func (h *APIHandler) GetSingleNodeMetrics(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	clusterUUID, err := h.getClusterUUID(clusterID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	should := []util.MapStr{
		{
			"term":util.MapStr{
				"metadata.labels.cluster_id":util.MapStr{
					"value": clusterID,
				},
			},
		},
		{
			"term":util.MapStr{
				"metadata.labels.cluster_uuid":util.MapStr{
					"value": clusterUUID,
				},
			},
		},
	}
	nodeID := ps.MustGetParameter("node_id")
	var must = []util.MapStr{
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
		{
			"term": util.MapStr{
				"metadata.labels.node_id": util.MapStr{
					"value": nodeID,
				},
			},
		},
	}
	resBody := map[string]interface{}{}
	bucketSize, min, max, err := h.GetMetricRangeAndBucketSize(req,clusterID, v1.MetricTypeNodeStats,60)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	query:=map[string]interface{}{}
	query["query"]=util.MapStr{
		"bool": util.MapStr{
			"must": must,
			"minimum_should_match": 1,
			"should": should,
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

	bucketSizeStr:=fmt.Sprintf("%vs",bucketSize)
	metricItems:=[]*common.MetricItem{}
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
	if metricKey == NodeHealthMetricKey {
		healthMetric, err := getNodeHealthMetric(ctx, query, bucketSize)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		metrics["node_health"] = healthMetric
	}else if metricKey == ShardStateMetricKey {
		query = util.MapStr{
			"size": 0,
			"query": util.MapStr{
				"bool": util.MapStr{
					"minimum_should_match": 1,
					"should": should,
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
								"metadata.name": util.MapStr{
									"value": "shard_stats",
								},
							},
						},
						{
							"term": util.MapStr{
								"metadata.labels.node_id": util.MapStr{
									"value": nodeID,
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
		}
		shardStateMetric, err := getNodeShardStateMetric(ctx, query, bucketSize)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		metrics["shard_state"] = shardStateMetric
	}else{
		switch metricKey {
		case NodeProcessCPUMetricKey:
			metricItem:=newMetricItem("cpu", 1, SystemGroupKey)
			metricItem.AddAxi("cpu","group1",common.PositionLeft,"ratio","0.[0]","0.[0]",5,true)
			metricItem.AddLine("Process CPU","Process CPU","process cpu used percent of node.","group1","payload.elasticsearch.node_stats.process.cpu.percent","max",bucketSizeStr,"%","num","0,0.[00]","0,0.[00]",false,false)
			metricItem.AddLine("OS CPU","OS CPU","process cpu used percent of node.","group1","payload.elasticsearch.node_stats.os.cpu.percent","max",bucketSizeStr,"%","num","0,0.[00]","0,0.[00]",false,false)
			metricItems=append(metricItems,metricItem)
		case NodeCPUJVMMetricKey:
			metricItem := newMetricItem("jvm", 2, SystemGroupKey)
			metricItem.AddAxi("JVM Heap","group1",common.PositionLeft,"bytes","0.[0]","0.[0]",5,true)
			metricItem.AddLine("Max Heap","Max Heap","JVM max Heap of node.","group1","payload.elasticsearch.node_stats.jvm.mem.heap_max_in_bytes","max",bucketSizeStr,"","bytes","0,0.[00]","0,0.[00]",false,false)
			metricItem.AddLine("Used Heap","Used Heap","JVM used Heap of node.","group1","payload.elasticsearch.node_stats.jvm.mem.heap_used_in_bytes","max",bucketSizeStr,"","bytes","0,0.[00]","0,0.[00]",false,false)
			metricItems=append(metricItems,metricItem)
		case v1.IndexThroughputMetricKey:
			metricItem := newMetricItem("index_throughput", 3, OperationGroupKey)
			metricItem.AddAxi("indexing","group1",common.PositionLeft,"num","0,0","0,0.[00]",5,true)
			metricItem.AddLine("Indexing Rate","Total Shards","Number of documents being indexed for node.","group1","payload.elasticsearch.node_stats.indices.indexing.index_total","max",bucketSizeStr,"doc/s","num","0,0.[00]","0,0.[00]",false,true)
			metricItems=append(metricItems,metricItem)
		case v1.SearchThroughputMetricKey:
			metricItem := newMetricItem("search_throughput", 4, OperationGroupKey)
			metricItem.AddAxi("searching","group1",common.PositionLeft,"num","0,0","0,0.[00]",5,false)
			metricItem.AddLine("Search Rate","Total Shards",
				"Number of search requests being executed.",
				"group1","payload.elasticsearch.node_stats.indices.search.query_total","max",bucketSizeStr,"query/s","num","0,0.[00]","0,0.[00]",false,true)
			metricItems=append(metricItems,metricItem)
		case v1.IndexLatencyMetricKey:
			metricItem := newMetricItem("index_latency", 5, LatencyGroupKey)
			metricItem.AddAxi("indexing","group1",common.PositionLeft,"num","0,0","0,0.[00]",5,true)

			metricItem.AddLine("Indexing","Indexing Latency","Average latency for indexing documents.","group1","payload.elasticsearch.node_stats.indices.indexing.index_time_in_millis","max",bucketSizeStr,"ms","num","0,0.[00]","0,0.[00]",false,true)
			metricItem.Lines[0].Metric.Field2 = "payload.elasticsearch.node_stats.indices.indexing.index_total"
			metricItem.Lines[0].Metric.Calc = func(value, value2 float64) float64 {
				return value/value2
			}
			metricItem.AddLine("Indexing","Delete Latency","Average latency for delete documents.","group1","payload.elasticsearch.node_stats.indices.indexing.delete_time_in_millis","max",bucketSizeStr,"ms","num","0,0.[00]","0,0.[00]",false,true)
			metricItem.Lines[1].Metric.Field2 = "payload.elasticsearch.node_stats.indices.indexing.delete_total"
			metricItem.Lines[1].Metric.Calc = func(value, value2 float64) float64 {
				return value/value2
			}
			metricItems=append(metricItems,metricItem)
		case v1.SearchLatencyMetricKey:
			metricItem := newMetricItem("search_latency", 6, LatencyGroupKey)
			metricItem.AddAxi("searching","group2",common.PositionLeft,"num","0,0","0,0.[00]",5,false)

			metricItem.AddLine("Searching","Query Latency","Average latency for searching query.","group2","payload.elasticsearch.node_stats.indices.search.query_time_in_millis","max",bucketSizeStr,"ms","num","0,0.[00]","0,0.[00]",false,true)
			metricItem.Lines[0].Metric.Field2 = "payload.elasticsearch.node_stats.indices.search.query_total"
			metricItem.Lines[0].Metric.Calc = func(value, value2 float64) float64 {
				return value/value2
			}
			metricItem.AddLine("Searching","Fetch Latency","Average latency for searching fetch.","group2","payload.elasticsearch.node_stats.indices.search.fetch_time_in_millis","max",bucketSizeStr,"ms","num","0,0.[00]","0,0.[00]",false,true)
			metricItem.Lines[1].Metric.Field2 = "payload.elasticsearch.node_stats.indices.search.fetch_total"
			metricItem.Lines[1].Metric.Calc = func(value, value2 float64) float64 {
				return value/value2
			}
			metricItem.AddLine("Searching","Scroll Latency","Average latency for searching fetch.","group2","payload.elasticsearch.node_stats.indices.search.scroll_time_in_millis","max",bucketSizeStr,"ms","num","0,0.[00]","0,0.[00]",false,true)
			metricItem.Lines[2].Metric.Field2 = "payload.elasticsearch.node_stats.indices.search.scroll_total"
			metricItem.Lines[2].Metric.Calc = func(value, value2 float64) float64 {
				return value/value2
			}
			metricItems=append(metricItems,metricItem)
		case ParentBreakerMetricKey:
			metricItem := newMetricItem("parent_breaker", 8, SystemGroupKey)
			metricItem.AddLine("Parent Breaker Tripped","Parent Breaker Tripped","Rate of the circuit breaker has been triggered and prevented an out of memory error.","group1","payload.elasticsearch.node_stats.breakers.parent.tripped","max",bucketSizeStr,"times/s","num","0,0.[00]","0,0.[00]",false,true)
			metricItems=append(metricItems,metricItem)
		}

		metrics, err = h.getSingleMetrics(ctx, metricItems,query, bucketSize)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err, http.StatusInternalServerError)
			return
		}
	}

	resBody["metrics"] = metrics
	h.WriteJSON(w, resBody, http.StatusOK)
}

func getNodeShardStateMetric(ctx context.Context, query util.MapStr, bucketSize int)(*common.MetricItem, error){
	bucketSizeStr:=fmt.Sprintf("%vs",bucketSize)
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		return nil, err
	}

	query["aggs"] = util.MapStr{
		"dates": util.MapStr{
			"date_histogram": util.MapStr{
				"field": "timestamp",
				intervalField: bucketSizeStr,
			},
			"aggs": util.MapStr{
				"groups": util.MapStr{
					"terms": util.MapStr{
						"field": "payload.elasticsearch.shard_stats.routing.state",
						"size": 10,
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

	metricItem:=newMetricItem("shard_state", 0, "")
	metricItem.AddLine("Shard State","Shard State","","group1","payload.elasticsearch.shard_stats.routing.state","count",bucketSizeStr,"","ratio","0.[00]","0.[00]",false,false)

	metricData := []interface{}{}
	if response.StatusCode == 200 {
		metricData, err = parseGroupMetricData(response.Aggregations["dates"].Buckets, false)
		if err != nil {
			return nil, err
		}
	}
	metricItem.Lines[0].Data = metricData
	metricItem.Lines[0].Type = common.GraphTypeBar
	metricItem.Request = string(queryDSL)
	return metricItem, nil
}

func getNodeHealthMetric(ctx context.Context, query util.MapStr, bucketSize int)(*common.MetricItem, error){
	bucketSizeStr:=fmt.Sprintf("%vs",bucketSize)
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		return nil, err
	}
	query["aggs"] = util.MapStr{
		"dates": util.MapStr{
			"date_histogram": util.MapStr{
				"field": "timestamp",
				intervalField: bucketSizeStr,
			},
			"aggs": util.MapStr{
				"min_uptime": util.MapStr{
					"min": util.MapStr{
						"field": "payload.elasticsearch.node_stats.jvm.uptime_in_millis",
					},
				},
			},
		},
	}
	queryDSL := util.MustToJSONBytes(query)
	response, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).QueryDSL(ctx, getAllMetricsIndex(), nil,  queryDSL)
	if err != nil {
		log.Error(err)
		return nil, err
	}

	metricItem:=newMetricItem("node_health", 0, "")
	metricItem.AddLine("Node health","Node Health","","group1","payload.elasticsearch.node_stats.jvm.uptime_in_millis","min",bucketSizeStr,"%","ratio","0.[00]","0.[00]",false,false)

	metricData := []interface{}{}
	if response.StatusCode == 200 {
		for _, bucket := range response.Aggregations["dates"].Buckets {
			v, ok := bucket["key"].(float64)
			if !ok {
				log.Error("invalid bucket key")
				return nil, fmt.Errorf("invalid bucket key")
			}
			dateTime := int64(v)
			statusKey := "available"
			if uptimeAgg, ok := bucket["min_uptime"].(map[string]interface{}); ok {
				if _, ok = uptimeAgg["value"].(float64); !ok {
					statusKey = "unavailable"
				}
				metricData = append(metricData, map[string]interface{}{
					"x": dateTime,
					"y": 100,
					"g": statusKey,
				})
			}
		}
	}
	metricItem.Request = string(queryDSL)
	metricItem.Lines[0].Data = metricData
	metricItem.Lines[0].Type = common.GraphTypeBar
	return metricItem, nil
}

func getNodeOnlineStatusOfRecentDay(nodeIDs []string)(map[string][]interface{}, error){
	q := orm.Query{
		WildcardIndex: true,
	}
	query := util.MapStr{
		"aggs": util.MapStr{
			"group_by_node_id": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.node_id",
						"size": 100,
				},
				"aggs": util.MapStr{
					"uptime_histogram": util.MapStr{
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
							"min_uptime": util.MapStr{
								"min": util.MapStr{
									"field": "payload.elasticsearch.node_stats.jvm.uptime_in_millis",
								},
							},
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
								"gte":"now-15d",
								"lte": "now",
							},
						},
					},
				},
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.name": util.MapStr{
								"value": "node_stats",
							},
						},
					},
					{
						"terms": util.MapStr{
							"metadata.labels.node_id": nodeIDs,
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
	for _, bk := range response.Aggregations["group_by_node_id"].Buckets {
		nodeKey := bk["key"].(string)
		recentStatus[nodeKey] = []interface{}{}
		if histogramAgg, ok := bk["uptime_histogram"].(map[string]interface{}); ok {
			if bks, ok := histogramAgg["buckets"].([]interface{}); ok {
				for _, bkItem := range  bks {
					if bkVal, ok := bkItem.(map[string]interface{}); ok {
						if minUptime, ok := util.GetMapValueByKeys([]string{"min_uptime", "value"}, bkVal); ok {
							//mark node status as offline when uptime less than 10m
							if v, ok := minUptime.(float64); ok && v >= 600000 {
								recentStatus[nodeKey] = append(recentStatus[nodeKey], []interface{}{bkVal["key"], "online"})
							}else{
								recentStatus[nodeKey] = append(recentStatus[nodeKey], []interface{}{bkVal["key"], "offline"})
							}
						}
					}
				}
			}
		}
	}
	return recentStatus, nil
}

func (h *APIHandler) getNodeIndices(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		min = h.GetParameterOrDefault(req, "min", "now-15m")
		max = h.GetParameterOrDefault(req, "max", "now")
	)

	resBody := map[string] interface{}{}
	id := ps.ByName("id")
	nodeUUID := ps.ByName("node_id")
	q := &orm.Query{ Size: 1}
	q.AddSort("timestamp", orm.DESC)
	q.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.labels.cluster_id", id),
		orm.Eq("metadata.labels.node_id", nodeUUID),
		orm.Eq("metadata.name", "node_routing_table"),
	)

	err, result := orm.Search(event.Event{}, q)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w,resBody, http.StatusInternalServerError )
	}
	namesM := util.MapStr{}
	if len(result.Result) > 0 {
		if data, ok := result.Result[0].(map[string]interface{}); ok {
			if routingTable, exists := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_routing_table"}, data); exists {
				if rows, ok := routingTable.([]interface{}); ok{
					for _, row := range rows {
						if v, ok := row.(map[string]interface{}); ok {
							if indexName, ok := v["index"].(string); ok{
								namesM[indexName] = true
							}
						}
					}
				}
			}
		}
	}

	indexNames := make([]interface{}, 0, len(namesM) )
	for name, _ := range namesM {
		indexNames = append(indexNames, name)
	}

	q1 := &orm.Query{ Size: 100}
	q1.AddSort("timestamp", orm.DESC)
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.cluster_id", id),
		orm.In("metadata.index_name", indexNames),
		orm.NotEq("metadata.labels.index_status", "deleted"),
	)
	err, result = orm.Search(elastic.IndexConfig{}, q1)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w,resBody, http.StatusInternalServerError )
	}

	indices, err := h.getLatestIndices(req, min, max, id, &result)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w,resBody, http.StatusInternalServerError )
	}

	h.WriteJSON(w, indices, http.StatusOK)
}

type ShardsSummary struct {
	Index        string `json:"index"`
	Shards       int `json:"shards"`
	Replicas     int `json:"replicas"`
	DocsCount    int64 `json:"docs_count"`
	DocsDeleted    int64 `json:"docs_deleted"`
	StoreInBytes int64 `json:"store_in_bytes"`
	PriStoreInBytes int64 `json:"pri_store_in_bytes"`
	Timestamp interface{} `json:"timestamp"`
}
func (h *APIHandler) getLatestIndices(req *http.Request, min string, max string, clusterID string, result *orm.Result) ([]interface{}, error) {
	//filter indices
	allowedIndices, hasAllPrivilege := h.GetAllowedIndices(req, clusterID)
	if !hasAllPrivilege && len(allowedIndices) == 0 {
		return []interface{}{}, nil
	}
	clusterUUID, err := h.getClusterUUID(clusterID)
	if err != nil {
		return nil, err
	}

	query := util.MapStr{
		"size":    10000,
		"_source": []string{"metadata.labels.index_name", "payload.elasticsearch.shard_stats.docs","payload.elasticsearch.shard_stats.store", "payload.elasticsearch.shard_stats.routing", "timestamp"},
		"collapse": util.MapStr{
			"field": "metadata.labels.shard_id",
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
	q := &orm.Query{RawQuery: util.MustToJSONBytes(query), WildcardIndex: true}
	err, searchResult := orm.Search(event.Event{}, q)
	if err != nil {
		return nil, err
	}
	indexInfos := map[string]*ShardsSummary{}
	for _, hit := range searchResult.Result {
		if hitM, ok := hit.(map[string]interface{}); ok {
			shardDocCount, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "shard_stats", "docs", "count"}, hitM)
			storeInBytes, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "shard_stats", "store", "size_in_bytes"}, hitM)
			indexName, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "index_name"}, hitM)
			primary, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "shard_stats", "routing", "primary"}, hitM)
			if v, ok := indexName.(string); ok {
				if _, ok = indexInfos[v]; !ok {
					indexInfos[v] = &ShardsSummary{}
				}
				indexInfo := indexInfos[v]
				indexInfo.Index = v
				if count, ok := shardDocCount.(float64); ok && primary == true {
					indexInfo.DocsCount += int64(count)
				}
				if storeSize, ok := storeInBytes.(float64); ok {
					indexInfo.StoreInBytes += int64(storeSize)
				}
				if primary == true {
					indexInfo.Shards++
				}else{
					indexInfo.Replicas++
				}
				indexInfo.Timestamp = hitM["timestamp"]
			}
		}
	}
	indices := []interface{}{}
	var indexPattern *radix.Pattern
	if !hasAllPrivilege{
		indexPattern = radix.Compile(allowedIndices...)
	}

	for _, hit := range result.Result {
		if hitM, ok := hit.(map[string]interface{}); ok {
			indexName, _ := util.GetMapValueByKeys([]string{"metadata", "index_name"}, hitM)
			state, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "state"}, hitM)
			health, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "health_status"}, hitM)
			if state == "delete" {
				health = "N/A"
			}
			shards, _ := util.GetMapValueByKeys([]string{"payload", "index_state", "settings", "index", "number_of_shards"}, hitM)
			replicas, _ := util.GetMapValueByKeys([]string{"payload", "index_state", "settings", "index", "number_of_replicas"}, hitM)
			shardsNum, _ := util.ToInt(shards.(string))
			replicasNum, _ := util.ToInt(replicas.(string))
			if v, ok := indexName.(string); ok {
				if indexPattern != nil {
					if !indexPattern.Match(v) {
						continue
					}
				}
				if indexInfos[v] != nil {
					indices = append(indices, util.MapStr{
						"index":     v,
						"status":    state,
						"health": health,
						"timestamp": indexInfos[v].Timestamp,
						"docs_count": indexInfos[v].DocsCount,
						"shards": indexInfos[v].Shards,
						"replicas": replicasNum,
						"unassigned_shards": (replicasNum + 1) * shardsNum - indexInfos[v].Shards - replicasNum,
						"store_size": util.FormatBytes(float64(indexInfos[v].StoreInBytes), 1),
					})
				} else {
					indices = append(indices, util.MapStr{
						"index":     v,
						"status":    state,
						"health": health,
						"timestamp": hitM["timestamp"],
					})
				}
			}
		}
	}
	return indices, nil
}


func (h *APIHandler) GetNodeShards(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	if GetMonitorState(clusterID) == elastic.ModeAgentless {
		h.APIHandler.GetNodeShards(w, req, ps)
		return
	}
	nodeID := ps.MustGetParameter("node_id")
	q1 := orm.Query{
		Size: 1000,
		WildcardIndex: true,
		CollapseField: "metadata.labels.shard_id",
	}
	clusterUUID, err := h.getClusterUUID(clusterID)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.name", "shard_stats"),
		orm.Eq("metadata.labels.node_id", nodeID),
		orm.Eq("metadata.labels.cluster_uuid", clusterUUID),
		orm.Ge("timestamp", "now-15m"),
	)
	q1.AddSort("timestamp", orm.DESC)
	err, result := orm.Search(&event.Event{}, &q1)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError )
		return
	}
	var shards = []interface{}{}
	if len(result.Result) > 0 {
		qps, err := h.getShardQPS(clusterID, nodeID, "", 20)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		for _, item := range result.Result {
			row, ok := item.(map[string]interface{})
			if ok {
				source := util.MapStr(row)
				shardV, err := source.GetValue("payload.elasticsearch.shard_stats")
				if err != nil {
					log.Error(err)
					continue
				}
				shardInfo := util.MapStr{}
				shardInfo["id"], _ = source.GetValue("metadata.labels.node_id")
				shardInfo["index"], _ = source.GetValue("metadata.labels.index_name")
				shardInfo["ip"], _ = source.GetValue("metadata.labels.ip")
				shardInfo["node"], _ = source.GetValue("metadata.labels.node_name")
				shardInfo["shard"], _ = source.GetValue("metadata.labels.shard")
				shardInfo["shard_id"], _ = source.GetValue("metadata.labels.shard_id")
				if v, ok := shardV.(map[string]interface{}); ok {
					shardM := util.MapStr(v)
					shardInfo["docs"], _ = shardM.GetValue("docs.count")
					primary, _ := shardM.GetValue("routing.primary")
					if primary == true {
						shardInfo["prirep"] = "p"
					}else{
						shardInfo["prirep"] = "r"
					}
					shardInfo["state"], _ = shardM.GetValue("routing.state")
					shardInfo["store_in_bytes"], _ = shardM.GetValue("store.size_in_bytes")
				}

				if v, ok := shardInfo["shard_id"].(string); ok {
					shardInfo["index_qps"] = qps[v]["index"]
					shardInfo["query_qps"] = qps[v]["query"]
					shardInfo["index_bytes_qps"] = qps[v]["index_bytes"]
				}
				shards = append(shards, shardInfo)
			}
		}
	}

	h.WriteJSON(w, shards, http.StatusOK)
}

//deleteNodeMetadata used to clean node metadata after node is offline and not active within 7 days
func (h APIHandler) deleteNodeMetadata(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	indexName := orm.GetIndexName(elastic.NodeConfig{})
	dsl := util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.status": "unavailable",
						},
					},
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"lt": "now-7d",
							},
						},
					},
				},
			},
		},
	}
	_, err := esClient.DeleteByQuery(indexName, util.MustToJSONBytes(dsl))
	if err != nil {
		h.WriteError(w, err, http.StatusInternalServerError)
	}
	h.WriteAckOKJSON(w)
}