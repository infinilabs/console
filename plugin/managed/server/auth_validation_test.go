package server

import (
	"net/http/httptest"
	"testing"

	agent_common "infini.sh/console/modules/agent/common"
	config3 "infini.sh/framework/core/config"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	ucfg "infini.sh/framework/lib/go-ucfg"
	configcommon "infini.sh/framework/modules/configs/common"
)

func TestValidateManagedAgentRequestAuth(t *testing.T) {
	oldBasicAuth := global.Env().SystemConfig.Configs.ManagerConfig.BasicAuth
	t.Cleanup(func() {
		global.Env().SystemConfig.Configs.ManagerConfig.BasicAuth = oldBasicAuth
	})

	global.Env().SystemConfig.Configs.ManagerConfig.BasicAuth = config3.BasicAuth{
		Username: "manager",
		Password: ucfg.SecretString("secret"),
	}

	t.Run("rejects missing auth", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/configs/_sync", nil)
		err := validateManagedAgentRequestAuth(req, &model.Instance{})
		if err != agent_common.ErrInvalidManagerBasicAuth {
			t.Fatalf("expected missing auth to be rejected, got %v", err)
		}
	})

	t.Run("accepts valid basic auth", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/configs/_sync", nil)
		req.SetBasicAuth("manager", "secret")
		if err := validateManagedAgentRequestAuth(req, &model.Instance{}); err != nil {
			t.Fatalf("expected basic auth to pass, got %v", err)
		}
	})

	t.Run("legacy compatible auth accepts basic auth with credentialed instance", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/configs/_sync", nil)
		req.SetBasicAuth("manager", "secret")
		instance := &model.Instance{
			ManagerCredentialID: "cred-1",
			Application: env.Application{
				Version: env.Version{VersionNumber: "1.30.4"},
			},
		}
		if err := validateLegacyCompatibleManagedAgentRequestAuth(req, instance); err != nil {
			t.Fatalf("expected legacy basic auth to pass, got %v", err)
		}
	})

	t.Run("legacy register detection requires legacy basic auth and no access token", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/instance/_register", nil)
		req.SetBasicAuth("manager", "secret")
		client := &model.Instance{
			Application: env.Application{
				Version: env.Version{VersionNumber: "1.30.4"},
			},
		}
		if !isLegacyManagedRegisterRequest(req, client, nil) {
			t.Fatal("expected legacy register request to be detected")
		}
		if !isLegacyManagedBasicAuthRequest(req, client) {
			t.Fatal("expected legacy basic auth request to be detected")
		}
	})

	t.Run("register request with access token stays on new flow", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/instance/_register", nil)
		req.SetBasicAuth("manager", "secret")
		accessToken := &configcommon.RegisterToken{Value: "access-token"}
		client := &model.Instance{
			Application: env.Application{
				Version: env.Version{VersionNumber: "1.30.4"},
			},
		}
		if isLegacyManagedRegisterRequest(req, client, accessToken) {
			t.Fatal("expected token-capable register request to stay on new flow")
		}
	})

	t.Run("manager token request is not treated as legacy basic auth", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/instance/_register", nil)
		req.Header.Set(model.API_TOKEN, "manager-token")
		req.SetBasicAuth("manager", "secret")
		client := &model.Instance{
			Application: env.Application{
				Version: env.Version{VersionNumber: "1.30.4"},
			},
		}
		if isLegacyManagedBasicAuthRequest(req, client) {
			t.Fatal("expected token-bearing request to avoid legacy basic auth flow")
		}
	})

	t.Run("newer version does not use legacy basic auth flow", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/configs/_sync", nil)
		req.SetBasicAuth("manager", "secret")
		instance := &model.Instance{
			Application: env.Application{
				Version: env.Version{VersionNumber: "1.30.5"},
			},
		}
		if isLegacyManagedBasicAuthRequest(req, instance) {
			t.Fatal("expected newer version to stay on token flow")
		}
	})
}
