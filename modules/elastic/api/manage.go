// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

package api

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"infini.sh/framework/core/queue"

	log "github.com/cihub/seelog"
	"infini.sh/console/core"
	v1 "infini.sh/console/modules/elastic/api/v1"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
)

type APIHandler struct {
	core.Handler
	v1.APIHandler
}

func (h *APIHandler) Client() elastic.API {
	return elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID))
}

func (h *APIHandler) HandleCreateClusterAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var conf = &elastic.ElasticsearchConfig{}
	err := h.DecodeJSON(req, conf)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	conf.Enabled = true
	if len(conf.Hosts) > 0 && conf.Host == "" {
		conf.Host = conf.Hosts[0]
	}
	conf.Host = strings.TrimSpace(conf.Host)
	if conf.Host == "" {
		h.WriteError(w, "host is required", http.StatusBadRequest)
		return
	}
	if conf.Schema == "" {
		conf.Schema = "http"
	}
	conf.Endpoint = fmt.Sprintf("%s://%s", conf.Schema, conf.Host)
	conf.ID = util.GetUUID()
	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	if conf.CredentialID == "" && conf.BasicAuth != nil && conf.BasicAuth.Username != "" {
		credentialID, err := saveBasicAuthToCredential(conf.Name+"_platform("+conf.ID+")", conf.BasicAuth)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		conf.CredentialID = credentialID
	}
	conf.BasicAuth = nil

	if conf.AgentCredentialID == "" && conf.AgentBasicAuth != nil && conf.AgentBasicAuth.Username != "" {
		credentialID, err := saveBasicAuthToCredential(conf.Name+"_agent("+conf.ID+")", conf.AgentBasicAuth)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		conf.AgentCredentialID = credentialID
	}
	conf.AgentBasicAuth = nil

	if conf.Distribution == "" {
		conf.Distribution = elastic.Elasticsearch
	}
	if conf.MetricCollectionMode == "" {
		conf.MetricCollectionMode = elastic.ModeAgentless
	}
	err = orm.Create(ctx, conf)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	basicAuth, err := common.GetBasicAuth(conf)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	conf.BasicAuth = basicAuth
	conf.Source = elastic.ElasticsearchConfigSourceElasticsearch
	_, err = common.InitElasticInstance(*conf)
	if err != nil {
		log.Warn("error on init elasticsearch:", err)
	}

	h.WriteCreatedOKJSON(w, conf.ID)
}

func saveBasicAuthToCredential(name string, auth *model.BasicAuth) (string, error) {
	cred := credential.Credential{
		Name: name,
		Type: credential.BasicAuth,
		Tags: []string{"ES"},
		Payload: map[string]interface{}{
			"basic_auth": map[string]interface{}{
				"username": auth.Username,
				"password": auth.Password.Get(),
			},
		},
	}
	cred.ID = util.GetUUID()
	err := cred.Encode()
	if err != nil {
		return "", err
	}
	err = orm.Create(nil, &cred)
	if err != nil {
		return "", err
	}
	return cred.ID, nil
}

func (h *APIHandler) HandleGetClusterAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	clusterConf := elastic.ElasticsearchConfig{}
	clusterConf.ID = id
	exists, err := orm.Get(&clusterConf)
	if err != nil || !exists {
		log.Error(err)
		h.Error404(w)
		return
	}
	h.WriteGetOKJSON(w, id, clusterConf)
}

func (h *APIHandler) HandleUpdateClusterAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var conf = map[string]interface{}{}
	err := h.DecodeJSON(req, &conf)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	id := ps.MustGetParameter("id")
	originConf := elastic.ElasticsearchConfig{}
	originConf.ID = id
	exists, err := orm.Get(&originConf)
	if err != nil || !exists {
		log.Error(err)
		h.Error404(w)
		return
	}
	var oldCollectionMode = originConf.MetricCollectionMode
	buf := util.MustToJSONBytes(originConf)
	source := map[string]interface{}{}
	util.MustFromJSONBytes(buf, &source)
	for k, v := range conf {
		if k == "id" {
			continue
		}
		if k == "basic_auth" {
			if authMap, ok := v.(map[string]interface{}); ok {
				if pwd, ok := authMap["password"]; !ok || (ok && pwd == "") {
					if sourceM, ok := source[k].(map[string]interface{}); ok {
						authMap["password"] = sourceM["password"]
					}
				}
			}
		}
		source[k] = v
	}

	// convert hosts array to string to get first
	if hosts, ok := conf["hosts"].([]interface{}); ok && len(hosts) > 0 {
		host := strings.TrimSpace(hosts[0].(string))
		if schema, ok := conf["schema"].(string); ok {
			source["endpoint"] = fmt.Sprintf("%s://%s", schema, host)
			source["host"] = host
		}
	}

	conf["updated"] = time.Now()
	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	confBytes, _ := json.Marshal(source)
	newConf := &elastic.ElasticsearchConfig{}
	json.Unmarshal(confBytes, newConf)
	newConf.ID = id

	if conf["credential_id"] == nil {
		if newConf.BasicAuth != nil && newConf.BasicAuth.Username != "" {
			credentialID, err := saveBasicAuthToCredential(newConf.Name+"_platform("+newConf.ID+")", newConf.BasicAuth)
			if err != nil {
				log.Error(err)
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			newConf.CredentialID = credentialID
			newConf.BasicAuth = nil
		} else {
			newConf.CredentialID = ""
		}
	}

	if conf["agent_credential_id"] == nil {
		if newConf.AgentBasicAuth != nil && newConf.AgentBasicAuth.Username != "" {
			credentialID, err := saveBasicAuthToCredential(newConf.Name+"_agent("+newConf.ID+")", newConf.AgentBasicAuth)
			if err != nil {
				log.Error(err)
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			newConf.AgentCredentialID = credentialID
			newConf.AgentBasicAuth = nil
		} else {
			newConf.AgentCredentialID = ""
		}
	}

	err = orm.Save(ctx, newConf)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// record cluster metric collection mode change activity
	if oldCollectionMode != newConf.MetricCollectionMode {
		recordCollectionModeChangeActivity(newConf.ID, newConf.Name, oldCollectionMode, newConf.MetricCollectionMode)
	}
	basicAuth, err := common.GetBasicAuth(newConf)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	newConf.BasicAuth = basicAuth

	//update config in heap
	newConf.Source = elastic.ElasticsearchConfigSourceElasticsearch
	_, err = common.InitElasticInstance(*newConf)
	if err != nil {
		log.Warn("error on init elasticsearch:", err)
	}

	h.WriteUpdatedOKJSON(w, id)
}

func recordCollectionModeChangeActivity(clusterID, clusterName, oldMode, newMode string) {
	activityInfo := &event.Activity{
		ID:        util.GetUUID(),
		Timestamp: time.Now(),
		Metadata: event.ActivityMetadata{
			Category: "elasticsearch",
			Group:    "platform",
			Name:     "metric_collection_mode_change",
			Type:     "update",
			Labels: util.MapStr{
				"cluster_id":   clusterID,
				"cluster_name": clusterName,
				"from":         oldMode,
				"to":           newMode,
			},
		},
	}

	queueConfig := queue.GetOrInitConfig("platform##activities")
	if queueConfig.Labels == nil {
		queueConfig.ReplaceLabels(util.MapStr{
			"type":     "platform",
			"name":     "activity",
			"category": "elasticsearch",
			"activity": true,
		})
	}
	err := queue.Push(queueConfig, util.MustToJSONBytes(event.Event{
		Timestamp: time.Now(),
		Metadata: event.EventMetadata{
			Category: "elasticsearch",
			Name:     "activity",
		},
		Fields: util.MapStr{
			"activity": activityInfo,
		}}))
	if err != nil {
		log.Error(err)
	}
}

func (h *APIHandler) HandleDeleteClusterAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.MustGetParameter("id")

	esConfig := elastic.ElasticsearchConfig{}
	esConfig.ID = id
	ok, err := orm.Get(&esConfig)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if ok {
		if esConfig.Reserved {
			resBody["error"] = "this cluster is reserved"
			h.WriteJSON(w, resBody, http.StatusInternalServerError)
			return
		}
	}
	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	err = orm.Delete(ctx, &esConfig)

	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	delDsl := util.MapStr{
		"query": util.MapStr{
			"match": util.MapStr{
				"metadata.cluster_id": id,
			},
		},
	}
	err = orm.DeleteBy(elastic.NodeConfig{}, util.MustToJSONBytes(delDsl))
	if err != nil {
		log.Error(err)
	}
	err = orm.DeleteBy(elastic.IndexConfig{}, util.MustToJSONBytes(delDsl))
	if err != nil {
		log.Error(err)
	}

	elastic.RemoveInstance(id)
	elastic.RemoveHostsByClusterID(id)
	h.WriteDeletedOKJSON(w, id)
}

