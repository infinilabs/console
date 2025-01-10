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
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package model

import (
	"fmt"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
)

type EmailServer struct {
	orm.ORMObjectBase
	Name         string           `json:"name" elastic_mapping:"name:{type:text}"`
	Host         string           `json:"host" elastic_mapping:"host:{type:keyword}"`
	Port         int              `json:"port" elastic_mapping:"port:{type:keyword}"`
	TLS          bool             `json:"tls" elastic_mapping:"tls:{type:keyword}"`
	Auth         *model.BasicAuth `json:"auth" elastic_mapping:"auth:{type:object}"`
	Enabled      bool             `json:"enabled" elastic_mapping:"enabled:{type:boolean}"`
	CredentialID string           `json:"credential_id" elastic_mapping:"credential_id:{type:keyword}"`
}

func (serv *EmailServer) Validate(requireName bool) error {
	if serv.Host == "" {
		return fmt.Errorf("host can not be empty")
	}
	if serv.Port <= 0 {
		return fmt.Errorf("invalid port [%d]", serv.Port)
	}
	if requireName && serv.Name == "" {
		return fmt.Errorf("name can not be empty")
	}
	return nil
}
