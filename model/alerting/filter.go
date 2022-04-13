/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

type Filter struct {
	And []FilterQuery `json:"and,omitempty"`
	Or []FilterQuery `json:"or,omitempty"`
	Not []FilterQuery `json:"not,omitempty"`
	//MinimumShouldMatch int `json:"minimum_should_match"`
}
