package server

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/security"
	"infini.sh/framework/modules/security/access_token"
)

const instanceTokenExchangeAPI = "/instance/_exchange_token"

// -1 means the exchanged manager api token never expires.
const managedAgentSyncTokenExpireAt int64 = -1

type tokenExchangeRequest struct {
	InstanceID    string `json:"instance_id,omitempty"`
	AgentAPIToken string `json:"agent_api_token,omitempty"`
}

type tokenExchangeResponse struct {
	ManagerAPIToken string `json:"manager_api_token,omitempty"`
}

var errManagerAPITokenRequired = errors.New("manager api token is required")
var errManagerAPITokenInvalid = errors.New("manager api token is invalid")

func writeTokenAuthError(h APIHandler, w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}

	switch {
	case errors.Is(err, errBootstrapTokenRequired),
		errors.Is(err, errBootstrapTokenInvalid),
		errors.Is(err, errBootstrapTokenExpired),
		errors.Is(err, errManagerAPITokenRequired),
		errors.Is(err, errManagerAPITokenInvalid):
		h.WriteError(w, err.Error(), http.StatusUnauthorized)
	default:
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
	}

	return true
}

func getManagerAPIToken(token string, instance *model.Instance, permissions ...security.PermissionKey) (*security.AccessToken, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, errManagerAPITokenRequired
	}

	record, err := getManagedAPIToken(token)
	if err != nil {
		return nil, errManagerAPITokenInvalid
	}
	if err := requireManagedPermissions(record, permissions...); err != nil {
		return nil, errManagerAPITokenInvalid
	}

	instance, err = loadStoredInstance(instance)
	if err != nil {
		return nil, err
	}
	if instance == nil {
		return nil, errManagerAPITokenInvalid
	}
	if err := requireManagedInstance(record, instance); err != nil {
		return nil, errManagerAPITokenInvalid
	}
	return record, nil
}

func validateManagerAPIToken(token string, instance *model.Instance, permissions ...security.PermissionKey) error {
	_, err := getManagerAPIToken(token, instance, permissions...)
	return err
}

func authorizeExchangeToken(token string, instance *model.Instance) (string, string, error) {
	_, err := getManagerAPIToken(token, instance, managedExchangePermission)
	if err == nil {
		return "", token, nil
	}
	if !errors.Is(err, errManagerAPITokenInvalid) {
		return "", "", err
	}

	userID, regErr := getBootstrapTokenUserID(token)
	if regErr != nil {
		return "", "", regErr
	}
	return userID, "", nil
}

func loadStoredInstance(instance *model.Instance) (*model.Instance, error) {
	if instance == nil || strings.TrimSpace(instance.ID) == "" {
		return nil, nil
	}
	if getManagerAPICredentialID(instance) != "" {
		return instance, nil
	}
	return loadExistingInstance(instance.ID)
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

func ensureManagerAPICredential(instance *model.Instance, managerAPIToken, userID string) (string, string, error) {
	managerCredentialID := getManagerAPICredentialID(instance)
	if strings.TrimSpace(managerAPIToken) == "" {
		return issueManagerAPIToken(instance, userID)
	}
	if managerCredentialID != "" {
		return managerAPIToken, managerCredentialID, nil
	}

	managerCredentialID, err := upsertInstanceManagerAPICredential(instance, managerAPIToken)
	if err != nil {
		return "", "", err
	}
	return managerAPIToken, managerCredentialID, nil
}

func persistExchangedTokens(instance *model.Instance, agentAPIToken, managerAPIToken, userID string) (string, error) {
	agentCredentialID, err := upsertInstanceAgentAPICredential(instance, agentAPIToken)
	if err != nil {
		return "", err
	}
	setAgentAPICredentialID(instance, agentCredentialID)

	managerAPIToken, managerCredentialID, err := ensureManagerAPICredential(instance, managerAPIToken, userID)
	if err != nil {
		return "", err
	}
	setManagerAPICredentialID(instance, managerCredentialID)
	clearInstanceAccessToken(instance)

	if err := orm.Save(nil, instance); err != nil {
		return "", err
	}
	return managerAPIToken, nil
}

func validateRegisterRequestAuth(req *http.Request, instance *model.Instance) error {
	token := strings.TrimSpace(req.Header.Get(access_token.HeaderAPIToken))
	if token == "" {
		return nil
	}

	err := validateManagerAPIToken(token, instance, managedRegisterPermission)
	if err == nil || !errors.Is(err, errManagerAPITokenInvalid) {
		return err
	}

	return validateBootstrapToken(token)
}

func validateSyncRequestAuth(req *http.Request, instance *model.Instance) error {
	managerAPIToken := strings.TrimSpace(req.Header.Get(access_token.HeaderAPIToken))
	if managerAPIToken == "" {
		return nil
	}
	return validateManagerAPIToken(managerAPIToken, instance, managedSyncPermission)
}

func issueManagerAPIToken(instance *model.Instance, userID string) (string, string, error) {
	if instance == nil {
		return "", "", fmt.Errorf("instance is nil")
	}
	if strings.TrimSpace(userID) == "" {
		return "", "", fmt.Errorf("user id is empty")
	}

	managerAPIToken, err := issueManagedAPIToken(
		newManagedTokenUser(userID, instance),
		fmt.Sprintf("%s manager api", getInstanceCredentialName(instance)),
		"managed_agent_sync",
		managedAgentSyncTokenExpireAt,
		getManagerTokenPermissions(),
	)
	if err != nil {
		return "", "", err
	}

	credentialID, err := upsertInstanceManagerAPICredential(instance, managerAPIToken)
	if err != nil {
		return "", "", err
	}

	return managerAPIToken, credentialID, nil
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

	instance, err := loadExistingInstance(reqBody.InstanceID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if instance == nil {
		h.WriteError(w, "instance not found", http.StatusBadRequest)
		return
	}
	obj := *instance

	userID, managerAPIToken, err := authorizeExchangeToken(strings.TrimSpace(req.Header.Get(access_token.HeaderAPIToken)), &obj)
	if writeTokenAuthError(h, w, err) {
		return
	}
	managerAPIToken, err = persistExchangedTokens(&obj, reqBody.AgentAPIToken, managerAPIToken, userID)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, tokenExchangeResponse{
		ManagerAPIToken: managerAPIToken,
	}, http.StatusOK)
}
