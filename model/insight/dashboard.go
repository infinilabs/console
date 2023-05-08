/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package insight

import "time"

type Dashboard struct {
	ID      string    `json:"id,omitempty"      elastic_meta:"_id" elastic_mapping:"id: { type: keyword }"`
	Created time.Time `json:"created,omitempty" elastic_mapping:"created: { type: date }"`
	Updated time.Time `json:"updated,omitempty" elastic_mapping:"updated: { type: date }"`
	ClusterId    string `json:"cluster_id" elastic_mapping:"cluster_id: { type: keyword }"`
	IndexPattern string `json:"index_pattern" elastic_mapping:"index_pattern: { type: keyword }"`
	TimeField    string `json:"time_field,omitempty" elastic_mapping:"time_field: { type: keyword }"`
	Filter      interface{} `json:"filter,omitempty" elastic_mapping:"filter: { type: object, enabled:false }"`
	BucketSize     string   `json:"bucket_size" elastic_mapping:"bucket_size: { type: keyword }"`
	Title          string   `json:"title"  elastic_mapping:"title: { type: keyword }"`
	Description    string   `json:"description" elastic_mapping:"description: { type: keyword }"`
	Visualizations interface{} `json:"visualizations"  elastic_mapping:"visualizations: { type: object, enabled:false }"`
	Tags []string `json:"tags,omitempty" elastic_mapping:"tags: { type: keyword }"`
	User string `json:"user" elastic_mapping:"user: { type: keyword }"`
	Query interface{} `json:"query,omitempty" elastic_mapping:"query: { type: object, enabled:false }"`
	TimeFilter interface{} `json:"time_filter,omitempty" elastic_mapping:"time_filter: { type: object, enabled:false }"`
}
