/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/core/security/enum"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
)

func Init() {
	handler := APIHandler{}
	api.HandleAPIMethod(api.POST, "/credential", handler.RequirePermission(handler.createCredential, enum.PermissionCredentialWrite))
	api.HandleAPIMethod(api.PUT, "/credential/:id", handler.RequirePermission(handler.updateCredential, enum.PermissionCredentialWrite))
	api.HandleAPIMethod(api.DELETE, "/credential/:id", handler.RequirePermission(handler.deleteCredential, enum.PermissionCredentialWrite))
	api.HandleAPIMethod(api.GET, "/credential/_search", handler.RequirePermission(handler.searchCredential, enum.PermissionCredentialRead))
	api.HandleAPIMethod(api.GET, "/credential/:id", handler.RequirePermission(handler.getCredential, enum.PermissionCredentialRead))

	credential.RegisterChangeEvent(func(cred *credential.Credential) {
		var keys []string
		elastic.WalkConfigs(func(key, value interface{}) bool {
			if v, ok := value.(*elastic.ElasticsearchConfig); ok {
				if v.CredentialID == cred.ID {
					if k, ok := key.(string); ok {
						keys = append(keys, k)
					}
				}
			}
			return true
		})
		for _, key := range keys {
			conf := elastic.GetConfig(key)
			if conf.CredentialID == cred.ID {
				obj, err := cred.Decode()
				if err != nil {
					log.Error(err)
					continue
				}
				if v, ok := obj.(model.BasicAuth); ok {
					newConf := *conf
					newConf.BasicAuth = &v
					_, err = common.InitElasticInstance(newConf)
					if err != nil {
						log.Error(err)
					}
					log.Tracef("updated cluster config: %s", util.MustToJSON(newConf))
				}
			}
		}
	})
}
