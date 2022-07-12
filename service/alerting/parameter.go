/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package alerting

type ParameterMeta struct {
	Name string                   `json:"name"`
	Type string                   `json:"type"` //int, float, string, date, array, object
	Description string            `json:"description"`
	Eg         string          `json:"eg,omitempty"`
	Properties []ParameterMeta `json:"properties,omitempty"`
}

func GetTemplateParameters() []ParameterMeta {
	return []ParameterMeta{
		{ParamRuleID, "string", "rule uuid", "c9f663tath2e5a0vksjg", nil},
		{ParamResourceID, "string", "resource uuid", "c9f663tath2e5a0vksjg", nil},
		{ParamResourceName, "string", "resource name", "es-v716", nil},
		{ParamEventID, "string", "identifier for check details", "c9f663tath2e5a0vksjx", nil},
		{ParamTitle, "string", "", "xxx cpu used 95%", nil},
		{ParamMessage, "string", "", "disk used 90%", nil},
		{ParamResults, "array", "", "", []ParameterMeta{
			{ParamThreshold, "array", "", "[\"90\"]", nil},
			{Priority, "string", "", "error", nil},
			{ParamGroupValues, "array", "", "[\"cluster-xxx\", \"node-xxx\"]", nil},
			{ParamIssueTimestamp, "date", "", "2022-05-11T11:50:55+08:00", nil},
			{ParamResultValue, "float", "", "91.2", nil},
			{ParamRelationValues, "map", "", "{a:100, b:91.2}", nil},
		}},
		{ParamTimestamp, "date", "", "2022-05-11T11:50:55+08:00", nil},
	}
}
