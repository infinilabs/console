/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package insight

import "infini.sh/framework/core/orm"

type Widget struct {
	orm.ORMObjectBase
	Formatter string `json:"formatter" elastic_mapping:"formatter: { type: keyword }"`
	Series [] WidgetSeriesItem `json:"series" elastic_mapping:"series: { type: object,enabled:false }"`
	Title string `json:"title" elastic_mapping:"title: { type: text }"`
}

type WidgetSeriesItem struct {
	Metric WidgetMetric `json:"metric"`
	Queries WidgetQuery  `json:"queries"`
	Type string `json:"type"`
}

type WidgetQuery struct {
	ClusterId string   `json:"cluster_id"`
	Indices   []string `json:"indices"`
	Query     string   `json:"query"`
	TimeField string   `json:"time_field"`
}
type WidgetMetric struct {
	BucketSize string `json:"bucket_size"`
	FormatType string `json:"format_type"`
	Formula    string `json:"formula"`
	Groups     []struct {
		Field string `json:"field"`
		Limit int    `json:"limit"`
	} `json:"groups"`
	Items []struct {
		Field     string `json:"field"`
		Name      string `json:"name"`
		Statistic string `json:"statistic"`
	} `json:"items"`
}
