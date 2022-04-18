/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"time"
)

type Rule struct {
	ID      string    `json:"id,omitempty"      elastic_meta:"_id" elastic_mapping:"id: { type: keyword }"`
	Created time.Time `json:"created,omitempty" elastic_mapping:"created: { type: date }"`
	Updated time.Time `json:"updated,omitempty" elastic_mapping:"updated: { type: date }"`
	//Name string `json:"name" elastic_mapping:"name:{type:keyword,copy_to:search_text}"`
	Enabled bool `json:"enabled" elastic_mapping:"enabled:{type:keyword}"`
	Resource Resource `json:"resource" elastic_mapping:"resource:{type:object}"`
	Metrics Metric `json:"metrics" elastic_mapping:"metrics:{type:object}"`
	Conditions       Condition   `json:"conditions" elastic_mapping:"conditions:{type:object}"`
	Channels     RuleChannel `json:"channels" elastic_mapping:"channels:{type:object}"`
	Schedule Schedule `json:"schedule" elastic_mapping:"schedule:{type:object}"`
	LastNotificationTime time.Time `json:"-" elastic_mapping:"last_notification_time:{type:date}"`
	LastTermStartTime time.Time `json:"-"` //标识最近一轮告警的开始时间
	LastEscalationTime time.Time `json:"-"` //标识最近一轮告警的开始时间
	SearchText string `json:"-" elastic_mapping:"search_text:{type:text,index_prefixes:{},index_phrases:true, analyzer:suggest_text_search }"`
}

type RuleChannel struct {
	Normal []Channel      `json:"normal"`
	Escalation []Channel  `json:"escalation"`
	ThrottlePeriod string `json:"throttle_period"` //沉默周期
	AcceptTimeRange TimeRange   `json:"accept_time_range"`
	EscalationThrottlePeriod string `json:"escalation_throttle_period"`
	EscalationEnabled bool `json:"escalation_enabled"`
}

type MessageTemplate struct{
	Type string `json:"type"`
	Source string `json:"source"`
}

type TimeRange struct {
	Start string `json:"start"`
	End string `json:"end"`
}

func (tr *TimeRange) Include( t time.Time) bool {
	currentTimeStr := t.Format("15:04")
	return tr.Start <= currentTimeStr && currentTimeStr <= tr.End
}
