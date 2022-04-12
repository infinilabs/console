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
