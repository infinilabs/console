/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package gateway

import (
	"fmt"
	"infini.sh/console/model/gateway"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

func fetchInstanceGroup(instanceID string) (string, error){
	// fetch gateway instance group
	q := orm.Query{}
	q.RawQuery = []byte(fmt.Sprintf(`{"size": 1, "query":{"term":{"instance_id":{"value":"%s"}}}}`, instanceID))
	err, res := orm.Search(&gateway.InstanceGroup{}, &q)
	if err != nil {
		return "", err
	}
	if len(res.Result) > 0 {
		if rowMap, ok := res.Result[0].(map[string]interface{}); ok {
			return rowMap["group_id"].(string), nil
		}
	}
	return "", nil
}

func fetchInstanceGroupByID(instanceIDs []interface{})([]interface{}, error){
	if len(instanceIDs) == 0 {
		return nil, nil
	}
	// fetch gateway instance groups
	esQuery := util.MapStr{
		"query": util.MapStr{
			"terms": util.MapStr{
				"instance_id": instanceIDs,
			},
		},
	}
	q := orm.Query{}
	q.RawQuery = util.MustToJSONBytes(esQuery)
	err, res := orm.Search(&gateway.InstanceGroup{}, &q)
	return res.Result, err
}
func fetchGroupByID(groupIDs []interface{})([]interface{}, error){
	if len(groupIDs) == 0 {
		return nil, nil
	}
	// fetch gateway groups
	esQuery := util.MapStr{
		"query": util.MapStr{
			"terms": util.MapStr{
				"_id": groupIDs,
			},
		},
	}
	q := orm.Query{}
	q.RawQuery = util.MustToJSONBytes(esQuery)
	err, res := orm.Search(&gateway.Group{}, &q)
	return res.Result, err
}

func pickElasticsearchColumnValues(result []interface{}, columnName string) []interface{}{
	if len(result) == 0 {
		return nil
	}
	columnValues := make([]interface{}, 0, len(result))
	for _, row := range result {
		if rowMap, ok := row.(map[string]interface{}); ok {
			columnValues = append(columnValues, rowMap[columnName])
		}
	}
	return columnValues
}

func getRelationshipMap(result []interface{}, key string, value string) map[string]interface{}{
	if len(result) == 0 {
		return nil
	}
	resultMap := map[string]interface{}{}
	for _, row := range result {
		if rowMap, ok := row.(map[string]interface{}); ok {
			resultMap[rowMap[key].(string)] = rowMap[value]
		}
	}
	return resultMap
}

