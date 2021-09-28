package alerting

import (
	"errors"
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/search-center/model/alerting"
	alertUtil "infini.sh/search-center/service/alerting/util"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func GetMonitor(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	mid := ps.ByName("monitorID")
	config := getDefaultConfig()

	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), mid)
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
	if found, ok := resBody["found"].(bool); ok && !found {
		writeError(w, errors.New("monitor not found"))
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
	queryDSL = fmt.Sprintf(queryDSL, mid)
	reqUrl = fmt.Sprintf("%s/%s/_search", config.Endpoint, getAlertIndexName(INDEX_ALL_ALERTS))
	res, err = doRequest(reqUrl, http.MethodPost,nil, queryDSL)

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
	dayCountBuckets := queryValue(searchResBody,  "aggregations.24_hour_count.buckets", 0)
	dayCount := 0
	if dcb, ok := dayCountBuckets.([]interface{}); ok {
		if dayAgg, ok := dcb[0].(map[string]interface{}); ok {
			dayCount = int(dayAgg["doc_count"].(float64))
		}
	}

	activeBuckets := queryValue(searchResBody, "aggregations.active_count.buckets",[]interface{}{})
	activeCount := 0
	if ab, ok := activeBuckets.([]interface{}); ok {
		for _, bk := range ab {
			if curr, ok := bk.(map[string]interface{}); ok {
				if curr["key"].(string) == "ACTIVE" {
					activeCount = int(curr["doc_count"].(float64))
					break
				}
			}
		}
	}
	monitor := queryValue(resBody, "_source.monitor", nil)
	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": monitor,
		"activeCount": activeCount,
		"dayCount": dayCount,
		"version": queryValue(resBody, "_version", nil),
	}, http.StatusOK)
}