func (h *APIHandler) HandleSearchClusterAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		name        = h.GetParameterOrDefault(req, "name", "")
		sortField   = h.GetParameterOrDefault(req, "sort_field", "")
		sortOrder   = h.GetParameterOrDefault(req, "sort_order", "")
		queryDSL    = `{"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d%s}`
		strSize     = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		mustBuilder = &strings.Builder{}
	)
	if name != "" {
		mustBuilder.WriteString(fmt.Sprintf(`{"prefix":{"name.text": "%s"}}`, name))
	}
	clusterFilter, hasAllPrivilege := h.GetClusterFilter(req, "_id")
	if !hasAllPrivilege && clusterFilter == nil {
		h.WriteJSON(w, elastic.SearchResponse{}, http.StatusOK)
		return
	}
	if !hasAllPrivilege {
		if mustBuilder.String() != "" {
			mustBuilder.WriteString(",")
		}
		mustBuilder.Write(util.MustToJSONBytes(clusterFilter))
	}

	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}
	var sort = ""
	if sortField != "" && sortOrder != "" {
		sort = fmt.Sprintf(`,"sort":[{"%s":{"order":"%s"}}]`, sortField, sortOrder)
	}

	queryDSL = fmt.Sprintf(queryDSL, mustBuilder.String(), size, from, sort)
	q := orm.Query{
		RawQuery: []byte(queryDSL),
	}
	err, result := orm.Search(elastic.ElasticsearchConfig{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	searchRes := elastic.SearchResponse{}
	util.MustFromJSONBytes(result.Raw, &searchRes)
	if len(searchRes.Hits.Hits) > 0 {
		for _, hit := range searchRes.Hits.Hits {
			if basicAuth, ok := hit.Source["basic_auth"]; ok {
				if authMap, ok := basicAuth.(map[string]interface{}); ok {
					delete(authMap, "password")
				}
			}
		}
	}

	h.WriteJSON(w, searchRes, http.StatusOK)
}

func (h *APIHandler) HandleMetricsSummaryAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.MustGetParameter("id")

	summary := map[string]interface{}{}
	var query = util.MapStr{
		"sort": util.MapStr{
			"timestamp": util.MapStr{
				"order": "desc",
			},
		},
		"size": 1,
	}
	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"must": []util.MapStr{
				{
					"term": util.MapStr{
						"metadata.labels.cluster_id": util.MapStr{
							"value": id,
						},
					},
				},
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
							"value": "cluster_stats",
						},
					},
				},
			},
		},
	}
	q := orm.Query{
		RawQuery:      util.MustToJSONBytes(query),
		WildcardIndex: true,
	}
	err, result := orm.Search(event.Event{}, &q)
	if err != nil {
		resBody["error"] = err.Error()
		log.Error("MetricsSummary search error: ", err)
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if len(result.Result) > 0 {
		if v, ok := result.Result[0].(map[string]interface{}); ok {
			sourceMap := util.MapStr(v)
			summary["timestamp"], _ = sourceMap.GetValue("timestamp")
			status, _ := sourceMap.GetValue("payload.elasticsearch.cluster_stats")
			statusMap := util.MapStr(status.(map[string]interface{}))
			summary["cluster_name"], _ = statusMap.GetValue("cluster_name")
			summary["status"], _ = statusMap.GetValue("status")
			summary["indices_count"], _ = statusMap.GetValue("indices.count")
			summary["total_shards"], _ = statusMap.GetValue("indices.shards.total")
			summary["primary_shards"], _ = statusMap.GetValue("indices.shards.primaries")
			summary["replication_shards"], _ = statusMap.GetValue("indices.shards.replication")
			//summary["unassigned_shards"]=status.Indices["shards"].(map[string]interface{})["primaries"]

			summary["document_count"], _ = statusMap.GetValue("indices.docs.count")
			summary["deleted_document_count"], _ = statusMap.GetValue("indices.docs.deleted")

			summary["used_store_bytes"], _ = statusMap.GetValue("indices.store.size_in_bytes")

			summary["max_store_bytes"], _ = statusMap.GetValue("nodes.fs.total_in_bytes")
			summary["available_store_bytes"], _ = statusMap.GetValue("nodes.fs.available_in_bytes")

			summary["fielddata_bytes"], _ = statusMap.GetValue("indices.fielddata.memory_size_in_bytes")
			summary["fielddata_evictions"], _ = statusMap.GetValue("indices.fielddata.evictions")

			summary["query_cache_bytes"], _ = statusMap.GetValue("indices.query_cache.memory_size_in_bytes")
			summary["query_cache_total_count"], _ = statusMap.GetValue("indices.query_cache.total_count")
			summary["query_cache_hit_count"], _ = statusMap.GetValue("indices.query_cache.hit_count")
			summary["query_cache_miss_count"], _ = statusMap.GetValue("indices.query_cache.miss_count")
			summary["query_cache_evictions"], _ = statusMap.GetValue("indices.query_cache.evictions")

			summary["segments_count"], _ = statusMap.GetValue("indices.segments.count")
			summary["segments_memory_in_bytes"], _ = statusMap.GetValue("indices.segments.memory_in_bytes")

			summary["nodes_count"], _ = statusMap.GetValue("nodes.count.total")
			summary["version"], _ = statusMap.GetValue("nodes.versions")

			summary["mem_total_in_bytes"], _ = statusMap.GetValue("nodes.os.mem.total_in_bytes")
			summary["mem_used_in_bytes"], _ = statusMap.GetValue("nodes.os.mem.used_in_bytes")
			summary["mem_used_percent"], _ = statusMap.GetValue("nodes.os.mem.used_percent")

			summary["uptime"], _ = statusMap.GetValue("nodes.jvm.max_uptime_in_millis")
			summary["used_jvm_bytes"], _ = statusMap.GetValue("nodes.jvm.mem.heap_used_in_bytes")
			summary["max_jvm_bytes"], _ = statusMap.GetValue("nodes.jvm.mem.heap_max_in_bytes")
		}
	}

	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"must": []util.MapStr{
				{
					"term": util.MapStr{
						"metadata.labels.cluster_id": util.MapStr{
							"value": id,
						},
					},
				},
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
							"value": "cluster_health",
						},
					},
				},
			},
		},
	}
	q.RawQuery = util.MustToJSONBytes(query)
	err, result = orm.Search(event.Event{}, &q)
	if err != nil {
		log.Error("MetricsSummary search error: ", err)
	} else {
		if len(result.Result) > 0 {
			if v, ok := result.Result[0].(map[string]interface{}); ok {
				health, _ := util.MapStr(v).GetValue("payload.elasticsearch.cluster_health")
				healthMap := util.MapStr(health.(map[string]interface{}))
				summary["unassigned_shards"], _ = healthMap.GetValue("unassigned_shards")
			}
		}
	}

	resBody["summary"] = summary
	h.WriteJSON(w, resBody, http.StatusOK)

}

