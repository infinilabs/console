/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"fmt"
	"infini.sh/console/model/insight"
	"infini.sh/framework/modules/elastic/common"
	"regexp"
)

type Metric struct {
	insight.Metric
	Title string `json:"title,omitempty"` //text template
	Message string `json:"message,omitempty"` // text template
	Expression string `json:"expression,omitempty" elastic_mapping:"expression:{type:keyword,copy_to:search_text}"` //告警表达式，自动生成 eg: avg(cpu) > 80
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
	Name string `json:"name"`
	Field string `json:"field"`
	Statistic string `json:"statistic"`
}

type QueryResult struct {
	Query string `json:"query"`
	Raw string `json:"raw"`
	MetricData []MetricData `json:"metric_data"`
	Nodata bool `json:"nodata"`
}

type MetricData struct {
	GroupValues []string `json:"group_values"`
	Data map[string][]TimeMetricData `json:"data"`
}

type TimeMetricData []interface{}

type AlertMetricItem struct {
	common.MetricItem
	BucketGroups [][]string `json:"bucket_groups,omitempty"`
}
