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
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package funcs

import (
	"strings"
	"text/template"
)

func GenericFuncMap() template.FuncMap {
	gfm := make(map[string]interface{}, len(genericMap))
	for k, v := range genericMap {
		gfm[k] = v
	}
	return gfm
}

var genericMap = map[string]interface{}{
	"hello":            func() string { return "Hello!" },
	"format_bytes":     formatBytes,
	"to_fixed":         toFixed,
	"date":             date,
	"date_in_zone":     dateInZone,
	"datetime":         datetime,
	"datetime_in_zone": datetimeInZone,
	"to_upper":         strings.ToUpper,
	"to_lower":         strings.ToLower,
	"add":              add,
	"sub":              sub,
	"div":              div,
	"mul":              mul,
	"lookup":           lookup,
	"str_replace":      replace,
	"md_to_html":       mdToHTML,
	//"get_keystore_secret": getKeystoreSecret,
}
