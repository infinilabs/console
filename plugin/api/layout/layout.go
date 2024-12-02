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
	log "github.com/cihub/seelog"
	"infini.sh/console/core/security"
	"infini.sh/console/model"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"strconv"
	"strings"
)

func (h *LayoutAPI) createLayout(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var obj = &model.Layout{}
	err := h.DecodeJSON(req, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	obj.ID = util.GetUUID()
	user, err := security.FromUserContext(req.Context())
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user != nil {
		obj.Creator.Name = user.Username
		obj.Creator.Id = user.UserId
	}
	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	err = orm.Create(ctx, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteCreatedOKJSON(w, obj.ID)

}

func (h *LayoutAPI) getLayout(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("layout_id")

	obj := model.Layout{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteGetOKJSON(w, id, obj)
}

func (h *LayoutAPI) updateLayout(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("layout_id")
	oldLayout := model.Layout{}

	oldLayout.ID = id
	exists, err := orm.Get(&oldLayout)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	create := oldLayout.Created
	obj := model.Layout{}
	err = h.DecodeJSON(req, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	//protect
	obj.ID = id
	obj.Created = create
	obj.Creator = oldLayout.Creator
	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	err = orm.Update(ctx, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteUpdatedOKJSON(w, obj.ID)
}

func (h *LayoutAPI) deleteLayout(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("layout_id")

	obj := model.Layout{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}
	if obj.Reserved {
		h.WriteError(w, "this layout is reserved", http.StatusInternalServerError)
		return
	}

	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	err = orm.Delete(ctx, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteDeletedOKJSON(w, id)
}

func (h *LayoutAPI) searchLayout(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var (
		keyword = h.GetParameterOrDefault(req, "keyword", "")
		strSize = h.GetParameterOrDefault(req, "size", "20")
		strFrom = h.GetParameterOrDefault(req, "from", "0")
		viewID  = strings.TrimSpace(h.GetParameterOrDefault(req, "view_id", ""))
		typ     = strings.TrimSpace(h.GetParameterOrDefault(req, "type", ""))
		isFixed = strings.TrimSpace(h.GetParameterOrDefault(req, "is_fixed", ""))
		mustQ   []util.MapStr
	)
	if isFixed != "" {
		fixed, err := strconv.ParseBool(isFixed)
		if err == nil {
			mustQ = append(mustQ, util.MapStr{
				"term": util.MapStr{
					"is_fixed": util.MapStr{
						"value": fixed,
					},
				},
			})
		}
	}
	if viewID != "" {
		mustQ = append(mustQ, util.MapStr{
			"term": util.MapStr{
				"view_id": util.MapStr{
					"value": viewID,
				},
			},
		})
	}
	if typ != "" {
		mustQ = append(mustQ, util.MapStr{
			"term": util.MapStr{
				"type": util.MapStr{
					"value": typ,
				},
			},
		})
	}
	if keyword != "" {
		mustQ = append(mustQ, util.MapStr{
			"query_string": util.MapStr{
				"default_field": "*",
				"query":         keyword,
			},
		})
	}
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}
	query := util.MapStr{
		"size": size,
		"from": from,
	}
	if len(mustQ) > 0 {
		query["query"] = util.MapStr{
			"bool": util.MapStr{
				"must": mustQ,
			},
		}
	}

	q := orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}

	err, res := orm.Search(&model.Layout{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.Write(w, res.Raw)
}
