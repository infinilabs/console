package server

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	agent_common "infini.sh/console/modules/agent/common"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/model"
	configcommon "infini.sh/framework/modules/configs/common"
)

func TestValidateTokenExchangeRequest(t *testing.T) {
	tests := []struct {
		name    string
		req     *tokenExchangeRequest
		wantErr string
	}{
		{name: "nil request", req: nil, wantErr: "empty request"},
		{name: "missing instance", req: &tokenExchangeRequest{AgentAPIToken: "agent-token"}, wantErr: "empty instance id"},
		{name: "missing agent token", req: &tokenExchangeRequest{InstanceID: "agent-1"}, wantErr: "empty agent api token"},
		{name: "valid request", req: &tokenExchangeRequest{InstanceID: "agent-1", AgentAPIToken: "agent-token"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateTokenExchangeRequest(tt.req)
			if tt.wantErr == "" {
				if err != nil {
					t.Fatalf("expected nil error, got %v", err)
				}
				return
			}
			if err == nil || err.Error() != tt.wantErr {
				t.Fatalf("expected %q, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestExchangeInstanceToken(t *testing.T) {
	originalGetRuntimeInstanceByIDFunc := getRuntimeInstanceByIDFunc
	originalValidateManagedAgentRequestAuthFunc := validateManagedAgentRequestAuthFunc
	originalUpsertInstanceManagerCredentialFunc := upsertInstanceManagerCredentialFunc
	originalUpsertInstanceAccessCredentialFunc := upsertInstanceAccessCredentialFunc
	originalSaveManagedInstanceFunc := saveManagedInstanceFunc
	originalGenerateManagedAPITokenFunc := generateManagedAPITokenFunc
	t.Cleanup(func() {
		getRuntimeInstanceByIDFunc = originalGetRuntimeInstanceByIDFunc
		validateManagedAgentRequestAuthFunc = originalValidateManagedAgentRequestAuthFunc
		upsertInstanceManagerCredentialFunc = originalUpsertInstanceManagerCredentialFunc
		upsertInstanceAccessCredentialFunc = originalUpsertInstanceAccessCredentialFunc
		saveManagedInstanceFunc = originalSaveManagedInstanceFunc
		generateManagedAPITokenFunc = originalGenerateManagedAPITokenFunc
	})

	instance := &model.Instance{
		Application: env.Application{Name: "agent"},
	}
	instance.ID = "agent-1"

	getRuntimeInstanceByIDFunc = func(instanceID string) (bool, *model.Instance, error) {
		if instanceID != instance.ID {
			t.Fatalf("unexpected instance id: %s", instanceID)
		}
		return true, instance, nil
	}
	validateManagedAgentRequestAuthFunc = func(req *http.Request, obj *model.Instance) error {
		if obj != instance {
			t.Fatalf("unexpected instance: %#v", obj)
		}
		if token := agent_common.ExtractManagerToken(req); token != "bootstrap-token" {
			t.Fatalf("unexpected manager token: %q", token)
		}
		return nil
	}

	managerCredentialUpdated := ""
	accessCredentialUpdated := ""
	upsertInstanceManagerCredentialFunc = func(obj *model.Instance, tokenValue string) error {
		managerCredentialUpdated = tokenValue
		obj.ManagerCredentialID = "manager-cred"
		return nil
	}
	upsertInstanceAccessCredentialFunc = func(obj *model.Instance, registerToken *configcommon.RegisterToken) error {
		if registerToken == nil {
			t.Fatal("expected register token")
		}
		accessCredentialUpdated = registerToken.Value
		obj.AccessCredentialID = "access-cred"
		return nil
	}
	saved := false
	saveManagedInstanceFunc = func(obj *model.Instance) error {
		saved = true
		if obj.ManagerCredentialID != "manager-cred" || obj.AccessCredentialID != "access-cred" {
			t.Fatalf("unexpected credential ids on save: %#v", obj)
		}
		return nil
	}
	generateManagedAPITokenFunc = func() (string, error) {
		return "manager-api-token", nil
	}

	req := httptest.NewRequest(http.MethodPost, instanceTokenExchangeAPI, bytes.NewBufferString(`{"instance_id":"agent-1","agent_api_token":"agent-api-token"}`))
	req.Header.Set(model.API_TOKEN, "bootstrap-token")
	resp := httptest.NewRecorder()

	APIHandler{}.exchangeInstanceToken(resp, req, nil)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body=%s", resp.Code, resp.Body.String())
	}
	if !strings.Contains(resp.Body.String(), `"manager_api_token":"manager-api-token"`) {
		t.Fatalf("unexpected response body: %s", resp.Body.String())
	}
	if managerCredentialUpdated != "manager-api-token" {
		t.Fatalf("unexpected manager token persisted: %q", managerCredentialUpdated)
	}
	if accessCredentialUpdated != "agent-api-token" {
		t.Fatalf("unexpected agent access token persisted: %q", accessCredentialUpdated)
	}
	if !saved {
		t.Fatal("expected instance to be saved")
	}
}

func TestExchangeInstanceTokenSupportsGateway(t *testing.T) {
	originalGetRuntimeInstanceByIDFunc := getRuntimeInstanceByIDFunc
	originalValidateManagedAgentRequestAuthFunc := validateManagedAgentRequestAuthFunc
	originalUpsertInstanceManagerCredentialFunc := upsertInstanceManagerCredentialFunc
	originalUpsertInstanceAccessCredentialFunc := upsertInstanceAccessCredentialFunc
	originalSaveManagedInstanceFunc := saveManagedInstanceFunc
	originalGenerateManagedAPITokenFunc := generateManagedAPITokenFunc
	t.Cleanup(func() {
		getRuntimeInstanceByIDFunc = originalGetRuntimeInstanceByIDFunc
		validateManagedAgentRequestAuthFunc = originalValidateManagedAgentRequestAuthFunc
		upsertInstanceManagerCredentialFunc = originalUpsertInstanceManagerCredentialFunc
		upsertInstanceAccessCredentialFunc = originalUpsertInstanceAccessCredentialFunc
		saveManagedInstanceFunc = originalSaveManagedInstanceFunc
		generateManagedAPITokenFunc = originalGenerateManagedAPITokenFunc
	})

	instance := &model.Instance{
		Application: env.Application{Name: "gateway"},
	}
	instance.ID = "gateway-1"

	getRuntimeInstanceByIDFunc = func(instanceID string) (bool, *model.Instance, error) {
		return true, instance, nil
	}
	validateManagedAgentRequestAuthFunc = func(req *http.Request, obj *model.Instance) error {
		return nil
	}
	upsertInstanceManagerCredentialFunc = func(obj *model.Instance, tokenValue string) error {
		obj.ManagerCredentialID = "manager-cred"
		return nil
	}
	upsertInstanceAccessCredentialFunc = func(obj *model.Instance, registerToken *configcommon.RegisterToken) error {
		obj.AccessCredentialID = "access-cred"
		return nil
	}
	saveManagedInstanceFunc = func(obj *model.Instance) error {
		return nil
	}
	generateManagedAPITokenFunc = func() (string, error) {
		return "manager-api-token", nil
	}

	req := httptest.NewRequest(http.MethodPost, instanceTokenExchangeAPI, bytes.NewBufferString(`{"instance_id":"gateway-1","agent_api_token":"gateway-api-token"}`))
	req.Header.Set(model.API_TOKEN, "bootstrap-token")
	resp := httptest.NewRecorder()

	APIHandler{}.exchangeInstanceToken(resp, req, nil)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body=%s", resp.Code, resp.Body.String())
	}
}

func TestExchangeInstanceTokenRejectsInvalidManagerAuth(t *testing.T) {
	originalGetRuntimeInstanceByIDFunc := getRuntimeInstanceByIDFunc
	originalValidateManagedAgentRequestAuthFunc := validateManagedAgentRequestAuthFunc
	t.Cleanup(func() {
		getRuntimeInstanceByIDFunc = originalGetRuntimeInstanceByIDFunc
		validateManagedAgentRequestAuthFunc = originalValidateManagedAgentRequestAuthFunc
	})

	instance := &model.Instance{
		Application: env.Application{Name: "agent"},
	}
	instance.ID = "agent-1"
	getRuntimeInstanceByIDFunc = func(instanceID string) (bool, *model.Instance, error) {
		return true, instance, nil
	}
	validateManagedAgentRequestAuthFunc = func(req *http.Request, obj *model.Instance) error {
		return agent_common.ErrInvalidManagerToken
	}

	req := httptest.NewRequest(http.MethodPost, instanceTokenExchangeAPI, bytes.NewBufferString(`{"instance_id":"agent-1","agent_api_token":"agent-api-token"}`))
	resp := httptest.NewRecorder()

	APIHandler{}.exchangeInstanceToken(resp, req, nil)

	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d, body=%s", resp.Code, resp.Body.String())
	}
}

func TestExchangeInstanceTokenHandlesLookupError(t *testing.T) {
	originalGetRuntimeInstanceByIDFunc := getRuntimeInstanceByIDFunc
	t.Cleanup(func() {
		getRuntimeInstanceByIDFunc = originalGetRuntimeInstanceByIDFunc
	})

	getRuntimeInstanceByIDFunc = func(instanceID string) (bool, *model.Instance, error) {
		return false, nil, errors.New("lookup failed")
	}

	req := httptest.NewRequest(http.MethodPost, instanceTokenExchangeAPI, bytes.NewBufferString(`{"instance_id":"agent-1","agent_api_token":"agent-api-token"}`))
	resp := httptest.NewRecorder()

	APIHandler{}.exchangeInstanceToken(resp, req, nil)

	if resp.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d, body=%s", resp.Code, resp.Body.String())
	}
}

func TestMigrateLegacyManagedRegisterAuthRotatesExistingManagerCredential(t *testing.T) {
	originalUpsertInstanceManagerCredentialFunc := upsertInstanceManagerCredentialFunc
	originalUpsertInstanceAccessCredentialFunc := upsertInstanceAccessCredentialFunc
	originalFindPendingManagerTokenByValueFunc := findPendingManagerTokenByValueFunc
	t.Cleanup(func() {
		upsertInstanceManagerCredentialFunc = originalUpsertInstanceManagerCredentialFunc
		upsertInstanceAccessCredentialFunc = originalUpsertInstanceAccessCredentialFunc
		findPendingManagerTokenByValueFunc = originalFindPendingManagerTokenByValueFunc
	})

	current := &model.Instance{
		Application: env.Application{
			Name:    "agent",
			Version: env.Version{VersionNumber: "1.30.3"},
		},
	}
	existing := &model.Instance{
		ManagerCredentialID: "manager-cred",
		Application: env.Application{
			Name:    "agent",
			Version: env.Version{VersionNumber: "1.31.0"},
		},
	}
	req := httptest.NewRequest(http.MethodPost, "/instance/_register", nil)
	req.Header.Set(model.API_TOKEN, "new-bootstrap-token")

	findPendingManagerTokenByValueFunc = func(tokenValue string) (*agent_common.PendingRegistrationToken, error) {
		if tokenValue != "new-bootstrap-token" {
			t.Fatalf("unexpected pending manager token lookup: %q", tokenValue)
		}
		return &agent_common.PendingRegistrationToken{}, nil
	}

	managerToken := ""
	accessToken := ""
	upsertInstanceManagerCredentialFunc = func(instance *model.Instance, tokenValue string) error {
		managerToken = tokenValue
		return nil
	}
	upsertInstanceAccessCredentialFunc = func(instance *model.Instance, registerToken *configcommon.RegisterToken) error {
		if registerToken == nil {
			t.Fatal("expected access token")
		}
		accessToken = registerToken.Value
		return nil
	}

	migrated, err := migrateLegacyManagedRegisterAuth(req, current, existing, &configcommon.RegisterToken{Value: "agent-access-token"})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if !migrated {
		t.Fatal("expected legacy registration auth to migrate")
	}
	if managerToken != "new-bootstrap-token" {
		t.Fatalf("expected manager token to rotate, got %q", managerToken)
	}
	if accessToken != "agent-access-token" {
		t.Fatalf("expected access token to update, got %q", accessToken)
	}
}
