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

package insight

import (
	"fmt"
	log "github.com/cihub/seelog"
	common2 "infini.sh/console/common"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"strings"
	"text/template"
)

func (h *InsightAPI) renderMapLabelTemplate(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	body := &RenderTemplateRequest{}
	err := h.DecodeJSON(req, &body)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(body.Contexts) == 0 && body.Template == "" {
		log.Error("got bad request body: %v", body)
		h.WriteError(w, "bad request", http.StatusInternalServerError)
	}
	client := elastic.GetClient(clusterID)
	var isFakeRender = true
	cacheLabelsMap := map[string]map[string]string{}
	keyFieldValuesM := map[string]map[string]struct{}{}
	tpl, err := template.New("template_render").Funcs(map[string]any{
		"lookup": func(directory, labelName string) string {
			var indexName, keyField, valueField string
			directory = strings.TrimSpace(directory)
			if directory == "" {
				return "N/A"
			}
			parts := strings.Split(directory, ",")
			kvs := map[string]string{}
			for _, part := range parts {
				kv := strings.Split(part, "=")
				if len(kv) == 2 {
					k := strings.TrimSpace(kv[0])
					kvs[k] = strings.TrimSpace(kv[1])
				} else {
					log.Debugf("got unexpected directory part: %s", part)
				}
			}
			indexName = kvs["object"]
			keyField = kvs["key_property"]
			switch kvs["category"] {
			case "metadata":
				switch kvs["object"] {
				case "cluster":
					indexName = orm.GetIndexName(elastic.ElasticsearchConfig{})
					if keyField == "" {
						keyField = "id"
					}
				case "node":
					indexName = orm.GetIndexName(elastic.NodeConfig{})
					if keyField == "" {
						keyField = "metadata.node_id"
					}
				}

			}
			valueField = kvs["property"]
			if indexName == "" || keyField == "" || valueField == "" {
				return kvs["default"]
			}
			cacheKey := fmt.Sprintf("%s_%s_%s", indexName, keyField, valueField)
			if isFakeRender {
				if keyFieldValuesM[cacheKey] == nil {
					keyFieldValuesM[cacheKey] = map[string]struct{}{}
				}
				keyFieldValuesM[cacheKey][labelName] = struct{}{}
				return ""
			}
			var (
				cacheLabels map[string]string
				ok          bool
			)
			if cacheLabels, ok = cacheLabelsMap[cacheKey]; !ok {
				var keyFieldValues []string
				if v, ok := keyFieldValuesM[cacheKey]; ok {
					keyFieldValues = make([]string, 0, len(v))
					for key, _ := range v {
						keyFieldValues = append(keyFieldValues, key)
					}
				}
				cacheLabels, err = common2.GetLabelMaps(indexName, keyField, valueField, client, keyFieldValues, len(keyFieldValues))
				if err != nil {
					log.Error(err)
				} else {
					cacheLabelsMap[cacheKey] = cacheLabels
				}
			}
			return common2.MapLabel(labelName, indexName, keyField, valueField, client, cacheLabels)

		},
	}).Parse(body.Template)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	//do fake render
	for _, ctx := range body.Contexts {
		common2.ExecuteTemplate(tpl, ctx.Value)
	}
	isFakeRender = false
	resultLabels := map[string]string{}
	for _, ctx := range body.Contexts {
		label, err := common2.ExecuteTemplate(tpl, ctx.Value)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		resultLabels[ctx.Key] = string(label)
	}
	h.WriteJSON(w, util.MapStr{
		"labels": resultLabels,
	}, http.StatusOK)
}

type RenderTemplateRequest struct {
	Contexts []RenderTemplateContext `json:"contexts"`
	Template string                  `json:"template"`
}

type RenderTemplateContext struct {
	Key   string                 `json:"key"`
	Value map[string]interface{} `json:"value"`
}
