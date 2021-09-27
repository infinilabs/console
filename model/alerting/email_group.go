package alerting

type EmailGroup struct {
	Emails []map[string]interface{} `json:"emails" elastic_mapping:"emails:{type: nested, properties: {email: {type: text}}}"`
	Name string `json:"name" elastic_mapping:"name:{type:text,fields: {keyword: {type: keyword, ignore_above: 256}}}"`
	SchemaVersion int64 `json:"schema_version" elastic_mapping:"schema_version:{type:long}"`
}