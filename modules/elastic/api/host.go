/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"fmt"
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/host"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
	"net"
	"net/http"
	"strings"
	"time"
)

func (h *APIHandler) SearchHostMetadata(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := util.MapStr{}
	reqBody := struct {
		Keyword      string                       `json:"keyword"`
		Size         int                          `json:"size"`
		From         int                          `json:"from"`
		Aggregations []elastic.SearchAggParam     `json:"aggs"`
		Highlight    elastic.SearchHighlightParam `json:"highlight"`
		Filter       elastic.SearchFilterParam    `json:"filter"`
		Sort         []string                     `json:"sort"`
		SearchField  string                       `json:"search_field"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if reqBody.Size <= 0 {
		reqBody.Size = 20
	}
	aggs := elastic.BuildSearchTermAggregations(reqBody.Aggregations)
	var should = []util.MapStr{}
	if reqBody.SearchField != "" {
		should = []util.MapStr{
			{
				"prefix": util.MapStr{
					reqBody.SearchField: util.MapStr{
						"value": reqBody.Keyword,
						"boost": 20,
					},
				},
			},
			{
				"match": util.MapStr{
					reqBody.SearchField: util.MapStr{
						"query":                reqBody.Keyword,
						"fuzziness":            "AUTO",
						"max_expansions":       10,
						"prefix_length":        2,
						"fuzzy_transpositions": true,
						"boost":                2,
					},
				},
			},
		}
	} else {
		if reqBody.Keyword != "" {
			should = []util.MapStr{
				{
					"match": util.MapStr{
						"search_text": util.MapStr{
							"query":                reqBody.Keyword,
							"fuzziness":            "AUTO",
							"max_expansions":       10,
							"prefix_length":        2,
							"fuzzy_transpositions": true,
							"boost":                2,
						},
					},
				},
			}
		}
	}

	query := util.MapStr{
		"aggs":      aggs,
		"size":      reqBody.Size,
		"from":      reqBody.From,
		"highlight": elastic.BuildSearchHighlight(&reqBody.Highlight),
		"query": util.MapStr{
			"bool": util.MapStr{
				"filter": elastic.BuildSearchTermFilter(reqBody.Filter),
				"should": should,
			},
		},
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
	}
	if len(reqBody.Sort) > 1 {
		query["sort"] = []util.MapStr{
			{
				reqBody.Sort[0]: util.MapStr{
					"order": reqBody.Sort[1],
				},
			},
		}
	}
	dsl := util.MustToJSONBytes(query)
	q := &orm.Query{
		RawQuery: dsl,
	}
	err, result := orm.Search(host.HostInfo{}, q)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	w.Write(result.Raw)
}

func (h *APIHandler) updateHost(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("host_id")
	obj := host.HostInfo{}

	obj.ID = id
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	toUpObj := host.HostInfo{}
	err = h.DecodeJSON(req, &toUpObj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	//protect
	if toUpObj.Name != "" {
		obj.Name = toUpObj.Name
	}
	obj.Tags = toUpObj.Tags
	if toUpObj.IP != "" {
		obj.IP = toUpObj.IP
	}
	err = orm.Update(nil, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "updated",
	}, 200)
}

func (h *APIHandler) getDiscoverHosts(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	hosts, err := discoverHost()
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var hostlist = []interface{}{}
	for _, host := range hosts {
		hostlist = append(hostlist, host)
	}

	h.WriteJSON(w, hostlist, http.StatusOK)
}

func getHostSummary(agentIDs []string, metricName string, summary map[string]util.MapStr) error {
	if summary == nil {
		summary = map[string]util.MapStr{
		}
	}

	if len(agentIDs) == 0 {
		return fmt.Errorf("empty agent ids")
	}

	q1 := orm.Query{WildcardIndex: true}
	query := util.MapStr{
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
		"collapse": util.MapStr{
			"field": "agent.id",
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.category": util.MapStr{
								"value": "host",
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.name": util.MapStr{
								"value": metricName,
							},
						},
					},
					{
						"terms": util.MapStr{
							"agent.id": agentIDs,
						},
					},
				},
			},
		},
	}
	q1.RawQuery = util.MustToJSONBytes(query)

	err, results := orm.Search(&event.Event{}, &q1)
	if err != nil {
		return err
	}
	for _, v := range results.Result {
		result, ok := v.(map[string]interface{})
		if ok {
			agentID, ok := util.GetMapValueByKeys([]string{"agent", "id"}, result)
			if ok {
				metric, ok := util.GetMapValueByKeys([]string{"payload", "host", metricName}, result)
				if ok {
					strAgentID := util.ToString(agentID)
					if _, ok = summary[strAgentID]; ok {
						summary[strAgentID][metricName] = metric
					} else {
						summary[strAgentID] = util.MapStr{
							metricName: metric,
						}
					}
				}

			}
		}
	}
	return nil
}

func getHostSummaryFromNode(nodeIDs []string) (map[string]util.MapStr, error) {
	q1 := orm.Query{WildcardIndex: true}
	query := util.MapStr{
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
		"collapse": util.MapStr{
			"field": "metadata.labels.node_id",
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.category": util.MapStr{
								"value": "elasticsearch",
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.name": util.MapStr{
								"value": "node_stats",
							},
						},
					},
					{
						"terms": util.MapStr{
							"metadata.labels.node_id": nodeIDs,
						},
					},
				},
			},
		},
	}
	q1.RawQuery = util.MustToJSONBytes(query)

	err, results := orm.Search(&event.Event{}, &q1)
	if err != nil {
		return nil, err
	}
	summary := map[string]util.MapStr{}
	for _, v := range results.Result {
		result, ok := v.(map[string]interface{})
		if ok {
			nodeID, ok := util.GetMapValueByKeys([]string{"metadata", "labels", "node_id"}, result)
			if ok {
				strNodeID := util.ToString(nodeID)
				summary[strNodeID] = util.MapStr{}
				osCPUPercent, ok := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "os", "cpu", "percent"}, result)
				if ok {
					summary[strNodeID]["cpu"] = util.MapStr{
						"used_percent": osCPUPercent,
					}
				}
				osMem, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "os", "mem"}, result)
				if osMemM, ok := osMem.(map[string]interface{}); ok {
					summary[strNodeID]["memory"] = util.MapStr{
						"used.percent":    osMemM["used_percent"],
						"available.bytes": osMemM["free_in_bytes"],
						"total.bytes":     osMemM["total_in_bytes"],
						"used.bytes":      osMemM["used_in_bytes"],
					}
				}
				fsTotal, _ := util.GetMapValueByKeys([]string{"payload", "elasticsearch", "node_stats", "fs", "total"}, result)
				if fsM, ok := fsTotal.(map[string]interface{}); ok {
					total, ok1 := fsM["total_in_bytes"].(float64)
					free, ok2 := fsM["free_in_bytes"].(float64)
					if ok1 && ok2 {
						summary[strNodeID]["filesystem_summary"] = util.MapStr{
							"used.percent": (total - free) * 100 / total,
							"total.bytes":  total,
							"free.bytes":   free,
							"used.bytes":   total - free,
						}
					}
				}
			}
		}
	}
	return summary, nil
}

func getHostSummaryFromAgent(agentIDs []string) (map[string]util.MapStr, error) {
	summary := map[string]util.MapStr{}
	if len(agentIDs) == 0 {
		return summary, nil
	}
	err := getHostSummary(agentIDs, "cpu", summary)
	if err != nil {
		return nil, err
	}
	err = getHostSummary(agentIDs, "memory", summary)
	if err != nil {
		return nil, err
	}
	err = getHostSummary(agentIDs, "filesystem_summary", summary)
	return summary, err
}

func (h *APIHandler) FetchHostInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var hostIDs = []string{}
	h.DecodeJSON(req, &hostIDs)

	if len(hostIDs) == 0 {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	queryDsl := util.MapStr{
		"query": util.MapStr{
			"terms": util.MapStr{
				"id": hostIDs,
			},
		},
	}
	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(queryDsl),
	}
	err, result := orm.Search(host.HostInfo{}, q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(result.Result) == 0 {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}

	var agentIDs []string
	var nodeIDs []string
	var hostIDToNodeID = map[string]string{}
	var hostIDToAgentID = map[string]string{}
	for _, row := range result.Result {
		tempHost := host.HostInfo{}
		buf := util.MustToJSONBytes(row)
		err = util.FromJSONBytes(buf, &tempHost)
		if err != nil {
			log.Error(err)
			continue
		}
		if tempHost.AgentID != "" {
			agentIDs = append(agentIDs, tempHost.AgentID)
			hostIDToAgentID[tempHost.ID] = tempHost.AgentID
			continue
		}
		if tempHost.NodeID != "" {
			nodeIDs = append(nodeIDs, tempHost.NodeID)
			hostIDToNodeID[tempHost.ID] = tempHost.NodeID
		}
	}

	summaryFromAgent, err := getHostSummaryFromAgent(agentIDs)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var summaryFromNode = map[string]util.MapStr{}
	if len(nodeIDs) > 0 {
		summaryFromNode, err = getHostSummaryFromNode(nodeIDs)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	statusMetric, err := getAgentOnlineStatusOfRecentDay(hostIDs)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	bucketSize, min, max, err := h.getMetricRangeAndBucketSize(req, 60, 15)
	if err != nil {
		panic(err)
		return
	}
	networkInMetricItem := newMetricItem("network_in_rate", 1, SystemGroupKey)
	networkInMetricItem.AddAxi("network_rate", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
	networkOutMetricItem := newMetricItem("network_out_rate", 1, SystemGroupKey)
	networkOutMetricItem.AddAxi("network_rate", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
	hostMetricItems := []GroupMetricItem{
		{
			Key:          "network_in_rate",
			Field:        "payload.host.network_summary.in.bytes",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   networkInMetricItem,
			FormatType:   "bytes",
			Units:        "/s",
		},
		{
			Key:          "network_out_rate",
			Field:        "payload.host.network_summary.out.bytes",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   networkOutMetricItem,
			FormatType:   "bytes",
			Units:        "/s",
		},
	}
	hostMetrics := h.getGroupHostMetric(agentIDs, min, max, bucketSize, hostMetricItems, "agent.id")

	networkMetrics := map[string]util.MapStr{}
	for key, item := range hostMetrics {
		for _, line := range item.Lines {
			if _, ok := networkMetrics[line.Metric.Label]; !ok {
				networkMetrics[line.Metric.Label] = util.MapStr{
				}
			}
			networkMetrics[line.Metric.Label][key] = line.Data
		}
	}

	infos := util.MapStr{}
	for _, hostID := range hostIDs {
		source := util.MapStr{}
		metrics := util.MapStr{
			"agent_status": util.MapStr{
				"metric": util.MapStr{
					"label": "Recent Agent Status",
					"units": "day",
				},
				"data": statusMetric[hostID],
			},
		}
		if agentID, ok := hostIDToAgentID[hostID]; ok {
			source["summary"] = summaryFromAgent[agentID]
			metrics["network_in_rate"] = util.MapStr{
				"metric": util.MapStr{
					"label": "Network In Rate",
					"units": "",
				},
				"data": networkMetrics[agentID]["network_in_rate"],
			}
			metrics["network_out_rate"] = util.MapStr{
				"metric": util.MapStr{
					"label": "Network Out Rate",
					"units": "",
				},
				"data": networkMetrics[agentID]["network_out_rate"],
			}
		} else {
			if nid, ok := hostIDToNodeID[hostID]; ok {
				source["summary"] = summaryFromNode[nid]
			}
		}
		source["metrics"] = metrics
		infos[hostID] = source
	}
	h.WriteJSON(w, infos, http.StatusOK)
}
func (h *APIHandler) GetHostInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	hostID := ps.MustGetParameter("host_id")
	hostInfo := &host.HostInfo{}
	hostInfo.ID = hostID
	exists, err := orm.Get(hostInfo)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !exists {
		h.WriteJSON(w, util.MapStr{
			"_id":   hostID,
			"found": false,
		}, http.StatusNotFound)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"found":   true,
		"_id":     hostID,
		"_source": hostInfo,
	}, 200)

}

func (h *APIHandler) getSingleHostMetric(agentID string, min, max int64, bucketSize int, metricItems []*common.MetricItem) map[string]*common.MetricItem {
	var must = []util.MapStr{
		{
			"term": util.MapStr{
				"agent.id": util.MapStr{
					"value": agentID,
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.category": util.MapStr{
					"value": "host",
				},
			},
		},
	}
	query := map[string]interface{}{}
	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"must": must,
			"filter": []util.MapStr{
				{
					"range": util.MapStr{
						"timestamp": util.MapStr{
							"gte": min,
							"lte": max,
						},
					},
				},
			},
		},
	}
	return h.getSingleMetrics(metricItems, query, bucketSize)
}

func (h *APIHandler) getSingleHostMetricFromNode(nodeID string, min, max int64, bucketSize int) map[string]*common.MetricItem {
	var must = []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.category": util.MapStr{
					"value": "elasticsearch",
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.name": util.MapStr{
					"value": "node_stats",
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.labels.node_id": util.MapStr{
					"value": nodeID,
				},
			},
		},
	}

	query := map[string]interface{}{}
	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"must": must,
			"filter": []util.MapStr{
				{
					"range": util.MapStr{
						"timestamp": util.MapStr{
							"gte": min,
							"lte": max,
						},
					},
				},
			},
		},
	}

	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	metricItems := []*common.MetricItem{}
	metricItem := newMetricItem("cpu_used_percent", 1, SystemGroupKey)
	metricItem.AddAxi("cpu", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
	metricItem.AddLine("CPU Used Percent", "CPU", "cpu used percent of host.", "group1", "payload.elasticsearch.node_stats.os.cpu.percent", "max", bucketSizeStr, "%", "num", "0,0.[00]", "0,0.[00]", false, false)
	metricItems = append(metricItems, metricItem)

	metricItem = newMetricItem("memory_used_percent", 1, SystemGroupKey)
	metricItem.AddAxi("Memory", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
	metricItem.AddLine("Memory Used Percent", "Memory Used Percent", "memory used percent of host.", "group1", "payload.elasticsearch.node_stats.os.mem.used_percent", "max", bucketSizeStr, "%", "num", "0,0.[00]", "0,0.[00]", false, false)
	metricItems = append(metricItems, metricItem)

	metricItem = newMetricItem("disk_used_percent", 1, SystemGroupKey)
	metricItem.AddAxi("disk", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
	metricItem.AddLine("Disk Used Percent", "Disk Used Percent", "disk used percent of host.", "group1", "payload.elasticsearch.node_stats.fs.total.free_in_bytes", "max", bucketSizeStr, "%", "num", "0,0.[00]", "0,0.[00]", false, false)
	metricItem.Lines[0].Metric.Field2 = "payload.elasticsearch.node_stats.fs.total.total_in_bytes"
	metricItem.Lines[0].Metric.Calc = func(value, value2 float64) float64 {
		return 100 - value*100/value2
	}
	metricItems = append(metricItems, metricItem)
	return h.getSingleMetrics(metricItems, query, bucketSize)
}

func (h *APIHandler) GetSingleHostMetrics(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	hostID := ps.MustGetParameter("host_id")
	hostInfo := &host.HostInfo{}
	hostInfo.ID = hostID
	exists, err := orm.Get(hostInfo)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !exists {
		h.WriteError(w, fmt.Sprintf("host [%s] not found", hostID), http.StatusNotFound)
		return
	}

	resBody := map[string]interface{}{}
	bucketSize, min, max, err := h.getMetricRangeAndBucketSize(req, 10, 60)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if hostInfo.AgentID == "" {
		resBody["metrics"] = h.getSingleHostMetricFromNode(hostInfo.NodeID, min, max, bucketSize)
		h.WriteJSON(w, resBody, http.StatusOK)
		return
	}
	isOverview := h.GetIntOrDefault(req, "overview", 0)

	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	metricItems := []*common.MetricItem{}
	metricItem := newMetricItem("cpu_used_percent", 1, SystemGroupKey)
	metricItem.AddAxi("cpu", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
	metricItem.AddLine("CPU Used Percent", "CPU", "cpu used percent of host.", "group1", "payload.host.cpu.used_percent", "max", bucketSizeStr, "%", "num", "0,0.[00]", "0,0.[00]", false, false)
	metricItems = append(metricItems, metricItem)
	if isOverview == 0 {
		metricItem = newMetricItem("system_load", 1, SystemGroupKey)
		metricItem.AddAxi("system_load", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		metricItem.AddLine("Load1", "Load1", "system load1.", "group1", "payload.host.cpu.load.load1", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
		metricItem.AddLine("Load5", "Load5", "system load5.", "group1", "payload.host.cpu.load.load5", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
		metricItem.AddLine("Load15", "Load15", "system load15.", "group1", "payload.host.cpu.load.load15", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
		metricItems = append(metricItems, metricItem)

		metricItem = newMetricItem("cpu_iowait", 1, SystemGroupKey)
		metricItem.AddAxi("cpu_iowait", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		metricItem.AddLine("iowait", "iowait", "cpu iowait.", "group1", "payload.host.cpu.iowait", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
		metricItems = append(metricItems, metricItem)
	}

	metricItem = newMetricItem("memory_used_percent", 1, SystemGroupKey)
	metricItem.AddAxi("Memory", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
	metricItem.AddLine("Memory Used Percent", "Memory Used Percent", "memory used percent of host.", "group1", "payload.host.memory.used.percent", "max", bucketSizeStr, "%", "num", "0,0.[00]", "0,0.[00]", false, false)
	metricItems = append(metricItems, metricItem)
	if isOverview == 0 {
		metricItem = newMetricItem("swap_memory_used_percent", 1, SystemGroupKey)
		metricItem.AddAxi("Swap Memory", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
		metricItem.AddLine("Swap Memory Used Percent", "Swap Memory Used Percent", "swap memory used percent of host.", "group1", "payload.host.memory_swap.used_percent", "max", bucketSizeStr, "%", "num", "0,0.[00]", "0,0.[00]", false, false)
		metricItems = append(metricItems, metricItem)
	}

	metricItem = newMetricItem("network_summary", 1, SystemGroupKey)
	metricItem.AddAxi("network_rate", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
	metricItem.AddLine("Network In Rate", "Network In Rate", "network in rate of host.", "group1", "payload.host.network_summary.in.bytes", "max", bucketSizeStr, "/s", "bytes", "0,0.[00]", "0,0.[00]", false, true)
	metricItem.AddLine("Network Out Rate", "Network Out Rate", "network out rate of host.", "group1", "payload.host.network_summary.out.bytes", "max", bucketSizeStr, "/s", "bytes", "0,0.[00]", "0,0.[00]", false, true)
	metricItems = append(metricItems, metricItem)
	if isOverview == 0 {
		metricItem = newMetricItem("network_packets_summary", 1, SystemGroupKey)
		metricItem.AddAxi("network_packets_rate", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		metricItem.AddLine("Network Packets In Rate", "Network Packets In Rate", "network packets in rate of host.", "group1", "payload.host.network_summary.in.packets", "max", bucketSizeStr, "packets/s", "num", "0,0.[00]", "0,0.[00]", false, true)
		metricItem.AddLine("Network Packets Out Rate", "Network Packets Out Rate", "network packets out rate of host.", "group1", "payload.host.network_summary.out.packets", "max", bucketSizeStr, "packets/s", "num", "0,0.[00]", "0,0.[00]", false, true)
		metricItems = append(metricItems, metricItem)
	}

	metricItem = newMetricItem("disk_used_percent", 1, SystemGroupKey)
	metricItem.AddAxi("disk", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
	metricItem.AddLine("Disk Used Percent", "Disk Used Percent", "disk used percent of host.", "group1", "payload.host.filesystem_summary.used.percent", "max", bucketSizeStr, "%", "num", "0,0.[00]", "0,0.[00]", false, false)
	metricItems = append(metricItems, metricItem)

	metricItem = newMetricItem("disk_read_rate", 1, SystemGroupKey)
	metricItem.AddAxi("disk_read_rate", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
	metricItem.AddLine("Disk Read Rate", "Disk Read Rate", "Disk read rate of host.", "group1", "payload.host.diskio_summary.read.bytes", "max", bucketSizeStr, "%", "bytes", "0,0.[00]", "0,0.[00]", false, true)
	metricItems = append(metricItems, metricItem)

	metricItem = newMetricItem("disk_write_rate", 1, SystemGroupKey)
	metricItem.AddAxi("disk_write_rate", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
	metricItem.AddLine("Disk Write Rate", "Disk Write Rate", "network write rate of host.", "group1", "payload.host.diskio_summary.write.bytes", "max", bucketSizeStr, "%", "bytes", "0,0.[00]", "0,0.[00]", false, true)
	metricItems = append(metricItems, metricItem)

	hostMetrics := h.getSingleHostMetric(hostInfo.AgentID, min, max, bucketSize, metricItems)
	if isOverview == 0 {
		groupMetrics := h.getGroupHostMetrics(hostInfo.AgentID, min, max, bucketSize)
		if hostMetrics == nil {
			hostMetrics = map[string]*common.MetricItem{}
		}
		for k, v := range groupMetrics {
			hostMetrics[k] = v
		}
	}

	resBody["metrics"] = hostMetrics

	h.WriteJSON(w, resBody, http.StatusOK)
}

func (h *APIHandler) getGroupHostMetrics(agentID string, min, max int64, bucketSize int) map[string]*common.MetricItem {
	diskPartitionMetric := newMetricItem("disk_partition_usage", 2, SystemGroupKey)
	diskPartitionMetric.AddAxi("Disk Partition Usage", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
	hostMetricItems := []GroupMetricItem{
		{
			Key:          "disk_partition_usage",
			Field:        "payload.host.disk_partition_usage.used_percent",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   diskPartitionMetric,
			FormatType:   "ratio",
			Units:        "%",
		},
	}
	hostMetrics := h.getGroupHostMetric([]string{agentID}, min, max, bucketSize, hostMetricItems, "payload.host.disk_partition_usage.partition")
	networkOutputMetric := newMetricItem("network_interface_output_rate", 2, SystemGroupKey)
	networkOutputMetric.AddAxi("Network interface output rate", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
	hostMetricItems = []GroupMetricItem{
		{
			Key:          "network_interface_output_rate",
			Field:        "payload.host.network_interface.output_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   networkOutputMetric,
			FormatType:   "bytes",
			Units:        "",
		},
	}
	networkOutMetrics := h.getGroupHostMetric([]string{agentID}, min, max, bucketSize, hostMetricItems, "payload.host.network_interface.name")
	if networkOutMetrics != nil {
		hostMetrics["network_interface_output_rate"] = networkOutMetrics["network_interface_output_rate"]
	}
	return hostMetrics
}

func (h *APIHandler) getGroupHostMetric(agentIDs []string, min, max int64, bucketSize int, hostMetricItems []GroupMetricItem, groupField string) map[string]*common.MetricItem {
	var must = []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.category": util.MapStr{
					"value": "host",
				},
			},
		},
	}
	if len(agentIDs) > 0 {
		must = append(must, util.MapStr{
			"terms": util.MapStr{
				"agent.id": agentIDs,
			},
		})
	}
	query := map[string]interface{}{
		"size": 0,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": must,
				"filter": []util.MapStr{
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"gte": min,
								"lte": max,
							},
						},
					},
				},
			},
		},
	}
	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)

	aggs := generateGroupAggs(hostMetricItems)
	query["aggs"] = util.MapStr{
		"group_by_level": util.MapStr{
			"terms": util.MapStr{
				"field": groupField,
			},
			"aggs": util.MapStr{
				"dates": util.MapStr{
					"date_histogram": util.MapStr{
						"field":          "timestamp",
						"fixed_interval": bucketSizeStr,
					},
					"aggs": aggs,
				},
			},
		},
	}
	return h.getMetrics(query, hostMetricItems, bucketSize)
}

func getHost(hostID string) (*host.HostInfo, error) {
	hostInfo := &host.HostInfo{}
	hostInfo.ID = hostID
	exists, err := orm.Get(hostInfo)
	if err != nil {
		return nil, fmt.Errorf("get host info error: %w", err)
	}
	if !exists {
		return nil, fmt.Errorf("host [%s] not found", hostID)
	}
	return hostInfo, nil
}

func (h *APIHandler) GetHostMetricStats(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	hostID := ps.MustGetParameter("host_id")
	hostInfo, err := getHost(hostID)
	if err != nil {
		log.Error(err)
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	if hostInfo.AgentID == "" {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	queryDSL := util.MapStr{
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
		"collapse": util.MapStr{
			"field": "metadata.name",
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"agent.id": util.MapStr{
								"value": hostInfo.AgentID,
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.category": util.MapStr{
								"value": "host",
							},
						},
					},
					{
						"terms": util.MapStr{
							"metadata.name": []string{
								"filesystem_summary",
								"cpu",
								"memory",
								"network_summary",
								"network",
							},
						},
					},
				},
			},
		},
	}
	q := &orm.Query{
		WildcardIndex: true,
		RawQuery:      util.MustToJSONBytes(queryDSL),
	}
	err, result := orm.Search(event.Event{}, q)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusNotFound)
		return
	}
	var metricStats []util.MapStr
	for _, row := range result.Result {
		if rowM, ok := row.(map[string]interface{}); ok {
			metricName, _ := util.GetMapValueByKeys([]string{"metadata", "name"}, rowM)
			if mv, ok := metricName.(string); ok {
				var status = "failure"
				if ts, ok := rowM["timestamp"].(string); ok {
					lastTime, _ := time.Parse(time.RFC3339, ts)
					if time.Since(lastTime).Seconds() < 60 {
						status = "success"
					}
				}
				metricStats = append(metricStats, util.MapStr{
					"metric_name": mv,
					"timestamp":   rowM["timestamp"],
					"status":      status,
				})
			}
		}
	}
	h.WriteJSON(w, metricStats, http.StatusOK)
}

func (h *APIHandler) GetHostOverviewInfo(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	hostID := ps.MustGetParameter("host_id")
	hostInfo := &host.HostInfo{}
	hostInfo.ID = hostID
	exists, err := orm.Get(hostInfo)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !exists {
		h.WriteJSON(w, util.MapStr{
			"_id":   hostID,
			"found": false,
		}, http.StatusNotFound)
		return
	}

	var (
		summary util.MapStr
	)
	if hostInfo.AgentID != "" {
		summaries, err := getHostSummaryFromAgent([]string{hostID})
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if v, ok := summaries[hostID]; ok {
			summary = v
		}

	} else if hostInfo.NodeID != "" {
		summaries, err := getHostSummaryFromNode([]string{hostInfo.NodeID})
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if v, ok := summaries[hostInfo.NodeID]; ok {
			summary = v
		}
	}
	h.WriteJSON(w, util.MapStr{
		"host_mame":    hostInfo.Name,
		"ip":           hostInfo.IP,
		"os_info":      hostInfo.OSInfo,
		"agent_status": hostInfo.AgentStatus,
		"summary":      summary,
		"agent_id":     hostInfo.AgentID,
	}, http.StatusOK)

}

// discoverHost auto discover host ip from elasticsearch node metadata and agent ips
func discoverHost() (map[string]interface{}, error) {
	queryDsl := util.MapStr{
		"size":    1000,
		"_source": []string{"ip", "name"},
	}
	q := &orm.Query{RawQuery: util.MustToJSONBytes(queryDsl)}
	err, result := orm.Search(host.HostInfo{}, q)
	if err != nil {
		return nil, fmt.Errorf("search host error: %w", err)
	}
	hosts := map[string]interface{}{}
	for _, row := range result.Result {
		if rowM, ok := row.(map[string]interface{}); ok {
			if ip, ok := rowM["ip"].(string); ok {
				hosts[ip] = rowM["name"]
			}
		}
	}

	queryDsl = util.MapStr{
		"_source": []string{"metadata.labels.ip", "metadata.node_id", "metadata.node_name", "payload.node_state.os"},
		"collapse": util.MapStr{
			"field": "metadata.labels.ip",
		},
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
	}
	q = &orm.Query{
		RawQuery: util.MustToJSONBytes(queryDsl),
	}
	err, result = orm.Search(elastic.NodeConfig{}, q)
	if err != nil {
		return nil, fmt.Errorf("search node metadata error: %w", err)
	}
	hostsFromES := map[string]interface{}{}
	for _, row := range result.Result {
		if rowM, ok := row.(map[string]interface{}); ok {
			rowV := util.MapStr(rowM)
			hostIP, _ := rowV.GetValue("metadata.labels.ip")
			if v, ok := hostIP.(string); ok {
				if _, ok = hosts[v]; ok {
					continue
				}
				nodeUUID, _ := rowV.GetValue("metadata.node_id")
				nodeName, _ := rowV.GetValue("metadata.node_name")
				osName, _ := rowV.GetValue("payload.node_state.os.name")
				osArch, _ := rowV.GetValue("payload.node_state.os.arch")
				hostsFromES[v] = util.MapStr{
					"ip":        v,
					"node_uuid": nodeUUID,
					"node_name": nodeName,
					"source":    "es_node",
					"os_name":   osName,
					"host_name": "",
					"os_arch":   osArch,
				}
			}

		}
	}

	queryDsl = util.MapStr{
		"size":    1000,
		"_source": []string{"id", "ip", "remote_ip", "major_ip", "host"},
		//"query": util.MapStr{
		//	"term": util.MapStr{
		//		"enrolled": util.MapStr{
		//			"value": true,
		//		},
		//	},
		//},
	}
	q = &orm.Query{RawQuery: util.MustToJSONBytes(queryDsl)}
	err, result = orm.Search(model.Instance{}, q)
	if err != nil {
		return nil, fmt.Errorf("search agent error: %w", err)
	}

	hostsFromAgent := map[string]interface{}{}
	for _, row := range result.Result {
		ag := model.Instance{}
		bytes := util.MustToJSONBytes(row)
		err = util.FromJSONBytes(bytes, &ag)
		if err != nil {
			log.Errorf("got unexpected agent: %s, error: %v", string(bytes), err)
			continue
		}
		var ip = ag.Network.MajorIP
		if ip = strings.TrimSpace(ip); ip == "" {
			for _, ipr := range ag.Network.IP {
				if net.ParseIP(ipr).IsPrivate() {
					ip = ipr
					break
				}
			}
		}
		if _, ok := hosts[ip]; ok {
			continue
		}

		data := util.MapStr{
			"ip":         ip,
			"agent_id":   ag.ID,
			"agent_host": ag.Endpoint,
			"source":     "agent",
		}
		if ag.Host != nil {
			data["os_name"] = ag.Host.OS.Name
			data["os_arch"] = ag.Host.OS.Architecture
			data["host_name"] = ag.Host.Name
		}
		hostsFromAgent[ip] = data
	}
	err = util.MergeFields(hostsFromES, hostsFromAgent, true)

	return hostsFromES, err
}

func getAgentOnlineStatusOfRecentDay(hostIDs []string) (map[string][]interface{}, error) {
	if hostIDs == nil {
		hostIDs = []string{}
	}

	q := orm.Query{
		WildcardIndex: true,
	}
	query := util.MapStr{
		"aggs": util.MapStr{
			"group_by_host_id": util.MapStr{
				"terms": util.MapStr{
					"field": "agent.host_id",
					"size":  100,
				},
				"aggs": util.MapStr{
					"uptime_histogram": util.MapStr{
						"date_range": util.MapStr{
							"field":     "timestamp",
							"format":    "yyyy-MM-dd",
							"time_zone": "+08:00",
							"ranges": []util.MapStr{
								{
									"from": "now-13d/d",
									"to":   "now-12d/d",
								}, {
									"from": "now-12d/d",
									"to":   "now-11d/d",
								},
								{
									"from": "now-11d/d",
									"to":   "now-10d/d",
								},
								{
									"from": "now-10d/d",
									"to":   "now-9d/d",
								}, {
									"from": "now-9d/d",
									"to":   "now-8d/d",
								},
								{
									"from": "now-8d/d",
									"to":   "now-7d/d",
								},
								{
									"from": "now-7d/d",
									"to":   "now-6d/d",
								},
								{
									"from": "now-6d/d",
									"to":   "now-5d/d",
								}, {
									"from": "now-5d/d",
									"to":   "now-4d/d",
								},
								{
									"from": "now-4d/d",
									"to":   "now-3d/d",
								}, {
									"from": "now-3d/d",
									"to":   "now-2d/d",
								}, {
									"from": "now-2d/d",
									"to":   "now-1d/d",
								}, {
									"from": "now-1d/d",
									"to":   "now/d",
								},
								{
									"from": "now/d",
									"to":   "now",
								},
							},
						},
						"aggs": util.MapStr{
							"min_uptime": util.MapStr{
								"min": util.MapStr{
									"field": "payload.agent.agent_basic.uptime_in_ms",
								},
							},
						},
					},
				},
			},
		},
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
		"size": 0,
		"query": util.MapStr{
			"bool": util.MapStr{
				"filter": []util.MapStr{
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"gte": "now-15d",
								"lte": "now",
							},
						},
					},
				},
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.name": util.MapStr{
								"value": "agent_basic",
							},
						},
					},
					{
						"terms": util.MapStr{
							"agent.host_id": hostIDs,
						},
					},
				},
			},
		},
	}
	q.RawQuery = util.MustToJSONBytes(query)

	err, res := orm.Search(&event.Event{}, &q)
	if err != nil {
		return nil, err
	}

	response := elastic.SearchResponse{}
	util.FromJSONBytes(res.Raw, &response)
	recentStatus := map[string][]interface{}{}
	for _, bk := range response.Aggregations["group_by_host_id"].Buckets {
		agentKey := bk["key"].(string)
		recentStatus[agentKey] = []interface{}{}
		if histogramAgg, ok := bk["uptime_histogram"].(map[string]interface{}); ok {
			if bks, ok := histogramAgg["buckets"].([]interface{}); ok {
				for _, bkItem := range bks {
					if bkVal, ok := bkItem.(map[string]interface{}); ok {
						if minUptime, ok := util.GetMapValueByKeys([]string{"min_uptime", "value"}, bkVal); ok {
							//mark agent status as offline when uptime less than 10m
							if v, ok := minUptime.(float64); ok && v >= 600000 {
								recentStatus[agentKey] = append(recentStatus[agentKey], []interface{}{bkVal["key"], "online"})
							} else {
								recentStatus[agentKey] = append(recentStatus[agentKey], []interface{}{bkVal["key"], "offline"})
							}
						}
					}
				}
			}
		}
	}
	emptyStatus := getAgentEmptyStatusOfRecentDay(14)
	for _, hostID := range hostIDs {
		if _, ok := recentStatus[hostID]; !ok {
			recentStatus[hostID] = emptyStatus
		}
	}
	return recentStatus, nil
}

func getAgentEmptyStatusOfRecentDay(days int) []interface{} {
	now := time.Now()
	startTime := now.Add(-time.Duration(days-1) * time.Hour * 24)
	year, month, day := startTime.Date()
	startTime = time.Date(year, month, day, 0, 0, 0, 0, startTime.Location())
	var status []interface{}
	for i := 1; i <= days; i++ {
		nextTime := startTime.Add(time.Hour * 24)
		if nextTime.After(now) {
			nextTime = now
		}
		status = append(status, []interface{}{
			fmt.Sprintf("%s-%s", startTime.Format("2006-01-02"), nextTime.Format("2006-01-02")),
			"offline",
		})
		startTime = nextTime
	}
	return status
}
