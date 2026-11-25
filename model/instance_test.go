package model

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	agent_common "infini.sh/console/modules/agent/common"
	framework_model "infini.sh/framework/core/model"
	ucfg "infini.sh/framework/lib/go-ucfg"
)

func TestTaskWorkerDoRequestUsesAccessCredentialToken(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer access-token" {
			t.Fatalf("unexpected authorization header: %q", got)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	agent_common.RememberPreviousToken("cred-1", "access-token")

	inst := &TaskWorker{
		Instance: framework_model.Instance{
			Endpoint:           server.URL,
			AccessCredentialID: "cred-1",
		},
	}

	if err := inst.TryConnectWithTimeout(time.Second); err != nil {
		t.Fatalf("expected token auth to work, got %v", err)
	}
}

func TestTaskWorkerDoRequestFallsBackToBasicAuth(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, password, ok := r.BasicAuth()
		if !ok || user != "managed_gateway" || password != "secret" {
			t.Fatalf("unexpected basic auth credentials: ok=%v user=%q password=%q", ok, user, password)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	inst := &TaskWorker{
		Instance: framework_model.Instance{
			Endpoint: server.URL,
			BasicAuth: &framework_model.BasicAuth{
				Username: "managed_gateway",
				Password: ucfg.SecretString("secret"),
			},
		},
	}

	if err := inst.TryConnectWithTimeout(time.Second); err != nil {
		t.Fatalf("expected basic auth to work, got %v", err)
	}
}
