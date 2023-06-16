/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package insight

import (
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
	tpl, err := template.New("template_render").Funcs(map[string]any{
		"map_label": func(indexName, indexKeyField, indexValueField, labelName string) string {
			return common2.MapLabel(labelName, indexName, indexKeyField, indexValueField, client)
		},
	}).Parse(body.Template)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
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