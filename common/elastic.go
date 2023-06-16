/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"bytes"
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"sync"
	"text/template"
	"time"
)

//GetClusterNames query cluster names by cluster ids
func GetClusterNames(clusterIds []string) (map[string]string, error){
	if len(clusterIds) == 0 {
		return nil, fmt.Errorf("cluster ids must not be empty")
	}
	rq := util.MapStr{
		"size": len(clusterIds),
		"query": util.MapStr{
			"terms": util.MapStr{
				"id": clusterIds,
			},
		},
	}
	idToNames := map[string]string{}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(rq),
	}
	err, result := orm.Search(elastic.ElasticsearchConfig{}, &q)
	if err != nil {
		return nil, err
	}
	for _, row := range result.Result {
		if rowM, ok := row.(map[string]interface{}); ok {
			if id, ok := rowM["id"].(string); ok {
				if name, ok := rowM["name"].(string); ok {
					idToNames[id] = name
				}
			}
		}
	}

	return idToNames, nil
}

//GetNodeNames query node names by node ids
func GetNodeNames(nodeIDs []string) (map[string]string, error){
	if len(nodeIDs) == 0 {
		return nil, fmt.Errorf("node ids must not be empty")
	}
	rq := util.MapStr{
		"size": 500,
		"query": util.MapStr{
			"terms": util.MapStr{
				"metadata.node_id": nodeIDs,
			},
		},
	}
	idToNames := map[string]string{}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(rq),
	}
	err, result := orm.Search(elastic.NodeConfig{}, &q)
	if err != nil {
		return nil, err
	}
	for _, row := range result.Result {
		if rowM, ok := row.(map[string]interface{}); ok {
			id := GetMapStringValue(rowM, "metadata.node_id")
			name := GetMapStringValue(rowM, "metadata.node_name")
			if id != "" {
				idToNames[id] = name
			}
		}
	}

	return idToNames, nil
}

func GetMapStringValue(m util.MapStr, key string) string {
	v, err := m.GetValue(key)
	if err != nil {
		return ""
	}
	return util.ToString(v)
}

func MapLabel(labelName, indexName, indexKeyField, indexValueField string, client elastic.API) string {
	labelMaps, err := getOrInitLabelCache(indexName, indexKeyField, indexValueField, client)
	if err != nil {
		log.Error(err)
		return ""
	}
	return labelMaps[labelName]
}

var labelCache = sync.Map{}
type LabelCacheItem struct {
	KeyValues map[string]string
	Timestamp time.Time
}
func getOrInitLabelCache(indexName, indexKeyField, indexValueField string, client elastic.API) (map[string]string, error){
	cacheKey := fmt.Sprintf("%s_%s_%s", indexName, indexKeyField, indexValueField )
	var (
		labelMaps = map[string]string{}
		err error
	)
	if v, ok := labelCache.Load(cacheKey); ok {
		if cacheItem, ok :=  v.(*LabelCacheItem); ok {
			if cacheItem.Timestamp.Add(time.Minute).After(time.Now()){
				return cacheItem.KeyValues, nil
			}
			//cache expired
		}
	}
	labelMaps, err  = getLabelMaps(indexName, indexKeyField, indexValueField, client)
	if err != nil {
		return labelMaps, err
	}
	labelCache.Store(cacheKey, &LabelCacheItem{
		KeyValues: labelMaps,
		Timestamp: time.Now(),
	})
	return labelMaps, nil
}

func getLabelMaps( indexName, indexKeyField, indexValueField string, client elastic.API) (map[string]string, error){
	if client == nil {
		return nil, fmt.Errorf("cluster client must not be empty")
	}
	query := util.MapStr{
		"size": 1000,
		"collapse": util.MapStr{
			"field": indexKeyField,
		},
		"_source": []string{indexKeyField, indexValueField},
	}
	queryDsl := util.MustToJSONBytes(query)
	searchRes, err := client.SearchWithRawQueryDSL(indexName, queryDsl)
	if err != nil {
		return nil, err
	}
	labelMaps := map[string]string{}
	for _, hit := range searchRes.Hits.Hits {
		sourceM := util.MapStr(hit.Source)
		v := GetMapStringValue(sourceM, indexValueField)
		var key string
		if indexKeyField == "_id" {
			key = hit.ID
		}else{
			key = GetMapStringValue(sourceM, indexKeyField)
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
