/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package task_manager

import (
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/module"
)

func (module *Module) Name() string {
	return "migration"
}

func (module *Module) Setup() {
	exists, err := env.ParseConfig("migration", module)
	if exists && err != nil {
		log.Error(err)
	}
	InitAPI()
}
func (module *Module) Start() error {
	return nil
}

func (module *Module) Stop() error {
	return nil
}

type Module struct {
}

func init() {
	module.RegisterUserPlugin(&Module{})
}