// new
func (h *APIHandler) HandleClusterMetricsAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.ByName("id")
	key := h.GetParameter(req, "key")

	if GetMonitorState(id) == elastic.ModeAgentless || strings.HasPrefix(key, "rollup") {
		h.APIHandler.HandleClusterMetricsAction(w, req, ps)
		return
	}

	var metricType string
	switch key {
	case v1.IndexThroughputMetricKey, v1.SearchThroughputMetricKey, v1.IndexLatencyMetricKey, v1.SearchLatencyMetricKey, CircuitBreakerMetricKey, ShardStateMetricKey:
		metricType = v1.MetricTypeNodeStats
	case ClusterDocumentsMetricKey,
		ClusterStorageMetricKey,
		ClusterIndicesMetricKey,
		ClusterNodeCountMetricKey:
		metricType = v1.MetricTypeClusterStats
	case ClusterHealthMetricKey:
		metricType = v1.MetricTypeClusterStats
	case ShardCountMetricKey:
		metricType = v1.MetricTypeClusterHealth
	default:
		h.WriteError(w, "invalid metric key", http.StatusBadRequest)
		return
	}

	bucketSize, min, max, err := h.GetMetricRangeAndBucketSize(req, id, metricType, 90)
	if err != nil {
		panic(err)
	}
	var metrics map[string]*common.MetricItem
	if bucketSize <= 60 {
		min = min - int64(2*bucketSize*1000)
	}
	timeout := h.GetParameterOrDefault(req, "timeout", "60s")
	du, err := time.ParseDuration(timeout)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), du)
	defer cancel()
	if util.StringInArray([]string{v1.IndexThroughputMetricKey, v1.SearchThroughputMetricKey, v1.IndexLatencyMetricKey, v1.SearchLatencyMetricKey}, key) {
		metrics, err = h.GetClusterIndexMetrics(ctx, id, bucketSize, min, max, key)
	} else if key == ShardStateMetricKey {
		clusterUUID, err := h.getClusterUUID(id)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		query := util.MapStr{
			"size": 0,
			"query": util.MapStr{
				"bool": util.MapStr{
					"minimum_should_match": 1,
					"should": []util.MapStr{
						{
							"term": util.MapStr{
								"metadata.labels.cluster_id": util.MapStr{
									"value": id,
								},
							},
						},
						{
							"term": util.MapStr{
								"metadata.labels.cluster_uuid": util.MapStr{
									"value": clusterUUID,
								},
							},
						},
					},
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
									"value": "shard_stats",
								},
							},
						},
					},
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
		shardStateMetric, err := getNodeShardStateMetric(ctx, query, bucketSize)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		metrics = map[string]*common.MetricItem{
			ShardStateMetricKey: shardStateMetric,
		}
	} else {
		metrics, err = h.GetClusterMetrics(ctx, id, bucketSize, min, max, key)
	}
	if err != nil {
		log.Error(err)
		h.WriteError(w, err, http.StatusInternalServerError)
		return
	}
	if _, ok := metrics[key]; ok {
		if metrics[key].HitsTotal > 0 && metrics[key].MinBucketSize == 0 {
			minBucketSize, err := v1.GetMetricMinBucketSize(id, metricType)
			if err != nil {
				log.Error(err)
			} else {
				metrics[key].MinBucketSize = int64(minBucketSize)
			}
		}
	}

	resBody["metrics"] = metrics
	h.WriteJSON(w, resBody, http.StatusOK)

}

func (h *APIHandler) HandleNodeMetricsAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.ByName("id")
	bucketSize, min, max, err := h.GetMetricRangeAndBucketSize(req, id, v1.MetricTypeNodeStats, 90)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	nodeName := h.Get(req, "node_name", "")
	top := h.GetIntOrDefault(req, "top", 5)
	if bucketSize <= 60 {
		min = min - int64(2*bucketSize*1000)
	}
	key := h.GetParameter(req, "key")
	timeout := h.GetParameterOrDefault(req, "timeout", "60s")
	du, err := time.ParseDuration(timeout)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), du)
	defer cancel()
	metrics, err := h.getNodeMetrics(ctx, id, bucketSize, min, max, nodeName, top, key)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err, http.StatusInternalServerError)
		return
	}
	if _, ok := metrics[key]; ok {
		if metrics[key].HitsTotal > 0 {
			minBucketSize, err := v1.GetMetricMinBucketSize(id, v1.MetricTypeNodeStats)
			if err != nil {
				log.Error(err)
			} else {
				metrics[key].MinBucketSize = int64(minBucketSize)
			}
		}
	}
	resBody["metrics"] = metrics
	ver := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).GetVersion()
	if ver.Distribution == "" {
		cr, err := util.VersionCompare(ver.Number, "6.1")
		if err != nil {
			log.Error(err)
		}
		if cr < 0 {
			resBody["tips"] = "The system cluster version is lower than 6.1, the top node may be inaccurate"
		}
	}

	h.WriteJSON(w, resBody, http.StatusOK)

}

