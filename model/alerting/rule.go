/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"strings"
	"time"
)

type Rule struct {
	ID      string    `json:"id,omitempty"      elastic_meta:"_id" elastic_mapping:"id: { type: keyword }"`
	Created time.Time `json:"created,omitempty" elastic_mapping:"created: { type: date }"`
	Updated time.Time `json:"updated,omitempty" elastic_mapping:"updated: { type: date }"`
	Name string `json:"name" elastic_mapping:"name:{type:keyword,copy_to:search_text}"`
	Enabled bool `json:"enabled" elastic_mapping:"enabled:{type:keyword}"`
	Resource Resource `json:"resource" elastic_mapping:"resource:{type:object}"`
	Metrics Metric `json:"metrics" elastic_mapping:"metrics:{type:object}"`
	Conditions         Condition          `json:"conditions" elastic_mapping:"conditions:{type:object}"`
	Channels           NotificationConfig `json:"channels,omitempty" elastic_mapping:"channels:{type:object}"`
	NotificationConfig *NotificationConfig `json:"notification_config,omitempty" elastic_mapping:"notification_config:{type:object}"`
	RecoveryNotificationConfig *RecoveryNotificationConfig `json:"recovery_notification_config,omitempty" elastic_mapping:"recovery_notification_config:{type:object}"`
	Schedule           Schedule           `json:"schedule" elastic_mapping:"schedule:{type:object}"`
	LastNotificationTime time.Time `json:"-" elastic_mapping:"last_notification_time:{type:date}"`
	LastTermStartTime time.Time `json:"-"` //标识最近一轮告警的开始时间
	LastEscalationTime time.Time `json:"-"` //标识最近一次告警升级发送通知的时间
	SearchText string `json:"-" elastic_mapping:"search_text:{type:text,index_prefixes:{},index_phrases:true, analyzer:suggest_text_search }"`
	Expression string `json:"-"`
	Creator struct {
		Name string `json:"name" elastic_mapping:"name: { type: keyword }"`
		Id   string `json:"id" elastic_mapping:"id: { type: keyword }"`
	} `json:"creator" elastic_mapping:"creator:{type:object}"`
}

func (rule *Rule) GetOrInitExpression() (string, error){
	if rule.Expression != ""{
		return rule.Expression, nil
	}
	sb := strings.Builder{}
	for i, cond := range rule.Conditions.Items {
		condExp, err := cond.GenerateConditionExpression()
		if err != nil {
			return "", err
		}
		sb.WriteString(condExp)

		if i < len(rule.Conditions.Items)-1 {
			sb.WriteString(" or ")
		}
	}
	metricExp, err := rule.Metrics.GenerateExpression()
	if err != nil {
		return "", err
	}
	rule.Expression = strings.ReplaceAll(sb.String(), "result", metricExp)
	return rule.Expression, nil
}
//GetNotificationConfig for adapter old version config
func (rule *Rule) GetNotificationConfig() *NotificationConfig {
	if rule.NotificationConfig != nil {
		return rule.NotificationConfig
	}
	return &rule.Channels
}
func (rule *Rule) GetNotificationTitleAndMessage() (string, string) {
	if rule.NotificationConfig != nil {
		return rule.NotificationConfig.Title, rule.NotificationConfig.Message
	}
	return rule.Metrics.Title, rule.Metrics.Message
}

type NotificationConfig struct {
	Enabled bool `json:"enabled"`
	Title string `json:"title,omitempty"` //text template
	Message string `json:"message,omitempty"` // text template
	Normal []Channel      `json:"normal,omitempty"`
	Escalation []Channel  `json:"escalation,omitempty"`
	ThrottlePeriod string `json:"throttle_period,omitempty"` //沉默周期
	AcceptTimeRange TimeRange   `json:"accept_time_range,omitempty"`
	EscalationThrottlePeriod string `json:"escalation_throttle_period,omitempty"`
	EscalationEnabled bool `json:"escalation_enabled,omitempty"`
}

type RecoveryNotificationConfig struct {
	Enabled bool `json:"enabled"`
	Title string `json:"title"` //text template
	Message string `json:"message"` // text template
	AcceptTimeRange TimeRange   `json:"accept_time_range,omitempty"`
	Channels []Channel      `json:"channels,omitempty"`
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
	if tr.Start == "" || tr.End == "" {
		return true
	}
	currentTimeStr := t.Format("15:04")
	return tr.Start <= currentTimeStr && currentTimeStr <= tr.End
}

type FilterParam struct {
	Start interface{} `json:"start"`
	End interface{} `json:"end"`
	BucketSize string `json:"bucket_size"`
}
//ctx
//rule expression, rule_id, resource_id, resource_name, event_id, condition_name, preset_value,[group_tags, check_values],
//check_status ,timestamp,