package index_management

import (
	"fmt"
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
)

func (handler APIHandler) ElasticsearchOverviewAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		totalNode int
		totalStoreSize int
		clusterIDs []interface{}
	)
	elastic.WalkConfigs(func(key, value interface{})bool{
		if handler.Config.Elasticsearch == key {
			return true
		}
		clusterIDs = append(clusterIDs, key)
		return true
	})

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

	hostCount, err := handler.getMetricCount(orm.GetIndexName(elastic.NodeConfig{}), "metadata.host")
	if err != nil{
		log.Error(err)
	}
	nodeCount, err := handler.getMetricCount(orm.GetIndexName(elastic.NodeConfig{}), "_id")
	if err != nil{
		log.Error(err)
	}
	if v, ok := nodeCount.(float64); ok {
		totalNode = int(v)
	}
	resBody := util.MapStr{
		"nodes_count": totalNode,
		"cluster_count": len(clusterIDs),
		"total_used_store_in_bytes": totalStoreSize,
		"hosts_count": hostCount,
		//"hosts": hosts,
	}
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) getLatestClusterMonitorData(clusterIDs []interface{}) (*elastic.SearchResponse, error){
	client := elastic.GetClient(handler.Config.Elasticsearch)
	queryDSLTpl := `{
  "size": %d, 
   "query": {
    "bool": {
      "must": [
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

func (handler APIHandler) getMetricCount(indexName, field string) (interface{}, error){
	client := elastic.GetClient(handler.Config.Elasticsearch)
	queryDSL := `{
  "size": 0, 
  "aggs": {
    "field_count": {
      "cardinality": {
        "field": "%s"
      }
    }
  }
}`
	queryDSL = fmt.Sprintf(queryDSL, field)
	searchRes, err := client.SearchWithRawQueryDSL(indexName, []byte(queryDSL))
	if err != nil {
		log.Error(err)
		return 0, err
	}
	return searchRes.Aggregations["field_count"].Value, nil
}

func (handler APIHandler) getLastActiveHostCount() (int, error){
	client := elastic.GetClient(handler.Config.Elasticsearch)
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

