package alerting

type EmailAccount struct {
	Email string `json:"email" elastic_mapping:"email:{type:text,fields: {keyword: {type: keyword, ignore_above: 256}}}"`
	//From string `json:"from" elastic_mapping:"from:{type:text}"`
	Host  string `json:"host" elastic_mapping:"host:{type:text}"`
	Method  string `json:"method" elastic_mapping:"method:{type:text}"`
	Name string `json:"name" elastic_mapping:"name:{type:text,fields: {keyword: {type: keyword, ignore_above: 256}}}"`
	Port int `json:"port" elastic_mapping:"port:{type:integer}"`
	SchemaVersion int64 `json:"schema_version" elastic_mapping:"schema_version:{type:long}"`
	Password string `json:"password,omitempty" elastic_mapping:"password:{type:keyword}"`
}
