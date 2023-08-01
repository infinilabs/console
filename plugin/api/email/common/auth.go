/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"infini.sh/console/model"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
)

func GetBasicAuth(srv *model.EmailServer) (basicAuth elastic.BasicAuth, err error) {
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
		if auth, ok := dv.(elastic.BasicAuth); ok {
			basicAuth = auth
		}
	}
	return
}
