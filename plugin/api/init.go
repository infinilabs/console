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
	"path"

	"infini.sh/console/config"
	"infini.sh/console/core/security/enum"
	"infini.sh/console/plugin/api/alerting"
	"infini.sh/console/plugin/api/data"
	"infini.sh/console/plugin/api/email"
	"infini.sh/console/plugin/api/index_management"
	"infini.sh/console/plugin/api/insight"
	"infini.sh/console/plugin/api/layout"
	"infini.sh/console/plugin/api/notification"
	"infini.sh/console/plugin/api/platform"
	"infini.sh/framework/core/api"
)

func Init(cfg *config.AppConfig) {

	handler := index_management.APIHandler{
		Config: cfg,
	}
	var pathPrefix = "/_search-center/"
	var esPrefix = "/elasticsearch/:id/"
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "elasticsearch/overview"), handler.RequirePermission(handler.ElasticsearchOverviewAction, enum.PermissionElasticsearchMetricRead))

	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "doc/:index/_search"), handler.RequireLogin(handler.HandleSearchDocumentAction))
	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "doc/:index"), handler.IndexRequired(handler.HandleAddDocumentAction, "doc.create"))
	api.HandleAPIMethod(api.PUT, path.Join(esPrefix, "doc/:index/:docId"), handler.IndexRequired(handler.HandleUpdateDocumentAction, "doc.update"))
	api.HandleAPIMethod(api.DELETE, path.Join(esPrefix, "doc/:index/:docId"), handler.IndexRequired(handler.HandleDeleteDocumentAction, "doc.delete"))
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "doc/_validate"), handler.ValidateDocIDAction)

	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "_cat/indices"), handler.RequireLogin(handler.HandleCatIndicesAction))
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index/_mappings"), handler.IndexRequired(handler.HandleGetMappingsAction, "indices.get_mapping"))
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index/_settings"), handler.IndexRequired(handler.HandleGetSettingsAction, "indices.get_settings"))
	api.HandleAPIMethod(api.PUT, path.Join(esPrefix, "index/:index/_settings"), handler.IndexRequired(handler.HandleUpdateSettingsAction, "indices.put_settings"))
	api.HandleAPIMethod(api.DELETE, path.Join(esPrefix, "index/:index"), handler.IndexRequired(handler.HandleDeleteIndexAction, "indices.delete"))
	api.HandleAPIMethod(api.POST, path.Join(esPrefix, "index/:index"), handler.IndexRequired(handler.HandleCreateIndexAction, "indices.create"))
	api.HandleAPIMethod(api.GET, path.Join(esPrefix, "index/:index"), handler.IndexRequired(handler.HandleGetIndexAction, "indices.get"))

	api.HandleAPIMethod(api.POST, path.Join(pathPrefix, "elasticsearch/command"), handler.RequirePermission(handler.HandleAddCommonCommandAction, enum.PermissionCommandWrite))
	api.HandleAPIMethod(api.PUT, path.Join(pathPrefix, "elasticsearch/command/:cid"), handler.RequirePermission(handler.HandleSaveCommonCommandAction, enum.PermissionCommandWrite))
	api.HandleAPIMethod(api.GET, path.Join(pathPrefix, "elasticsearch/command"), handler.RequirePermission(handler.HandleQueryCommonCommandAction, enum.PermissionCommandRead))
	api.HandleAPIMethod(api.DELETE, path.Join(pathPrefix, "elasticsearch/command/:cid"), handler.RequirePermission(handler.HandleDeleteCommonCommandAction, enum.PermissionCommandWrite))
	api.HandleAPIMethod(api.GET, "/elasticsearch/overview/status", handler.RequireLogin(handler.ElasticsearchStatusSummaryAction))
	api.HandleAPIMethod(api.GET, "/elasticsearch/:id/overview/treemap", handler.RequireClusterPermission(handler.RequirePermission(handler.ClusterOverTreeMap, enum.PermissionElasticsearchMetricRead)))

	alertAPI := alerting.AlertAPI{}

	alertAPI.Init()

	insight.InitAPI()
	layout.InitAPI()
	notification.InitAPI()

	email.InitAPI()
	data.InitAPI()
	platform.InitAPI()
}
