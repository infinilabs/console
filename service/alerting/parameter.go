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
		{ParamResults, "array", "", "", []ParameterMeta{
			{ParamMessage, "string", "", "disk used 90%", nil},
			{ParamPresetValue, "float", "", "", nil},
			{ParamStatus, "string", "", "error", nil},
			{ParamGroupValues, "array", "", "[\"cluster-xxx\", \"node-xxx\"]", nil},
			{ParamIssueTimestamp, "date", "", "1652184211252", nil},
			{ParamResultValue, "float", "", "91.2", nil},
			{ParamRelationValues, "map", "", "{a:100, b:91.2}", nil},
		}},
		{ParamTimestamp, "date", "", "", nil},
	}
}
