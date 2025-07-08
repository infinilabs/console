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
	"net/http"
	"strings"
	"time"

	log "github.com/cihub/seelog"
	v1 "infini.sh/console/modules/elastic/api/v1"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/adapter"
	"infini.sh/framework/modules/elastic/common"
)

func (h *APIHandler) SearchIndexMetadata(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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
	aggs := elastic.BuildSearchTermAggregations(reqBody.Aggregations)
	aggs["term_cluster_id"] = util.MapStr{
		"terms": util.MapStr{
			"field": "metadata.cluster_id",
			"size":  1000,
		},
		"aggs": util.MapStr{
			"term_cluster_name": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.cluster_name",
					"size":  1,
				},
			},
		},
	}
	filter := elastic.BuildSearchTermFilter(reqBody.Filter)
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
	} else {
		if reqBody.Keyword != "" {
			should = []util.MapStr{
				{
					"prefix": util.MapStr{
						"metadata.index_name": util.MapStr{
							"value": reqBody.Keyword,
							"boost": 30,
						},
					},
				},
				{
					"prefix": util.MapStr{
						"metadata.aliases": util.MapStr{
							"value": reqBody.Keyword,
							"boost": 20,
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
				{
					"query_string": util.MapStr{
						"fields":                 []string{"*"},
						"query":                  reqBody.Keyword,
						"fuzziness":              "AUTO",
						"fuzzy_prefix_length":    2,
						"fuzzy_max_expansions":   10,
						"fuzzy_transpositions":   true,
						"allow_leading_wildcard": false,
					},
				},
			}
		}
	}

	must := []interface{}{}
	if indexFilter, hasIndexPri := h.getAllowedIndexFilter(req); hasIndexPri {
		if indexFilter != nil {
			must = append(must, indexFilter)
		}
	} else {
		h.WriteJSON(w, elastic.SearchResponse{}, http.StatusOK)
		return
	}
	boolQuery := util.MapStr{
		"must_not": []util.MapStr{
			{
				"term": util.MapStr{
					"metadata.labels.index_status": "deleted",
				},
			},
		},
		"filter": filter,
		"must":   must,
	}
	if len(should) > 0 {
		boolQuery["should"] = should
		boolQuery["minimum_should_match"] = 1
	}
	query := util.MapStr{
		"aggs":      aggs,
		"size":      reqBody.Size,
		"from":      reqBody.From,
		"highlight": elastic.BuildSearchHighlight(&reqBody.Highlight),
		"query": util.MapStr{
			"bool": boolQuery,
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
		query["sort"] = []util.MapStr{
			{
				reqBody.Sort[0]: util.MapStr{
					"order": reqBody.Sort[1],
				},
			},
		}
	}
	dsl := util.MustToJSONBytes(query)
	response, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).SearchWithRawQueryDSL(orm.GetIndexName(elastic.IndexConfig{}), dsl)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	w.Write(util.MustToJSONBytes(response))

}

func (h *APIHandler) getAllowedIndexFilter(req *http.Request) (util.MapStr, bool) {
	hasAllPrivilege, indexPrivilege := h.GetCurrentUserIndex(req)
	if !hasAllPrivilege && len(indexPrivilege) == 0 {
		return nil, false
	}
	if !hasAllPrivilege {
		indexShould := make([]interface{}, 0, len(indexPrivilege))
		for clusterID, indices := range indexPrivilege {
			var (
				wildcardIndices []string
				normalIndices   []string
			)
			for _, index := range indices {
				if strings.Contains(index, "*") {
					wildcardIndices = append(wildcardIndices, index)
					continue
				}
				normalIndices = append(normalIndices, index)
			}
			subShould := []util.MapStr{}
			if len(wildcardIndices) > 0 {
				subShould = append(subShould, util.MapStr{
					"query_string": util.MapStr{
						"query":            strings.Join(wildcardIndices, " "),
						"fields":           []string{"metadata.index_name"},
						"default_operator": "OR",
					},
				})
			}
			if len(normalIndices) > 0 {
				subShould = append(subShould, util.MapStr{
					"terms": util.MapStr{
						"metadata.index_name": normalIndices,
					},
				})
			}
			indexShould = append(indexShould, util.MapStr{
				"bool": util.MapStr{
					"must": []util.MapStr{
						{
							"wildcard": util.MapStr{
								"metadata.cluster_id": util.MapStr{
									"value": clusterID,
								},
							},
						},
						{
							"bool": util.MapStr{
								"minimum_should_match": 1,
								"should":               subShould,
							},
						},
					},
				},
			})
		}
		indexFilter := util.MapStr{
			"bool": util.MapStr{
				"minimum_should_match": 1,
				"should":               indexShould,
			},
		}
		return indexFilter, true
	}
	return nil, true
}
func (h *APIHandler) FetchIndexInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var indexIDs []interface{}
	h.DecodeJSON(req, &indexIDs)

	if len(indexIDs) == 0 {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	indexIDs = indexIDs[0:1]
	// map indexIDs(cluster_id:index_name => cluster_uuid:indexName)
	var (
		indexIDM          = map[string]string{}
		newIndexIDs       []interface{}
		clusterIndexNames = map[string][]string{}
	)
	indexID := indexIDs[0]
	timeout := h.GetParameterOrDefault(req, "timeout", "60s")
	du, err := time.ParseDuration(timeout)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), du)
	defer cancel()
	var (
		firstClusterID string
		firstIndexName string
	)
	if v, ok := indexID.(string); ok {
		parts := strings.Split(v, ":")
		if len(parts) != 2 {
			h.WriteError(w, fmt.Sprintf("invalid index_id: %s", indexID), http.StatusInternalServerError)
			return
		}
		firstClusterID, firstIndexName = parts[0], parts[1]
		if GetMonitorState(firstClusterID) == elastic.ModeAgentless {
			h.APIHandler.FetchIndexInfo(w, ctx, indexIDs)
			return
		}
		clusterIndexNames[firstClusterID] = append(clusterIndexNames[firstClusterID], firstIndexName)
	} else {
		h.WriteError(w, fmt.Sprintf("invalid index_id: %v", indexID), http.StatusInternalServerError)
		return
	}
	for clusterID, indexNames := range clusterIndexNames {
		clusterUUID, err := adapter.GetClusterUUID(clusterID)
		if err != nil {
			log.Warnf("get cluster uuid error: %v", err)
			continue
		}
		for _, indexName := range indexNames {
			newIndexID := fmt.Sprintf("%s:%s", clusterUUID, indexName)
			newIndexIDs = append(newIndexIDs, newIndexID)
			indexIDM[fmt.Sprintf("%s:%s", clusterID, indexName)] = newIndexID
		}
	}
	q1 := orm.Query{WildcardIndex: true}
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.name", "shard_stats"),
		orm.Eq("metadata.labels.index_id", newIndexIDs[0]),
	)
	q1.Collapse("metadata.labels.shard_id")
	q1.AddSort("timestamp", orm.DESC)
	q1.Size = 20000

	err, results := orm.Search(&event.Event{}, &q1)
	if err != nil {
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
	}

	summaryMap := map[string]*ShardsSummary{}
	for _, hit := range results.Result {
		if hitM, ok := hit.(map[string]interface{}); ok {
			shardDocCount, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "shard_stats", "docs", "count"}, hitM)
			shardDocDeleted, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "shard_stats", "docs", "deleted"}, hitM)
			storeInBytes, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "shard_stats", "store", "size_in_bytes"}, hitM)
			indexID, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "index_id"}, hitM)
			indexName, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "index_name"}, hitM)
			primary, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "shard_stats", "routing", "primary"}, hitM)
			if v, ok := indexID.(string); ok {
				if _, ok = summaryMap[v]; !ok {
					summaryMap[v] = &ShardsSummary{}
				}
				indexInfo := summaryMap[v]
				if iv, ok := indexName.(string); ok {
					indexInfo.Index = iv
				}
				if count, ok := shardDocCount.(float64); ok && primary == true {
					indexInfo.DocsCount += int64(count)
				}
				if deleted, ok := shardDocDeleted.(float64); ok && primary == true {
					indexInfo.DocsDeleted += int64(deleted)
				}
				if storeSize, ok := storeInBytes.(float64); ok {
					indexInfo.StoreInBytes += int64(storeSize)
					if primary == true {
						indexInfo.PriStoreInBytes += int64(storeSize)
					}
				}
				if primary == true {
					indexInfo.Shards++
				} else {
					indexInfo.Replicas++
				}
				indexInfo.Timestamp = hitM["timestamp"]
			}
		}
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
	indexMetric := newMetricItem("indexing", 1, OperationGroupKey)
	indexMetric.OnlyPrimary = true
	indexMetric.AddAxi("indexing rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
	nodeMetricItems := []GroupMetricItem{}
	nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
		Key:          "indexing",
		Field:        "payload.elasticsearch.shard_stats.indexing.index_total",
		ID:           util.GetUUID(),
		IsDerivative: true,
		MetricItem:   indexMetric,
		FormatType:   "num",
		Units:        "Indexing/s",
	})
	queryMetric := newMetricItem("search", 2, OperationGroupKey)
	queryMetric.AddAxi("query rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
	nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
		Key:          "search",
		Field:        "payload.elasticsearch.shard_stats.search.query_total",
		ID:           util.GetUUID(),
		IsDerivative: true,
		MetricItem:   queryMetric,
		FormatType:   "num",
		Units:        "Search/s",
	})

	aggs := map[string]interface{}{}
	query := map[string]interface{}{}
	query["query"] = util.MapStr{
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
							"value": "shard_stats",
						},
					},
				},
				{
					"term": util.MapStr{
						"metadata.labels.cluster_id": firstClusterID,
					},
				},
				{
					"term": util.MapStr{
						"metadata.labels.index_name": firstIndexName,
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

	sumAggs := util.MapStr{}
	term_level := "term_shard"

	for _, metricItem := range nodeMetricItems {
		leafAgg := util.MapStr{
			"max": util.MapStr{
				"field": metricItem.Field,
			},
		}
		var sumBucketPath = term_level + ">" + metricItem.ID
		if metricItem.MetricItem.OnlyPrimary {
			filterSubAggs := util.MapStr{
				metricItem.ID: leafAgg,
			}
			aggs["filter_pri"] = util.MapStr{
				"filter": util.MapStr{
					"term": util.MapStr{
						"payload.elasticsearch.shard_stats.routing.primary": util.MapStr{
							"value": true,
						},
					},
				},
				"aggs": filterSubAggs,
			}
			sumBucketPath = term_level + ">filter_pri>" + metricItem.ID
		} else {
			aggs[metricItem.ID] = leafAgg
		}

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
	sumAggs[term_level] = util.MapStr{
		"terms": util.MapStr{
			"field": "metadata.labels.shard_id",
			"size":  10000,
		},
		"aggs": aggs,
	}

	bucketSizeStr := fmt.Sprintf("%ds", bucketSize)
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		panic(err)
	}
	query["size"] = 0
	query["aggs"] = util.MapStr{
		"group_by_level": util.MapStr{
			"terms": util.MapStr{
				"field": "metadata.labels.index_id",
				"size":  100,
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
	metrics, err := h.getMetrics(ctx, term_level, query, nodeMetricItems, bucketSize)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err, http.StatusInternalServerError)
	}
	indexMetrics := map[string]util.MapStr{}
	for key, item := range metrics {
		for _, line := range item.Lines {
			if _, ok := indexMetrics[line.Metric.Label]; !ok {
				indexMetrics[line.Metric.Label] = util.MapStr{}
			}
			indexMetrics[line.Metric.Label][key] = line.Data
		}
	}
	infos := util.MapStr{}
	for _, tempIndexID := range indexIDs {
		result := util.MapStr{}

		indexID := tempIndexID.(string)
		newIndexID := indexIDM[indexID]

		result["summary"] = summaryMap[newIndexID]
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
				"data": indexMetrics[newIndexID]["indexing"],
			},
			"search": util.MapStr{
				"metric": util.MapStr{
					"label": "Search",
					"units": "s",
				},
				"data": indexMetrics[newIndexID]["search"],
			},
		}
		infos[indexID] = result
	}
	h.WriteJSON(w, infos, http.StatusOK)
}

