package alerting

import (
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

func GetAlertOverview(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	alertDayMetricData, err := getLastAlertDayCount()
	if err != nil {
		writeError(w, err)
		return
	}
	topTenData, err := getTopTenAlertCluster()
	if err != nil {
		writeError(w, err)
		return
	}
	stateCount, err := getAlertByState()
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, IfaceMap{
		"metrics": IfaceMap{
			"last_tree_month": IfaceMap{
				"data": alertDayMetricData,
				"day": 90,
			},
			"top_ten_cluster": IfaceMap{
				"data": topTenData,
			},
		},
		"state_count": stateCount,
		"ok": true,
	}, http.StatusOK)
}

func getAlertByState() (IfaceMap, error){
	reqBody := IfaceMap{
		"size": 0,
		"aggs": IfaceMap{
			"alert_count_by_state": IfaceMap{
				"terms": IfaceMap{
					"field": "state",
					"size":  10,
				},
			},
		},
	}
	buckets, err := queryMetricBuckets(reqBody, "alert_count_by_state", INDEX_ALERT)
	if err != nil {
		return  nil, err
	}
	var metricData = IfaceMap{}
	if bks, ok := buckets.([]interface{}); ok {
		for _, bk := range bks {
			if bkm, ok :=  bk.(map[string]interface{}); ok {
				metricData[queryValue(bkm, "key", "").(string)]= queryValue(bkm, "doc_count", 0)
			}
		}
	}
	return metricData, nil
}

func queryMetricBuckets(reqBody IfaceMap, metricKey, indexName string)(interface{}, error){
	conf := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_search", conf.Endpoint, getAlertIndexName(indexName))
	res, err := doRequest(reqUrl, http.MethodGet, nil, reqBody)
	if err != nil {
		return nil, err
	}
	result := IfaceMap{}
	defer res.Body.Close()
	err = decodeJSON(res.Body, &result)
	if err != nil {
		return nil, err
	}
	buckets := queryValue(result, fmt.Sprintf("aggregations.%s.buckets", metricKey), []interface{}{})
	return buckets, nil
}

func getTopTenAlertCluster()(interface{}, error){
	reqBody := IfaceMap{
		"size": 0,
		"aggs": IfaceMap{
			"alert_top_ten": IfaceMap{
				"terms": IfaceMap{
					"field": "cluster_id",
					"size": 10,
				},
				"aggs": IfaceMap{
					"group_by_state": IfaceMap{
						"terms": IfaceMap{
							"field": "state",
							"size": 5,
						},
					},
				},
			},
		},
	}
	buckets, err := queryMetricBuckets(reqBody, "alert_top_ten", INDEX_ALL_ALERTS)
	if err != nil {
		return nil, err
	}
	var metricData []IfaceMap
	var clusterIDs []interface{}
	if bks, ok := buckets.([]interface{}); ok {
		for _, bk := range bks {
			if bkm, ok :=  bk.(map[string]interface{}); ok {
				stateBuckets := queryValue(bkm, "group_by_state.buckets", nil )
				key := queryValue(bkm, "key", "" )
				clusterIDs = append(clusterIDs, key)
				if stateBKS, ok := stateBuckets.([]interface{}); ok{
					for _, stateBK := range stateBKS {
						if stateBKMap, ok := stateBK.(map[string]interface{}); ok {
							metricData = append(metricData, IfaceMap{
								"x": key,
								"y": queryValue(stateBKMap, "doc_count", 0),
								"g": queryValue(stateBKMap, "key", ""),
							})
						}
					}
				}
			}
		}
	}
	//reqBody = IfaceMap{
	//	"query": IfaceMap{
	//		"terms": IfaceMap{
	//			"_id": clusterIDs,
	//		},
	//	},
	//}
	return metricData, nil
}

func getLastAlertDayCount() (interface{}, error){
	reqBody := IfaceMap{
		"size": 0,
		"query": IfaceMap{
			"bool": IfaceMap{
				"filter": []IfaceMap{
					{"range": IfaceMap{
						"start_time": IfaceMap{
							"gte": "now-3M",
						},
					}},
				},
			},
		},
		"aggs": IfaceMap{
			"alert_day_count": IfaceMap{
				"date_histogram": IfaceMap{
					"field": "start_time",
					"interval": "day",
				},
			},
		},
	}
	buckets, err := queryMetricBuckets(reqBody, "alert_day_count", INDEX_ALL_ALERTS)
	if err != nil {
		return nil, err
	}
	var metricData []interface{}
	if bks, ok := buckets.([]interface{}); ok {
		for _, bk := range bks {
			if bkm, ok :=  bk.(map[string]interface{}); ok {
				metricData = append(metricData, []interface{}{
					queryValue(bkm, "key", ""),
					queryValue(bkm, "doc_count", 0),
				})
			}
		}
	}
	return metricData, nil
}
