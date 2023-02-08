/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package migration

import (
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/module"
)

func (module *Module) Name() string {
	return "migration"
}

func (module *Module) Setup() {
	module.BulkResultIndexName = ".infini_async_bulk_results"
	_, err := env.ParseConfig("migration", module)
	if err != nil {
		log.Error(err)
	}
	InitAPI(module.BulkResultIndexName)
}
func (module *Module) Start() error {
	return nil
}

func (module *Module) Stop() error {
	return nil
}

type Module struct {
	BulkResultIndexName string `config:"bulk_result_index_name"`
}

func init()  {
	module.RegisterUserPlugin(&Module{})
}