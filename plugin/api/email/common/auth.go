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

package common

import (
	"infini.sh/console/model"
	"infini.sh/framework/core/credential"
	model2 "infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
)

func GetBasicAuth(srv *model.EmailServer) (basicAuth model2.BasicAuth, err error) {
	if srv.Auth != nil && srv.Auth.Username != "" {
		basicAuth = *srv.Auth
		return
	}
	if srv.CredentialID != "" {
		cred := credential.Credential{}
		cred.ID = srv.CredentialID
		_, err = orm.Get(&cred)
		if err != nil {
			return
		}
		var dv interface{}
		dv, err = cred.Decode()
		if err != nil {
			return
		}
		if auth, ok := dv.(model2.BasicAuth); ok {
			basicAuth = auth
		}
	}
	return
}