func (h *APIHandler) HandleIndexMetricsAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.ByName("id")
	if GetMonitorState(id) == elastic.ModeAgentless {
		h.APIHandler.HandleIndexMetricsAction(w, req, ps)
		return
	}
	bucketSize, min, max, err := h.GetMetricRangeAndBucketSize(req, id, v1.MetricTypeNodeStats, 90)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	indexName := h.Get(req, "index_name", "")
	top := h.GetIntOrDefault(req, "top", 5)
	shardID := h.Get(req, "shard_id", "")
	if bucketSize <= 60 {
		min = min - int64(2*bucketSize*1000)
	}
	key := h.GetParameter(req, "key")
	timeout := h.GetParameterOrDefault(req, "timeout", "60s")
	du, err := time.ParseDuration(timeout)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), du)
	defer cancel()
	var metrics map[string]*common.MetricItem
	if key == v1.DocPercentMetricKey {
		metrics, err = h.getIndexMetrics(ctx, req, id, bucketSize, min, max, indexName, top, shardID, v1.DocCountMetricKey)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		docsDeletedMetrics, err := h.getIndexMetrics(ctx, req, id, bucketSize, min, max, indexName, top, shardID, v1.DocsDeletedMetricKey)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		for k, v := range docsDeletedMetrics {
			if v != nil {
				metrics[k] = v
			}
		}
		if metrics["doc_count"] != nil && metrics["docs_deleted"] != nil && len(metrics["doc_count"].Lines) > 0 && len(metrics["docs_deleted"].Lines) > 0 {
			metricA := metrics["doc_count"]
			metricB := metrics["docs_deleted"]
			if dataA, ok := metricA.Lines[0].Data.([][]interface{}); ok {
				if dataB, ok := metricB.Lines[0].Data.([][]interface{}); ok {
					data := make([]map[string]interface{}, 0, len(dataA)*2)
					var (
						x1 float64
						x2 float64
					)
					for i := 0; i < len(dataA); i++ {
						x1 = dataA[i][1].(float64)
						x2 = dataB[i][1].(float64)
						if x1+x2 == 0 {
							continue
						}
						data = append(data, map[string]interface{}{
							"x": dataA[i][0],
							"y": x1 / (x1 + x2) * 100,
							"g": "Doc Count",
						})
						data = append(data, map[string]interface{}{
							"x": dataA[i][0],
							"y": x2 / (x1 + x2) * 100,
							"g": "Doc Deleted",
						})
					}
					metricDocPercent := &common.MetricItem{
						Axis:  []*common.MetricAxis{},
						Key:   "doc_percent",
						Group: metricA.Group,
						Order: 18,
						Lines: []*common.MetricLine{
							{
								TimeRange: metricA.Lines[0].TimeRange,
								Data:      data,
								Type:      common.GraphTypeBar,
							},
						},
					}
					metrics["doc_percent"] = metricDocPercent
				}
			}

		}
	} else {
		metrics, err = h.getIndexMetrics(ctx, req, id, bucketSize, min, max, indexName, top, shardID, key)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	if _, ok := metrics[key]; ok {
		if metrics[key].HitsTotal > 0 {
			minBucketSize, err := v1.GetMetricMinBucketSize(id, v1.MetricTypeNodeStats)
			if err != nil {
				log.Error(err)
			} else {
				metrics[key].MinBucketSize = int64(minBucketSize)
			}
		}
	}
	resBody["metrics"] = metrics
	ver := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).GetVersion()
	if ver.Distribution == "" {
		cr, err := util.VersionCompare(ver.Number, "6.1")
		if err != nil {
			log.Error(err)
		}
		if cr < 0 {
			resBody["tips"] = "The system cluster version is lower than 6.1, the top index may be inaccurate"
		}
	}

	h.WriteJSON(w, resBody, http.StatusOK)

}
func (h *APIHandler) HandleQueueMetricsAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.ByName("id")
	bucketSize, min, max, err := h.GetMetricRangeAndBucketSize(req, id, v1.MetricTypeNodeStats, 90)
	if err != nil {
		log.Error(err)
		resBody["error"] = err
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	nodeName := h.Get(req, "node_name", "")
	top := h.GetIntOrDefault(req, "top", 5)
	if bucketSize <= 60 {
		min = min - int64(2*bucketSize*1000)
	}
	key := h.GetParameter(req, "key")
	timeout := h.GetParameterOrDefault(req, "timeout", "60s")
	du, err := time.ParseDuration(timeout)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), du)
	defer cancel()
	metrics, err := h.getThreadPoolMetrics(ctx, id, bucketSize, min, max, nodeName, top, key)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if _, ok := metrics[key]; ok {
		if metrics[key].HitsTotal > 0 {
			minBucketSize, err := v1.GetMetricMinBucketSize(id, v1.MetricTypeNodeStats)
			if err != nil {
				log.Error(err)
			} else {
				metrics[key].MinBucketSize = int64(minBucketSize)
			}
		}
	}
	resBody["metrics"] = metrics
	ver := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).GetVersion()
	if ver.Distribution == "" {
		cr, err := util.VersionCompare(ver.Number, "6.1")
		if err != nil {
			log.Error(err)
		}
		if cr < 0 {
			resBody["tips"] = "The system cluster version is lower than 6.1, the top node may be inaccurate"
		}
	}

	h.WriteJSON(w, resBody, http.StatusOK)

}

// TODO, use expired hash
var clusters = map[string]elastic.ElasticsearchConfig{}
var clustersMutex = &sync.RWMutex{}

