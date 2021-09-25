package alerting

type Monitor struct {
	Enabled bool `json:"enabled" elastic_mapping:"enabled: {type:boolean}"`
	EnabledTime int64 `json:"enabled_time" elastic_mapping:"enabled_time:{type:date,format:strict_date_time||epoch_millis}"`
	Inputs []MonitorInput `json:"inputs" elastic_mapping:"inputs"`
	LastUpdateTime int64 `json:"last_update_time" elastic_mapping:"last_update_time:{type:date,format:strict_date_time||epoch_millis}"`
	Name string `json:"name" elastic_mapping:"name:{type:text,fields: {keyword: {type: keyword, ignore_above: 256}}}"`
	Schedule Schedule `json:"schedule" elastic_mapping:"schedule"`
	SchemaVersion int `json:"schema_version" elastic_mapping:"schema_version:{type:integer}"`
	Triggers []Trigger `json:"triggers" elastic_mapping:"triggers"`
	Type string `json:"type" elastic_mapping:"type:{type:keyword}`
}

type MonitorInput struct {
	Search MonitorSearch `json:"search" elastic_mapping:"search"`
}

type MonitorSearch struct {
	Indices []string `json:"indices" elastic_mapping:"indices:{type:text,fields: {keyword: {type: keyword, ignore_above: 256}}}"`
	Query map[string]interface{} `json:"query" elastic_mapping:"query:{type:object,enabled:false}}"`
}

type Cron struct {
	Expression string `json:"expression" elastic_mapping:"expression:{type:text}"`
	Timezone string `json:"timezone" elastic_mapping:"timezone:{type:keyword}"`
}

type Period struct {
	Interval int `json:"interval" elastic_mapping:"interval:{type:integer}"`
	Unit string `json:"unit" elastic_mapping:"unit:{type:keyword}"`
}


type Schedule struct {
	Cron *Cron `json:"cron,omitempty" elastic_mapping:"cron"`
	Period *Period `json:"period,omitempty" elastic_mapping:"period"`
}


type Throttle struct {
	Unit string `json:"unit" elastic_mapping:"unit:{type:keyword}"`
	Value int `json:"value" elastic_mapping:"value:{type:integer}"`
}

type Action struct {
	ID string `json:"id"`
	DestinationId string `json:"destination_id" elastic_mapping:"destination_id:{type:keyword}"`
	MessageTemplate map[string]interface{} `json:"message_template" elastic_mapping:"message_template:{type:object}"`
	Name string `json:"name" elastic_mapping:"name:{type:text,fields: {keyword: {type: keyword, ignore_above: 256}}}"`
	SubjectTemplate map[string]interface{} `json:"subject_template" elastic_mapping:"subject_template:{type:object}"`
	ThrottleEnabled bool `json:"throttle_enabled" elastic_mapping:"throttle_enabled:{type:boolean}"`
	Throttle *Throttle `json:"throttle,omitempty" elastic_mapping:"throttle"`
}

type Trigger struct {
	ID string `json:"id"`
	Severity string `json:"severity" elastic_mapping:"severity:{type:keyword}"`
	Name string `json:"name" elastic_mapping:"name:{type:text,fields: {keyword: {type: keyword, ignore_above: 256}}}"`
	Condition map[string]interface{} `json:"condition" elastic_mapping:"condition:{type:object, enable:false}"`
	Actions []Action `json:"actions" elastic_mapping:"actions"`
	MinTimeBetweenExecutions int `json:"min_time_between_executions" elastic_mapping:"min_time_between_executions:{type:integer}"`
}