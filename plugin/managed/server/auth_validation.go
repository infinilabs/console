package server

import (
	"net/http"

	agent_common "infini.sh/console/modules/agent/common"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
)

func validateManagedAgentRequestAuth(req *http.Request, instance *model.Instance) error {
	return agent_common.ValidateManagerRequestAuth(
		req,
		instance,
		(*model.BasicAuth)(&global.Env().SystemConfig.Configs.ManagerConfig.BasicAuth),
	)
}
