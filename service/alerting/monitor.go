package alerting

import (
	"bytes"
	"errors"
	"fmt"
	"infini.sh/console/model/alerting"
	alertUtil "infini.sh/console/service/alerting/util"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"io"
	"net/http"
	"src/github.com/buger/jsonparser"
	"src/github.com/valyala/fasttemplate"
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
	esClient := elastic.GetClient(config.ID)
	res, err := esClient.Get(orm.GetIndexName(alerting.Config{}), "", mid)
	if err != nil {
		writeError(w, err)
		return
	}

	if !res.Found {
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
	searchRes, err := esClient.SearchWithRawQueryDSL(getAlertIndexName(INDEX_ALL_ALERTS), []byte(queryDSL))
	if err != nil {
		writeError(w, err)
		return
	}
	var dayCountBuckets interface{}
	if agg, ok := searchRes.Aggregations["24_hour_count"]; ok {
		dayCountBuckets = agg.Buckets
	}
	dayCount := 0
	if dcb, ok := dayCountBuckets.([]elastic.BucketBase); ok {
		dayCount = int(dcb[0]["doc_count"].(float64))
	}

	var activeBuckets interface{}
	if agg, ok := searchRes.Aggregations["active_count"]; ok {
		activeBuckets = agg.Buckets
	}
	activeCount := 0
	if ab, ok := activeBuckets.([]elastic.BucketBase); ok {
		for _, bk := range ab {
			if bk["key"].(string) == "ACTIVE" {
				activeCount = int(bk["doc_count"].(float64))
				break
			}
		}
	}
	monitor := queryValue(res.Source, "monitor", nil)
	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": monitor,
		"activeCount": activeCount,
		"dayCount": dayCount,
		"version": res.Version,
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
	var (
		intSize int
		intFrom int
	)
	intSize, _ = strconv.Atoi(size)
	if intSize < 0 {
		intSize = 1000
	}
	intFrom, _ = strconv.Atoi(from)
	if intFrom < 0 {
		intFrom = 0
	}

	sortPageData := IfaceMap{
		"size": intSize,
		"from": intFrom,
	}
	if msort, ok := monitorSorts[sortField]; ok {
		sortPageData["sort"] = []IfaceMap{
			{ msort.(string): sortDirection },
		}
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
	esClient := elastic.GetClient(config.ID)
	resBody, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(alerting.Config{}), util.MustToJSONBytes(params))
	if err != nil {
		writeError(w, err)
		return
	}

	totalMonitors := resBody.GetTotal()
	var monitors  []IfaceMap
	var hits = resBody.Hits.Hits
	monitorIDs := []interface{}{}
	monitorMap := map[string]int{}
	for i, hit := range hits {
			monitorIDs = append(monitorIDs, hit.ID)
			monitor := hit.Source["monitor"].(map[string]interface{})
			monitorMap[hit.ID] = i
			monitors = append(monitors, IfaceMap{
				"id":            hit.ID,
				//"version":      hit.,
				"name":         monitor["name"],
				"enabled":      monitor["enabled"],
				"monitor":       monitor,
			})
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

	searchRes, err := esClient.SearchWithRawQueryDSL(getAlertIndexName(INDEX_ALL_ALERTS), util.MustToJSONBytes(aggsParams))
	if err != nil {
		writeError(w, err)
		return
	}

	var buckets interface{}
	if agg, ok :=  searchRes.Aggregations["uniq_monitor_ids"]; ok {
		buckets = agg.Buckets
	}
	if bks, ok := buckets.([]elastic.BucketBase); ok {
		for _, bk := range bks {
			id := queryValue(bk, "key", "")
			monitor := monitors[monitorMap[id.(string)]]
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
			delete(monitorMap, id.(string))
		}
	}

	for _, idx := range monitorMap {
		assignTo(monitors[idx], IfaceMap{
			"lastNotificationTime": nil,
			"ignored": 0,
			"active": 0,
			"acknowledged": 0,
			"errors": 0,
			"latestAlert": "--",
			"currentTime": time.Now().UnixNano()/1e6,
		})
	}

	results := monitors

	//if _, ok := monitorSorts[sortField]; !ok {
	//	results = results[intFrom: intFrom + intSize]
	//}
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
	esClient := elastic.GetClient(config.ID)
	indexName :=  orm.GetIndexName(alerting.Config{})
	indexRes, err := esClient.Index(indexName,"",util.GetUUID(),IfaceMap{
		"cluster_id": id,
		MONITOR_FIELD: monitor,
	})
	if err != nil {
		writeError(w, err)
		return
	}


	monitorId := indexRes.ID
	GetScheduler().AddMonitor(monitorId, &ScheduleMonitor{
		Monitor: monitor,
		ClusterID: id,
	})

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": IfaceMap{
			MONITOR_FIELD: monitor,
			"_id": monitorId,
			"_version":  indexRes.Version,
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
	esClient := elastic.GetClient(config.ID)
	//change alert state to deleted and move alert to history
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
	_, err := esClient.Reindex(util.MustToJSONBytes(reqBody))
	if err != nil {
		writeError(w, err)
		return
	}
	//delete alert
	_, err = esClient.DeleteByQuery(getAlertIndexName(INDEX_ALERT), util.MustToJSONBytes(IfaceMap{
		"query" : query,
	}) )

	if err != nil {
		writeError(w, err)
		return
	}

	//logic delete monitor
	var indexName = orm.GetIndexName(alerting.Config{})
	getRes, err := esClient.Get(indexName, "", monitorId)
	if err != nil {
		writeError(w, err)
		return
	}
	source := util.MapStr(getRes.Source)
	source.Put("monitor.status", "DELETED")
	indexRes, err := esClient.Index(indexName, "", monitorId, source)
	if err != nil {
		writeError(w, err)
		return
	}

	var isOk = false
	if indexRes.Result == "updated" {
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
	config := getDefaultConfig()
	esClient := elastic.GetClient(config.ID)
	indexName := orm.GetIndexName(alerting.Config{})
	getRes, err := esClient.Get(indexName, "", monitorId)
	if err != nil {
		writeError(w, err)
		return
	}
	if !getRes.Found {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	indexRes, err := esClient.Index(indexName, "", monitorId,  IfaceMap{
		"cluster_id": getRes.Source["cluster_id"],
		MONITOR_FIELD: monitor,
	})
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
		"version": indexRes.Version,
		"id": indexRes.ID,
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
	esClient := elastic.GetClient(config.ID)
	res, err := esClient.UpdateByQuery( getAlertIndexName(INDEX_ALERT), util.MustToJSONBytes(reqBody))
	if err != nil {
		writeError(w, err)
		return
	}

	var isOk = false
	if len(res.Failures) == 0 {
		isOk = true
	}

	writeJSON(w, IfaceMap{
		"ok": isOk,
		"resp": IfaceMap{
			"success": ackAlertsReq.AlertIDs,
			"failed": res.Failures,
		},
	}, http.StatusOK)

}

func ExecuteMonitor(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	esClient := elastic.GetClient(id)
	if esClient == nil {
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
	period := alertUtil.GetMonitorPeriod(periodStart, &monitor.Schedule)
	//strQuery := string(util.MustToJSONBytes(monitor.Inputs[0].Search.Query))
	//resolveQuery(strQuery, IfaceMap{
	//
	//	"periodStart": period.Start,
	//	"periodEnd": period.End,
	//})

	queryDsl := util.MustToJSONBytes(monitor.Inputs[0].Search.Query)
	searchRes, err := esClient.SearchWithRawQueryDSL(strings.Join(monitor.Inputs[0].Search.Indices, ","), queryDsl)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	util.MustFromJSONBytes(searchRes.RawResult.Body, &resBody)

	var triggerResults = IfaceMap{}
	sm := ScheduleMonitor{
		Monitor: monitor,
	}

	var monitorCtx []byte
	if dryrun == "true" {
		for _, trigger := range monitor.Triggers {
			triggerResult := IfaceMap{
				"error": nil,
				"action_results": IfaceMap{},
				"name": trigger.Name,
			}
			monitorCtx, err = createMonitorContext(&trigger, resBody, &sm, IfaceMap{
				"periodStart": period.Start,
				"periodEnd": period.End,
			})
			if err != nil {
				triggerResult["error"] = err.Error()
				triggerResults[trigger.ID] = triggerResult
				continue
			}
			isTrigger, rerr := resolveTriggerResult(&trigger, monitorCtx)
			triggerResult["triggered"] = isTrigger
			if rerr != nil {
				triggerResult["error"] = rerr.Error()
			}
			if trigger.ID == "" {
				trigger.ID = util.GetUUID()
			}
			triggerResults[trigger.ID] = triggerResult
		}
	}else{
		LOOP_TRIGGER:
		for _, trigger := range monitor.Triggers {
			monitorCtx, err = createMonitorContext(&trigger, resBody, &sm, IfaceMap{
				"periodStart": period.Start,
				"periodEnd": period.End,
			})
			if err != nil {
				break
			}
			for _, action := range trigger.Actions {
				_, err = doAction(action, monitorCtx)
				if err != nil {
					break LOOP_TRIGGER
				}
			}
		}
	}


	var (
		ok = true
		errStr string
	)
	if err != nil {
		ok = false
		errStr = err.Error()
	}
	writeJSON(w, IfaceMap{
		"ok": ok,
		"resp": IfaceMap{
			"error": errStr,
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

func resolveQuery(query string, ctx IfaceMap ) ([]byte, error){
	ctxBytes := util.MustToJSONBytes(ctx)
	msg := query
	tpl := fasttemplate.New(msg, "{{", "}}")
	msgBuffer := bytes.NewBuffer(nil)
	_, err := tpl.ExecuteFunc(msgBuffer, func(writer io.Writer, tag string)(int, error){
		keyParts := strings.Split(tag,".")
		value, _, _, err := jsonparser.Get(ctxBytes, keyParts...)
		if err != nil {
			return 0, err
		}
		return writer.Write(value)
	})
	return msgBuffer.Bytes(), err
	//return json.Marshal(msg)
}