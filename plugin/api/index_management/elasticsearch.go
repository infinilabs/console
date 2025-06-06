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

package index_management

import (
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/console/common"
	"infini.sh/console/core/security"
	"infini.sh/console/model"
	"infini.sh/console/service"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/graph"
	"infini.sh/framework/core/host"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"strings"
)

func (handler APIHandler) ElasticsearchOverviewAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		totalNode      int
		totalStoreSize int
		clusterIDs     []interface{}
	)
	//elastic.WalkConfigs(func(key, value interface{})bool{
	//	if handler.Config.Elasticsearch == key {
	//		return true
	//	}
	//	clusterIDs = append(clusterIDs, key)
	//	return true
	//})
	esClient := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	queryDsl := util.MapStr{
		"size": 100,
	}
	clusterFilter, hasAllPrivilege := handler.GetClusterFilter(req, "_id")
	if !hasAllPrivilege && clusterFilter == nil {
		handler.WriteJSON(w, util.MapStr{
			"nodes_count":               0,
			"clusters_count":            0,
			"total_used_store_in_bytes": 0,
			"hosts_count":               0,
			"indices_count":             0,
		}, http.StatusOK)
		return
	}
	if !hasAllPrivilege {
		queryDsl["query"] = clusterFilter
	}

	user, auditLogErr := security.FromUserContext(req.Context())
	if auditLogErr == nil && handler.GetHeader(req, "Referer", "") != "" {
		auditLog, _ := model.NewAuditLogBuilderWithDefault().WithOperator(user.Username).
			WithLogTypeAccess().WithResourceTypeClusterManagement().
			WithEventName("get elasticsearch overview").WithEventSourceIP(common.GetClientIP(req)).
			WithResourceName("elasticsearch").WithOperationTypeAccess().
			WithEventRecord(util.MustToJSON(queryDsl)).Build()
		_ = service.LogAuditLog(auditLog)
	}

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(elastic.ElasticsearchConfig{}), util.MustToJSONBytes(queryDsl))
	if err != nil {
		log.Error(err)
		handler.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	for _, hit := range searchRes.Hits.Hits {
		clusterIDs = append(clusterIDs, hit.ID)
	}

	res, err := handler.getLatestClusterMonitorData(clusterIDs)
	if err != nil {
		log.Error(err)
		handler.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	for _, info := range res.Hits.Hits {
		data := util.MapStr(info.Source)
		//val, err := data.GetValue("payload.elasticsearch.cluster_stats.nodes.count.total")
		//if err != nil {
		//	log.Warn(err)
		//}
		//if num, ok := val.(float64); ok {
		//	totalNode += int(num)
		//}
		val, err := data.GetValue("payload.elasticsearch.cluster_stats.indices.store.size_in_bytes")
		if err != nil {
			log.Warn(err)
		}
		if num, ok := val.(float64); ok {
			totalStoreSize += int(num)
		}
	}

	hostCount, err := handler.getMetricCount(orm.GetIndexName(host.HostInfo{}), "ip", nil)
	if err != nil {
		log.Error(err)
	}
	if v, ok := hostCount.(float64); (ok && v == 0) || hostCount == nil {
		hostCount, err = handler.getMetricCount(orm.GetIndexName(elastic.NodeConfig{}), "metadata.host", clusterIDs)
		if err != nil {
			log.Error(err)
		}
	}

	nodeCount, err := handler.getMetricCount(orm.GetIndexName(elastic.NodeConfig{}), "id", clusterIDs)
	if err != nil {
		log.Error(err)
	}
	if v, ok := nodeCount.(float64); ok {
		totalNode = int(v)
	}
	indicesCount, err := handler.getIndexCount(req)
	if err != nil {
		log.Error(err)
	}

	resBody := util.MapStr{
		"nodes_count":               totalNode,
		"clusters_count":            len(clusterIDs),
		"total_used_store_in_bytes": totalStoreSize,
		"hosts_count":               hostCount,
		"indices_count":             indicesCount,
	}
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) getLatestClusterMonitorData(clusterIDs []interface{}) (*elastic.SearchResponse, error) {
	client := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	queryDSLTpl := `{
  "size": %d, 
   "query": {
    "bool": {
      "must": [
		 {
          "range": {
            "timestamp": {
              "gte": "now-1d"
            }
          }
        },
        {
          "terms": {
            "metadata.labels.cluster_id": %s
          }
        },
        {
          "term": {
            "metadata.name": {
              "value": "cluster_stats"
            }
          }
        },
        {
          "term": {
            "metadata.category": {
              "value": "elasticsearch"
            }
          }
        }
      ]
    }
  }, 
 "collapse": {
    "field": "metadata.labels.cluster_id"
  },
  "sort": [
    {
      "timestamp": {
        "order": "desc"
      }
    }
  ]
}`
	queryDSL := fmt.Sprintf(queryDSLTpl, len(clusterIDs), util.MustToJSONBytes(clusterIDs))
	return client.SearchWithRawQueryDSL(orm.GetWildcardIndexName(event.Event{}), []byte(queryDSL))

}

func (handler APIHandler) getIndexCount(req *http.Request) (int64, error) {
	hasAllPrivilege, indexPrivilege := handler.GetCurrentUserIndex(req)
	if !hasAllPrivilege && len(indexPrivilege) == 0 {
		return 0, nil
	}
	var indexFilter util.MapStr
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
		indexFilter = util.MapStr{
			"bool": util.MapStr{
				"minimum_should_match": 1,
				"should":               indexShould,
			},
		}
	}
	var body []byte
	if len(indexFilter) > 0 {
		body = util.MustToJSONBytes(util.MapStr{
			"query": indexFilter,
		})
	}
	return orm.Count(elastic.IndexConfig{}, body)
}

