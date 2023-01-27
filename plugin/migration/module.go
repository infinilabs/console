/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package migration

import (
	"infini.sh/framework/core/module"
)

func (module *Module) Name() string {
	return "migration"
}

func (module *Module) Setup() {
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

func init()  {
	module.RegisterUserPlugin(&Module{})
}