// TODO use prefered client
func (h *APIHandler) GetClusterClient(id string) (bool, elastic.API, error) {
	clustersMutex.RLock()
	config, ok := clusters[id]
	clustersMutex.RUnlock()

	var client elastic.API

	if !ok {
		client = elastic.GetClientNoPanic(id)
	}

	if client == nil {
		indexName := orm.GetIndexName(elastic.ElasticsearchConfig{})
		getResponse, err := h.Client().Get(indexName, "", id)
		if err != nil {
			return false, nil, err
		}

		bytes := util.MustToJSONBytes(getResponse.Source)
		cfg := elastic.ElasticsearchConfig{}
		err = util.FromJSONBytes(bytes, &cfg)
		if err != nil {
			return false, nil, err
		}

		if getResponse.StatusCode == http.StatusNotFound {
			return false, nil, err
		}

		cfg.ID = id
		clustersMutex.Lock()
		clusters[id] = cfg
		clustersMutex.Unlock()
		config = cfg

		client, _ = common.InitClientWithConfig(config)

	}

	return true, client, nil
}

func (h *APIHandler) GetClusterHealth(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	id := ps.ByName("id")
	exists, client, err := h.GetClusterClient(id)

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	if !exists {
		resBody["error"] = fmt.Sprintf("cluster [%s] not found", id)
		log.Warn(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}

	health, _ := client.ClusterHealth(context.Background())

	h.WriteJSON(w, health, 200)
}

func (h *APIHandler) HandleGetNodesAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	metaData := elastic.GetMetadata(id)
	result := util.MapStr{}
	if metaData == nil || metaData.Nodes == nil {
		h.WriteError(w, "nodes metadata not found", 500)
		return
	}
	for k, nodeInfo := range *metaData.Nodes {
		result[k] = util.MapStr{
			"name":              nodeInfo.Name,
			"transport_address": nodeInfo.TransportAddress,
		}
	}
	h.WriteJSON(w, result, 200)
}

const (
	SystemGroupKey         = "system"
	OperationGroupKey      = "operations"
	LatencyGroupKey        = "latency"
	CacheGroupKey          = "cache"
	HttpGroupKey           = "http"
	MemoryGroupKey         = "memory"
	StorageGroupKey        = "storage"
	JVMGroupKey            = "JVM"
	TransportGroupKey      = "transport"
	DocumentGroupKey       = "document"
	IOGroupKey             = "io"
	CircuitBreakerGroupKey = "circuit_breaker"
)

const (
	ClusterStorageMetricKey   = "cluster_storage"
	ClusterDocumentsMetricKey = "cluster_documents"
	ClusterIndicesMetricKey   = "cluster_indices"
	ClusterNodeCountMetricKey = "node_count"
	ClusterHealthMetricKey    = "cluster_health"
	ShardCountMetricKey       = "shard_count"
	CircuitBreakerMetricKey   = "circuit_breaker"
)

func (h *APIHandler) GetClusterMetrics(ctx context.Context, id string, bucketSize int, min, max int64, metricKey string) (map[string]*common.MetricItem, error) {

	var (
		clusterMetricsResult = map[string]*common.MetricItem{}
		err                  error
	)
	switch metricKey {
	case ClusterDocumentsMetricKey,
		ClusterStorageMetricKey,
		ClusterIndicesMetricKey,
		ClusterNodeCountMetricKey:
		clusterMetricsResult, err = h.getClusterMetricsByKey(ctx, id, bucketSize, min, max, metricKey)
	case v1.IndexLatencyMetricKey, v1.IndexThroughputMetricKey, v1.SearchThroughputMetricKey, v1.SearchLatencyMetricKey:
		clusterMetricsResult, err = h.GetClusterIndexMetrics(ctx, id, bucketSize, min, max, metricKey)
	case ClusterHealthMetricKey:
		var statusMetric *common.MetricItem
		statusMetric, err = h.getClusterStatusMetric(ctx, id, min, max, bucketSize)
		if err == nil {
			clusterMetricsResult[ClusterHealthMetricKey] = statusMetric
		}
	case ShardCountMetricKey:
		clusterMetricsResult, err = h.getShardsMetric(ctx, id, min, max, bucketSize)

	case CircuitBreakerMetricKey:
		clusterMetricsResult, err = h.getCircuitBreakerMetric(ctx, id, min, max, bucketSize)
	}
	return clusterMetricsResult, err
}

