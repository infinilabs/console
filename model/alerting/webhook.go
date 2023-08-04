/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

type CustomWebhook struct {
	HeaderParams map[string]string `json:"header_params,omitempty" elastic_mapping:"header_params:{type:object,enabled:false}"`
	Method string `json:"method" elastic_mapping:"method:{type:keyword}"`
	URL string `json:"url,omitempty"`
	Body string `json:"body" elastic_mapping:"body:{type:text}"`
}

type Email struct {
	ServerID string `json:"server_id" elastic_mapping:"server_id:{type:keyword}"`
	Recipients struct {
		To  []string `json:"to,omitempty" elastic_mapping:"to:{type:keyword}"`
		CC  []string `json:"cc,omitempty" elastic_mapping:"cc:{type:keyword}"`
		BCC []string `json:"bcc,omitempty" elastic_mapping:"bcc:{type:keyword}"`
	} `json:"recipients" elastic_mapping:"recipients:{type:object}"`
	Subject string `json:"subject" elastic_mapping:"subject:{type:text}"`
	Body string `json:"body" elastic_mapping:"body:{type:text}"`
	ContentType string `json:"content_type" elastic_mapping:"content_type:{type:keyword}"`
}