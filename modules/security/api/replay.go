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
	core2 "infini.sh/console/core"
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
	"time"
)

func (h APIHandler) IssueReplayNonce(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var req struct {
		Method string `json:"method"`
		Path   string `json:"path"`
	}

	if err := h.DecodeJSON(r, &req); err != nil {
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	nonce, ttl, err := core2.IssueReplayNonce(r, req.Method, req.Path)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.WriteOKJSON(w, map[string]interface{}{
		"status":            "ok",
		"nonce":             nonce,
		"expire_in_seconds": int(ttl / time.Second),
	})
}
