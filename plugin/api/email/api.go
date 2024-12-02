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

package email

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/model"
	"infini.sh/console/plugin/api/email/common"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

type EmailAPI struct {
	api.Handler
}

func InitAPI() {
	email := EmailAPI{}
	api.HandleAPIMethod(api.POST, "/email/server/_test", email.testEmailServer)
	api.HandleAPIMethod(api.GET, "/email/server/:email_server_id", email.getEmailServer)
	api.HandleAPIMethod(api.POST, "/email/server", email.createEmailServer)
	api.HandleAPIMethod(api.PUT, "/email/server/:email_server_id", email.updateEmailServer)
	api.HandleAPIMethod(api.DELETE, "/email/server/:email_server_id", email.deleteEmailServer)
	api.HandleAPIMethod(api.GET, "/email/server/_search", email.searchEmailServer)

	credential.RegisterChangeEvent(func(cred *credential.Credential) {
		query := util.MapStr{
			"size": 1,
			"query": util.MapStr{
				"bool": util.MapStr{
					"must": []util.MapStr{
						{
							"term": util.MapStr{
								"credential_id": util.MapStr{
									"value": cred.ID,
								},
							},
						},
						{
							"term": util.MapStr{
								"enabled": util.MapStr{
									"value": true,
								},
							},
						},
					},
				},
			},
		}
		q := orm.Query{
			RawQuery: util.MustToJSONBytes(query),
		}
		err, result := orm.Search(model.EmailServer{}, &q)
		if err != nil {
			log.Error(err)
			return
		}
		if len(result.Result) > 0 {
			err = common.RefreshEmailServer()
			if err != nil {
				log.Error("refresh email server pipeline error: ", err)
			}
		}
	})
}

func InitEmailServer() error {
	if !common.CheckEmailPipelineExists() {
		return common.RefreshEmailServer()
	}
	return nil
}
