package alerting

import (
	"errors"
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"net/http"
	"runtime/debug"
	"strconv"
	"strings"
	"time"
)

func GetMonitor(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	defer func() {
		if err := recover(); err != nil {
			debug.PrintStack()
		}
	}()
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	mid := ps.ByName("monitorID")
	// /_opendistro/_alerting/monitors/uiSjqXsBHT9Hsiy5Dq6g
	reqUrl := fmt.Sprintf("%s/%s/_alerting/monitors/%s", conf.Endpoint, API_PREFIX, mid)
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
				"ok": false,
		}, http.StatusOK)
		return
	}

	queryDSL := ` {
            "size": 0,
            "query": {
              "bool": {
                "must": {
                  "term": {
                    "monitor_id": "%s"
                  }
                }
              }
            },
            "aggs": {
              "active_count": {
                "terms": {
                  "field": "state"
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
	reqUrl = fmt.Sprintf("%s/%s/_alerting/monitors/_search", conf.Endpoint, API_PREFIX)
	res, err = doRequest(reqUrl, http.MethodPost, map[string]string{
		"index": INDEX_ALL_ALERTS,
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
	dayCount := queryValue(searchResBody,  "aggregations.24_hour_count.buckets.0.doc_count", 0)
	activeBuckets := queryValue(searchResBody, "aggregations.active_count.buckets",[]interface{}{})
	activeCount := 0
	if ab, ok := activeBuckets.([]IfaceMap); ok {
		for _, curr := range ab {
			if  curr["key"].(string) == "ACTIVE" {
				activeCount = int(curr["doc_count"].(float64))
			}
		}
	}
	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody["monitor"],
		"activeCount": activeCount,
		"dayCount": dayCount,
		"version": queryValue(resBody, "_version", nil),
		"ifSeqNo": queryValue(resBody, "_seq_no", nil),
		"ifPrimaryTerm": queryValue(resBody, "_primary_term", nil),
	}, http.StatusOK)
}

func GetMonitors(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	defer func() {
		if err := recover(); err != nil {
			debug.PrintStack()
		}
	}()
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}
	var (
		from = getQueryParam(req, "from")
		size = getQueryParam(req, "size")
		search = getQueryParam(req, "search")
		sortDirection = getQueryParam(req, "sortDirection")
		sortField = getQueryParam(req, "sortField")
		state = getQueryParam(req, "state")
		must = IfaceMap{ "match_all": IfaceMap{} }
	)
	if clearSearch := strings.TrimSpace(search); clearSearch != "" {
		clearSearch =  strings.ReplaceAll(clearSearch, " ", "* *")
		must = IfaceMap{
          "query_string": IfaceMap{
			"default_field": "monitor.name",
            "default_operator": "AND",
            "query": fmt.Sprintf("*%s*", clearSearch),
          },
        }
	}
	var filter = []IfaceMap{
		IfaceMap{ "term": IfaceMap{ "monitor.type": "monitor" }},
	}
	if state != "all" {
		filter = append(filter, IfaceMap{
			"term": IfaceMap{ "monitor.enabled": state == "enabled" },
		})
	}
	var monitorSorts = IfaceMap{ "name": "monitor.name.keyword" }
	sortPageData := IfaceMap{
		"size": 1000,
		"from": 0,
	}
	var (
		intSize int
		intFrom int
	)
	if msort, ok := monitorSorts[sortField]; ok {
		sortPageData["sort"] = []IfaceMap{
			{ msort.(string): sortDirection },
		}
		intSize, _ = strconv.Atoi(size)
		if intSize < 0 {
			intSize = 1000
		}
		sortPageData["size"] = intSize
		intFrom, _ = strconv.Atoi(from)
		if intFrom < 0 {
			intFrom = 0
		}
		sortPageData["from"] = intFrom
	}
	var params = IfaceMap{
		"seq_no_primary_term": true,
		"version":             true,
		"query": IfaceMap{
			"bool": IfaceMap{
				"filter": filter,
				"must": must,
			},
		},
	}
	assignTo(params, sortPageData)
	reqUrl := fmt.Sprintf("%s/%s/_alerting/monitors/_search", conf.Endpoint, API_PREFIX )
	res, err := doRequest(reqUrl, http.MethodPost, nil, params)
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

	totalMonitors := queryValue(resBody, "hits.total.value", 0)
	monitorMap:= map[string]IfaceMap{}
	var hits = queryValue(resBody, "hits.hits", []IfaceMap{})
	monitorIDs := []interface{}{}
	if hitsArr, ok := hits.([]interface{}); ok {
		for _, hitIface := range hitsArr {
			if hit, ok := hitIface.(map[string]interface{}); ok {
				id := queryValue(hit, "_id", "")
				monitorIDs = append(monitorIDs, id)
				monitor := queryValue(hit, "_source", IfaceMap{}).(map[string]interface{})
				monitorMap[id.(string)] = IfaceMap{
					"id":            id,
					"version":       queryValue(hit, "_version", ""),
					"ifSeqNo":       queryValue(hit, "_seq_no", false),
					"ifPrimaryTerm": queryValue(hit, "_primary_term", false),
					"name":          queryValue(monitor, "name", ""),
					"enabled":       queryValue(monitor, "enabled", false),
					"monitor":       monitor,
				}
			}
		}
	}


	aggsOrderData := IfaceMap{}
	aggsSorts := IfaceMap{
		"active": "active",
		"acknowledged": "acknowledged",
		"errors": "errors",
		"ignored": "ignored",
		"lastNotificationTime": "last_notification_time",
	}

	if sortF, ok := aggsSorts[sortField]; ok {
		aggsOrderData["order"] = IfaceMap{ sortF.(string): sortDirection }
	}
	var queryParams = map[string]string{
		"index": INDEX_ALL_ALERTS,
	}
	var termsMap = IfaceMap{
		"field": "monitor_id",
		"size": intFrom + intSize,
	}
	assignTo(termsMap, aggsOrderData)
	var aggsParams = IfaceMap{
		"size": 0,
		"query": IfaceMap{ "terms": IfaceMap{ "monitor_id": monitorIDs } },
		"aggregations": IfaceMap{
			"uniq_monitor_ids": IfaceMap{
				"terms": termsMap,
				"aggregations": IfaceMap{
					"active": IfaceMap{ "filter": IfaceMap{ "term": IfaceMap{ "state": "ACTIVE" } } },
					"acknowledged": IfaceMap{ "filter": IfaceMap{ "term": IfaceMap{ "state": "ACKNOWLEDGED" } } },
					"errors": IfaceMap{ "filter": IfaceMap{ "term": IfaceMap{ "state": "ERROR" } } },
					"ignored": IfaceMap{
						"filter": IfaceMap{
							"bool": IfaceMap{
								"filter": IfaceMap{ "term": IfaceMap{ "state": "COMPLETED" } },
								"must_not": IfaceMap{ "exists": IfaceMap{ "field": "acknowledged_time" } },
							},
						},
					},
					"last_notification_time": IfaceMap{ "max": IfaceMap{ "field": "last_notification_time" } },
					"latest_alert": IfaceMap{
						"top_hits": IfaceMap{
							"size": 1,
							"sort": []IfaceMap{ { "start_time": IfaceMap{ "order": "desc" }} },
							"_source": IfaceMap{
								"includes": []string{"last_notification_time", "trigger_name"},
							},
						},
					},
				},
			},
		},
	}


	reqUrl = fmt.Sprintf("%s/%s/_alerting/monitors/_search", conf.Endpoint, API_PREFIX)
	searchRes, err := doRequest(reqUrl, http.MethodPost, queryParams, aggsParams)
	if err != nil {
		writeError(w, err)
		return
	}

	var searchResBody = IfaceMap{}
	err = decodeJSON(searchRes.Body, &searchResBody)
	if err != nil {
		writeError(w, err)
		return
	}
	buckets := queryValue(searchResBody, "aggregations.uniq_monitor_ids.buckets",[]IfaceMap{})
	usedMonitors := []IfaceMap{}
	if bks, ok := buckets.([]interface{}); ok {
		for _, bk := range bks {
			if bk, ok := bk.(map[string]interface{}); ok {
				id := queryValue(bk, "key", "")
				monitor := monitorMap[id.(string)]
				monitor["lastNotificationTime"] = queryValue(bk, "last_notification_time.value", "")
				monitor["ignored"] = queryValue(bk, "ignored.doc_count", 0)
				alertHits := queryValue(bk, "latest_alert.hits.hits", nil)
				var latestAlert interface{}
				if hits, ok := alertHits.([]interface{}); ok && len(hits) > 0 {
					if hitMap, ok := hits[0].(map[string]interface{}); ok {
						latestAlert = queryValue(hitMap, "_source.trigger_name", nil)
					}
				}
				monitor["latestAlert"] = latestAlert
				monitor["active"] = queryValue(bk, "active.doc_count", 0)
				monitor["errors"] = queryValue(bk, "errors.doc_count", 0)
				monitor["currentTime"] = time.Now().UnixNano() / 1e6
				usedMonitors = append(usedMonitors, monitor)
				delete(monitorMap, id.(string))
			}
		}
	}
	unusedMonitors := []IfaceMap{}

	for _, m := range monitorMap {
		assignTo(m, IfaceMap{
			"lastNotificationTime": nil,
			"ignored": 0,
			"active": 0,
			"acknowledged": 0,
			"errors": 0,
			"latestAlert": "--",
			"currentTime": time.Now().UnixNano()/1e6,
		})
		unusedMonitors = append(unusedMonitors,m)
	}

	results := append(usedMonitors, unusedMonitors...)

	if _, ok := monitorSorts[sortField]; !ok {
		results = results[intFrom: intFrom + intSize]
	}
	writeJSON(w, IfaceMap{
		"ok": true,
		"monitors": results,
		"totalMonitors": totalMonitors,
	}, http.StatusOK)
}


func CreateMonitor(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	reqUrl := fmt.Sprintf("%s/%s/_alerting/monitors", conf.Endpoint, API_PREFIX)
	res, err := doRequest(reqUrl, http.MethodPost, map[string]string{
		"refresh": "wait_for",
	}, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody,
	}, http.StatusOK)
}

func DeleteMonitor(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	monitorId := ps.ByName("monitorID")

	reqUrl := fmt.Sprintf("%s/%s/_alerting/monitors/%s", conf.Endpoint, API_PREFIX, monitorId)
	res, err := doRequest(reqUrl, http.MethodDelete, nil, nil)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}
	//TODO error handle: check whether resBody has contains field error

	resultIfce := queryValue(resBody, "result", "")
	var isOk = false
	if result, ok := resultIfce.(string); ok && result == "deleted" {
		isOk = true
	}
	writeJSON(w, IfaceMap{
		"ok": isOk,
	}, http.StatusOK)

}

func UpdateMonitor(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	monitorId := ps.ByName("monitorID")
	var (
		ifSeqNo = getQueryParam(req, "ifSeqNo")
		ifPrimaryTerm = getQueryParam(req, "ifPrimaryTerm")
	)

	reqUrl := fmt.Sprintf("%s/%s/_alerting/monitors/%s", conf.Endpoint, API_PREFIX, monitorId)
	res, err := doRequest(reqUrl, http.MethodPut, map[string]string{
		"refresh": "wait_for",
		"if_seq_no": ifSeqNo,
		"if_primary_term": ifPrimaryTerm,
	}, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"version": queryValue(resBody, "_version", ""),
		"id": queryValue(resBody, "_id", ""),
	}, http.StatusOK)

}

func AcknowledgeAlerts(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	monitorId := ps.ByName("monitorID")

	reqUrl := fmt.Sprintf("%s/%s/_alerting/monitors/%s/_acknowledge/alerts", conf.Endpoint, API_PREFIX, monitorId)
	res, err := doRequest(reqUrl, http.MethodPost,nil, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}

	var isOk = false
	if failed, ok := resBody["failed"].([]interface{}); ok && len(failed) == 0 {
		isOk = true
	}

	writeJSON(w, IfaceMap{
		"ok": isOk,
		"resp": resBody,
	}, http.StatusOK)

}

func ExecuteMonitor(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}
	var (
		dryrun = getQueryParam(req, "dryrun", "true")
	)

	reqUrl := fmt.Sprintf("%s/%s/_alerting/monitors/_execute", conf.Endpoint, API_PREFIX)
	res, err := doRequest(reqUrl, http.MethodPost, map[string]string{
		"dryrun": dryrun,
	}, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}
	//TODO error handle: check whether resBody has contains field error

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody,
	}, http.StatusOK)
}
