/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

type FilterQuery struct {
	Field string `json:"field,omitempty"`
	Operator string `json:"operator,omitempty"`
	Values []string `json:"values,omitempty"`
	And []FilterQuery `json:"and,omitempty"`
	Or []FilterQuery `json:"or,omitempty"`
	Not []FilterQuery `json:"not,omitempty"`
}
