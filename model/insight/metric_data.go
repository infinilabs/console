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
	"fmt"
	"regexp"

	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

const (
	AggFuncCount                      = "count"
	AggFuncAvg                        = "avg"
	AggFuncSum                        = "sum"
	AggFuncMin                        = "min"
	AggFuncMax                        = "max"
	AggFuncMedium                     = "medium"
	AggFuncValueCount                 = "value_count"
	AggFuncCardinality                = "cardinality"
	AggFuncDerivative                 = "derivative"
	AggFuncRate                       = "rate"
	AggFuncPercent99                  = "p99"
	AggFuncPercent95                  = "p95"
	AggFuncPercent90                  = "p90"
	AggFuncPercent80                  = "p80"
	AggFuncPercent50                  = "p50"
	AggFuncLatest                     = "latest"
	AggFuncLatency                    = "latency"
	AggFuncSumFuncValueInGroup        = "sum_func_value_in_group"
	AggFuncRateSumFuncValueInGroup    = "rate_sum_func_value_in_group"
	AggFuncLatencySumFuncValueInGroup = "latency_sum_func_value_in_group"
)

type Metric struct {
	AggTypes     []string          `json:"agg_types,omitempty"`
	IndexPattern string            `json:"index_pattern,omitempty"`
	TimeField    string            `json:"time_field,omitempty"`
	BucketSize   string            `json:"bucket_size,omitempty"`
	Filter       interface{}       `json:"filter,omitempty"`
	Groups       []MetricGroupItem `json:"groups,omitempty"` //bucket group
	Sort         []GroupSort       `json:"sort,omitempty"`
	ClusterId    string            `json:"cluster_id,omitempty"`
	Formula      string            `json:"formula,omitempty"`
	//array of formula for new version
	Formulas        []string     `json:"formulas,omitempty"`
	Items           []MetricItem `json:"items"`
	FormatType      string       `json:"format,omitempty"`
	TimeFilter      interface{}  `json:"time_filter,omitempty"`
	TimeBeforeGroup bool         `json:"time_before_group,omitempty"`
	BucketLabel     *BucketLabel `json:"bucket_label,omitempty"`
	// number of buckets to return, used for aggregation auto_date_histogram when bucket size equals 'auto'
	Buckets uint   `json:"buckets,omitempty"`
	Unit    string `json:"unit,omitempty"`
}

type MetricBase struct {
	orm.ORMObjectBase
	//display name of the metric
	Name string `json:"name"`
	//metric identifier
	Key string `json:"key"`
	//optional values : "node", "indices", "shard"
	Level string `json:"level"`
	//metric calculation formula
	Formula    string       `json:"formula,omitempty"`
	Items      []MetricItem `json:"items"`
	FormatType string       `json:"format,omitempty"`
	Unit       string       `json:"unit,omitempty"`
	//determine if this metric is built-in
	Builtin bool `json:"builtin"`
	//array of supported calculation statistic, eg: "avg", "sum", "min", "max"
	Statistics []string `json:"statistics,omitempty"`
}

type GroupSort struct {
	Key       string `json:"key"`
	Direction string `json:"direction"`
}

type MetricGroupItem struct {
	Field string `json:"field"`
	Limit int    `json:"limit"`
}

func (m *Metric) GenerateExpression() (string, error) {
	if len(m.Items) == 1 {
		return fmt.Sprintf("%s(%s)", m.Items[0].Statistic, m.Items[0].Field), nil
	}
	if m.Formula == "" {
		return "", fmt.Errorf("formula should not be empty since there are %d metrics", len(m.Items))
	}
	var (
		expressionBytes  = []byte(m.Formula)
		metricExpression string
	)
	for _, item := range m.Items {
		metricExpression = fmt.Sprintf("%s(%s)", item.Statistic, item.Field)
		reg, err := regexp.Compile(item.Name + `([^\w]|$)`)
		if err != nil {
			return "", err
		}
		expressionBytes = reg.ReplaceAll(expressionBytes, []byte(metricExpression+"$1"))
	}

	return string(expressionBytes), nil
}

// shouldUseAggregation checks if any item's statistic or function exists in the provided aggFuncs list.
// If a match is found, it returns true; otherwise, it returns false.
func (m *Metric) shouldUseAggregation(aggFuncs []string) bool {
	for _, item := range m.Items {
		// Default to item's Statistic field
		statistic := item.Statistic

		// If Function is defined, use its first key as the statistic
		if item.Function != nil {
			for key := range item.Function {
				statistic = key
				break
			}
		}

		// Check if statistic is in the aggregation function list
		if util.StringInArray(aggFuncs, statistic) {
			return true
		}
	}
	return false
}

// AutoTimeBeforeGroup determines if date aggregation should be applied before terms aggregation.
// Returns false if the metric uses any of the specified aggregation functions.
func (m *Metric) AutoTimeBeforeGroup() bool {
	return !m.shouldUseAggregation([]string{
		AggFuncDerivative,
		AggFuncRate,
		AggFuncLatency,
		AggFuncRateSumFuncValueInGroup,
		AggFuncLatencySumFuncValueInGroup,
	})
}

// UseBucketSort determines whether bucket sorting should be used for aggregation.
// Returns false if the metric contains specific aggregation functions that require alternative handling.
func (m *Metric) UseBucketSort() bool {
	return m.shouldUseAggregation([]string{
		AggFuncDerivative,
		AggFuncRate,
		AggFuncLatency,
		AggFuncSumFuncValueInGroup,
		AggFuncRateSumFuncValueInGroup,
		AggFuncLatencySumFuncValueInGroup,
	})
}

func (m *Metric) ValidateSortKey() error {
	if len(m.Sort) == 0 {
		return nil
	}
	if len(m.Items) == 0 {
		return nil
	}
	var mm = map[string]*MetricItem{}
	for _, item := range m.Items {
		mm[item.Name] = &item
	}
	for _, sortItem := range m.Sort {
		if !util.StringInArray([]string{"desc", "asc"}, sortItem.Direction) {
			return fmt.Errorf("unknown sort direction [%s]", sortItem.Direction)
		}
		if _, ok := mm[sortItem.Key]; !ok && !util.StringInArray([]string{"_key", "_count"}, sortItem.Key) {
			return fmt.Errorf("unknown sort key [%s]", sortItem.Key)
		}
	}
	return nil
}

type MetricItem struct {
	Name      string `json:"name,omitempty"`
	Field     string `json:"field"`
	FieldType string `json:"field_type,omitempty"`
	Statistic string `json:"statistic,omitempty"`

	//Function specifies the calculation details for the metric,
	//including the aggregation type and any associated parameters.
	Function map[string]interface{} `json:"function,omitempty"`
}

type MetricDataItem struct {
	Timestamp  interface{} `json:"timestamp,omitempty"`
	Value      interface{} `json:"value"`
	Groups     []string    `json:"groups,omitempty"`
	GroupLabel string      `json:"group_label,omitempty"`
}

type MetricData struct {
	Groups     []string `json:"groups,omitempty"`
	Data       map[string][]MetricDataItem
	GroupLabel string `json:"group_label,omitempty"`
}

type BucketLabel struct {
	Enabled  bool   `json:"enabled"`
	Template string `json:"template,omitempty"`
}
