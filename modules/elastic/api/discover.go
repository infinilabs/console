package api

import (
	"context"
	"fmt"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"time"
)

func (h *APIHandler) HandleEseSearchAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	targetClusterID := ps.ByName("id")
	exists,client,err:=h.GetClusterClient(targetClusterID)

	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !exists{
		errStr := fmt.Sprintf("cluster [%s] not found",targetClusterID)
		log.Error(errStr)
		h.WriteError(w, errStr, http.StatusNotFound)
		return
	}

	var reqParams = struct{
		Index string `json:"index"`
		Body map[string]interface{} `json:"body"`
		DistinctByField map[string]interface{} `json:"distinct_by_field"`
	}{}

	err = h.DecodeJSON(req, &reqParams)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ver := client.GetVersion()
	if _, ok := reqParams.Body["track_total_hits"]; ok {
		if ver.Distribution == "" || ver.Distribution == "elasticsearch" {
			vr, _ := util.VersionCompare(ver.Number, "7.0")
			if vr < 0 {
				delete(reqParams.Body, "track_total_hits")
			}
		}
	}
	if reqParams.DistinctByField != nil {
		if query, ok := reqParams.Body["query"]; ok {
			if qm, ok := query.(map[string]interface{}); ok {

				filter, _ := util.MapStr(qm).GetValue("bool.filter")
				if fv, ok := filter.([]interface{}); ok{
					fv = append(fv, util.MapStr{
						"script": util.MapStr{
							"script": util.MapStr{
								"source": "distinct_by_field",
								"lang": "infini",
								"params": reqParams.DistinctByField,
							},
						},
					})
					util.MapStr(qm).Put("bool.filter", fv)
				}

			}
		}
	}
	if ver.Distribution == "" || ver.Distribution == "elasticsearch" {
		vr, err := util.VersionCompare(ver.Number, "7.2")
		if err != nil {
			errStr := fmt.Sprintf("version compare error: %v", err)
			log.Error(errStr)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if vr < 0 {
			if aggs, ok := reqParams.Body["aggs"]; ok {
				if maggs, ok := aggs.(map[string]interface{}); ok {
					if aggsCounts, ok := maggs["counts"].(map[string]interface{}); ok {
						if aggVals, ok := aggsCounts["date_histogram"].(map[string]interface{}); ok {
							var interval interface{}
							if calendarInterval, ok := aggVals["calendar_interval"]; ok {
								interval = calendarInterval
								delete(aggVals, "calendar_interval")
							}
							if fixedInterval, ok := aggVals["fixed_interval"]; ok {
								interval = fixedInterval
								delete(aggVals, "fixed_interval")
							}
							aggVals["interval"] = interval
						}
					}
				}
			}
		}
	}
	indices, hasAll := h.GetAllowedIndices(req, targetClusterID)
	if !hasAll {
		if len(indices) == 0 {
			h.WriteJSON(w, elastic.SearchResponse{}, http.StatusOK)
			return
		}
		reqParams.Body["query"] = util.MapStr{
			"bool": util.MapStr{
				"must": []interface{}{
					util.MapStr{
						"terms": util.MapStr{
							"_index": indices,
						},
					},
					reqParams.Body["query"],
				},
			},
		}
	}

	reqDSL := util.MustToJSONBytes(reqParams.Body)
	timeout := h.GetParameterOrDefault(req, "timeout", "")
	var queryArgs *[]util.KV
	var ctx context.Context
	if timeout != "" {
		queryArgs = &[]util.KV{
			{
				Key: "timeout",
				Value: timeout,
			},
		}
		du, err := util.ParseDuration(timeout)
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		var cancel context.CancelFunc
		// here add one second for network delay
		ctx, cancel = context.WithTimeout(context.Background(), du + time.Second)
		defer cancel()
	}

	searchRes, err := client.QueryDSL(ctx, reqParams.Index, queryArgs, reqDSL)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if searchRes.StatusCode != http.StatusOK {
		h.WriteError(w, string(searchRes.RawResult.Body), http.StatusInternalServerError)
		return
	}
	failures, _, _, _ := jsonparser.Get(searchRes.RawResult.Body, "_shards", "failures")
	if len(failures) > 0 {
		h.WriteError(w, string(failures), http.StatusInternalServerError)
		return
	}
	h.WriteJSONHeader(w)
	h.WriteHeader(w, http.StatusOK)
	h.Write(w, searchRes.RawResult.Body)
}


func (h *APIHandler) HandleValueSuggestionAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{
	}
	targetClusterID := ps.ByName("id")
	exists,client,err:=h.GetClusterClient(targetClusterID)

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !exists{
		errStr := fmt.Sprintf("cluster [%s] not found",targetClusterID)
		h.WriteError(w, errStr, http.StatusNotFound)
		return
	}

	var reqParams = struct{
		BoolFilter interface{} `json:"boolFilter"`
		FieldName string `json:"field"`
		Query string `json:"query"`
	}{}
	err = h.DecodeJSON(req, &reqParams)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	indexName := ps.ByName("index")
	boolQ := util.MapStr{
		"filter": reqParams.BoolFilter,
	}
	var values = []interface{}{}
	indices, hasAll := h.GetAllowedIndices(req, targetClusterID)
	if !hasAll {
		if len(indices) == 0 {
			h.WriteJSON(w, values,http.StatusOK)
			return
		}
		boolQ["must"] = []util.MapStr{
			{
				"terms": util.MapStr{
					"_index": indices,
				},
			},
		}
	}
	queryBody := util.MapStr{
		"size": 0,
		"query": util.MapStr{
			"bool": boolQ,
		},
		"aggs": util.MapStr{
			"suggestions": util.MapStr{
				"terms": util.MapStr{
					"field": reqParams.FieldName,
					"include": reqParams.Query + ".*",
					"execution_hint": "map",
					"shard_size": 10,
				},
			},
		},
	}
	var queryBodyBytes  = util.MustToJSONBytes(queryBody)

	searchRes, err := client.SearchWithRawQueryDSL(indexName, queryBodyBytes)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, bucket := range searchRes.Aggregations["suggestions"].Buckets {
		values = append(values, bucket["key"])
	}
	h.WriteJSON(w, values,http.StatusOK)
}

func (h *APIHandler) HandleTraceIDSearchAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	traceID := h.GetParameterOrDefault(req, "traceID", "")
	traceIndex := h.GetParameterOrDefault(req, "traceIndex", orm.GetIndexName(elastic.TraceMeta{}))
	traceField := h.GetParameterOrDefault(req, "traceField", "trace_id")
	targetClusterID := ps.ByName("id")
	exists,client,err:=h.GetClusterClient(targetClusterID)

	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !exists{
		errStr := fmt.Sprintf("cluster [%s] not found",targetClusterID)
		h.WriteError(w, errStr, http.StatusNotFound)
		return
	}
	var queryDSL = util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							traceField: traceID,
						},
					},
					{
						"term": util.MapStr{
							"cluster_id": targetClusterID,
						},
					},
				},
			},
		},
	}
	searchRes, err := client.SearchWithRawQueryDSL(traceIndex, util.MustToJSONBytes(queryDSL))
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if searchRes.GetTotal() == 0 {
		h.WriteJSON(w, []string{}, http.StatusOK)
		return
	}
	var indexNames []string
	for _, hit := range searchRes.Hits.Hits {
		indexNames = append(indexNames, hit.Source["index"].(string))
	}
	h.WriteJSON(w, indexNames, http.StatusOK)
}

