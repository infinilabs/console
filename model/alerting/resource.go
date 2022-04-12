/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

type Resource struct {
	ID string `json:"id"`
	Type string `json:"type"`
	Objects []string `json:"objects" elastic_mapping:"objects:{type:keyword,copy_to:search_text}"`
	Filter Filter `json:"filter,omitempty" elastic_mapping:"-"`
	RawFilter map[string]interface{} `json:"raw_filter,omitempty"`
	TimeField string `json:"time_field,omitempty"`
	Context Context `json:"context"`
}
