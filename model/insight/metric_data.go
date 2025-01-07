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
	"infini.sh/framework/core/util"
	"regexp"
)

type Metric struct {
	AggTypes  []string `json:"agg_types,omitempty"`
	IndexPattern string `json:"index_pattern,omitempty"`
	TimeField    string `json:"time_field,omitempty"`
	BucketSize   string `json:"bucket_size,omitempty"`
	Filter interface{}      `json:"filter,omitempty"`
	Groups []MetricGroupItem `json:"groups,omitempty"` //bucket group
	Sort []GroupSort `json:"sort,omitempty"`
	ClusterId string   `json:"cluster_id,omitempty"`
	Formula string `json:"formula,omitempty"`
	//array of formula for new version
	Formulas []string `json:"formulas,omitempty"`
	Items []MetricItem `json:"items"`
	FormatType string `json:"format,omitempty"`
	TimeFilter interface{} `json:"time_filter,omitempty"`
	TimeBeforeGroup bool `json:"time_before_group,omitempty"`
	BucketLabel *BucketLabel `json:"bucket_label,omitempty"`
	// number of buckets to return, used for aggregation auto_date_histogram when bucket size equals 'auto'
	Buckets uint `json:"buckets,omitempty"`
	Unit string `json:"unit,omitempty"`
}

type GroupSort struct {
	Key string `json:"key"`
	Direction string `json:"direction"`
}

type MetricGroupItem struct {
	Field string `json:"field"`
	Limit int `json:"limit"`
}

func (m *Metric) GenerateExpression() (string, error){
	if len(m.Items) == 1 {
		return fmt.Sprintf("%s(%s)", m.Items[0].Statistic, m.Items[0].Field), nil
	}
	if m.Formula == "" {
		return "", fmt.Errorf("formula should not be empty since there are %d metrics", len(m.Items))
	}
	var (
		expressionBytes = []byte(m.Formula)
		metricExpression string
	)
	for _, item := range m.Items {
		metricExpression = fmt.Sprintf("%s(%s)", item.Statistic, item.Field)
		reg, err := regexp.Compile(item.Name+`([^\w]|$)`)
		if err != nil {
			return "", err
		}
		expressionBytes = reg.ReplaceAll(expressionBytes, []byte(metricExpression+"$1"))
	}

	return string(expressionBytes), nil
}
func (m *Metric) AutoTimeBeforeGroup() bool {
	for _, item := range m.Items {
		if item.Statistic == "derivative" {
			return false
		}
	}
	return true
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
		if !util.StringInArray([]string{"desc", "asc"}, sortItem.Direction){
			return fmt.Errorf("unknown sort direction [%s]", sortItem.Direction)
		}
		if _, ok := mm[sortItem.Key]; !ok && !util.StringInArray([]string{"_key", "_count"}, sortItem.Key){
			return fmt.Errorf("unknown sort key [%s]", sortItem.Key)
		}
	}
	return nil
}

type MetricItem struct {
	Name string `json:"name,omitempty"`
	Field     string   `json:"field"`
	FieldType string   `json:"field_type,omitempty"`
	Statistic      string `json:"statistic,omitempty"`
}

type MetricDataItem struct {
	Timestamp interface{}  `json:"timestamp,omitempty"`
	Value     interface{}    `json:"value"`
	Groups []string `json:"groups,omitempty"`
	GroupLabel string `json:"group_label,omitempty"`
}

type MetricData struct {
	Groups []string `json:"groups,omitempty"`
	Data map[string][]MetricDataItem
	GroupLabel string `json:"group_label,omitempty"`
}

type BucketLabel struct {
	Enabled bool `json:"enabled"`
	Template string `json:"template,omitempty"`
}
