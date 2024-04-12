/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package platform

import (
	consoleModel "infini.sh/console/model"
	"infini.sh/console/model/alerting"
	"infini.sh/framework/core/api/rbac/enum"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
	"net/http"
	"strings"
	"sync"
)

var (
	collectionMetas map[string]CollectionMeta
	metasInitOnce   sync.Once
)

func GetCollectionMetas() map[string]CollectionMeta {
	metasInitOnce.Do(func() {
		collectionMetas = map[string]CollectionMeta{
			"gateway": {
				Name: "gateway",
				RequirePermission: map[string][]string{
					"read": {
						enum.PermissionGatewayInstanceRead,
					},
				},
				MatchObject: &model.Instance{},
			},
			"agent": {
				Name: "agent",
				RequirePermission: map[string][]string{
					"read": {
						enum.PermissionAgentInstanceRead,
					},
				},
				MatchObject: &model.Instance{},
			},
			"cluster": {
				Name: "cluster",
				RequirePermission: map[string][]string{
					"read": {
						enum.PermissionElasticsearchClusterRead,
					},
				},
				MatchObject: &elastic.ElasticsearchConfig{},
				GetSearchRequestBodyFilter: func(api *PlatformAPI, req *http.Request) (util.MapStr, bool) {
					return api.GetClusterFilter(req, "id")
				},
			},
			"node": {
				Name: "node",
				RequirePermission: map[string][]string{
					"read": {
						enum.PermissionElasticsearchNodeRead,
					},
				},
				MatchObject: &elastic.NodeConfig{},
			},
			"index": {
				Name: "index",
				RequirePermission: map[string][]string{
					"read": {
						enum.PermissionElasticsearchIndexRead,
					},
				},
				MatchObject: &elastic.IndexConfig{},
			},
			"command": {
				Name: "command",
				RequirePermission: map[string][]string{
					"read": {
						enum.PermissionCommandRead,
					},
				},
				MatchObject: &elastic.CommonCommand{},
			},
			"activity": {
				Name: "activity",
				RequirePermission: map[string][]string{
					"read": {
						enum.PermissionActivityRead,
					},
				},
				MatchObject: &event.Activity{},
				GetSearchRequestBodyFilter: func(api *PlatformAPI, req *http.Request) (util.MapStr, bool) {
					clusterFilter, hasAllPrivilege := api.GetClusterFilter(req, "metadata.labels.cluster_id")
					if !hasAllPrivilege && clusterFilter == nil {
						return clusterFilter, hasAllPrivilege
					}
					var filter []util.MapStr
					if !hasAllPrivilege && clusterFilter != nil {
						filter = append(filter, clusterFilter)
					}

					hasAllPrivilege, indexPrivilege := api.GetCurrentUserIndex(req)
					if !hasAllPrivilege && len(indexPrivilege) == 0 {
						return nil, hasAllPrivilege
					}
					if !hasAllPrivilege {
						indexShould := make([]interface{}, 0, len(indexPrivilege))
						for clusterID, indices := range indexPrivilege {
							var (
								wildcardIndices []string
								normalIndices   []string
							)
							for _, index := range indices {
								if strings.Contains(index, "*") {
									wildcardIndices = append(wildcardIndices, index)
									continue
								}
								normalIndices = append(normalIndices, index)
							}
							subShould := []util.MapStr{}
							if len(wildcardIndices) > 0 {
								subShould = append(subShould, util.MapStr{
									"query_string": util.MapStr{
										"query":            strings.Join(wildcardIndices, " "),
										"fields":           []string{"metadata.labels.index_name"},
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
												"should":               subShould,
											},
										},
									},
								},
							})
						}
						indexFilter := util.MapStr{
							"bool": util.MapStr{
								"minimum_should_match": 1,
								"should":               indexShould,
							},
						}
						filter = append(filter, indexFilter)
					}
					return util.MapStr{
						"bool": util.MapStr{
							"must": filter,
						},
					}, hasAllPrivilege
				},
			},
			"audit_log": {
				Name: "audit_log",
				RequirePermission: map[string][]string{
					"read": {
						enum.PermissionAuditLogRead,
					},
				},
				MatchObject: &consoleModel.AuditLog{},
			},
			"alerting_rule": {
				Name: "alerting_rule",
				RequirePermission: map[string][]string{
					"read": {
						enum.PermissionAlertRuleRead,
					},
				},
				MatchObject: &alerting.Rule{},
			},
		}
	})
	return collectionMetas
}

// CollectionMeta includes information about how to visit backend index
type CollectionMeta struct {
	//collection name
	Name string `json:"name"`
	//permissions required to visit collection
	RequirePermission map[string][]string `json:"require_permission"`
	//use for orm.GetIndexName to get real index name
	MatchObject interface{} `json:"match_object"`
	//configure GetSearchRequestBodyFilter to filter search request dsl
	GetSearchRequestBodyFilter SearchRequestBodyFilter
}

type SearchRequestBodyFilter func(api *PlatformAPI, req *http.Request) (util.MapStr, bool)
