/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package insight


type SeriesItem struct {
	Type   string `json:"type"`
	Options map[string]interface{} `json:"options"`
	Metric Metric `json:"metric"`
}