/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package platform

import (
	"infini.sh/framework/core/api/rbac/enum"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/model"
	"sync"
)

var (
	collectionMetas map[string]CollectionMeta
	metasInitOnce sync.Once
)

func GetCollectionMetas() map[string]CollectionMeta{
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
			},
		}
	})
	return collectionMetas
}
//CollectionMeta includes information about how to visit backend index
type CollectionMeta struct {
	//collection name
	Name string `json:"name"`
	//permissions required to visit collection
	RequirePermission map[string][]string `json:"require_permission"`
	//use for orm.GetIndexName to get real index name
	MatchObject interface{} `json:"match_object"`
}
