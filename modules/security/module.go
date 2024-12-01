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

	InitSchema()

	realm.Init(module.cfg)

	return nil
}

func (module *Module) Stop() error {

	return nil
}
