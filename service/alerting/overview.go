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
	writeJSON(w, IfaceMap{
		"metrics": IfaceMap{
			"alert_day": alertDayMetricData,
		},
		"ok": true,
	}, http.StatusOK)
}

func getLastAlertDayCount() (interface{}, error){
	conf := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_search", conf.Endpoint, getAlertIndexName(INDEX_ALL_ALERTS))
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
	buckets := queryValue(result, "aggregations.alert_day_count.buckets", []interface{}{})
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
