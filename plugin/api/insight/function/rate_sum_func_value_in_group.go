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

package function

import (
	"fmt"
	"infini.sh/framework/core/util"
)

// RateSumFuncValueInGroup represents a function that calculates the rate as a sum of values in a grouped aggregation.
// It combines a `Rate` calculation with a grouping operation and applies a specified aggregation function within each group.
// The group defines the field to group by, the aggregation function to apply, and the maximum number of groups to include.
type RateSumFuncValueInGroup struct {
	Rate  // Embeds the Rate struct for fields `Field` and `Scale`.
	Group struct {
		Field string `json:"field"` // The field used for grouping.
		Func  string `json:"func"`  // The aggregation function to apply within each group (e.g., max, min, sum).
		Size  uint   `json:"size"`  // The maximum number of groups to return.
	} `json:"group"`
}

// GenerateAggregation implements the `Function` interface and generates an aggregation for the `rate_sum_func_value_in_group` function.
// This function constructs an aggregation pipeline that computes the sum of values for a given field within groups, calculates the derivative,
// and then applies a bucket script to scale the resulting value by a provided `scale` factor.
func (p *RateSumFuncValueInGroup) GenerateAggregation(metricName string) (map[string]interface{}, error) {
	// Validate that the field is provided for the aggregation.
	if p.Field == "" {
		return nil, fmt.Errorf("empty field for agg func: rate_sum_func_value_in_group")
	}

	// Set default scale factor to 1 if not specified.
	if p.Scale == 0 {
		p.Scale = 1
	}

	// Validate that the group field is provided.
	if p.Group.Field == "" {
		return nil, fmt.Errorf("empty group field for agg func: rate_sum_func_value_in_group")
	}

	// Set default function to `max` if no function is specified for grouping.
	if p.Group.Func == "" {
		p.Group.Func = "max"
	}

	// Set default size for the group if none is specified.
	if p.Group.Size == 0 {
		p.Group.Size = 65536 // Default to a large size to include most groups.
	}
	var (
		aggID           = util.GetUUID()
		sumBucketAggID  = util.GetUUID()
		derivativeAggID = util.GetUUID()
	)
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
		sumBucketAggID: util.MapStr{
			"sum_bucket": util.MapStr{
				"buckets_path": fmt.Sprintf("sum_group>%s", aggID),
			},
		},
		derivativeAggID: util.MapStr{
			"derivative": util.MapStr{
				"buckets_path": sumBucketAggID,
			},
		},
		metricName: util.MapStr{
			"bucket_script": util.MapStr{
				"buckets_path": util.MapStr{
					"value": derivativeAggID,
				},
				"script": util.MapStr{
					"source": "params.value * params.scale",
					"params": util.MapStr{
						"scale": p.Scale,
					},
				},
			},
		},
	}, nil
}
