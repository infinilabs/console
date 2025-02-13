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

package ldap

import (
	"context"
	"errors"
	log "github.com/cihub/seelog"
	rbac "infini.sh/console/core/security"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"infini.sh/framework/lib/guardian/auth"
	"infini.sh/framework/lib/guardian/auth/strategies/basic"
	"infini.sh/framework/lib/guardian/auth/strategies/ldap"
	"time"
)

type LDAPConfig struct {
	Enabled        bool   `config:"enabled"`
	Tls            bool   `config:"tls"`
	Host           string `config:"host"`
	Port           int    `config:"port"`
	BindDn         string `config:"bind_dn"`
	BindPassword   string `config:"bind_password"`
	BaseDn         string `config:"base_dn"`
	UserFilter     string `config:"user_filter"`
	UidAttribute   string `config:"uid_attribute"`
	GroupAttribute string `config:"group_attribute"`

	DefaultRoles []string `config:"default_roles"`
	RoleMapping  struct {
		Group map[string][]string `config:"group"`
		Uid   map[string][]string `config:"uid"`
	} `config:"role_mapping"`
}

func (r *LDAPRealm) mapLDAPRoles(authInfo auth.Info) []string {
	var ret []string

	if global.Env().IsDebug {
		log.Tracef("mapping LDAP authInfo: %v", authInfo)
	}

	//check uid
	uid := authInfo.GetID()
	if uid == "" {
		uid = authInfo.GetUserName()
	}

	if global.Env().IsDebug {
		log.Tracef("ldap config: %v", util.MustToJSON(r.config))
	}

	if roles, ok := r.config.RoleMapping.Uid[uid]; ok {
		ret = append(ret, roles...)
	} else {
		if global.Env().IsDebug {
			log.Tracef("ldap uid mapping config: %v", r.config.RoleMapping.Uid)
		}
		log.Debugf("LDAP uid: %v, user: %v", uid, authInfo)
	}

	//map group
	for _, roleName := range authInfo.GetGroups() {
		newRoles, ok := r.config.RoleMapping.Group[roleName]
		if ok {
			ret = append(ret, newRoles...)
		} else {
			if global.Env().IsDebug {
				log.Tracef("ldap group mapping config: %v", r.config.RoleMapping.Group)
			}
			log.Debugf("LDAP group: %v, roleName: %v, match: %v", uid, roleName, newRoles)
		}
	}

	//auto append anonymous roles
	ret = append(ret, r.config.DefaultRoles...)

	return ret
}

func New(cfg2 LDAPConfig) *LDAPRealm {

	var realm = &LDAPRealm{
		config: cfg2,
		ldapCfg: ldap.Config{
			Port:           cfg2.Port,
			Host:           cfg2.Host,
			TLS:            nil,
			BindDN:         cfg2.BindDn,
			BindPassword:   cfg2.BindPassword,
			Attributes:     nil,
			BaseDN:         cfg2.BaseDn,
			UserFilter:     cfg2.UserFilter,
			GroupFilter:    "",
			UIDAttribute:   cfg2.UidAttribute,
			GroupAttribute: cfg2.GroupAttribute,
		},
	}
	realm.ldapFunc = ldap.GetAuthenticateFunc(&realm.ldapCfg)
	return realm
}

const providerName = "ldap"

type LDAPRealm struct {
	config   LDAPConfig
	ldapCfg  ldap.Config
	ldapFunc basic.AuthenticateFunc
}

func (r *LDAPRealm) GetType() string {
	return providerName
}

func (r *LDAPRealm) Authenticate(username, password string) (bool, *rbac.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(time.Second*10))
	defer cancel()

	authInfo, err := r.ldapFunc(ctx, nil, []byte(username), []byte(password))
	if err != nil {
		return false, nil, err
	}
	u := &rbac.User{
		AuthProvider: providerName,
		Username:     authInfo.GetUserName(),
		Nickname:     authInfo.GetUserName(),
		Email:        "",
	}
	u.Payload = &authInfo
	u.ID = authInfo.GetUserName()
	return true, u, err
}

func (r *LDAPRealm) Authorize(user *rbac.User) (bool, error) {
	authInfo := user.Payload.(*auth.Info)
	if authInfo != nil {
		roles := r.mapLDAPRoles(*authInfo)
		for _, roleName := range roles {
			user.Roles = append(user.Roles, rbac.UserRole{
				ID:   roleName,
				Name: roleName,
			})
		}
	} else {
		log.Warnf("LDAP %v auth Info is nil", user.Username)
	}

	var _, privilege = user.GetPermissions()

	if len(privilege) == 0 {
		log.Debug("no privilege assigned to user:", user)
		return false, errors.New("no privilege assigned to this user:" + user.Username)
	}

	return true, nil
}
