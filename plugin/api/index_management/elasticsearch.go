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
	)
	elastic.WalkConfigs(func(key, value interface{})bool{
		if handler.Config.Elasticsearch == key {
			return true
		}
		data, err := handler.getLatestClusterMonitorData(key)
		if err != nil{
			log.Error(err)
		}
		val, err := data.GetValue("payload.elasticsearch.cluster_stats.nodes.count.total")
		if err != nil {
			log.Warn(err)
		}
		if num, ok := val.(float64); ok {
			totalNode += int(num)
		}
		val, err = data.GetValue("payload.elasticsearch.cluster_stats.indices.store.size_in_bytes")
		if err != nil {
			log.Warn(err)
		}
		if num, ok := val.(float64); ok {
			totalStoreSize += int(num)
		}
		return true
	})

	hostCount, err := handler.getLastActiveHostCount()
	if err != nil{
		log.Error(err)
	}
	resBody := util.MapStr{
		"nodes_count": totalNode,
		"total_used_store_in_bytes": totalStoreSize,
		"hosts_count": hostCount,
		//"hosts": hosts,
	}
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) getLatestClusterMonitorData(clusterID interface{}) (util.MapStr, error){
	client := elastic.GetClient(handler.Config.Elasticsearch)
	queryDSLTpl := `{
  "size": 1, 
   "query": {
    "bool": {
      "must": [
        {
          "term": {
            "metadata.labels.cluster_id": {
              "value": "%s"
            }
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
  "sort": [
    {
      "timestamp": {
        "order": "desc"
      }
    }
  ]
}`
	queryDSL := fmt.Sprintf(queryDSLTpl, clusterID)
	searchRes, err := client.SearchWithRawQueryDSL(orm.GetIndexName(event.Event{}), []byte(queryDSL))
	if err != nil {
		log.Error(err)
		return nil, err
	}
	if len(searchRes.Hits.Hits) == 0 {
		return nil, nil
	}
	return searchRes.Hits.Hits[0].Source, nil
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

