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