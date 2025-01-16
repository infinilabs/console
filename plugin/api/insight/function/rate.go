/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package function

import (
	"fmt"
	"infini.sh/framework/core/util"
)

// Base represents a common structure for functions that operate on a specific field.
// Field: The name of the field to be aggregated.
type Base struct {
	Field string `json:"field"` // The field on which the aggregation operates.
}

// Rate extends the Base structure to include scaling for rate calculations.
// Scale: A multiplier applied to the rate calculation for normalization.
type Rate struct {
	Base
	Scale uint `json:"scale"` // The scaling factor used in the rate calculation.
}

// GenerateAggregation implements the `Function` interface and generates an aggregation for the `rate` function.
func (p *Rate) GenerateAggregation(metricName string) (map[string]interface{}, error) {
	if p.Field == "" {
		return nil, fmt.Errorf("empty field for agg func: rate")
	}
	if p.Scale == 0 {
		p.Scale = 1
	}
	var (
		aggID           = util.GetUUID()
		derivativeAggID = util.GetUUID()
	)
	return util.MapStr{
		aggID: util.MapStr{
			"max": util.MapStr{
				"field": p.Field,
			},
		},
		derivativeAggID: util.MapStr{
			"derivative": util.MapStr{
				"buckets_path": aggID,
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
