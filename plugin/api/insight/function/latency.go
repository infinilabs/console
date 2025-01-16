/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package function

import (
	"fmt"
	"infini.sh/framework/core/util"
)

// Latency represents a function that calculates latency as a ratio of two metrics.
// Divisor: The denominator in the latency calculation.
// Dividend: The numerator in the latency calculation.
type Latency struct {
	Divisor  string `json:"divisor"`
	Dividend string `json:"dividend"`
}

// GenerateAggregation implements the `Function` interface and generates an aggregation for the `latency` function.
func (p *Latency) GenerateAggregation(metricName string) (map[string]interface{}, error) {
	if p.Dividend == "" || p.Divisor == "" {
		return nil, fmt.Errorf("empty divisor or dividend for agg func: latency")
	}

	var (
		divisorAggID      = util.GetUUID()
		dividendAggID     = util.GetUUID()
		divisorBaseAggID  = util.GetUUID()
		dividendBaseAggID = util.GetUUID()
	)
	return util.MapStr{
		dividendBaseAggID: util.MapStr{
			"max": util.MapStr{
				"field": p.Dividend,
			},
		},
		dividendAggID: util.MapStr{
			"derivative": util.MapStr{
				"buckets_path": dividendBaseAggID,
			},
		},
		divisorBaseAggID: util.MapStr{
			"max": util.MapStr{
				"field": p.Divisor,
			},
		},
		divisorAggID: util.MapStr{
			"derivative": util.MapStr{
				"buckets_path": divisorBaseAggID,
			},
		},
		metricName: util.MapStr{
			"bucket_script": util.MapStr{
				"buckets_path": util.MapStr{
					"dividend": dividendAggID,
					"divisor":  divisorAggID,
				},
				"script": "params.dividend / params.divisor",
			},
		},
	}, nil
}
