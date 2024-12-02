// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

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
