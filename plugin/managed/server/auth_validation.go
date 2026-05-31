package server

import (
	"net/http"
	"strings"

	agent_common "infini.sh/console/modules/agent/common"
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
	version := ""
	if instance != nil {
		version = instance.Application.Version.VersionNumber
	}
	return validateLegacyCompatibleManagedAgentRequestAuthForVersion(req, instance, version)
}

func validateLegacyCompatibleManagedAgentRequestAuthForVersion(req *http.Request, instance *model.Instance, version string) error {
	if shouldAllowLegacyManagedRequestWithoutAuthVersion(req, version) {
		return nil
	}
	return validateManagedAgentRequestAuth(req, instance)
}

func isLegacyManagedRegisterRequest(req *http.Request, client *model.Instance, accessToken *configcommon.RegisterToken) bool {
	if client == nil {
		return false
	}
	if accessToken != nil && strings.TrimSpace(accessToken.Value) != "" {
		return false
	}
	return shouldAllowLegacyManagedRequestWithoutAuth(req, client)
}

func isLegacyManagedBasicAuthRequest(req *http.Request, instance *model.Instance) bool {
	if instance == nil {
		return false
	}
	if !isLegacyManagedVersion(instance.Application.Version.VersionNumber) {
		return false
	}
	managerAuth := global.Env().SystemConfig.Configs.ManagerConfig.BasicAuth
	if req == nil || agent_common.ExtractManagerToken(req) != "" || strings.TrimSpace(managerAuth.Username) == "" {
		return false
	}
	user, password, ok := req.BasicAuth()
	if !ok {
		return false
	}
	return user == managerAuth.Username && password == managerAuth.Password.Get()
}

func shouldAllowLegacyManagedRequestWithoutAuth(req *http.Request, instance *model.Instance) bool {
	if instance == nil {
		return false
	}
	return shouldAllowLegacyManagedRequestWithoutAuthVersion(req, instance.Application.Version.VersionNumber)
}

func shouldAllowLegacyManagedRequestWithoutAuthVersion(req *http.Request, version string) bool {
	if !isLegacyManagedVersion(version) {
		return false
	}
	return req == nil || agent_common.ExtractManagerToken(req) == ""
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
	cmp, err := parsed.Compare(legacyManagedAuthMaxVersion)
	if err != nil {
		return false
	}
	return cmp <= 0
}
