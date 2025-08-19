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
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package insight

import (
	"infini.sh/framework/core/util"
)

type DerivedAggregation interface {
	// GetName returns the name of the derived aggregation.
	GetName() string
	// Calculate performs the aggregation calculation.
	// It takes a Metric and a search result map, and appends the results to the
	// provided metricData slice.
	// Returns an error if the calculation fails.
	Calculate(metric *Metric, searchResult map[string]interface{}, metricData *[]MetricData) error
}

// DerivedAggregationRegistry is a map that holds registered derived aggregations.
var derivedAggregationRegistry = map[string]DerivedAggregation{}

// RegisterDerivedAggregation registers a new derived aggregation in the registry.
// If an aggregation with the same name already exists, it panics.
// This is to ensure that each derived aggregation has a unique name.
// It is recommended to call this function during the initialization phase of the application.
// This function should be called only once for each derived aggregation.
func RegisterDerivedAggregation(aggregation DerivedAggregation) {
	name := aggregation.GetName()
	if _, exists := derivedAggregationRegistry[name]; exists {
		panic("Derived aggregation with name " + name + " already exists")
	}
	derivedAggregationRegistry[name] = aggregation
}

// GetDerivedAggregation retrieves a derived aggregation by its name.
func GetDerivedAggregation(name string) (DerivedAggregation, bool) {
	aggregation, exists := derivedAggregationRegistry[name]
	if !exists {
		return nil, false
	}
	return aggregation, true
}

func init() {
	// Register the PercentageAggregation as a derived aggregation.
	RegisterDerivedAggregation(&PercentageAggregation{name: AggFuncPercentage})
}

type PercentageAggregation struct {
	// Name of the aggregation.
	name string
}

func (p *PercentageAggregation) GetName() string {
	return p.name
}

// Calculate implements the PercentageAggregation calculation.
// It calculates the percentage of each item in the metric data based on the total document count.
// It updates the metric data with the calculated percentage values.
// The calculation is based on the document count of each item relative to the total document count.
// If the metric has a time field and is grouped by time, it uses the document count of the parent time bucket as the total document count.
// The percentage is calculated as (item's doc_count / total_doc_count) * 100.
// The result is stored in the Value field of each MetricDataItem in the metric data.
// The percentage is rounded to two decimal places.
// It returns an error if the calculation fails.
func (p *PercentageAggregation) Calculate(metric *Metric, searchResult map[string]interface{}, metricData *[]MetricData) error {
	var totalDocs float64
	var agg = searchResult["aggregations"]
	if metric.Filter != nil {
		if aggM, ok := agg.(map[string]interface{}); ok {
			agg = aggM["filter_agg"]
			tv, _ := util.MapStr(aggM).GetValue("filter_agg.doc_count")
			if v, ok := tv.(float64); ok {
				totalDocs = v
			}
		}
	} else {
		tv, _ := util.MapStr(searchResult).GetValue("hits.total.value")
		if v, ok := tv.(float64); ok {
			totalDocs = v
		}
	}
	timeBeforeGroup := metric.AutoTimeBeforeGroup()
	for _, md := range *metricData {
		totalDocCount := uint32(totalDocs)
		if len(md.Groups) > 1 {
			totalDocCount = md.Groups[len(md.Groups)-2].DocCount
		}

		for _, mi := range metric.Items {
			if mi.Statistic == p.name {
				if items, ok := md.Data[mi.Name]; ok {
					for i := range items {
						// calculate and assign percentage to value of each item
						// if timeBeforeGroup and time field is not empty, we use TimeBucketDocCount as parent bucket doc count
						if timeBeforeGroup && metric.TimeField != "" && len(md.Groups) == 1 {
							totalDocCount = items[i].TimeBucketDocCount
						}
						percentage := float64(items[i].DocCount) / float64(totalDocCount)
						items[i].Value = util.ToFixed(percentage, 2)
					}
				}
			}
		}
	}
	return nil
}
