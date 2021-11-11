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
		hosts = map[string]struct{}{}
	)
	elastic.WalkConfigs(func(key, value interface{})bool{
		if handler.Config.Elasticsearch == key {
			return true
		}
		data, err := handler.getLatestClusterMonitorData(key)
		if err != nil{
			log.Error(err)
		}
		val, err := data.GetValue("cluster_stats.nodes.count.total")
		if err != nil {
			log.Warn(err)
		}
		if num, ok := val.(float64); ok {
			totalNode += int(num)
		}
		val, err = data.GetValue("index_stats._all.total.store.size_in_bytes")
		if err != nil {
			log.Warn(err)
		}
		if num, ok := val.(float64); ok {
			totalStoreSize += int(num)
		}

		val, err = data.GetValue("agent.ip")
		if err != nil {
			log.Warn(err)
		}
		if ip, ok := val.(string); ok {
			hosts[ip] = struct{}{}
		}
		return true
	})

	resBody := util.MapStr{
		"total_node": totalNode,
		"total_store_size_in_bytes": totalStoreSize,
		"total_host": len(hosts),
		//"hosts": hosts,
	}
	handler.WriteJSON(w, resBody, http.StatusOK)
}

func (handler APIHandler) getLatestClusterMonitorData(clusterID interface{}) (util.MapStr, error){
	client := elastic.GetClient(handler.Config.Elasticsearch)
	queryDSLTpl := `{
  "size": 1, 
  "query": {
    "match": {
      "elasticsearch": "%s"
    }
  }, 
  "sort": [
    {
      "cluster_stats.timestamp": {
        "order": "desc"
      }
    }
  ]
}`
	queryDSL := fmt.Sprintf(queryDSLTpl, clusterID)
	searchRes, err := client.SearchWithRawQueryDSL(orm.GetIndexName(event.Event{}), []byte(queryDSL))
	if err != nil {
		return nil, err
	}
	if len(searchRes.Hits.Hits) == 0 {
		return nil, nil
	}
	return searchRes.Hits.Hits[0].Source, nil
}
