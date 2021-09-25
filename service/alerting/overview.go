package alerting

import (
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

func GetAlertMetric(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

}

func getLastAlertDayCount() error{
	conf := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s", conf.Endpoint, getAlertIndexName(INDEX_ALL_ALERTS))
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
		return err
	}
	result := IfaceMap{}
	defer res.Body.Close()
	err = decodeJSON(res.Body, &result)
	if err != nil {
		return err
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
	return nil
}
