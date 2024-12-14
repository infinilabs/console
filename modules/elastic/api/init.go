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
	"infini.sh/console/core/security/enum"
	"infini.sh/framework/core/api"
)

var clusterAPI APIHandler

func init() {
	clusterAPI = APIHandler{}

	InitTestAPI()

	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/health", clusterAPI.RequireClusterPermission(clusterAPI.GetClusterHealth))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/metrics", clusterAPI.RequireClusterPermission(clusterAPI.HandleMetricsSummaryAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/cluster_metrics", clusterAPI.RequireClusterPermission(clusterAPI.HandleClusterMetricsAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/node_metrics", clusterAPI.RequireClusterPermission(clusterAPI.HandleNodeMetricsAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/index_metrics", clusterAPI.RequireClusterPermission(clusterAPI.HandleIndexMetricsAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/queue_metrics", clusterAPI.RequireClusterPermission(clusterAPI.HandleQueueMetricsAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/storage_metrics", clusterAPI.RequireClusterPermission(clusterAPI.HandleGetStorageMetricAction))

	api.HandleAPIMethod(api.POST, "/elasticsearch/", clusterAPI.RequirePermission(clusterAPI.HandleCreateClusterAction, enum.PermissionElasticsearchClusterWrite))
	api.HandleAPIMethod(api.GET, "/elasticsearch/indices", clusterAPI.RequireLogin(clusterAPI.ListIndex))
	api.HandleAPIMethod(api.GET, "/elasticsearch/status", clusterAPI.RequireLogin(clusterAPI.GetClusterStatusAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id", clusterAPI.RequireClusterPermission(clusterAPI.RequirePermission(clusterAPI.HandleGetClusterAction, enum.PermissionElasticsearchClusterRead)))
	api.HandleAPIMethod(api.PUT, "/elasticsearch/:id", clusterAPI.RequireClusterPermission(clusterAPI.RequirePermission(clusterAPI.HandleUpdateClusterAction, enum.PermissionElasticsearchClusterWrite)))
	api.HandleAPIMethod(api.DELETE, "/elasticsearch/:id", clusterAPI.RequireClusterPermission(clusterAPI.RequirePermission(clusterAPI.HandleDeleteClusterAction, enum.PermissionElasticsearchClusterWrite)))
	api.HandleAPIMethod(api.GET, "/elasticsearch/_search", clusterAPI.RequirePermission(clusterAPI.HandleSearchClusterAction, enum.PermissionElasticsearchClusterRead))
	api.HandleAPIMethod(api.POST, "/elasticsearch/_search", clusterAPI.RequirePermission(clusterAPI.HandleSearchClusterAction, enum.PermissionElasticsearchClusterRead))

	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/search_template", clusterAPI.HandleCreateSearchTemplateAction)
	api.HandleAPIMethod(api.PUT, "/elasticsearch/:id/search_template/:template_id", clusterAPI.HandleUpdateSearchTemplateAction)
	api.HandleAPIMethod(api.DELETE, "/elasticsearch/:id/search_template/:template_id", clusterAPI.HandleDeleteSearchTemplateAction)
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/search_template", clusterAPI.HandleSearchSearchTemplateAction)
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/search_template/:template_id", clusterAPI.HandleGetSearchTemplateAction)
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/search_template_history/_search", clusterAPI.HandleSearchSearchTemplateHistoryAction)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/_render/template", clusterAPI.HandleRenderTemplateAction)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/_search/template", clusterAPI.HandleSearchTemplateAction)

	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/alias", clusterAPI.RequireClusterPermission(clusterAPI.HandleAliasAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/alias", clusterAPI.RequireClusterPermission(clusterAPI.HandleGetAliasAction))

	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/saved_objects/view", clusterAPI.RequirePermission(clusterAPI.HandleCreateViewAction, enum.PermissionViewWrite))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/saved_objects/_find", clusterAPI.RequirePermission(clusterAPI.HandleGetViewListAction, enum.PermissionViewRead))
	api.HandleAPIMethod(api.DELETE, "/elasticsearch/:id/saved_objects/view/:view_id", clusterAPI.RequirePermission(clusterAPI.HandleDeleteViewAction, enum.PermissionViewWrite))
	api.HandleAPIMethod(api.PUT, "/elasticsearch/:id/saved_objects/view/:view_id", clusterAPI.RequirePermission(clusterAPI.HandleUpdateViewAction, enum.PermissionViewWrite))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/internal/view-management/resolve_index/:wild", clusterAPI.RequireLogin(clusterAPI.HandleResolveIndexAction))
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/saved_objects/_bulk_get", clusterAPI.RequirePermission(clusterAPI.HandleBulkGetViewAction, enum.PermissionViewRead))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/view/_fields_for_wildcard", clusterAPI.RequireClusterPermission(clusterAPI.HandleGetFieldCapsAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/saved_objects/view/:view_id", clusterAPI.RequireClusterPermission(clusterAPI.HandleGetViewAction))
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/view/:view_id/_set_default_layout", clusterAPI.RequireClusterPermission(clusterAPI.SetDefaultLayout))

	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/search/ese", clusterAPI.RequireClusterPermission(clusterAPI.HandleEseSearchAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/search/trace_id", clusterAPI.HandleTraceIDSearchAction)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/suggestions/values/:index", clusterAPI.RequireClusterPermission(clusterAPI.HandleValueSuggestionAction))
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/setting", clusterAPI.RequireClusterPermission(clusterAPI.HandleSettingAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/setting/:key", clusterAPI.RequireClusterPermission(clusterAPI.HandleGetSettingAction))

	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/_proxy", clusterAPI.RequireClusterPermission(clusterAPI.HandleProxyAction))

	api.HandleAPIMethod(api.POST, "/elasticsearch/cluster/_search", clusterAPI.RequirePermission(clusterAPI.SearchClusterMetadata, enum.PermissionElasticsearchClusterRead))
	api.HandleAPIMethod(api.POST, "/elasticsearch/cluster/info", clusterAPI.RequirePermission(clusterAPI.FetchClusterInfo, enum.PermissionElasticsearchMetricRead))

	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/info", clusterAPI.RequireClusterPermission(clusterAPI.RequirePermission(clusterAPI.GetClusterInfo, enum.PermissionElasticsearchMetricRead)))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/_collection_stats", clusterAPI.RequireClusterPermission(clusterAPI.RequirePermission(clusterAPI.getClusterMonitorState, enum.PermissionElasticsearchMetricRead)))
	api.HandleAPIMethod(api.POST, "/elasticsearch/node/_search", clusterAPI.RequirePermission(clusterAPI.SearchNodeMetadata, enum.PermissionElasticsearchNodeRead))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/nodes", clusterAPI.RequireClusterPermission(clusterAPI.RequirePermission(clusterAPI.GetClusterNodes, enum.PermissionElasticsearchMetricRead, enum.PermissionElasticsearchNodeRead)))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/nodes/realtime", clusterAPI.RequireClusterPermission(clusterAPI.RequirePermission(clusterAPI.GetRealtimeClusterNodes, enum.PermissionElasticsearchMetricRead)))
	api.HandleAPIMethod(api.POST, "/elasticsearch/node/info", clusterAPI.RequirePermission(clusterAPI.FetchNodeInfo, enum.PermissionElasticsearchMetricRead))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/indices", clusterAPI.RequirePermission(clusterAPI.GetClusterIndices, enum.PermissionElasticsearchMetricRead, enum.PermissionElasticsearchIndexRead))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/indices/realtime", clusterAPI.RequireLogin(clusterAPI.GetRealtimeClusterIndices))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/node/:node_id/shards", clusterAPI.RequireClusterPermission(clusterAPI.RequirePermission(clusterAPI.GetNodeShards, enum.PermissionElasticsearchMetricRead)))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/node/:node_id/info", clusterAPI.RequireClusterPermission(clusterAPI.RequirePermission(clusterAPI.GetNodeInfo, enum.PermissionElasticsearchMetricRead, enum.PermissionElasticsearchNodeRead)))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/node/:node_id/metrics", clusterAPI.RequireClusterPermission(clusterAPI.RequirePermission(clusterAPI.GetSingleNodeMetrics, enum.PermissionElasticsearchMetricRead)))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/node/:node_id/indices", clusterAPI.RequirePermission(clusterAPI.getNodeIndices, enum.PermissionElasticsearchMetricRead, enum.PermissionElasticsearchIndexRead))
	api.HandleAPIMethod(api.POST, "/elasticsearch/index/_search", clusterAPI.RequirePermission(clusterAPI.SearchIndexMetadata, enum.PermissionElasticsearchIndexRead))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/index/:index/metrics", clusterAPI.RequirePermission(clusterAPI.GetSingleIndexMetrics, enum.PermissionElasticsearchMetricRead))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/index/:index/info", clusterAPI.RequirePermission(clusterAPI.GetIndexInfo, enum.PermissionElasticsearchIndexRead, enum.PermissionElasticsearchMetricRead))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/index/:index/shards", clusterAPI.RequirePermission(clusterAPI.GetIndexShards, enum.PermissionElasticsearchIndexRead, enum.PermissionElasticsearchMetricRead))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/index/:index/nodes", clusterAPI.RequirePermission(clusterAPI.getIndexNodes, enum.PermissionElasticsearchMetricRead, enum.PermissionElasticsearchNodeRead))
	api.HandleAPIMethod(api.POST, "/elasticsearch/index/info", clusterAPI.RequirePermission(clusterAPI.FetchIndexInfo, enum.PermissionElasticsearchMetricRead))

	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/trace_template", clusterAPI.HandleSearchTraceTemplateAction)
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/trace_template/:template_id", clusterAPI.HandleGetTraceTemplateAction)
	api.HandleAPIMethod(api.POST, "/elasticsearch/:id/trace_template", clusterAPI.HandleCrateTraceTemplateAction)
	api.HandleAPIMethod(api.PUT, "/elasticsearch/:id/trace_template/:template_id", clusterAPI.HandleSaveTraceTemplateAction)
	api.HandleAPIMethod(api.DELETE, "/elasticsearch/:id/trace_template/:template_id", clusterAPI.HandleDeleteTraceTemplateAction)

	api.HandleAPIMethod(api.POST, "/elasticsearch/activity/_search", clusterAPI.RequirePermission(clusterAPI.HandleSearchActivityAction, enum.PermissionActivityRead))

	api.HandleAPIMethod(api.GET, "/host/_discover", clusterAPI.getDiscoverHosts)
	api.HandleAPIMethod(api.POST, "/host/_search", clusterAPI.SearchHostMetadata)
	api.HandleAPIMethod(api.POST, "/host/info", clusterAPI.FetchHostInfo)
	api.HandleAPIMethod(api.GET, "/host/:host_id/metrics", clusterAPI.GetSingleHostMetrics)
	api.HandleAPIMethod(api.GET, "/host/:host_id/metric/_stats", clusterAPI.GetHostMetricStats)
	api.HandleAPIMethod(api.GET, "/host/:host_id", clusterAPI.GetHostInfo)
	api.HandleAPIMethod(api.PUT, "/host/:host_id", clusterAPI.updateHost)
	api.HandleAPIMethod(api.GET, "/host/:host_id/info", clusterAPI.GetHostOverviewInfo)

	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/_ilm/policy", clusterAPI.HandleGetILMPolicyAction)
	api.HandleAPIMethod(api.PUT, "/elasticsearch/:id/_ilm/policy/:policy", clusterAPI.HandleSaveILMPolicyAction)
	api.HandleAPIMethod(api.DELETE, "/elasticsearch/:id/_ilm/policy/:policy", clusterAPI.HandleDeleteILMPolicyAction)

	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/_template", clusterAPI.HandleGetTemplateAction)
	api.HandleAPIMethod(api.PUT, "/elasticsearch/:id/_template/:template_name", clusterAPI.HandleSaveTemplateAction)
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/shard/:shard_id/info", clusterAPI.RequirePermission(clusterAPI.GetShardInfo, enum.PermissionElasticsearchMetricRead))

	api.HandleAPIMethod(api.GET, "/elasticsearch/metadata", clusterAPI.RequireLogin(clusterAPI.GetMetadata))
	api.HandleAPIMethod(api.GET, "/elasticsearch/hosts", clusterAPI.RequireLogin(clusterAPI.GetHosts))
	api.HandleAPIMethod(api.DELETE, "/elasticsearch/metadata/index", clusterAPI.RequireLogin(clusterAPI.deleteIndexMetadata))
	api.HandleAPIMethod(api.DELETE, "/elasticsearch/metadata/node", clusterAPI.RequireLogin(clusterAPI.deleteNodeMetadata))

}
