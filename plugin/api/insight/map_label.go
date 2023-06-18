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
	"infini.sh/framework/core/util"
	"net/http"
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
		"map_label": func(indexName, keyField, valueField, labelName string) string {
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
				ok bool
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
				}else{
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
			continue
		}
		resultLabels[ctx.Key] = string(label)
	}
	h.WriteJSON(w, util.MapStr{
		"labels": resultLabels,
	}, http.StatusOK)
}

type RenderTemplateRequest struct {
	Contexts []RenderTemplateContext `json:"contexts"`
	Template string `json:"template"`
}

type RenderTemplateContext struct {
	Key string `json:"key"`
	Value map[string]interface{} `json:"value"`
}