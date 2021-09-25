package alerting

//type Config struct {
//	ID string `json:"id" index:"id"`
//	Type string `json:"type" elastic_mapping:"type:{type:keyword}"`
//	Destination Destination `json:"destination,omitempty" elastic_mapping:"destination:{dynamic:false,properties:{custom_webhook:{properties:{header_params:{type:object,enabled:false},host:{type:text},password:{type:text},path:{type:keyword},port:{type:integer},query_params:{type:object,enabled:false},scheme:{type:keyword},url:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}},username:{type:text}}},email:{properties:{email_account_id:{type:keyword},recipients:{type:nested,properties:{email:{type:text},email_group_id:{type:keyword},type:{type:keyword}}}}},last_update_time:{type:date,format:strict_date_time||epoch_millis},name:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}},schema_version:{type:integer},slack:{properties:{url:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}}}},type:{type:keyword},user:{properties:{backend_roles:{type:text,fields:{keyword:{type:keyword}}},custom_attribute_names:{type:text,fields:{keyword:{type:keyword}}},name:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}},roles:{type:text,fields:{keyword:{type:keyword}}}}}}}"`
//	EmailAccount EmailAccount `json:"email_account,omitempty" elastic_mapping:"email_account:{properties:{email:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}},from:{type:text},host:{type:text},method:{type:text},name:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}},port:{type:integer},schema_version:{type:long}}}"`
//	EmailGroup EmailGroup `json:"email_group,omitempty" elastic_mapping:"email_group:{properties:{emails:{type:nested,properties:{email:{type:text}}},name:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}},schema_version:{type:long}}}"`
//	Monitor Monitor `json:"monitor,omitempty" elastic_mapping:"monitor:{dynamic:false,properties:{enabled:{type:boolean},enabled_time:{type:date,format:strict_date_time||epoch_millis},inputs:{type:nested,properties:{search:{properties:{indices:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}},query:{type:object,enabled:false}}}}},last_update_time:{type:date,format:strict_date_time||epoch_millis},name:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}},schedule:{properties:{cron:{properties:{expression:{type:text},timezone:{type:keyword}}},period:{properties:{interval:{type:integer},unit:{type:keyword}}}}},schema_version:{type:integer},triggers:{type:nested,properties:{actions:{type:nested,properties:{destination_id:{type:keyword},message_template:{type:object,enabled:false},name:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}},subject_template:{type:object,enabled:false},throttle:{properties:{unit:{type:keyword},value:{type:integer}}},throttle_enabled:{type:boolean}}},condition:{type:object,enabled:false},min_time_between_executions:{type:integer},name:{type:text,fields:{keyword:{type:keyword,ignore_above:256}}}}},type:{type:keyword}}}"`
//}

type Config struct {
	ID string `json:"id" index:"id"`
	Type string `json:"type" elastic_mapping:"type:{type:keyword}"`
	Destination Destination `json:"destination,omitempty" elastic_mapping:"destination"`
	EmailAccount EmailAccount `json:"email_account,omitempty" elastic_mapping:"email_account"`
	EmailGroup EmailGroup `json:"email_group,omitempty" elastic_mapping:"email_group"`
	Monitor Monitor `json:"monitor,omitempty" elastic_mapping:"monitor"`
}
