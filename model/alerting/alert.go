/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

import (
	"time"
)

type Alert struct {
	ID      string    `json:"id,omitempty"      elastic_meta:"_id" elastic_mapping:"id: { type: keyword }"`
	Created time.Time `json:"created,omitempty" elastic_mapping:"created: { type: date }"`
	Updated time.Time `json:"updated,omitempty" elastic_mapping:"updated: { type: date }"`
	RuleID string `json:"rule_id"  elastic_mapping:"rule_id: { type: keyword }"`
	ResourceID string `json:"resource_id"  elastic_mapping:"resource_id: { type: keyword }"`
	ResourceName string `json:"resource_name"  elastic_mapping:"resource_name: { type: keyword }"`
	Expression string `json:"expression"  elastic_mapping:"expression: { type: keyword, copy_to:search_text }"`
	Objects []string `json:"objects" elastic_mapping:"objects: { type:keyword,copy_to:search_text }"`
	Severity string `json:"severity" elastic_mapping:"severity: { type: keyword }"`
	Content string `json:"content" elastic_mapping:"context: { type: keyword, copy_to:search_text }"`
	AcknowledgedTime       interface{}             `json:"acknowledged_time,omitempty"`
	ActionExecutionResults []ActionExecutionResult `json:"action_execution_results"`
	Users []string `json:"users,omitempty"`
	State string `json:"state"`
	Error string `json:"error,omitempty"`
	IsNotified bool `json:"is_notified" elastic_mapping:"is_notified: { type: boolean }"` //标识本次检测是否发送了告警通知
	IsEscalated bool `json:"is_escalated" elastic_mapping:"is_escalated: { type: boolean }"` //标识本次检测是否发送了升级告警通知
	Conditions Condition `json:"condition"`
	ConditionResult *ConditionResult `json:"condition_result,omitempty" elastic_mapping:"condition_result: { type: object,enabled:false }"`
	SearchText string `json:"-" elastic_mapping:"search_text:{type:text,index_prefixes:{},index_phrases:true, analyzer:suggest_text_search }"`
}

type ActionExecutionResult struct {
	LastExecutionTime int    `json:"last_execution_time"`
	Error             string `json:"error"`
	Result            string `json:"result"`
}

const (
	AlertStateActive string = "active"
	AlertStateAcknowledge = "acknowledge"
	AlertStateNormal = "normal"
	AlertStateError = "error"
)


/*
{
	RuleID
	ResourceID
	ResourceName
}
*/