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

/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package layout

import (
	"infini.sh/console/core"
	"infini.sh/console/core/security/enum"
	"infini.sh/framework/core/api"
)

type LayoutAPI struct {
	core.Handler
}

func InitAPI() {
	layoutAPI := LayoutAPI{}
	api.HandleAPIMethod(api.GET, "/layout/:layout_id", layoutAPI.RequirePermission(layoutAPI.getLayout, enum.PermissionLayoutRead))
	api.HandleAPIMethod(api.POST, "/layout", layoutAPI.RequirePermission(layoutAPI.createLayout, enum.PermissionLayoutWrite))
	api.HandleAPIMethod(api.PUT, "/layout/:layout_id", layoutAPI.RequirePermission(layoutAPI.updateLayout, enum.PermissionLayoutWrite))
	api.HandleAPIMethod(api.DELETE, "/layout/:layout_id", layoutAPI.RequirePermission(layoutAPI.deleteLayout, enum.PermissionLayoutWrite))
	api.HandleAPIMethod(api.GET, "/layout/_search", layoutAPI.RequirePermission(layoutAPI.searchLayout, enum.PermissionLayoutRead))
}