func (h *APIHandler) GetIndexInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	if GetMonitorState(clusterID) == elastic.ModeAgentless {
		h.APIHandler.GetIndexInfo(w, req, ps)
		return
	}
	indexID := ps.MustGetParameter("index")
	parts := strings.Split(indexID, ":")
	if len(parts) > 1 && !h.IsIndexAllowed(req, clusterID, parts[1]) {
		h.WriteError(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		return
	}
	if len(parts) < 2 {
		h.WriteError(w, "invalid index id: "+indexID, http.StatusInternalServerError)
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
	clusterUUID, err := adapter.GetClusterUUID(clusterID)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	q1 := orm.Query{
		Size:          1000,
		WildcardIndex: true,
	}
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.name", "shard_stats"),
		orm.Eq("metadata.labels.index_name", parts[1]),
		orm.Eq("metadata.labels.cluster_uuid", clusterUUID),
		orm.Ge("timestamp", "now-15m"),
	)
	q1.Collapse("metadata.labels.shard_id")
	q1.AddSort("timestamp", orm.DESC)
	err, result := orm.Search(&event.Event{}, &q1)
	summary := util.MapStr{}
	hit := response.Hits.Hits[0].Source
	var (
		shardsNum   int
		replicasNum int
		indexInfo   = util.MapStr{
			"index": parts[1],
		}
	)
	if aliases, ok := util.GetMapValueByKeys([]string{"metadata", "aliases"}, hit); ok {
		health, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "health_status"}, hit)
		indexUUID, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "index_uuid"}, hit)
		indexInfo["id"] = indexUUID
		state, _ := util.GetMapValueByKeys([]string{"metadata", "labels", "state"}, hit)
		shards, _ := util.GetMapValueByKeys([]string{"payload", "index_state", "settings", "index", "number_of_shards"}, hit)
		replicas, _ := util.GetMapValueByKeys([]string{"payload", "index_state", "settings", "index", "number_of_replicas"}, hit)
		shardsNum, _ = util.ToInt(shards.(string))
		replicasNum, _ = util.ToInt(replicas.(string))
		summary["aliases"] = aliases
		summary["timestamp"] = hit["timestamp"]
		if state == "delete" {
			health = "N/A"
		}
		indexInfo["health"] = health
		indexInfo["status"] = state
	}
	if len(result.Result) > 0 {
		shardSum := ShardsSummary{}
		for _, row := range result.Result {
			resultM, ok := row.(map[string]interface{})
			if ok {
				primary, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "shard_stats", "routing", "primary"}, resultM)
				storeInBytes, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "shard_stats", "store", "size_in_bytes"}, resultM)
				if docs, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "shard_stats", "docs", "count"}, resultM); ok {
					//summary["docs"] = docs
					if v, ok := docs.(float64); ok && primary == true {
						shardSum.DocsCount += int64(v)
					}
				}
				if storeSize, ok := storeInBytes.(float64); ok {
					shardSum.StoreInBytes += int64(storeSize)
					if primary == true {
						shardSum.PriStoreInBytes += int64(storeSize)
					}
				}
				if primary == true {
					shardSum.Shards++
				} else {
					shardSum.Replicas++
				}
			}
			summary["timestamp"] = resultM["timestamp"]
		}
		indexInfo["docs_count"] = shardSum.DocsCount
		indexInfo["pri_store_size"] = util.FormatBytes(float64(shardSum.PriStoreInBytes), 1)
		indexInfo["store_size"] = util.FormatBytes(float64(shardSum.StoreInBytes), 1)
		indexInfo["shards"] = shardSum.Shards + shardSum.Replicas

		summary["unassigned_shards"] = (replicasNum+1)*shardsNum - shardSum.Shards - shardSum.Replicas
	}
	summary["index_info"] = indexInfo

	h.WriteJSON(w, summary, http.StatusOK)
}

