/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package data

import (
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/console/model"
	"infini.sh/console/model/alerting"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
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
		result, err := getExportData(meta.Type)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		resBody = append(resBody, ExportData{
			Type: meta.Type,
			Data: result.Result,
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
	err = indexExportData(reqBody)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteAckOKJSON(w)
}

func indexExportData(eds []ExportData) error {
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
			if err != nil {
				return err
			}
			err = orm.Save(nil, obj)
			if err != nil {
				return err
			}
		}

	}
	return nil
}

func getExportData(typ string) (*orm.Result, error) {
	var obj interface{}
	switch typ {
	case DataTypeAlertChannel:
		obj = alerting.Channel{}
	case DataTypeAlertRule:
		obj = alerting.Rule{}
	case DataTypeAlertEmailServer:
		obj = model.EmailServer{}
	default:
		return nil, fmt.Errorf("unkonw data type: %s", typ)
	}
	err, result := orm.Search(obj, &orm.Query{
		Size: 1000,
	})
	if err != nil {
		return nil, err
	}
	return &result, err
}