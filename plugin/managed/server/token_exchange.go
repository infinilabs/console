package server

import (
	"fmt"
	"net/http"
	"strings"

	agent_common "infini.sh/console/modules/agent/common"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	configcommon "infini.sh/framework/modules/configs/common"
)

const instanceTokenExchangeAPI = "/instance/_exchange_token"

var getRuntimeInstanceByIDFunc = GetRuntimeInstanceByID
var validateManagedAgentRequestAuthFunc = validateManagedAgentRequestAuth
var upsertInstanceManagerCredentialFunc = upsertInstanceManagerCredential
var upsertInstanceAccessCredentialFunc = upsertInstanceAccessCredential
var saveManagedInstanceFunc = func(instance *model.Instance) error {
	return orm.Save(&orm.Context{Refresh: orm.WaitForRefresh}, instance)
}
var generateManagedAPITokenFunc = func() string {
	return util.GenerateRandomString(48)
}

type tokenExchangeRequest struct {
	InstanceID    string `json:"instance_id,omitempty"`
	AgentAPIToken string `json:"agent_api_token,omitempty"`
}

type tokenExchangeResponse struct {
	ManagerAPIToken string `json:"manager_api_token,omitempty"`
}

func validateTokenExchangeRequest(reqBody *tokenExchangeRequest) error {
	if reqBody == nil {
		return fmt.Errorf("empty request")
	}
	if strings.TrimSpace(reqBody.InstanceID) == "" {
		return fmt.Errorf("empty instance id")
	}
	if strings.TrimSpace(reqBody.AgentAPIToken) == "" {
		return fmt.Errorf("empty agent api token")
	}
	return nil
}

func upsertInstanceManagerCredential(instance *model.Instance, tokenValue string) error {
	if instance == nil {
		return fmt.Errorf("instance is nil")
	}
	tokenValue = strings.TrimSpace(tokenValue)
	if tokenValue == "" {
		return fmt.Errorf("manager api token is empty")
	}
	if instance.ManagerCredentialID != "" {
		previous, err := agent_common.GetTokenCredentialValue(instance.ManagerCredentialID)
		if err != nil {
			return err
		}
		agent_common.RememberPreviousToken(instance.ManagerCredentialID, previous)
		return agent_common.UpdateTokenCredential(
			instance.ManagerCredentialID,
			agent_common.BuildManagerCredentialName(instance),
			agent_common.BuildManagerCredentialTags(),
			tokenValue,
		)
	}

	credentialID, err := agent_common.SaveTokenCredential(
		agent_common.BuildManagerCredentialName(instance),
		agent_common.BuildManagerCredentialTags(),
		tokenValue,
	)
	if err != nil {
		return err
	}
	instance.ManagerCredentialID = credentialID
	return nil
}

func (h APIHandler) exchangeInstanceToken(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	reqBody := &tokenExchangeRequest{}
	if err := h.DecodeJSON(req, reqBody); err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := validateTokenExchangeRequest(reqBody); err != nil {
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, instance, err := getRuntimeInstanceByIDFunc(reqBody.InstanceID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}
	if instance == nil {
		h.WriteError(w, "instance not found", http.StatusBadRequest)
		return
	}
	if !configcommon.SupportsManagedAccessToken(instance.Application.Name) {
		h.WriteError(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}
	if err := validateManagedAgentRequestAuthFunc(req, instance); err != nil {
		if agent_common.IsManagerAuthFailure(err) {
			h.WriteError(w, err.Error(), http.StatusUnauthorized)
		} else {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	managerAPIToken := generateManagedAPITokenFunc()
	if err := upsertInstanceManagerCredentialFunc(instance, managerAPIToken); err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := upsertInstanceAccessCredentialFunc(instance, &configcommon.RegisterToken{Value: reqBody.AgentAPIToken}); err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := saveManagedInstanceFunc(instance); err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, tokenExchangeResponse{
		ManagerAPIToken: managerAPIToken,
	}, http.StatusOK)
}