func (h *APIHandler) GetIndexShards(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	if GetMonitorState(clusterID) == elastic.ModeAgentless {
		h.APIHandler.GetIndexShards(w, req, ps)
		return
	}
	indexName := ps.MustGetParameter("index")
	q1 := orm.Query{
		Size:          1000,
		WildcardIndex: true,
	}
	clusterUUID, err := adapter.GetClusterUUID(clusterID)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.name", "shard_stats"),
		orm.Eq("metadata.labels.index_name", indexName),
		orm.Eq("metadata.labels.cluster_uuid", clusterUUID),
		orm.Ge("timestamp", "now-15m"),
	)
	q1.Collapse("metadata.labels.shard_id")
	q1.AddSort("timestamp", orm.DESC)
	err, result := orm.Search(&event.Event{}, &q1)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var shards = []interface{}{}
	if len(result.Result) > 0 {
		q := &orm.Query{
			Size: 500,
		}
		q.Conds = orm.And(
			orm.Eq("metadata.cluster_id", clusterID),
		)
		err, nodesResult := orm.Search(elastic.NodeConfig{}, q)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		nodeIDToName := util.MapStr{}
		for _, row := range nodesResult.Result {
			if rowM, ok := row.(map[string]interface{}); ok {
				nodeName, _ := util.MapStr(rowM).GetValue("metadata.node_name")
				nodeID, _ := util.MapStr(rowM).GetValue("metadata.node_id")
				if v, ok := nodeID.(string); ok {
					nodeIDToName[v] = nodeName
				}
			}
		}
		qps, err := h.getShardQPS(clusterID, "", indexName, 20)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		for _, item := range result.Result {
			row, ok := item.(map[string]interface{})
			if ok {
				shardInfo := util.MapStr{}
				source := util.MapStr(row)
				nodeID, _ := source.GetValue("metadata.labels.node_id")
				if v, ok := nodeID.(string); ok {
					if v, ok := nodeIDToName[v]; ok {
						shardInfo["node"] = v
					}

				}
				shardV, err := source.GetValue("payload.elasticsearch.shard_stats")
				if err != nil {
					log.Error(err)
					continue
				}
				shardInfo["id"], _ = source.GetValue("metadata.labels.node_id")
				shardInfo["index"], _ = source.GetValue("metadata.labels.index_name")
				shardInfo["ip"], _ = source.GetValue("metadata.labels.ip")
				shardInfo["shard"], _ = source.GetValue("metadata.labels.shard")
				shardInfo["shard_id"], _ = source.GetValue("metadata.labels.shard_id")
				if v, ok := shardV.(map[string]interface{}); ok {
					shardM := util.MapStr(v)
					shardInfo["docs"], _ = shardM.GetValue("docs.count")
					primary, _ := shardM.GetValue("routing.primary")
					if primary == true {
						shardInfo["prirep"] = "p"
					} else {
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

func (h *APIHandler) GetSingleIndexMetrics(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	if GetMonitorState(clusterID) == elastic.ModeAgentless {
		h.APIHandler.GetSingleIndexMetrics(w, req, ps)
		return
	}
	indexName := ps.MustGetParameter("index")
	if !h.IsIndexAllowed(req, clusterID, indexName) {
		h.WriteJSON(w, util.MapStr{
			"error": http.StatusText(http.StatusForbidden),
		}, http.StatusForbidden)
		return
	}
	clusterUUID, err := h.getClusterUUID(clusterID)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	shardID := h.GetParameterOrDefault(req, "shard_id", "")

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
					"value": "shard_stats",
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
	if shardID != "" {
		must = append(must, util.MapStr{
			"term": util.MapStr{
				"metadata.labels.shard_id": util.MapStr{
					"value": shardID,
				},
			},
		})
	}
	resBody := map[string]interface{}{}
	metricKey := h.GetParameter(req, "key")
	var metricType string
	if metricKey == v1.IndexHealthMetricKey {
		metricType = v1.MetricTypeClusterHealth
	} else {
		//for agent mode
		metricType = v1.MetricTypeNodeStats
	}
	bucketSize, min, max, err := h.GetMetricRangeAndBucketSize(req, clusterID, metricType, 60)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if bucketSize <= 60 {
		min = min - int64(2*bucketSize*1000)
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
	query := map[string]interface{}{}
	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"must": must,
			"should": []util.MapStr{
				{
					"term": util.MapStr{
						"metadata.labels.cluster_uuid": util.MapStr{
							"value": clusterUUID,
						},
					},
				},
				{
					"term": util.MapStr{
						"metadata.labels.cluster_id": util.MapStr{
							"value": clusterID,
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

	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	metricItems := []*common.MetricItem{}
	metrics := map[string]*common.MetricItem{}
	if metricKey == ShardStateMetricKey {
		shardStateMetric, err := h.getIndexShardsMetric(ctx, clusterID, indexName, min, max, bucketSize, shardID)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		metrics["shard_state"] = shardStateMetric
	} else if metricKey == v1.IndexHealthMetricKey {
		healthMetric, err := h.GetIndexHealthMetric(ctx, clusterID, indexName, min, max, bucketSize)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err, http.StatusInternalServerError)
			return
		}
		metrics["index_health"] = healthMetric
	} else {
		switch metricKey {
		case v1.IndexThroughputMetricKey:
			metricItem := newMetricItem("index_throughput", 1, OperationGroupKey)
			metricItem.AddAxi("indexing", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
			if shardID == "" {
				metricItem.AddLine("Indexing Rate", "Primary Indexing", "Number of documents being indexed for node.", "group1", "payload.elasticsearch.shard_stats.indexing.index_total", "max", bucketSizeStr, "doc/s", "num", "0,0.[00]", "0,0.[00]", false, true)
				metricItem.AddLine("Deleting Rate", "Primary Deleting", "Number of documents being deleted for node.", "group1", "payload.elasticsearch.shard_stats.indexing.delete_total", "max", bucketSizeStr, "doc/s", "num", "0,0.[00]", "0,0.[00]", false, true)
				metricItem.Lines[0].Metric.OnlyPrimary = true
				metricItem.Lines[1].Metric.OnlyPrimary = true
			} else {
				metricItem.AddLine("Indexing Rate", "Indexing Rate", "Number of documents being indexed for node.", "group1", "payload.elasticsearch.shard_stats.indexing.index_total", "max", bucketSizeStr, "doc/s", "num", "0,0.[00]", "0,0.[00]", false, true)
				metricItem.AddLine("Deleting Rate", "Deleting Rate", "Number of documents being deleted for node.", "group1", "payload.elasticsearch.shard_stats.indexing.delete_total", "max", bucketSizeStr, "doc/s", "num", "0,0.[00]", "0,0.[00]", false, true)
			}
			metricItems = append(metricItems, metricItem)
		case v1.SearchThroughputMetricKey:
			metricItem := newMetricItem("search_throughput", 2, OperationGroupKey)
			metricItem.AddAxi("searching", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, false)
			metricItem.AddLine("Search Rate", "Search Rate",
				"Number of search requests being executed.",
				"group1", "payload.elasticsearch.shard_stats.search.query_total", "max", bucketSizeStr, "query/s", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItems = append(metricItems, metricItem)
		case v1.IndexLatencyMetricKey:
			metricItem := newMetricItem("index_latency", 3, LatencyGroupKey)
			metricItem.AddAxi("indexing", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
			if shardID == "" { //index level
				metricItem.AddLine("Indexing Latency", "Primary Indexing Latency", "Average latency for indexing documents.", "group1", "payload.elasticsearch.shard_stats.indexing.index_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
				metricItem.AddLine("Deleting Latency", "Primary Deleting Latency", "Average latency for delete documents.", "group1", "payload.elasticsearch.shard_stats.indexing.delete_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
				metricItem.Lines[0].Metric.OnlyPrimary = true
				metricItem.Lines[1].Metric.OnlyPrimary = true
			} else { // shard level
				metricItem.AddLine("Indexing Latency", "Indexing Latency", "Average latency for indexing documents.", "group1", "payload.elasticsearch.shard_stats.indexing.index_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
				metricItem.AddLine("Deleting Latency", "Deleting Latency", "Average latency for delete documents.", "group1", "payload.elasticsearch.shard_stats.indexing.delete_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
			}
			metricItem.Lines[0].Metric.Field2 = "payload.elasticsearch.shard_stats.indexing.index_total"
			metricItem.Lines[0].Metric.Calc = func(value, value2 float64) float64 {
				return value / value2
			}
			metricItem.Lines[1].Metric.Field2 = "payload.elasticsearch.shard_stats.indexing.delete_total"
			metricItem.Lines[1].Metric.Calc = func(value, value2 float64) float64 {
				return value / value2
			}
			metricItems = append(metricItems, metricItem)
		case v1.SearchLatencyMetricKey:
			metricItem := newMetricItem("search_latency", 4, LatencyGroupKey)
			metricItem.AddAxi("searching", "group2", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, false)

			metricItem.AddLine("Searching", "Query Latency", "Average latency for searching query.", "group2", "payload.elasticsearch.shard_stats.search.query_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItem.Lines[0].Metric.Field2 = "payload.elasticsearch.shard_stats.search.query_total"
			metricItem.Lines[0].Metric.Calc = func(value, value2 float64) float64 {
				return value / value2
			}
			metricItem.AddLine("Searching", "Fetch Latency", "Average latency for searching fetch.", "group2", "payload.elasticsearch.shard_stats.search.fetch_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItem.Lines[1].Metric.Field2 = "payload.elasticsearch.shard_stats.search.fetch_total"
			metricItem.Lines[1].Metric.Calc = func(value, value2 float64) float64 {
				return value / value2
			}
			metricItem.AddLine("Searching", "Scroll Latency", "Average latency for searching fetch.", "group2", "payload.elasticsearch.shard_stats.search.scroll_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
			metricItem.Lines[2].Metric.Field2 = "payload.elasticsearch.shard_stats.search.scroll_total"
			metricItem.Lines[2].Metric.Calc = func(value, value2 float64) float64 {
				return value / value2
			}
			metricItems = append(metricItems, metricItem)
		case v1.SegmentMemoryMetricKey:
			metricItem := newMetricItem(v1.SegmentMemoryMetricKey, 2, MemoryGroupKey)
			metricItem.AddAxi("Segment Memory", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, false)
			metricItem.AddLine("Segment Memory", "Segment Memory",
				"Memory use of all open segments.",
				"group1", "payload.elasticsearch.shard_stats.segments.memory_in_bytes", "max", bucketSizeStr, "", "bytes", "0,0.[00]", "0,0.[00]", false, false)
			metricItems = append(metricItems, metricItem)
		}
		metrics, err = h.getSingleIndexMetrics(context.Background(), metricItems, query, bucketSize)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err, http.StatusInternalServerError)
		}
	}
	if metricItem, ok := metrics[metricKey]; ok && metricItem != nil {
		if metricItem.HitsTotal > 0 && metricItem.MinBucketSize == 0 {
			minBucketSize, err := v1.GetMetricMinBucketSize(clusterID, metricType)
			if err != nil {
				log.Error(err)
			} else {
				metricItem.MinBucketSize = int64(minBucketSize)
			}
		}
	}

	resBody["metrics"] = metrics
	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) getIndexShardsMetric(ctx context.Context, id, indexName string, min, max int64, bucketSize int, shardID string) (*common.MetricItem, error) {
	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		return nil, err
	}
	must := []util.MapStr{
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
					"value": "shard_stats",
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
	if shardID != "" {
		must = append(must, util.MapStr{
			"term": util.MapStr{
				"metadata.labels.shard_id": util.MapStr{
					"value": shardID,
				},
			},
		})
	}
	query := util.MapStr{
		"query": util.MapStr{
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
		},
		"aggs": util.MapStr{
			"dates": util.MapStr{
				"date_histogram": util.MapStr{
					"field":       "timestamp",
					intervalField: bucketSizeStr,
				},
				"aggs": util.MapStr{
					"groups": util.MapStr{
						"terms": util.MapStr{
							"field": "payload.elasticsearch.shard_stats.routing.state",
							"size":  10,
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

	metricItem := newMetricItem("shard_state", 0, "")
	metricItem.AddLine("Shard State", "Shard State", "", "group1", "payload.elasticsearch.shard_stats.routing.state", "max", bucketSizeStr, "", "ratio", "0.[00]", "0.[00]", false, false)

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
	metricItem.HitsTotal = response.GetTotal()
	return metricItem, nil
}

func (h *APIHandler) getIndexNodes(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.ByName("id")
	indexName := ps.ByName("index")
	if !h.IsIndexAllowed(req, id, indexName) {
		h.WriteJSON(w, util.MapStr{
			"error": http.StatusText(http.StatusForbidden),
		}, http.StatusForbidden)
		return
	}
	q := &orm.Query{Size: 1}
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
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
	}
	namesM := util.MapStr{}
	if len(result.Result) > 0 {
		if data, ok := result.Result[0].(map[string]interface{}); ok {
			if routingTable, exists := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "index_routing_table"}, data); exists {
				if table, ok := routingTable.(map[string]interface{}); ok {
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
	nodeIds := make([]interface{}, 0, len(namesM))
	for name, _ := range namesM {
		nodeIds = append(nodeIds, name)
	}

	q1 := &orm.Query{Size: 100}
	q1.AddSort("timestamp", orm.DESC)
	q1.Conds = orm.And(
		orm.Eq("metadata.category", "elasticsearch"),
		orm.Eq("metadata.cluster_id", id),
		orm.In("metadata.node_id", nodeIds),
	)
	err, result = orm.Search(elastic.NodeConfig{}, q1)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
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
					"id":        v,
					"name":      nodeName,
					"ip":        ip,
					"port":      port,
					"status":    status,
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

	if !util.StringInArray(ids, "*") {

		must = append(must, util.MapStr{
			"terms": util.MapStr{
				"metadata.cluster_id": ids,
			},
		})
	}

	if keyword != "" {
		must = append(must, util.MapStr{
			"wildcard": util.MapStr{
				"metadata.index_name": util.MapStr{"value": fmt.Sprintf("*%s*", keyword)},
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

// deleteIndexMetadata used to delete index metadata after index is deleted from cluster
func (h APIHandler) deleteIndexMetadata(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	indexName := orm.GetIndexName(elastic.IndexConfig{})
	must := []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.labels.state": "delete",
			},
		},
	}
	if indexFilter, hasIndexPri := h.getAllowedIndexFilter(req); hasIndexPri {
		if indexFilter != nil {
			must = append(must, indexFilter)
		}
	} else {
		//has no any index permission, just return
		h.WriteAckOKJSON(w)
		return
	}
	dsl := util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": must,
			},
		},
	}
	_, err := esClient.DeleteByQuery(indexName, util.MustToJSONBytes(dsl))
	if err != nil {
		h.WriteError(w, err, http.StatusInternalServerError)
	}
	h.WriteAckOKJSON(w)
}
