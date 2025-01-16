/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package function

import (
	"fmt"
	"infini.sh/framework/core/util"
)

// LatencySumFuncValueInGroup represents a function that calculates the latency as a sum of values in a grouped aggregation.
// It combines a `Latency` calculation with a grouping operation and applies a specified aggregation function within each group.
// The group defines the field to group by, the aggregation function to apply, and the maximum number of groups to include.
type LatencySumFuncValueInGroup struct {
	Latency // Embeds the Latency struct for fields `Divisor` and `Dividend`.
	Group struct {
		Field string `json:"field"` // The field used for grouping.
		Func  string `json:"func"`  // The aggregation function to apply within each group (e.g., max, min, sum).
		Size  uint   `json:"size"`  // The maximum number of groups to return.
	} `json:"group"`
}

// GenerateAggregation implements the `Function` interface and generates an aggregation for the `latency_sum_func_value_in_group` function.
func (p *LatencySumFuncValueInGroup) GenerateAggregation(metricName string) (map[string]interface{}, error) {
	// Validate that the divisor and dividend are not empty.
	if p.Dividend == "" || p.Divisor == "" {
		return nil, fmt.Errorf("empty divisor or dividend for agg func: latency")
	}

	// Validate that the group field is not empty.
	if p.Group.Field == "" {
		return nil, fmt.Errorf("empty group field for agg func: latency_sum_func_value_in_group")
	}

	// Set default function to `max` if no function is provided.
	if p.Group.Func == "" {
		p.Group.Func = "max"
	}

	// Set default size for the group if none is provided.
	if p.Group.Size == 0 {
		p.Group.Size = 65536 // Default to a large size to include most groups.
	}
	var (
		divisorBaseAggID        = util.GetUUID()
		dividendBaseAggID       = util.GetUUID()
		sumDivisorAggID         = util.GetUUID()
		sumDividendAggID        = util.GetUUID()
		derivativeDivisorAggID  = util.GetUUID()
		derivativeDividendAggID = util.GetUUID()
	)
	return util.MapStr{
		"sum_group": util.MapStr{
			"aggs": util.MapStr{
				divisorBaseAggID: util.MapStr{
					p.Group.Func: util.MapStr{
						"field": p.Divisor,
					},
				},
				dividendBaseAggID: util.MapStr{
					p.Group.Func: util.MapStr{
						"field": p.Dividend,
					},
				},
			},
			"terms": util.MapStr{
				"field": p.Group.Field,
				"size":  p.Group.Size,
			},
		},
		sumDivisorAggID: util.MapStr{
			"sum_bucket": util.MapStr{
				"buckets_path": fmt.Sprintf("sum_group>%s", divisorBaseAggID),
			},
		},
		sumDividendAggID: util.MapStr{
			"sum_bucket": util.MapStr{
				"buckets_path": fmt.Sprintf("sum_group>%s", dividendBaseAggID),
			},
		},
		derivativeDivisorAggID: util.MapStr{
			"derivative": util.MapStr{
				"buckets_path": sumDivisorAggID,
			},
		},
		derivativeDividendAggID: util.MapStr{
			"derivative": util.MapStr{
				"buckets_path": sumDividendAggID,
			},
		},
		metricName: util.MapStr{
			"bucket_script": util.MapStr{
				"buckets_path": util.MapStr{
					"dividend": derivativeDividendAggID,
					"divisor":  derivativeDivisorAggID,
				},
				"script": "params.dividend / params.divisor",
			},
		},
	}, nil
}
