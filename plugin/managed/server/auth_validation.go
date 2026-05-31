package server

import (
	"net/http"
	"strings"

	agent_common "infini.sh/console/modules/agent/common"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
	configcommon "infini.sh/framework/modules/configs/common"
)

const legacyManagedAuthMaxVersion = "1.30.4"

func validateManagedAgentRequestAuth(req *http.Request, instance *model.Instance) error {
	return agent_common.ValidateManagerRequestAuth(
		req,
		instance,
		(*model.BasicAuth)(&global.Env().SystemConfig.Configs.ManagerConfig.BasicAuth),
	)
}

func validateLegacyCompatibleManagedAgentRequestAuth(req *http.Request, instance *model.Instance) error {
	if isLegacyManagedBasicAuthRequest(req, instance) {
		return nil
	}
	return validateManagedAgentRequestAuth(req, instance)
}

func isLegacyManagedRegisterRequest(req *http.Request, client *model.Instance, accessToken *configcommon.RegisterToken) bool {
	if accessToken != nil && strings.TrimSpace(accessToken.Value) != "" {
		return false
	}
	return isLegacyManagedBasicAuthForVersion(req, client.Application.Version.VersionNumber)
}

func isLegacyManagedBasicAuthRequest(req *http.Request, instance *model.Instance) bool {
	if instance == nil {
		return false
	}
	return isLegacyManagedBasicAuthForVersion(req, instance.Application.Version.VersionNumber)
}

func isLegacyManagedBasicAuthForVersion(req *http.Request, version string) bool {
	if !isLegacyManagedVersion(version) {
		return false
	}
	if req == nil || agent_common.ExtractManagerToken(req) != "" {
		return false
	}
	managerAuth := global.Env().SystemConfig.Configs.ManagerConfig.BasicAuth
	if strings.TrimSpace(managerAuth.Username) == "" {
		return false
	}
	user, password, ok := req.BasicAuth()
	if !ok {
		return false
	}
	return user == managerAuth.Username && password == managerAuth.Password.Get()
}

func isLegacyManagedVersion(version string) bool {
	version = strings.TrimSpace(version)
	if version == "" {
		return false
	}
	parsed, err := util.ParseSemantic(version)
	if err != nil {
		parsed, err = util.ParseGeneric(version)
		if err != nil {
			return false
		}
	}
	cmp, err := parsed.Compare(nextManagedAuthVersionAfterLegacy())
	if err != nil {
		return false
	}
	return cmp == -1
}

func nextManagedAuthVersionAfterLegacy() string {
	legacyMax := env.Version{VersionNumber: legacyManagedAuthMaxVersion}
	parsed := util.MustParseSemantic(legacyMax.VersionNumber)
	return parsed.WithPatch(parsed.Patch() + 1).String()
}
