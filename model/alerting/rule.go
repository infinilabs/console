// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"strings"
	"time"
)

type Rule struct {
	ID                         string                      `json:"id,omitempty"      elastic_meta:"_id" elastic_mapping:"id: { type: keyword }"`
	Created                    time.Time                   `json:"created,omitempty" elastic_mapping:"created: { type: date }"`
	Updated                    time.Time                   `json:"updated,omitempty" elastic_mapping:"updated: { type: date }"`
	Name                       string                      `json:"name" elastic_mapping:"name:{type:keyword,copy_to:search_text}"`
	Enabled                    bool                        `json:"enabled" elastic_mapping:"enabled:{type:keyword}"`
	Resource                   Resource                    `json:"resource" elastic_mapping:"resource:{type:object}"`
	Metrics                    Metric                      `json:"metrics" elastic_mapping:"metrics:{type:object}"`
	Conditions                 Condition                   `json:"conditions" elastic_mapping:"conditions:{type:object}"`
	Channels                   *NotificationConfig         `json:"channels,omitempty" elastic_mapping:"channels:{type:object}"`
	NotificationConfig         *NotificationConfig         `json:"notification_config,omitempty" elastic_mapping:"notification_config:{type:object}"`
	RecoveryNotificationConfig *RecoveryNotificationConfig `json:"recovery_notification_config,omitempty" elastic_mapping:"recovery_notification_config:{type:object}"`
	Schedule                   Schedule                    `json:"schedule" elastic_mapping:"schedule:{type:object}"`
	LastNotificationTime       time.Time                   `json:"-" elastic_mapping:"last_notification_time:{type:date}"`
	LastTermStartTime          time.Time                   `json:"-"` //标识最近一轮告警的开始时间
	LastEscalationTime         time.Time                   `json:"-"` //标识最近一次告警升级发送通知的时间
	SearchText                 string                      `json:"-" elastic_mapping:"search_text:{type:text,index_prefixes:{},index_phrases:true, analyzer:suggest_text_search }"`
	Expression                 string                      `json:"-"`
	Creator                    struct {
		Name string `json:"name" elastic_mapping:"name: { type: keyword }"`
		Id   string `json:"id" elastic_mapping:"id: { type: keyword }"`
	} `json:"creator" elastic_mapping:"creator:{type:object}"`
	Category         string     `json:"category,omitempty"  elastic_mapping:"category: { type: keyword,copy_to:search_text }"`
	Tags             []string   `json:"tags,omitempty"  elastic_mapping:"tags: { type: keyword,copy_to:search_text }"`
	BucketConditions *Condition `json:"bucket_conditions" elastic_mapping:"bucket_conditions:{type:object}"`
}

func (rule *Rule) GetOrInitExpression() (string, error) {
	if rule.Expression != "" {
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

// GetNotificationConfig for adapter old version config
func (rule *Rule) GetNotificationConfig() *NotificationConfig {
	if rule.NotificationConfig != nil {
		return rule.NotificationConfig
	}
	return rule.Channels
}
func (rule *Rule) GetNotificationTitleAndMessage() (string, string) {
	if rule.NotificationConfig != nil {
		return rule.NotificationConfig.Title, rule.NotificationConfig.Message
	}
	return rule.Metrics.Title, rule.Metrics.Message
}

type NotificationConfig struct {
	Enabled                  bool      `json:"enabled"`
	Title                    string    `json:"title,omitempty"`   //text template
	Message                  string    `json:"message,omitempty"` // text template
	Normal                   []Channel `json:"normal,omitempty"`
	Escalation               []Channel `json:"escalation,omitempty"`
	ThrottlePeriod           string    `json:"throttle_period,omitempty"` //沉默周期
	AcceptTimeRange          TimeRange `json:"accept_time_range,omitempty"`
	EscalationThrottlePeriod string    `json:"escalation_throttle_period,omitempty"`
	EscalationEnabled        bool      `json:"escalation_enabled,omitempty"`
}

type RecoveryNotificationConfig struct {
	Enabled         bool      `json:"enabled"` // channel enabled
	Title           string    `json:"title"`   //text template
	Message         string    `json:"message"` // text template
	AcceptTimeRange TimeRange `json:"accept_time_range,omitempty"`
	Normal          []Channel `json:"normal,omitempty"`
	EventEnabled    bool      `json:"event_enabled"`
}

type MessageTemplate struct {
	Type   string `json:"type"`
	Source string `json:"source"`
}

type TimeRange struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

func (tr *TimeRange) Include(t time.Time) bool {
	if tr.Start == "" || tr.End == "" {
		return true
	}
	currentTimeStr := t.Format("15:04")
	return tr.Start <= currentTimeStr && currentTimeStr <= tr.End
}

type FilterParam struct {
	Start      interface{} `json:"start"`
	End        interface{} `json:"end"`
	BucketSize string      `json:"bucket_size"`
}

//ctx
//rule expression, rule_id, resource_id, resource_name, event_id, condition_name, preset_value,[group_tags, check_values],
//check_status ,timestamp,
