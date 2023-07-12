/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package email

import (
	"infini.sh/console/model"
	"infini.sh/console/plugin/api/email/common"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	log "src/github.com/cihub/seelog"
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
	q := orm.Query{
		Size: 10,
	}
	q.Conds = orm.And(orm.Eq("enabled", true))
	err, result := orm.Search(model.EmailServer{}, &q )
	if err != nil {
		return err
	}
	if len(result.Result) == 0 {
		return nil
	}
	for _, row := range result.Result {
		emailServer := model.EmailServer{}
		buf := util.MustToJSONBytes(row)
		util.MustFromJSONBytes(buf, &emailServer)
		err = emailServer.Validate(false)
		if err != nil {
			log.Error(err)
			continue
		}
		err = common.StartEmailServer(&emailServer)
		if err != nil {
			log.Error(err)
		}
	}
	return nil
}