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

package main

import (
	console_common "infini.sh/console/common"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	framework_model "infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
	"net/http"
)

func init() {
	api.HandleAPIMethod(api.GET, "/_info", sanitizedInfoAPIHandler)
	api.HandleUIMethod(api.GET, "/_info", sanitizedInfoAPIHandler, api.RequireLogin())
}

func sanitizedInfoAPIHandler(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	info := framework_model.GetInstanceInfo()
	payload := console_common.SanitizeInstanceInfoMap(util.MapStr{
		"id":          info.ID,
		"name":        info.Name,
		"application": info.Application,
		"labels":      info.Labels,
		"tags":        info.Tags,
		"description": info.Description,
		"status":      info.Status,
	})
	api.DefaultAPI.WriteJSON(w, payload, http.StatusOK)
}
