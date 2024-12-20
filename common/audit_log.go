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

package common

import (
	"infini.sh/framework/core/api"
	"net/http"
	"strings"
)

// GetClientIP retrieves the client's IP address
func GetClientIP(req *http.Request) string {
	h := new(api.Handler)
	// 1. Try to get the client IP from the X-Forwarded-For header and return the first IP address in the list
	xff := h.GetHeader(req, "X-Forwarded-For", "")
	clientIP := strings.Split(xff, ",")[0]
	if len(clientIP) > 0 {
		return clientIP
	}
	// 2. Try to get the client IP from the X-Real-IP header
	clientIP = h.GetHeader(req, "X-Real-IP", "")
	if len(clientIP) > 0 {
		return clientIP
	}
	// 3. retrieve IP from request RemoteAddr
	return strings.Split(req.RemoteAddr, ":")[0]
}
