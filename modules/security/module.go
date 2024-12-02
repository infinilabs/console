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

/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package security

import (
	rbac "infini.sh/console/core/security"
	authapi "infini.sh/console/modules/security/api"
	"infini.sh/console/modules/security/config"
	credapi "infini.sh/console/modules/security/credential/api"
	"infini.sh/console/modules/security/realm"
	"infini.sh/console/modules/security/realm/authc/oauth"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
)

type Module struct {
	cfg *config.Config
}

func (module *Module) Name() string {
	return "security"
}

func (module *Module) Setup() {
	module.cfg = &config.Config{
		Enabled: false,
		Authentication: config.AuthenticationConfig{
			Realms: config.RealmsConfig{
				Native: config.RealmConfig{
					Enabled: true,
				},
			},
		},
		OAuthConfig: config.OAuthConfig{
			SuccessPage: "/#/user/sso/success",
			FailedPage:  "/#/user/sso/failed",
		},
	}

	ok, err := env.ParseConfig("security", &module.cfg)
	if ok && err != nil && global.Env().SystemConfig.Configs.PanicOnConfigError {
		panic(err)
	}

	if !module.cfg.Enabled {
		return
	}
	InitSchema()

	credapi.Init()

	if module.cfg.OAuthConfig.Enabled {
		oauth.Init(module.cfg.OAuthConfig)
	}

	authapi.Init()
}

func InitSchema() {
	orm.RegisterSchemaWithIndexName(rbac.Role{}, "rbac-role")
	orm.RegisterSchemaWithIndexName(rbac.User{}, "rbac-user")
	orm.RegisterSchemaWithIndexName(credential.Credential{}, "credential")
}

func (module *Module) Start() error {
	if !module.cfg.Enabled {
		return nil
	}

	realm.Init(module.cfg)

	return nil
}

func (module *Module) Stop() error {

	return nil
}
