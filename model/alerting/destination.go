package alerting

type Destination struct {
	Type string `json:"type" elastic_mapping:"type:{type:keyword}"`
	Name string `json:"name" elastic_mapping:"name:{type:text,fields: {keyword: {type: keyword, ignore_above: 256}}}"`
	SchemaVersion int `json:"schema_version" elastic_mapping:"schema_version:{type:integer}"`
	LastUpdateTime int64 `json:"last_update_time" elastic_mapping:"last_update_time:{type:date,format:strict_date_time||epoch_millis}"`
	CustomWebhook CustomWebhook `json:"custom_webhook,omitempty" elastic_mapping:"custom_webhook:{type:object}"`
	Email EmailDestination `json:"email,omitempty" elastic_mapping:"email:{type:object}"`
	//Slack Slack `json:"slack,omitempty" elastic_mapping:"slack"`
}

type EmailDestination struct {
	EmailAccountID string `json:"email_account_id" elastic_mapping:"email_account_id:{type:keyword}"`
	Recipients []Recipient `json:"recipients" elastic_mapping:"recipients:{type:nested}"`
}

type Recipient struct {
	EmailGroupID string  `json:"email_group_id,omitempty" elastic_mapping:"email_group_id:{type:keyword}"`
	Email string `json:"email,omitempty" elastic_mapping:"email:{type:text}"`
	Type string `json:"type" elastic_mapping:"type:{type:keyword}"`
}


type CustomWebhook struct {
	HeaderParams map[string]string `json:"header_params" elastic_mapping:"header_params:{type:object,enabled:false}"`
	Host string `json:"host" elastic_mapping:"host:{type:text}"`
	Method string `json:"method" elastic_mapping:"method:{type:keyword}"`
	Password string `json:"password" elastic_mapping:"password:{type:text}"`
	Path string `json:"path" elastic_mapping:"path:{type:keyword}"`
	Port int `json:"port" elastic_mapping:"port:{type:integer}"`
	QueryParams map[string]string `json:"query_params" elastic_mapping:"query_params:{type:object,enabled:false}"`
	Scheme string `json:"scheme" elastic_mapping:"scheme:{type:keyword}"`
	URL string `json:"url" elastic_mapping:"url:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}}"`
	Username string `json:"username" elastic_mapping:"username:{type:text}"`
}

type Slack struct {
	URl string `json:"url" elastic_mapping:"url:{type:keyword}"`
}