func (handler APIHandler) getMetricCount(indexName, field string, clusterIDs []interface{}) (interface{}, error) {
	client := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	queryDSL := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"field_count": util.MapStr{
				"cardinality": util.MapStr{
					"field": field,
				},
			},
		},
	}
	if len(clusterIDs) > 0 {
		queryDSL["query"] = util.MapStr{
			"terms": util.MapStr{
				"metadata.cluster_id": clusterIDs,
			},
		}
	}
	searchRes, err := client.SearchWithRawQueryDSL(indexName, util.MustToJSONBytes(queryDSL))
	if err != nil {
		log.Error(err)
		return 0, err
	}
	return searchRes.Aggregations["field_count"].Value, nil
}

func (handler APIHandler) getLastActiveHostCount() (int, error) {
	client := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	queryDSL := `{
  "size": 0, 
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "metadata.name": {
              "value": "node_stats"
            }
          }
        },
        {
          "term": {
            "metadata.category": {
              "value": "elasticsearch"
            }
          }
        }
      ],
      "filter": [
        {
          "range": {
            "timestamp": {
              "gte": "now-w",
              "lte": "now"
            }
          }
        }
      ]
    }
  }, 
  "aggs": {
    "week_active_host": {
      "terms": {
        "field": "payload.elasticsearch.node_stats.host",
        "size": 10000
      }
    }
  }
}`
	searchRes, err := client.SearchWithRawQueryDSL(orm.GetIndexName(event.Event{}), []byte(queryDSL))
	if err != nil {
		log.Error(err)
		return 0, err
	}
	return len(searchRes.Aggregations["week_active_host"].Buckets), nil
}

func (handler APIHandler) ElasticsearchStatusSummaryAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterIDs, hasAllPrivilege := handler.GetAllowedClusters(req)
	if !hasAllPrivilege && len(clusterIDs) == 0 {
		handler.WriteJSON(w, util.MapStr{
			"cluster": util.MapStr{},
			"node":    util.MapStr{},
			"host": util.MapStr{
				"online": 0,
			},
		}, http.StatusOK)
		return
	}
	var filter interface{}
	if !hasAllPrivilege {
		filter = util.MapStr{
			"terms": util.MapStr{
				"id": clusterIDs,
			},
		}
	}

	clusterGrp, err := handler.getGroupMetric(orm.GetIndexName(elastic.ElasticsearchConfig{}), "labels.health_status", filter)
	if err != nil {
		log.Error(err)
		handler.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !hasAllPrivilege {
		filter = util.MapStr{
			"terms": util.MapStr{
				"metadata.cluster_id": clusterIDs,
			},
		}
	}
	nodeGrp, err := handler.getGroupMetric(orm.GetIndexName(elastic.NodeConfig{}), "metadata.labels.status", filter)
	if err != nil {
		log.Error(err)
		handler.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var clusterIds []interface{}
	if !hasAllPrivilege {
		for _, cid := range clusterIDs {
			clusterIds = append(clusterIds, cid)
		}
	}
	hostCount, err := handler.getMetricCount(orm.GetIndexName(elastic.NodeConfig{}), "metadata.host", clusterIds)
	if err != nil {
		log.Error(err)
		handler.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	handler.WriteJSON(w, util.MapStr{
		"cluster": clusterGrp,
		"node":    nodeGrp,
		"host": util.MapStr{
			"online": hostCount,
		},
	}, http.StatusOK)
}

func (handler APIHandler) getGroupMetric(indexName, field string, filter interface{}) (interface{}, error) {
	client := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
	queryDSL := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"group": util.MapStr{
				"terms": util.MapStr{
					"field": field,
				},
			},
		},
	}
	if filter != nil {
		queryDSL["query"] = filter
	}
	searchRes, err := client.SearchWithRawQueryDSL(indexName, util.MustToJSONBytes(queryDSL))
	if err != nil {
		log.Error(err)
		return 0, err
	}
	groups := map[string]interface{}{}
	for _, bk := range searchRes.Aggregations["group"].Buckets {
		if key, ok := bk["key"].(string); ok {
			groups[key] = bk["doc_count"]
		}
	}
	return groups, nil
}

