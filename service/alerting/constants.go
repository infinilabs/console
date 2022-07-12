/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

const (
	KVLastNotificationTime = "alert_last_notification_time"
	KVLastTermStartTime = "alert_last_term_start_time"
	KVLastEscalationTime = "alert_last_escalation_time"
	KVLastMessageState = "alert_last_message_state"
)


const (
	ParamRuleID         = "rule_id"       //规则 UUID
	ParamResourceID     = "resource_id"   // 资源 UUID
	ParamResourceName   = "resource_name" // 资源名称 如集群名称 es-v714
	ParamEventID        = "event_id"      // 检查事件 ID
	ParamResults        = "results"       //
	ParamMessage        = "message"       //检查消息 自定义(模版渲染)
	ParamTitle          = "title"
	ParamThreshold      = "threshold"    //检查预设值 []string
	ParamResultValue    = "result_value" //检查结果 {group_tags:["cluster-xxx", "node-xxx"], check_values:[]}
	Priority            = "priority"     //告警等级
	ParamTimestamp      = "timestamp"    //事件产生时间戳
	ParamGroupValues    = "group_values"
	ParamIssueTimestamp = "issue_timestamp"
	ParamRelationValues = "relation_values"
//rule expression, rule_id, resource_id, resource_name, event_id, condition_name, preset_value,[group_tags, check_values],
//check_status ,timestamp,
)