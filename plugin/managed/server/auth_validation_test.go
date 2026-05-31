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
		instance := &model.Instance{
			ManagerCredentialID: "cred-1",
			Application: env.Application{
				Version: env.Version{VersionNumber: "1.30.4"},
			},
		}
		if err := validateLegacyCompatibleManagedAgentRequestAuth(req, instance); err != nil {
			t.Fatalf("expected legacy request without manager auth to pass, got %v", err)
		}
	})

	t.Run("legacy register detection only depends on legacy version", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/instance/_register", nil)
		client := &model.Instance{
			Application: env.Application{
				Version: env.Version{VersionNumber: "1.30.4"},
			},
		}
		if !isLegacyManagedRegisterRequest(req, client, nil) {
			t.Fatal("expected legacy register request to be detected")
		}
		if !shouldAllowLegacyManagedRequestWithoutAuth(req, client) {
			t.Fatal("expected legacy no-auth request to be detected")
		}
	})

	t.Run("register request with access token stays on new flow", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/instance/_register", nil)
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

	t.Run("legacy version still allows no-auth flow even if a manager token header is present", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/instance/_register", nil)
		req.Header.Set(model.API_TOKEN, "manager-token")
		client := &model.Instance{
			Application: env.Application{
				Version: env.Version{VersionNumber: "1.30.4"},
			},
		}
		if !shouldAllowLegacyManagedRequestWithoutAuth(req, client) {
			t.Fatal("expected legacy version to keep compatibility auth even with token headers present")
		}
	})

	t.Run("legacy basic auth helper still recognizes matching basic auth", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/configs/_sync", nil)
		req.SetBasicAuth("manager", "secret")
		instance := &model.Instance{
			Application: env.Application{
				Version: env.Version{VersionNumber: "1.30.4"},
			},
		}
		if !isLegacyManagedBasicAuthRequest(req, instance) {
			t.Fatal("expected legacy basic auth request to be detected")
		}
	})

	t.Run("newer version does not use legacy compatibility flow", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/configs/_sync", nil)
		instance := &model.Instance{
			Application: env.Application{
				Version: env.Version{VersionNumber: "1.30.5"},
			},
		}
		if shouldAllowLegacyManagedRequestWithoutAuth(req, instance) {
			t.Fatal("expected newer version to stay on token flow")
		}
	})

	t.Run("request legacy version overrides stored newer version", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/configs/_sync", nil)
		instance := &model.Instance{
			Application: env.Application{
				Version: env.Version{VersionNumber: "1.31.0"},
			},
		}
		if err := validateLegacyCompatibleManagedAgentRequestAuthForVersion(req, instance, "1.30.3"); err != nil {
			t.Fatalf("expected request legacy version to allow compatibility auth, got %v", err)
		}
	})
}
