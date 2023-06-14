/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"fmt"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
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