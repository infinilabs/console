/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package function

import (
	"fmt"
	"infini.sh/framework/core/util"
)

// SumFuncValueInGroup represents a function to calculate a sum of values in a grouped aggregation.
// It combines a `Rate` calculation with a grouping operation and a specified aggregation function within each group.
// The group defines the field to group by, the aggregation function to apply, and the maximum number of groups to include.
type SumFuncValueInGroup struct {
	Rate // Embeds the Rate struct for rate-specific fields like `Field` and `Scale`.
	Group struct {
		Field string `json:"field"` // The field used for grouping.
		Func  string `json:"func"`  // The aggregation function to apply within each group (e.g., max, min, sum).
		Size  uint   `json:"size"`  // The maximum number of groups to return.
	} `json:"group"`
}

// GenerateAggregation implements the `Function` interface and generates an aggregation for the `sum_func_value_in_group` function.
func (p *SumFuncValueInGroup) GenerateAggregation(metricName string) (map[string]interface{}, error) {
	if p.Group.Field == "" {
		return nil, fmt.Errorf("empty group field for agg func: sum_func_value_in_group")
	}
	// Set a default aggregation function if none is specified.
	if p.Group.Func == "" {
		p.Group.Func = "max"
	}
	// Set a default size for the group if none is specified.
	if p.Group.Size == 0 {
		p.Group.Size = 65536 // Default to a large size to include most groups.
	}
	aggID := util.GetUUID()
	return util.MapStr{
		"sum_group": util.MapStr{
			"aggs": util.MapStr{
				aggID: util.MapStr{
					p.Group.Func: util.MapStr{
						"field": p.Field,
					},
				},
			},
			"terms": util.MapStr{
				"field": p.Group.Field,
				"size":  p.Group.Size,
			},
		},
		metricName: util.MapStr{
			"sum_bucket": util.MapStr{
				"buckets_path": fmt.Sprintf("sum_group>%s", aggID),
			},
		},
	}, nil
}
