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
	"bytes"
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"text/template"
)

func GetMapStringValue(m util.MapStr, key string) string {
	v, err := m.GetValue(key)
	if err != nil {
		return ""
	}
	return util.ToString(v)
}

func MapLabel(labelName, indexName, keyField, valueField string, client elastic.API, cacheLabels map[string]string) string {
	if len(cacheLabels) > 0 {
		if v, ok := cacheLabels[labelName]; ok{
			return v
		}
	}
	labelMaps, err := GetLabelMaps(indexName, keyField, valueField, client, []string{labelName}, 1)
	if err != nil {
		log.Error(err)
		return ""
	}
	return labelMaps[labelName]
}

func GetLabelMaps( indexName, keyField, valueField string, client elastic.API, keyFieldValues []string, cacheSize int) (map[string]string, error){
	if client == nil {
		return nil, fmt.Errorf("cluster client must not be empty")
	}
	query := util.MapStr{
		"size": cacheSize,
		"collapse": util.MapStr{
			"field": keyField,
		},
		"_source": []string{keyField, valueField},
	}
	if len(keyFieldValues) > 0 {
		query["query"] = util.MapStr{
			"terms": util.MapStr{
				keyField: keyFieldValues,
			},
		}
		query["size"] = len(keyFieldValues)
	}
	queryDsl := util.MustToJSONBytes(query)
	searchRes, err := client.SearchWithRawQueryDSL(indexName, queryDsl)
	if err != nil {
		return nil, err
	}
	labelMaps := map[string]string{}
	for _, hit := range searchRes.Hits.Hits {
		sourceM := util.MapStr(hit.Source)
		v := GetMapStringValue(sourceM, valueField)
		var key string
		if keyField == "_id" {
			key = hit.ID
		}else{
			key = GetMapStringValue(sourceM, keyField)
		}
		if key != "" {
			labelMaps[key] = v
		}
	}
	return labelMaps, nil
}

func ExecuteTemplate( tpl *template.Template, ctx map[string]interface{}) ([]byte, error){
	msgBuffer := &bytes.Buffer{}
	err := tpl.Execute(msgBuffer, ctx)
	return msgBuffer.Bytes(), err
}
