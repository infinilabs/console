package index_management

import (
	"infini.sh/console/config"
	"infini.sh/console/core"
)

type APIHandler struct {
	Config *config.AppConfig
	core.Handler
}

func newResponseBody() map[string]interface{} {
	return map[string]interface{}{}
}
