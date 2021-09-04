package alerting

import (
	"errors"
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"net/http"
	"strings"
)

func GetMonitor(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	mid := ps.ByName("monitorID")
	// /_opendistro/_alerting/monitors/uiSjqXsBHT9Hsiy5Dq6g
	reqUrl := fmt.Sprintf("%s/_opendistro/_alerting/monitors/%s", conf.Endpoint, mid)
	res, err := doRequest(reqUrl, http.MethodGet, nil, nil)
	if err != nil {
		writeError(w, err)
		return
	}
	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		writeError(w, err)
		return
	}
	res.Body.Close()

	if _, ok := resBody["monitor"]; !ok {
		writeJSON(w, IfaceMap{
			"body": IfaceMap{
				"ok": false,
			},
		}, http.StatusOK)
		return
	}
	///_opendistro/_alerting/monitors/_search?index=.opendistro-alerting-alert*

	queryDSL := ` {
            "size": 0,
            "query"": {
              "bool": {
                "must": {
                  "term"": {
                    "monitor_id": "%s",
                  },
                },
              },
            },
            "aggs": {
              "active_count": {
                "terms": {
                  "field": "state",
                }
              },
              "24_hour_count": {
                "date_range": {
                  "field": "start_time",
                  "ranges": [{ "from": "now-24h/h" }]
                }
              }
            }
          }`
	queryDSL = fmt.Sprintf(queryDSL, id)
	reqUrl = fmt.Sprintf("%s/_opendistro/_alerting/monitors/_search", conf.Endpoint)
	res, err = doRequest(reqUrl, http.MethodPost, map[string]string{
		"index": ".opendistro-alerting-alert*",
	}, queryDSL)

	if err != nil {
		writeError(w, err)
		return
	}

	var searchResBody = IfaceMap{}
	err = decodeJSON(res.Body, &searchResBody)
	if err != nil {
		writeError(w, err)
		return
	}
	//dayCount := queryValue(searchResBody,  "aggregations.24_hour_count.buckets.0.doc_count", 0)
	//activeBuckets := queryValue(searchResBody, "aggregations.active_count.buckets",[]interface{}{})
	writeJSON(w, IfaceMap{
		"body": IfaceMap{
			"ok": true,
			"resp": resBody,
		},
	}, http.StatusOK)
}

func queryValue(obj map[string]interface{}, key string, defaultValue interface{}) interface{} {
	if key == "" {
		return obj
	}
	idx := strings.Index(key, ".")
	if idx == -1 {
		if v, ok := obj[key]; ok {
			return v
		}
		return defaultValue
	}

	ckey := key[0:idx]

	if v, ok := obj[ckey]; ok {
		if vmap, ok := v.(map[string]interface{}); ok {
			return queryValue(vmap, key[idx+1:], defaultValue)
		}
	}
	return defaultValue
}