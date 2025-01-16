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
