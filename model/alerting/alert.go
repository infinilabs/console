package alerting

type Alert struct {
	ClusterID string `json:"cluster_id"`
	AcknowledgedTime *int64 `json:"acknowledged_time" elastic_mapping:"acknowledged_time:{type:date}"`
	ActionExecutionResults []ActionExecutionResult `json:"action_execution_results" elastic_mapping:"action_execution_results"`
	AlertHistories []AlertHistory `json:"alert_history" elastic_mapping:"alert_history"`
	EndTime *int64 `json:"end_time" elastic_mapping:"end_time:{type:date}"`
	ErrorMessage string `json:"error_message" elastic_mapping:"error_message:{type:text}"`
	Id string `json:"id" elastic_mapping:"id:{type:keyword}"`
	LastNotificationTime int64 `json:"last_notification_time" elastic_mapping:"last_notification_time:{type:date}"`
	MonitorId string `json:"monitor_id" elastic_mapping:"monitor_id:{type:keyword}"`
	MonitorName string `json:"monitor_name" elastic_mapping:"monitor_name:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}}"`
	Severity string `json:"severity" elastic_mapping:"severity:{type:keyword}"`
	StartTime int64 `json:"start_time"  elastic_mapping:"start_time:{type:date}"`
	State string `json:"state"  elastic_mapping:"state:{type:keyword}"`
	TriggerId string `json:"trigger_id" elastic_mapping:"trigger_id:{type:keyword}"`
	TriggerName string `json:"trigger_name" elastic_mapping:"trigger_name:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}}"`
}

type AlertingHistory Alert

type ActionExecutionResult struct {
	ActionID string `json:"action_id" elastic_mapping:"action_id:{type:keyword}"`
	LastExecutionTime int64 `json:"last_execution_time" elastic_mapping:"last_execution_time:{type:date}"`
	ThrottledCount int `json:"throttled_count" elastic_mapping:"throttled_count:{type:integer}"`
	Error string `json:"error,omitempty"`
	Result string `json:"result"`
}

type AlertHistory struct {
	Message string `json:"message" elastic_mapping:"message:{type:text}"`
	Timestamp int64 `json:"timestamp" elastic_mapping:"timestamp:{type:date}"`
}