func (h *APIHandler) ClusterOverTreeMap(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	clusterID := ps.ByName("id")

	queryLatency := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"indices": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.index_name",
					"include": util.MapStr{
						"partition":      0,
						"num_partitions": 10,
					},
					"size": 1000,
				},
				"aggs": util.MapStr{
					"recent_15m": util.MapStr{
						"auto_date_histogram": util.MapStr{
							"field":            "timestamp",
							"minimum_interval": "minute", //es7.3 and above
							"buckets":          12,
						},
						"aggs": util.MapStr{
							"max_query_count": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.index_stats.primaries.search.query_total",
								},
							},
							"query_count_deriv": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "max_query_count",
								},
							},
							"max_query_time": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.index_stats.primaries.search.query_time_in_millis",
								},
							},
							"query_time_deriv": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "max_query_time",
								},
							},
							"query_latency": util.MapStr{
								"bucket_script": util.MapStr{
									"buckets_path": util.MapStr{
										"my_var1": "query_time_deriv",
										"my_var2": "query_count_deriv",
									},
									"script": "params.my_var1 / params.my_var2",
								},
							},
						},
					},
					"max_query_latency": util.MapStr{
						"max_bucket": util.MapStr{
							"buckets_path": "recent_15m>query_latency",
						},
					},
					"sort": util.MapStr{
						"bucket_sort": util.MapStr{
							"sort": []util.MapStr{
								{
									"max_query_latency": util.MapStr{
										"order": "desc",
									},
								},
							},
						},
					},
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must_not": []util.MapStr{{
					"term": util.MapStr{
						"metadata.labels.index_name": util.MapStr{
							"value": "_all",
						},
					},
				},
				},
				"must": []util.MapStr{
					{
						"match": util.MapStr{
							"metadata.name": "index_stats",
						}},
					util.MapStr{
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
								"gte": "now-7d",
								"lte": "now",
							},
						},
					},
				},
			}},
	}

	q := orm.Query{WildcardIndex: true}
	q.AddQueryArgs("filter_path", "aggregations.indices.buckets.key,aggregations.indices.buckets.max_query_latency")
	q.RawQuery = util.MustToJSONBytes(queryLatency)
	err, searchR1 := orm.Search(&event.Event{}, &q)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	searchResponse := elastic.SearchResponse{}
	err = util.FromJSONBytes(searchR1.Raw, &searchResponse)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	root := graph.NestedNode{Name: "root"}

	indices, ok := searchResponse.Aggregations["indices"]
	if ok {
		buckets := indices.Buckets
		for _, item := range buckets {
			indexName := item["key"]
			latencyObj, ok := item["max_query_latency"].(map[string]interface{})
			if ok {
				v := latencyObj["value"]
				date := latencyObj["keys"].([]interface{})
				root.Add(indexName.(string), date[0].(string), v.(float64))
			}
		}
	}

	result := util.MapStr{
		"_index": ".infini-graph",
		"_type":  "_doc",
		"_id":    "graph-1",
		"_source": util.MapStr{
			"name": "Avg search latency by index",
			"unit": "ms",
			"data": root,
		},
	}

	h.Write(w, util.MustToJSONBytes(result))
}
