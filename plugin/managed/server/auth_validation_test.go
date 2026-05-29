package server

import (
	"net/http/httptest"
	"testing"

	agent_common "infini.sh/console/modules/agent/common"
	config3 "infini.sh/framework/core/config"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	ucfg "infini.sh/framework/lib/go-ucfg"
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
}
