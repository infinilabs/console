/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package insight

import "time"

type Visualization struct {
	ID      string    `json:"id,omitempty"      elastic_meta:"_id" elastic_mapping:"id: { type: keyword }"`
	Created *time.Time `json:"created,omitempty" elastic_mapping:"created: { type: date }"`
	Updated *time.Time `json:"updated,omitempty" elastic_mapping:"updated: { type: date }"`
	Title        string `json:"title,omitempty" elastic_mapping:"title: { type: keyword }"`
	IndexPattern string `json:"index_pattern,omitempty" elastic_mapping:"index_pattern: { type: keyword }"`
	ClusterId    string `json:"cluster_id,omitempty" elastic_mapping:"cluster_id: { type: keyword }"`
	Series []SeriesItem `json:"series"  elastic_mapping:"series: { type: object }"`
	Position *Position `json:"position,omitempty" elastic_mapping:"position: { type: object }"`
	Description string `json:"description,omitempty" elastic_mapping:"description: { type: keyword }"`
}

type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
	H int `json:"h"`
	W int `json:"w"`
}
