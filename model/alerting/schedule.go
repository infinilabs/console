/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

type Schedule struct {
	Cron *Cron `json:"cron,omitempty" elastic_mapping:"cron:{type:object}"`
	Interval string `json:"interval,omitempty" elastic_mapping:"interval:{type:keyword}"`
}

type Cron struct {
	Expression string `json:"expression" elastic_mapping:"expression:{type:text}"`
	Timezone string `json:"timezone" elastic_mapping:"timezone:{type:keyword}"`
}



