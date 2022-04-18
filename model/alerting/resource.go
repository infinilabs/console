/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"fmt"
)

type Resource struct {
	ID string `json:"resource_id" elastic_mapping:"resource_id:{type:keyword}"`
	Name string `json:"resource_name" elastic_mapping:"resource_name:{type:keyword}"`
	Type string `json:"type" elastic_mapping:"type:{type:keyword}"`
	Objects []string `json:"objects" elastic_mapping:"objects:{type:keyword,copy_to:search_text}"`
	Filter FilterQuery `json:"filter,omitempty" elastic_mapping:"-"`
	RawFilter map[string]interface{} `json:"raw_filter,omitempty"`
	TimeField string `json:"time_field,omitempty" elastic_mapping:"id:{type:keyword}"`
	Context Context `json:"context"`
}

func (r Resource) Validate() error{
	if r.TimeField == "" {
		return fmt.Errorf("TimeField can not be empty")
	}
	return nil
}

