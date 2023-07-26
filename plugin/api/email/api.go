/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package email

import (
	"infini.sh/console/plugin/api/email/common"
	"infini.sh/framework/core/api"
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
}

func InitEmailServer() error {
	if !common.CheckEmailPipelineExists() {
		return common.RefreshEmailServer()
	}
	return nil
}