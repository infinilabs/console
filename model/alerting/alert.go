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
	RuleID string `json:"rule_id"`
	ClusterID string `json:"cluster_id"`
	Expression string `json:"expression"`
	Objects []string `json:"objects"`
	Severity string `json:"severity"`
	Content string `json:"content"`
	AcknowledgedTime       interface{}             `json:"acknowledged_time,omitempty"`
	ActionExecutionResults []ActionExecutionResult `json:"action_execution_results"`
	Users []string `json:"users,omitempty"`
	State string `json:"state"`
	Error string `json:"error,omitempty"`
}

type ActionExecutionResult struct {
	//ActionId          string `json:"action_id"`
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