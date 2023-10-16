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