func GetMonitors(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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
		must = []IfaceMap{
			{
				"match": IfaceMap{
					"cluster_id": id,
				},
			},
			{
				"exists": IfaceMap{
					"field": MONITOR_FIELD,
				},
			},
		}
	)
	if clearSearch := strings.TrimSpace(search); clearSearch != "" {
		clearSearch =  strings.ReplaceAll(clearSearch, " ", "* *")
		must = append(must, IfaceMap{
			"query_string": IfaceMap{
				//"default_field": "monitor.name",
				"default_operator": "AND",
				"query": fmt.Sprintf("*%s*", clearSearch),
			},
		})
	}
	var filter = []IfaceMap{
		{ "term": IfaceMap{ "monitor.type": "monitor" }},
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
		"query": IfaceMap{
			"bool": IfaceMap{
				"filter": filter,
				"must": must,
				"must_not": []IfaceMap{
					{
						"exists": IfaceMap{
							"field": "monitor.status",
						},
					},
				},
			},
		},
	}
	assignTo(params, sortPageData)
	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_search", config.Endpoint, orm.GetIndexName(alerting.Config{}) )
	res, err := doRequest(reqUrl, http.MethodGet, nil, params)
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
				monitor := queryValue(hit, "_source.monitor", IfaceMap{}).(map[string]interface{})
				monitorMap[id.(string)] = IfaceMap{
					"id":            id,
					"version":       queryValue(hit, "_version", ""),
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
					"active": IfaceMap{ "filter": IfaceMap{ "term": IfaceMap{ "state": ALERT_ACTIVE } } },
					"acknowledged": IfaceMap{ "filter": IfaceMap{ "term": IfaceMap{ "state": ALERT_ACKNOWLEDGED } } },
					"errors": IfaceMap{ "filter": IfaceMap{ "term": IfaceMap{ "state": ALERT_ERROR } } },
					"ignored": IfaceMap{
						"filter": IfaceMap{
							"bool": IfaceMap{
								"filter": IfaceMap{ "term": IfaceMap{ "state": ALERT_COMPLETED } },
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

	reqUrl = fmt.Sprintf("%s/%s/_search", config.Endpoint, getAlertIndexName(INDEX_ALL_ALERTS))
	searchRes, err := doRequest(reqUrl, http.MethodPost, nil, aggsParams)
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
				monitor["acknowledged"] = queryValue(bk, "acknowledged.doc_count", 0)
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

	var monitor = &alerting.Monitor{}
	err := decodeJSON(req.Body, &monitor)
	if err != nil {
		writeError(w, err)
		return
	}

	monitor.LastUpdateTime = time.Now().UnixNano()/1e6
	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_doc", config.Endpoint, orm.GetIndexName(alerting.Config{}))
	res, err := doRequest(reqUrl, http.MethodPost, map[string]string{
		"refresh": "wait_for",
	}, IfaceMap{
		"cluster_id": id,
		MONITOR_FIELD: monitor,
	})
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
	monitorId := queryValue(resBody, "_id", "").(string)
	GetScheduler().AddMonitor(monitorId, &ScheduleMonitor{
		Monitor: monitor,
		ClusterID: id,
	})

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": IfaceMap{
			MONITOR_FIELD: monitor,
			"_id": monitorId,
			"_version":  queryValue(resBody, "_version", 0),
		},
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
	config := getDefaultConfig()

	//change alert state to deleted and move alert to history
	reqUrl := fmt.Sprintf("%s/_reindex", config.Endpoint)
	query := IfaceMap{
		"bool": IfaceMap{
			"must": []IfaceMap{
				{"match": IfaceMap{
					"monitor_id": monitorId,
				}},
			},
		},
	}
	reqBody := IfaceMap{
		"source": IfaceMap{
			"index": getAlertIndexName(INDEX_ALERT),
			"query": query,
		},
		"dest": IfaceMap{
			"index": getAlertIndexName(INDEX_ALERT_HISTORY),
		},
		"script": IfaceMap{
			"source": fmt.Sprintf("ctx._source['state'] = '%s';", ALERT_DELETED),
		},
	}
	_, err := doRequest(reqUrl, http.MethodPost,nil, reqBody)
	if err != nil {
		writeError(w, err)
		return
	}
	//delete alert
	reqUrl = fmt.Sprintf("%s/%s/_delete_by_query", config.Endpoint, getAlertIndexName(INDEX_ALERT))
	_, err = doRequest(reqUrl, http.MethodPost, nil, IfaceMap{
		"query" : query,
	})
	if err != nil {
		writeError(w, err)
		return
	}

	//logic delete monitor
	reqUrl = fmt.Sprintf("%s/%s/_update/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), monitorId)
	res, err := doRequest(reqUrl, http.MethodPost, map[string]string{
		"refresh": "wait_for",
	}, IfaceMap{
		"script" : IfaceMap{
			"source": "ctx._source.monitor.status = 'DELETED';",
			"lang": "painless",
		},
	})
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

	resultIfce := queryValue(resBody, "result", "")
	var isOk = false
	if result, ok := resultIfce.(string); ok && result == "updated" {
		isOk = true
		GetScheduler().RemoveMonitor(monitorId)
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
	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), monitorId)

	var monitor = &alerting.Monitor{}
	err := decodeJSON(req.Body, &monitor)
	if err != nil {
		writeError(w, err)
		return
	}
	if len(monitor.Triggers) > 0 {
		for i, trigger := range monitor.Triggers {
			if trigger.ID == "" {
				monitor.Triggers[i].ID = util.GetUUID()
			}
			if len(trigger.Actions) > 0 {
				for j, action := range trigger.Actions {
					if action.ID == ""{
						monitor.Triggers[i].Actions[j].ID = util.GetUUID()
					}
				}
			}
		}
	}
	monitor.LastUpdateTime = time.Now().UnixNano()/1e6
	res, err := doRequest(reqUrl, http.MethodPut, map[string]string{
		"refresh": "wait_for",
	}, IfaceMap{
		"cluster_id": id,
		MONITOR_FIELD: monitor,
	})
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

	GetScheduler().UpdateMonitor(monitorId, &ScheduleMonitor{
		Monitor: monitor,
		ClusterID: id,
	})
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
	var ackAlertsReq = struct {
		AlertIDs []string `json:"alerts"`
	}{}
	err := decodeJSON(req.Body, &ackAlertsReq)
	if err != nil {
		writeError(w, err)
		return
	}

	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_update_by_query", config.Endpoint, getAlertIndexName(INDEX_ALERT))
	reqBody := IfaceMap{
		"query": IfaceMap{
			"bool": IfaceMap{
				"must":[]IfaceMap{
					{"match": IfaceMap{
						"monitor_id": monitorId,
					}},
					{
						"terms": IfaceMap{
							"_id": ackAlertsReq.AlertIDs,
						},
					},
				},
			},

		},
		"script": IfaceMap{
			"source": fmt.Sprintf("ctx._source['state'] = '%s';ctx._source['acknowledged_time'] = %dL;", ALERT_ACKNOWLEDGED, time.Now().UnixNano()/1e6),
		},
	}
	res, err := doRequest(reqUrl, http.MethodPost, map[string]string{
		"refresh":"",
	}, reqBody)
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
	if failed, ok := resBody["failures"].([]interface{}); ok && len(failed) == 0 {
		isOk = true
	}

	writeJSON(w, IfaceMap{
		"ok": isOk,
		"resp": IfaceMap{
			"success": ackAlertsReq.AlertIDs,
			"failed": []string{},
		},
	}, http.StatusOK)

}

func ExecuteMonitor(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	meta := elastic.GetMetadata(id)
	if meta == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}
	var (
		dryrun = getQueryParam(req, "dryrun", "true")
	)

	var monitor = &alerting.Monitor{}
	err := decodeJSON(req.Body, &monitor)
	if err != nil {
		writeError(w, err)
		return
	}

	if monitor.Name == "TEMP_MONITOR"{

	}
	if len(monitor.Inputs) == 0 {
		writeError(w, errors.New("no input"))
		return
	}
	periodStart := time.Now()
	reqUrl := fmt.Sprintf("%s/%s/_search", meta.GetActiveEndpoint(), strings.Join(monitor.Inputs[0].Search.Indices, ","))
	res, err := doRequest(reqUrl, http.MethodGet, nil, monitor.Inputs[0].Search.Query)
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

	var triggerResults = IfaceMap{}
	if dryrun == "true" {
		sm := ScheduleMonitor{
			Monitor: monitor,
		}
		for _, trigger := range monitor.Triggers {
			triggerResult := IfaceMap{
				"error": nil,
				"action_results": IfaceMap{},
				"name": trigger.Name,
			}
			monitorCtx, err := createMonitorContext(&trigger, resBody, &sm, IfaceMap{})
			if err != nil {
				triggerResult["error"] = err
				triggerResults[trigger.ID] = triggerResult
				continue
			}
			isTrigger, err := resolveTriggerResult(&trigger, monitorCtx)
			triggerResult["triggered"] = isTrigger
			if err != nil {
				triggerResult["error"] = err
			}
			if trigger.ID == "" {
				trigger.ID = util.GetUUID()
			}
			triggerResults[trigger.ID] = triggerResult
		}
	}

	period := alertUtil.GetMonitorPeriod(&periodStart, &monitor.Schedule)
	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": IfaceMap{
			"error": nil,
			"monitor_name": monitor.Name,
			"input_results": IfaceMap{
				"error": nil,
				"results": []IfaceMap{resBody},
			},
			"trigger_results": triggerResults,
			"period_start": period.Start,
			"period_end": period.End,
		},
	}, http.StatusOK)
}
