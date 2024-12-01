/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package api

import (
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"strings"
)

func (h *APIHandler) HandleSearchActivityAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	resBody:=util.MapStr{}
	reqBody := struct{
		Keyword string `json:"keyword"`
		Size int `json:"size"`
		From int `json:"from"`
		Aggregations []elastic.SearchAggParam `json:"aggs"`
		Highlight elastic.SearchHighlightParam `json:"highlight"`
		Filter elastic.SearchFilterParam `json:"filter"`
		Sort []string `json:"sort"`
		StartTime interface{} `json:"start_time"`
		EndTime interface{} `json:"end_time"`
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w,resBody, http.StatusInternalServerError )
		return
	}
	aggs := elastic.BuildSearchTermAggregations(reqBody.Aggregations)
	aggs["term_cluster_id"] = util.MapStr{
		"terms": util.MapStr{
			"field": "metadata.labels.cluster_id",
			"size": 1000,
		},
		"aggs": util.MapStr{
			"term_cluster_name": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.cluster_name",
					"size": 1,
				},
			},
		},
	}
	filter := elastic.BuildSearchTermFilter(reqBody.Filter)
	if reqBody.StartTime != "" {
		filter = append(filter, util.MapStr{
			"range": util.MapStr{
				"timestamp": util.MapStr{
					"gte": reqBody.StartTime,
					"lte": reqBody.EndTime,
				},
			},
		})
	}

	clusterFilter, hasAllPrivilege := h.GetClusterFilter(req, "metadata.labels.cluster_id")
	if !hasAllPrivilege && clusterFilter == nil {
		h.WriteJSON(w, elastic.SearchResponse{

		}, http.StatusOK)
		return
	}
	if !hasAllPrivilege && clusterFilter != nil {
		filter = append(filter, clusterFilter)
	}

	hasAllPrivilege, indexPrivilege := h.GetCurrentUserIndex(req)
	if !hasAllPrivilege && len(indexPrivilege) == 0 {
		h.WriteJSON(w, elastic.SearchResponse{

		}, http.StatusOK)
		return
	}
	if !hasAllPrivilege {
		indexShould := make([]interface{}, 0, len(indexPrivilege))
		for clusterID, indices := range indexPrivilege {
			var (
				wildcardIndices []string
				normalIndices []string
			)
			for _, index := range indices {
				if strings.Contains(index,"*") {
					wildcardIndices = append(wildcardIndices, index)
					continue
				}
				normalIndices = append(normalIndices, index)
			}
			subShould := []util.MapStr{}
			if len(wildcardIndices) > 0 {
				subShould = append(subShould, util.MapStr{
					"query_string": util.MapStr{
						"query": strings.Join(wildcardIndices, " "),
						"fields": []string{"metadata.labels.index_name"},
						"default_operator": "OR",
					},
				})
			}
			if len(normalIndices) > 0 {
				subShould = append(subShould, util.MapStr{
					"terms": util.MapStr{
						"metadata.labels.index_name": normalIndices,
					},
				})
			}
			indexShould = append(indexShould, util.MapStr{
				"bool": util.MapStr{
					"must": []util.MapStr{
						{
							"wildcard": util.MapStr{
								"metadata.labels.cluster_id": util.MapStr{
									"value": clusterID,
								},
							},
						},
						{
							"bool": util.MapStr{
								"minimum_should_match": 1,
								"should": subShould,
							},
						},
					},
				},
			})
		}
		indexFilter := util.MapStr{
			"bool": util.MapStr{
				"minimum_should_match": 1,
				"should": indexShould,
			},
		}
		filter = append(filter, indexFilter)
	}

	var should = []util.MapStr{}
	if reqBody.Keyword != "" {
		should = []util.MapStr{
			{
				"query_string": util.MapStr{
					"default_field": "*",
					"query": reqBody.Keyword,
				},
			},
		}
	}
	var boolQuery = util.MapStr{
		"filter": filter,
	}
	if len(should) >0 {
		boolQuery["should"] = should
		boolQuery["minimum_should_match"] = 1
	}
	query := util.MapStr{
		"aggs":      aggs,
		"size":      reqBody.Size,
		"from": reqBody.From,
		"_source": []string{"changelog", "id", "metadata", "timestamp"},
		"highlight": elastic.BuildSearchHighlight(&reqBody.Highlight),
		"query": util.MapStr{
			"bool": boolQuery,
		},
	}
	if len(reqBody.Sort) == 0 {
		reqBody.Sort = []string{"timestamp", "desc"}
	}

	query["sort"] =  []util.MapStr{
		{
			reqBody.Sort[0]: util.MapStr{
				"order": reqBody.Sort[1],
			},
		},
	}

	dsl := util.MustToJSONBytes(query)
	response, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).SearchWithRawQueryDSL(orm.GetWildcardIndexName(event.Activity{}), dsl)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w,resBody, http.StatusInternalServerError )
		return
	}
	w.Write(response.RawResult.Body)
}