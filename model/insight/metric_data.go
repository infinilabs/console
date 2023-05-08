/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package insight

import (
	"fmt"
	"regexp"
)

type Metric struct {
	AggTypes  []string `json:"agg_types,omitempty"`
	IndexPattern string `json:"index_pattern,omitempty"`
	TimeField    string `json:"time_field,omitempty"`
	BucketSize   string `json:"bucket_size,omitempty"`
	Filter interface{}      `json:"filter,omitempty"`
	Groups []MetricGroupItem `json:"groups,omitempty"` //bucket group
	ClusterId string   `json:"cluster_id,omitempty"`
	Formula string `json:"formula,omitempty"`
	Items []MetricItem `json:"items"`
	FormatType string `json:"format_type,omitempty"`
	TimeFilter interface{} `json:"time_filter,omitempty"`
	TimeBeforeGroup bool `json:"time_before_group,omitempty"`
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

type MetricItem struct {
	Name string `json:"name,omitempty"`
	Field     string   `json:"field"`
	FieldType string   `json:"field_type,omitempty"`
	Statistic      string `json:"statistic,omitempty"`
}

type MetricDataItem struct {
	Timestamp interface{}  `json:"timestamp,omitempty"`
	Value     interface{}    `json:"value"`
	Group     string `json:"group,omitempty"`
}

type MetricData struct {
	Group     string `json:"group,omitempty"`
	Data map[string][]MetricDataItem
}

