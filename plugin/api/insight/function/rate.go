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
