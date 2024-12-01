/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package config

import (
	ldap2 "infini.sh/console/modules/security/realm/authc/ldap"
)

type Config struct {
	Enabled        bool                 `config:"enabled"`
	Authentication AuthenticationConfig `config:"authc"`
	OAuthConfig    OAuthConfig          `config:"oauth"`
}

type RealmConfig struct {
	Enabled bool `config:"enabled"`
	Order   int  `config:"order"`
}

type RealmsConfig struct {
	Native RealmConfig `config:"native"`

	//ldap,oauth, active_directory, pki, file, saml, kerberos, oidc, jwt
	OAuth map[string]OAuthConfig      `config:"oauth"`
	LDAP  map[string]ldap2.LDAPConfig `config:"ldap"`
}

type AuthenticationConfig struct {
	Realms RealmsConfig `config:"realms"`
}
