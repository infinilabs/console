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

package common

import "infini.sh/framework/core/util"

var allowedInstanceInfoKeys = []string{
	"id",
	"name",
	"application",
	"labels",
	"tags",
	"description",
	"status",
}

func SanitizeInstanceInfoMap(payload util.MapStr) util.MapStr {
	sanitized := util.MapStr{}
	for _, key := range allowedInstanceInfoKeys {
		if value, ok := payload[key]; ok {
			sanitized[key] = value
		}
	}
	return sanitized
}

func SanitizeInstanceInfoBytes(body []byte) ([]byte, error) {
	payload := util.MapStr{}
	err := util.FromJSONBytes(body, &payload)
	if err != nil {
		return nil, err
	}
	return util.MustToJSONBytes(SanitizeInstanceInfoMap(payload)), nil
}
