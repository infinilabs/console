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

type FilterQuery struct {
	Field    string        `json:"field,omitempty"`
	Operator string        `json:"operator,omitempty"`
	Values   []string      `json:"values,omitempty"`
	And      []FilterQuery `json:"and,omitempty"`
	Or       []FilterQuery `json:"or,omitempty"`
	Not      []FilterQuery `json:"not,omitempty"`
}

func (fq FilterQuery) IsComplex() bool {
	return len(fq.And) > 0 || len(fq.Or) > 0 || len(fq.Not) > 0
}

func (f FilterQuery) IsEmpty() bool {
	return !f.IsComplex() && f.Operator == ""
}
