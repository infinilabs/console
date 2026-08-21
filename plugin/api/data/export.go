/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package data

import (
	"fmt"
	"net/http"
	"time"

	log "github.com/cihub/seelog"
	"infini.sh/console/model"
	"infini.sh/console/model/alerting"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

func (h *DataAPI) exportData(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	reqBody := &ExportDataRequest{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var resBody []ExportData
	for _, meta := range reqBody.Metadatas {
		result, err := getExportData(meta)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		resBody = append(resBody, ExportData{
			Version: global.Env().GetVersion(),
			Type:    meta.Type,
			Data:    result.Result,
		})
	}
	h.WriteJSON(w, resBody, http.StatusOK)

}

func (h *DataAPI) importData(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	reqBody := []ExportData{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	needPatch := true
	if len(reqBody) > 0 && len(reqBody[0].Version) > 0 {
		needPatch = false
	}
	err = indexExportData(reqBody, needPatch)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteAckOKJSON(w)
}

func indexExportData(eds []ExportData, patch bool) error {
	for _, ed := range eds {
		for _, row := range ed.Data {
			var obj interface{}
			switch ed.Type {
			case DataTypeAlertChannel:
				obj = &alerting.Channel{}
			case DataTypeAlertRule:
				obj = &alerting.Rule{}
			case DataTypeAlertEmailServer:
				obj = &model.EmailServer{}
			default:
				return fmt.Errorf("unkonw data type: %s", ed.Type)
			}
			buf := util.MustToJSONBytes(row)
			err := util.FromJSONBytes(buf, obj)
			if ed.Type == DataTypeAlertRule {
				if rule, ok := obj.(*alerting.Rule); ok {
					if patch && len(rule.Category) == 0 {
						rule.Category = "Platform"
					}
					now := time.Now()
					if rule.Created.IsZero() {
						rule.Created = now
					}
					if rule.Updated.IsZero() || rule.Updated.Before(rule.Created) {
						rule.Updated = now
					}
					obj = rule
				}
			}
			if err != nil {
				return err
			}
			err = orm.Save(orm.NewContext(), obj)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func getExportData(meta ExportMetadata) (*orm.Result, error) {
	var obj interface{}
	switch meta.Type {
	case DataTypeAlertChannel:
		obj = alerting.Channel{}
	case DataTypeAlertRule:
		obj = alerting.Rule{}
	case DataTypeAlertEmailServer:
		obj = model.EmailServer{}
	default:
		return nil, fmt.Errorf("unkonw data type: %s", meta.Type)
	}
	q := &orm.Query{
		Size: 1000,
	}
	if meta.Filter != nil {
		query := util.MapStr{
			"size":  1000,
			"query": meta.Filter,
		}
		q.RawQuery = util.MustToJSONBytes(query)
	}
	err, result := orm.Search(obj, q)
	if err != nil {
		return nil, err
	}
	return &result, err
}