func (h *APIHandler) getClusterMetricsByKey(ctx context.Context, id string, bucketSize int, min, max int64, metricKey string) (map[string]*common.MetricItem, error) {
	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)

	clusterMetricItems := []*common.MetricItem{}
	switch metricKey {
	case ClusterStorageMetricKey:
		metricItem := newMetricItem("cluster_storage", 8, StorageGroupKey)
		metricItem.AddAxi("indices_storage", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		metricItem.AddAxi("available_storage", "group2", common.PositionRight, "bytes", "0.[0]", "0.[0]", 5, true)

		metricItem.AddLine("Disk", "Indices Storage", "", "group1", "payload.elasticsearch.cluster_stats.indices.store.size_in_bytes", "max", bucketSizeStr, "", "bytes", "0,0.[00]", "0,0.[00]", false, false)
		metricItem.AddLine("Disk", "Available Disk", "", "group2", "payload.elasticsearch.cluster_stats.nodes.fs.available_in_bytes", "max", bucketSizeStr, "", "bytes", "0,0.[00]", "0,0.[00]", false, false)

		clusterMetricItems = append(clusterMetricItems, metricItem)

	case ClusterDocumentsMetricKey:
		metricItem := newMetricItem("cluster_documents", 4, StorageGroupKey)
		metricItem.AddAxi("count", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, false)
		metricItem.AddAxi("deleted", "group2", common.PositionRight, "num", "0,0", "0,0.[00]", 5, false)
		metricItem.AddLine("Documents Count", "Documents Count", "", "group1", "payload.elasticsearch.cluster_stats.indices.docs.count", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
		metricItem.AddLine("Documents Deleted", "Documents Deleted", "", "group2", "payload.elasticsearch.cluster_stats.indices.docs.deleted", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
		clusterMetricItems = append(clusterMetricItems, metricItem)
	case ClusterIndicesMetricKey:
		metricItem := newMetricItem("cluster_indices", 6, StorageGroupKey)
		metricItem.AddAxi("count", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, false)
		metricItem.AddLine("Indices Count", "Indices Count", "", "group1", "payload.elasticsearch.cluster_stats.indices.count", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
		clusterMetricItems = append(clusterMetricItems, metricItem)
	case ClusterNodeCountMetricKey:
		metricItem := newMetricItem("node_count", 5, MemoryGroupKey)
		metricItem.AddAxi("count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		meta := elastic.GetMetadata(id)
		if meta == nil {
			err := fmt.Errorf("metadata of cluster [%s] is not found", id)
			return nil, err
		}
		majorVersion := meta.GetMajorVersion()

		metricItem.AddLine("Total", "Total Nodes", "", "group1", "payload.elasticsearch.cluster_stats.nodes.count.total", "max", bucketSizeStr, "", "num", "0.[00]", "0.[00]", false, false)
		if majorVersion < 5 {
			metricItem.AddLine("Master Only", "Master Only", "", "group1", "payload.elasticsearch.cluster_stats.nodes.count.master_only", "max", bucketSizeStr, "", "num", "0.[00]", "0.[00]", false, false)
			metricItem.AddLine("Data Node", "Data Only", "", "group1", "payload.elasticsearch.cluster_stats.nodes.count.data_only", "max", bucketSizeStr, "", "num", "0.[00]", "0.[00]", false, false)
			metricItem.AddLine("Master Data", "Master Data", "", "group1", "payload.elasticsearch.cluster_stats.nodes.count.master_data", "max", bucketSizeStr, "", "num", "0.[00]", "0.[00]", false, false)
		} else {
			metricItem.AddLine("Master Node", "Master Node", "", "group1", "payload.elasticsearch.cluster_stats.nodes.count.master", "max", bucketSizeStr, "", "num", "0.[00]", "0.[00]", false, false)
			metricItem.AddLine("Data Node", "Data Node", "", "group1", "payload.elasticsearch.cluster_stats.nodes.count.data", "max", bucketSizeStr, "", "num", "0.[00]", "0.[00]", false, false)
			metricItem.AddLine("Coordinating Node Only", "Coordinating Node Only", "", "group1", "payload.elasticsearch.cluster_stats.nodes.count.coordinating_only", "max", bucketSizeStr, "", "num", "0.[00]", "0.[00]", false, false)
			metricItem.AddLine("Ingest Node", "Ingest Node", "", "group1", "payload.elasticsearch.cluster_stats.nodes.count.ingest", "max", bucketSizeStr, "", "num", "0.[00]", "0.[00]", false, false)
		}

		clusterMetricItems = append(clusterMetricItems, metricItem)
	}

	query := map[string]interface{}{}
	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"must": []util.MapStr{
				{
					"term": util.MapStr{
						"metadata.labels.cluster_id": util.MapStr{
							"value": id,
						},
					},
				},
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
							"value": "cluster_stats",
						},
					},
				},
			},
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
	return h.getSingleMetrics(ctx, clusterMetricItems, query, bucketSize)
}

func (h *APIHandler) GetClusterIndexMetrics(ctx context.Context, id string, bucketSize int, min, max int64, metricKey string) (map[string]*common.MetricItem, error) {
	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	metricItems := []*common.MetricItem{}
	switch metricKey {
	case v1.IndexThroughputMetricKey:
		metricItem := newMetricItem(v1.IndexThroughputMetricKey, 2, OperationGroupKey)
		metricItem.AddAxi("indexing", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		metricItem.AddLine("Indexing Rate", "Total Indexing", "Number of documents being indexed for primary and replica shards.", "group1", "payload.elasticsearch.node_stats.indices.indexing.index_total", "max", bucketSizeStr, "doc/s", "num", "0,0.[00]", "0,0.[00]", false, true)
		metricItems = append(metricItems, metricItem)
	case v1.SearchThroughputMetricKey:
		metricItem := newMetricItem(v1.SearchThroughputMetricKey, 2, OperationGroupKey)
		metricItem.AddAxi("searching", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, false)
		metricItem.AddLine("Search Rate", "Total Query",
			"Number of search requests being executed across primary and replica shards. A single search can run against multiple shards!",
			"group1", "payload.elasticsearch.node_stats.indices.search.query_total", "max", bucketSizeStr, "query/s", "num", "0,0.[00]", "0,0.[00]", false, true)
		metricItems = append(metricItems, metricItem)
	case v1.IndexLatencyMetricKey:
		metricItem := newMetricItem(v1.IndexLatencyMetricKey, 3, LatencyGroupKey)
		metricItem.AddAxi("indexing", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)

		metricItem.AddLine("Indexing", "Indexing Latency", "Average latency for indexing documents.", "group1", "payload.elasticsearch.node_stats.indices.indexing.index_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
		metricItem.Lines[0].Metric.Field2 = "payload.elasticsearch.node_stats.indices.indexing.index_total"
		metricItem.Lines[0].Metric.Calc = func(value, value2 float64) float64 {
			return value / value2
		}
		metricItem.AddLine("Indexing", "Delete Latency", "Average latency for delete documents.", "group1", "payload.elasticsearch.node_stats.indices.indexing.delete_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
		metricItem.Lines[1].Metric.Field2 = "payload.elasticsearch.node_stats.indices.indexing.delete_total"
		metricItem.Lines[1].Metric.Calc = func(value, value2 float64) float64 {
			return value / value2
		}
		metricItems = append(metricItems, metricItem)
	case v1.SearchLatencyMetricKey:
		metricItem := newMetricItem(v1.SearchLatencyMetricKey, 3, LatencyGroupKey)
		metricItem.AddAxi("searching", "group2", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, false)

		metricItem.AddLine("Searching", "Query Latency", "Average latency for searching query.", "group2", "payload.elasticsearch.node_stats.indices.search.query_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
		metricItem.Lines[0].Metric.Field2 = "payload.elasticsearch.node_stats.indices.search.query_total"
		metricItem.Lines[0].Metric.Calc = func(value, value2 float64) float64 {
			return value / value2
		}
		metricItem.AddLine("Searching", "Fetch Latency", "Average latency for searching fetch.", "group2", "payload.elasticsearch.node_stats.indices.search.fetch_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
		metricItem.Lines[1].Metric.Field2 = "payload.elasticsearch.node_stats.indices.search.fetch_total"
		metricItem.Lines[1].Metric.Calc = func(value, value2 float64) float64 {
			return value / value2
		}
		metricItem.AddLine("Searching", "Scroll Latency", "Average latency for searching fetch.", "group2", "payload.elasticsearch.node_stats.indices.search.scroll_time_in_millis", "max", bucketSizeStr, "ms", "num", "0,0.[00]", "0,0.[00]", false, true)
		metricItem.Lines[2].Metric.Field2 = "payload.elasticsearch.node_stats.indices.search.scroll_total"
		metricItem.Lines[2].Metric.Calc = func(value, value2 float64) float64 {
			return value / value2
		}
		metricItems = append(metricItems, metricItem)
	default:
		panic("unknown metric key: " + metricKey)
	}
	query := map[string]interface{}{}
	clusterUUID, err := h.getClusterUUID(id)
	if err != nil {
		return nil, err
	}
	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"minimum_should_match": 1,
			"should": []util.MapStr{
				{
					"term": util.MapStr{
						"metadata.labels.cluster_id": util.MapStr{
							"value": id,
						},
					},
				},
				{
					"term": util.MapStr{
						"metadata.labels.cluster_uuid": util.MapStr{
							"value": clusterUUID,
						},
					},
				},
			},
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
			},
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
	return h.getSingleIndexMetricsByNodeStats(ctx, metricItems, query, bucketSize)
}

func (h *APIHandler) getShardsMetric(ctx context.Context, id string, min, max int64, bucketSize int) (map[string]*common.MetricItem, error) {
	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	query := util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.cluster_id": util.MapStr{
								"value": id,
							},
						},
					},
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
								"value": "cluster_health",
							},
						},
					},
				},
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
		"aggs": util.MapStr{
			"dates": util.MapStr{
				"date_histogram": util.MapStr{
					"field":    "timestamp",
					"interval": bucketSizeStr,
				},
			},
		},
	}
	metricItem := newMetricItem("shard_count", 7, StorageGroupKey)
	metricItem.AddAxi("counts", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, false)
	metricItem.AddLine("Active Primary Shards", "Active Primary Shards", "", "group1", "payload.elasticsearch.cluster_health.active_primary_shards", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
	metricItem.AddLine("Active Shards", "Active Shards", "", "group1", "payload.elasticsearch.cluster_health.active_shards", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
	metricItem.AddLine("Relocating Shards", "Relocating Shards", "", "group1", "payload.elasticsearch.cluster_health.relocating_shards", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
	metricItem.AddLine("Initializing Shards", "Initializing Shards", "", "group1", "payload.elasticsearch.cluster_health.initializing_shards", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
	metricItem.AddLine("Unassigned Shards", "Unassigned Shards", "", "group1", "payload.elasticsearch.cluster_health.unassigned_shards", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
	metricItem.AddLine("Delayed Unassigned Shards", "Delayed Unassigned Shards", "", "group1", "payload.elasticsearch.cluster_health.delayed_unassigned_shards", "max", bucketSizeStr, "", "num", "0,0.[00]", "0,0.[00]", false, false)
	var clusterHealthMetrics []*common.MetricItem
	clusterHealthMetrics = append(clusterHealthMetrics, metricItem)
	return h.getSingleMetrics(ctx, clusterHealthMetrics, query, bucketSize)
}

func (h *APIHandler) getCircuitBreakerMetric(ctx context.Context, id string, min, max int64, bucketSize int) (map[string]*common.MetricItem, error) {
	clusterUUID, err := h.getClusterUUID(id)
	if err != nil {
		return nil, err
	}
	should := []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.labels.cluster_id": util.MapStr{
					"value": id,
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.labels.cluster_uuid": util.MapStr{
					"value": clusterUUID,
				},
			},
		},
	}
	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	query := util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"minimum_should_match": 1,
				"should":               should,
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
				},
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
		"aggs": util.MapStr{
			"dates": util.MapStr{
				"date_histogram": util.MapStr{
					"field":    "timestamp",
					"interval": bucketSizeStr,
				},
			},
		},
	}
	metricItem := newMetricItem("circuit_breaker", 7, StorageGroupKey)
	metricItem.AddAxi("Circuit Breaker", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, false)
	metricItem.AddLine("Parent Breaker Tripped", "Parent Tripped", "", "group1", "payload.elasticsearch.node_stats.breakers.parent.tripped", "sum", bucketSizeStr, "times/s", "num", "0,0.[00]", "0,0.[00]", false, true)
	metricItem.AddLine("Fieldaata Breaker Tripped", "Fielddata Tripped", "", "group1", "payload.elasticsearch.node_stats.breakers.fielddata.tripped", "sum", bucketSizeStr, "times/s", "num", "0,0.[00]", "0,0.[00]", false, true)
	metricItem.AddLine("Accounting Breaker Tripped", "Accounting Tripped", "", "group1", "payload.elasticsearch.node_stats.breakers.accounting.tripped", "sum", bucketSizeStr, "times/s", "num", "0,0.[00]", "0,0.[00]", false, true)
	metricItem.AddLine("Request Breaker Tripped", "Request Tripped", "", "group1", "payload.elasticsearch.node_stats.breakers.request.tripped", "sum", bucketSizeStr, "times/s", "num", "0,0.[00]", "0,0.[00]", false, true)
	metricItem.AddLine("In Flight Requests Breaker Tripped", "In Flight Requests Tripped", "", "group1", "payload.elasticsearch.node_stats.breakers.in_flight_requests.tripped", "sum", bucketSizeStr, "times/s", "num", "0,0.[00]", "0,0.[00]", false, true)
	var circuitBreakerMetrics []*common.MetricItem
	circuitBreakerMetrics = append(circuitBreakerMetrics, metricItem)
	return h.getSingleMetrics(ctx, circuitBreakerMetrics, query, bucketSize)
}

