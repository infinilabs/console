/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/console/model/alerting"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"time"
)

func (h *AlertAPI) ignoreAlertMessage(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	body := struct {
		MessageIDs []string `json:"ids"`
	}{}
	err := h.DecodeJSON(req,  &body)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(body.MessageIDs) == 0 {
		h.WriteError(w, "alert ids should not be empty", http.StatusInternalServerError)
		return
	}
	queryDsl := util.MapStr{
		"query": util.MapStr{
			"terms": util.MapStr{
				"_id": body.MessageIDs,
			},
		},
		"script": util.MapStr{
			"source": fmt.Sprintf("ctx._source['status'] = '%s';ctx._source['ignored_time']='%s'", alerting.MessageStateIgnored, time.Now().Format(time.RFC3339Nano)),
		},
	}
	err = orm.UpdateBy(alerting.AlertMessage{}, util.MustToJSONBytes(queryDsl))
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"ids": body.MessageIDs,
		"result": "updated",
	}, 200)
}

func (h *AlertAPI) getAlertMessageStats(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	esClient := elastic.GetClient(h.Config.Elasticsearch)
	queryDsl := util.MapStr{
		"size": 0,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must_not": []util.MapStr{
					{
						"terms": util.MapStr{
							"status": []string{
								alerting.MessageStateRecovered,
							},
						},
					},
				},
			},
		},
		"aggs": util.MapStr{
			"terms_by_severity": util.MapStr{
				"terms": util.MapStr{
					"field": "severity",
					"size": 5,
				},
			},
		},
	}

	searchRes, err := esClient.SearchWithRawQueryDSL(orm.GetWildcardIndexName(alerting.AlertMessage{}), util.MustToJSONBytes(queryDsl) )
	if err != nil {
		h.WriteJSON(w, util.MapStr{
			"error": err.Error(),
		}, http.StatusInternalServerError)
		return
	}
	statusCounts := map[string]interface{}{}
	if termsAgg, ok := searchRes.Aggregations["terms_by_severity"]; ok {
		for _, bk := range termsAgg.Buckets {
			if status, ok := bk["key"].(string); ok {
				statusCounts[status] = bk["doc_count"]
			}
		}
	}
	for _, status := range []string{"warning", "error", "critical"} {
		if _, ok := statusCounts[status]; !ok {
			statusCounts[status] = 0
		}
	}
	h.WriteJSON(w, util.MapStr{
		"alert": util.MapStr{
			"current": statusCounts,
		},
	}, http.StatusOK)
}


func (h *AlertAPI) searchAlertMessage(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody:=util.MapStr{}
	reqBody := struct{
		Keyword string `json:"keyword"`
		Size int `json:"size"`
		From int `json:"from"`
		Aggregations []elastic.SearchAggParam `json:"aggs"`
		Highlight elastic.SearchHighlightParam `json:"highlight"`
		Filter elastic.SearchFilterParam `json:"filter"`
		Sort []string `json:"sort"`
		SearchField string `json:"search_field"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w,resBody, http.StatusInternalServerError )
		return
	}
	if reqBody.Size <= 0 {
		reqBody.Size = 20
	}
	aggs := elastic.BuildSearchTermAggregations(reqBody.Aggregations)
	filter := elastic.BuildSearchTermFilter(reqBody.Filter)
	var should []util.MapStr
	if reqBody.SearchField != ""{
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
	}else{
		if reqBody.Keyword != ""{
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
				{
					"query_string": util.MapStr{
						"fields":                 []string{"*"},
						"query":                  reqBody.Keyword,
						"fuzziness":              "AUTO",
						"fuzzy_prefix_length":    2,
						"fuzzy_max_expansions":   10,
						"fuzzy_transpositions":   true,
						"allow_leading_wildcard": false,
					},
				},
			}
		}
	}
	boolQuery := util.MapStr{
		"filter": filter,
	}
	if len(should) > 0 {
		boolQuery["should"] = should
		boolQuery["minimum_should_match"] = 1
	}
	query := util.MapStr{
		"aggs":      aggs,
		"size":      reqBody.Size,
		"from": reqBody.From,
		"highlight": elastic.BuildSearchHighlight(&reqBody.Highlight),
		"query": util.MapStr{
			"bool": boolQuery,
		},
	}
	if len(reqBody.Sort) > 1 {
		query["sort"] =  []util.MapStr{
			{
				reqBody.Sort[0]: util.MapStr{
					"order": reqBody.Sort[1],
				},
			},
		}
	}
	dsl := util.MustToJSONBytes(query)
	response, err := elastic.GetClient(h.Config.Elasticsearch).SearchWithRawQueryDSL(orm.GetIndexName(alerting.AlertMessage{}), dsl)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w,resBody, http.StatusInternalServerError )
		return
	}
	h.WriteJSONHeader(w)
	w.Write(util.MustToJSONBytes(response))

}