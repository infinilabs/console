/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package realm

import (
	log "github.com/cihub/seelog"
	rbac "infini.sh/console/core/security"
	"infini.sh/console/modules/security/config"
	ldap2 "infini.sh/console/modules/security/realm/authc/ldap"
	"infini.sh/console/modules/security/realm/authc/native"
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
)

var realms = []rbac.SecurityRealm{}

func Init(config *config.Config) {

	if !config.Enabled {
		return
	}

	if config.Authentication.Realms.Native.Enabled {
		native.Init()
		nativeRealm := native.NativeRealm{}
		realms = append(realms, &nativeRealm) //TODO sort by order
	}

	//if len(config.Authentication.Realms.OAuth) > 0 {
	//	for _, v := range config.Authentication.Realms.OAuth {
	//		{
	//			realm:=oauth.New(v)
	//			realms=append(realms,realm) //TODO sort by order
	//		}
	//	}
	//}

	if global.Env().IsDebug {
		log.Tracef("config: %v", util.MustToJSON(config))
	}

	if len(config.Authentication.Realms.LDAP) > 0 {
		for _, v := range config.Authentication.Realms.LDAP {
			if v.Enabled {
				realm := ldap2.New(v)
				realms = append(realms, realm) //TODO sort by order
			}
		}
	}
}

func Authenticate(username, password string) (bool, *rbac.User, error) {

	for i, realm := range realms {
		ok, user, err := realm.Authenticate(username, password)
		log.Debugf("authenticate result: %v, user: %v, err: %v, realm: %v", ok, user, err, i)
		if ok && user != nil && err == nil {
			return true, user, nil
		}
	}
	if global.Env().IsDebug {
		log.Errorf("failed to authenticate user: %v", username)
	}
	return false, nil, errors.Errorf("failed to authenticate user: %v", username)
}

func Authorize(user *rbac.User) (bool, error) {

	for i, realm := range realms {
		//skip if not the same auth provider, TODO: support cross-provider authorization
		if user.AuthProvider != realm.GetType() {
			continue
		}

		ok, err := realm.Authorize(user)
		log.Debugf("authorize result: %v, user: %v, err: %v, realm: %v", ok, user, err, i)
		if ok && err == nil {
			//return on any success, TODO, maybe merge all roles and privileges from all realms
			return true, nil
		}
	}

	roles, privilege := user.GetPermissions()
	if len(roles) == 0 && len(privilege) == 0 {
		if global.Env().IsDebug {
			log.Errorf("failed to authorize user: %v", user.Username)
		}
		return false, errors.New("no roles or privileges")
	}

	return false, errors.Errorf("failed to authorize user: %v", user.Username)

}