func (h *APIHandler) getClusterStatusMetric(ctx context.Context, id string, min, max int64, bucketSize int) (*common.MetricItem, error) {
	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		return nil, err
	}
	query := util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.cluster_id": util.MapStr{
								"value": id,
							},
						},
					},
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
								"value": "cluster_stats",
							},
						},
					},
				},
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
		"aggs": util.MapStr{
			"dates": util.MapStr{
				"date_histogram": util.MapStr{
					"field":       "timestamp",
					intervalField: bucketSizeStr,
				},
				"aggs": util.MapStr{
					"groups": util.MapStr{
						"terms": util.MapStr{
							"field": "payload.elasticsearch.cluster_stats.status",
							"size":  5,
						},
					},
				},
			},
		},
	}
	queryDSL := util.MustToJSONBytes(query)
	response, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).QueryDSL(ctx, getAllMetricsIndex(), nil, queryDSL)
	if err != nil {
		log.Error(err)
		return nil, err
	}
	metricData := []interface{}{}
	metricItem := newMetricItem("cluster_health", 1, MemoryGroupKey)
	metricItem.AddLine("status", "Status", "", "group1", "payload.elasticsearch.cluster_stats.status", "max", bucketSizeStr, "%", "ratio", "0.[00]", "0.[00]", false, false)

	if response.StatusCode == 200 {
		metricData, err = parseGroupMetricData(response.Aggregations["dates"].Buckets, true)
		if err != nil {
			return nil, err
		}
	}
	metricItem.Lines[0].Data = metricData
	metricItem.Lines[0].Type = common.GraphTypeBar
	metricItem.Request = string(queryDSL)
	metricItem.HitsTotal = response.GetTotal()
	return metricItem, nil
}

func (h *APIHandler) GetClusterStatusAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var status = map[string]interface{}{}
	clusterIDs, hasAllPrivilege := h.GetAllowedClusters(req)
	if !hasAllPrivilege && len(clusterIDs) == 0 {
		h.WriteJSON(w, status, http.StatusOK)
		return
	}

	elastic.WalkConfigs(func(k, value interface{}) bool {
		key := k.(string)
		if !hasAllPrivilege && !util.StringInArray(clusterIDs, key) {
			return true
		}
		cfg, ok := value.(*elastic.ElasticsearchConfig)
		if ok && cfg != nil {
			meta := elastic.GetOrInitMetadata(cfg)
			status[key] = map[string]interface{}{
				"health":    meta.Health,
				"available": meta.IsAvailable(),
				"config": map[string]interface{}{
					"monitored": meta.Config.Monitored,
				},
			}
		}
		return true
	})
	h.WriteJSON(w, status, http.StatusOK)
}

func (h *APIHandler) GetMetadata(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	result := util.MapStr{}
	clusterIDs, hasAllPrivilege := h.GetAllowedClusters(req)
	if !hasAllPrivilege && len(clusterIDs) == 0 {
		h.WriteJSON(w, result, http.StatusOK)
		return
	}

	elastic.WalkMetadata(func(key, value interface{}) bool {
		m := util.MapStr{}
		k := key.(string)
		if !hasAllPrivilege && !util.StringInArray(clusterIDs, k) {
			return true
		}
		if value == nil {
			return true
		}

		v, ok := value.(*elastic.ElasticsearchMetadata)
		if ok {
			m["major_version"] = v.GetMajorVersion()
			m["seed_hosts"] = v.GetSeedHosts()
			m["state"] = v.ClusterState
			m["topology_version"] = v.NodesTopologyVersion
			m["nodes"] = v.Nodes
			//m["indices"]=v.Indices
			m["health"] = v.Health
			m["aliases"] = v.Aliases
			//m["primary_shards"]=v.PrimaryShards
			m["available"] = v.IsAvailable()
			m["schema"] = v.GetSchema()
			m["config"] = v.Config
			m["last_success"] = v.LastSuccess()
			result[k] = m
		}
		return true
	})

	h.WriteJSON(w, result, http.StatusOK)

}

func (h *APIHandler) GetMetadataByID(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	result := util.MapStr{}

	id := ps.MustGetParameter("id")

	v := elastic.GetMetadata(id)
	m := util.MapStr{}
	if v != nil {
		m["major_version"] = v.GetMajorVersion()
		m["seed_hosts"] = v.GetSeedHosts()
		m["state"] = v.ClusterState
		m["topology_version"] = v.NodesTopologyVersion
		m["nodes"] = v.Nodes
		//m["indices"]=v.Indices
		m["health"] = v.Health
		m["aliases"] = v.Aliases
		//m["primary_shards"]=v.PrimaryShards
		m["available"] = v.IsAvailable()
		m["schema"] = v.GetSchema()
		m["config"] = v.Config
		m["last_success"] = v.LastSuccess()
		result[id] = m
	}

	h.WriteJSON(w, result, http.StatusOK)

}

func (h *APIHandler) GetHosts(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	result := util.MapStr{}

	elastic.WalkHosts(func(key, value interface{}) bool {
		k := key.(string)
		if value == nil {
			return true
		}

		v, ok := value.(*elastic.NodeAvailable)
		if ok {
			result[k] = util.MapStr{
				"host":            v.Host,
				"available":       v.IsAvailable(),
				"dead":            v.IsDead(),
				"last_check":      v.LastCheck(),
				"last_success":    v.LastSuccess(),
				"failure_tickets": v.FailureTickets(),
			}
		}
		return true
	})

	h.WriteJSON(w, result, http.StatusOK)

}

func getAllMetricsIndex() string {
	return orm.GetWildcardIndexName(event.Event{})
}

func (h *APIHandler) HandleGetStorageMetricAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := util.MapStr{}
	clusterID := ps.ByName("id")
	client := elastic.GetClient(clusterID)
	shardRes, err := client.CatShards()
	if err != nil {
		resBody["error"] = fmt.Sprintf("cat shards error: %v", err)
		log.Errorf("cat shards error: %v", err)
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	var metricData = TreeMapNode{
		Name:    fmt.Sprintf("%s:Storage", clusterID),
		SubKeys: map[string]int{},
	}
	for _, shardInfo := range shardRes {
		if shardInfo.ShardType != "p" {
			continue
		}
		nodeName := fmt.Sprintf("%s:%s", shardInfo.NodeIP, shardInfo.NodeName)
		//node level
		if _, ok := metricData.SubKeys[nodeName]; !ok {
			metricData.Children = append(metricData.Children, &TreeMapNode{
				Name:    nodeName,
				SubKeys: map[string]int{},
			})
			metricData.SubKeys[nodeName] = len(metricData.Children) - 1
		}
		//index level
		nodeIdx := metricData.SubKeys[nodeName]
		if _, ok := metricData.Children[nodeIdx].SubKeys[shardInfo.Index]; !ok {
			metricData.Children[nodeIdx].Children = append(metricData.Children[nodeIdx].Children, &TreeMapNode{
				Name:    shardInfo.Index,
				SubKeys: map[string]int{},
			})
			metricData.Children[nodeIdx].SubKeys[shardInfo.Index] = len(metricData.Children[nodeIdx].Children) - 1
		}
		//shard level
		indexIdx := metricData.Children[nodeIdx].SubKeys[shardInfo.Index]
		value, err := util.ConvertBytesFromString(shardInfo.Store)
		if err != nil {
			log.Warn(err)
		}
		metricData.Children[nodeIdx].Children[indexIdx].Children = append(metricData.Children[nodeIdx].Children[indexIdx].Children, &TreeMapNode{
			Name:  fmt.Sprintf("shard %s", shardInfo.ShardID),
			Value: value,
		})
	}
	var (
		totalStoreSize float64 = 0
		nodeSize       float64 = 0
		indexSize      float64 = 0
	)
	for _, node := range metricData.Children {
		nodeSize = 0
		for _, index := range node.Children {
			indexSize = 0
			for _, shard := range index.Children {
				indexSize += shard.Value
			}
			index.Value = math.Trunc(indexSize*100) / 100
			nodeSize += indexSize
		}
		node.Value = math.Trunc(nodeSize*100) / 100
		totalStoreSize += nodeSize
	}
	metricData.Value = math.Trunc(totalStoreSize*100) / 100
	h.WriteJSON(w, metricData, http.StatusOK)
}

func getDateHistogramIntervalField(clusterID string, bucketSize string) (string, error) {
	esClient := elastic.GetClient(clusterID)
	ver := esClient.GetVersion()
	return elastic.GetDateHistogramIntervalField(ver.Distribution, ver.Number, bucketSize)
}
