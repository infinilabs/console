package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
)

func TestExtractConsoleSelfAccessToken(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/stats", nil)
	req.Header.Set(model.API_TOKEN, "api-token")
	if got := extractConsoleSelfAccessToken(req); got != "api-token" {
		t.Fatalf("unexpected api token: %q", got)
	}

	req = httptest.NewRequest(http.MethodGet, "/stats", nil)
	req.Header.Set("Authorization", "Bearer bearer-token")
	if got := extractConsoleSelfAccessToken(req); got != "bearer-token" {
		t.Fatalf("unexpected bearer token: %q", got)
	}
}

func TestConsoleSelfAccessTokenValidation(t *testing.T) {
	originalLoad := loadConsoleSelfAccessToken
	t.Cleanup(func() {
		loadConsoleSelfAccessToken = originalLoad
	})

	loadConsoleSelfAccessToken = func() (string, error) {
		return "expected-token", nil
	}

	if !validateConsoleSelfAccessToken("expected-token") {
		t.Fatal("expected self access token to validate")
	}
	if validateConsoleSelfAccessToken("unexpected-token") {
		t.Fatal("expected mismatched self access token to be rejected")
	}
}

func TestConsoleSelfStatsRequireLoginOrAccessToken(t *testing.T) {
	originalLoad := loadConsoleSelfAccessToken
	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	t.Cleanup(func() {
		loadConsoleSelfAccessToken = originalLoad
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
	})

	loadConsoleSelfAccessToken = func() (string, error) {
		return "expected-token", nil
	}
	global.Env().SystemConfig.WebAppConfig.Security.Enabled = false

	handler := consoleSelfAPIHandler{}
	protected := handler.requireLoginOrAccessToken(func(w http.ResponseWriter, req *http.Request, _ httprouter.Params) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/stats", nil)
	req.Header.Set(model.API_TOKEN, "expected-token")
	recorder := httptest.NewRecorder()
	protected(recorder, req, nil)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected token-authenticated request to succeed, got %d", recorder.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/stats", nil)
	recorder = httptest.NewRecorder()
	protected(recorder, req, nil)
	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected missing token to be rejected, got %d", recorder.Code)
	}
}

func TestConsoleSelfTokenAllowsSharedProtectedRoute(t *testing.T) {
	originalLoad := loadConsoleSelfAccessToken
	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	t.Cleanup(func() {
		loadConsoleSelfAccessToken = originalLoad
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
	})

	loadConsoleSelfAccessToken = func() (string, error) {
		return "expected-token", nil
	}
	global.Env().SystemConfig.WebAppConfig.Security.Enabled = false

	handler := consoleSelfAPIHandler{}
	protected := handler.requireLoginOrAccessToken(func(w http.ResponseWriter, req *http.Request, _ httprouter.Params) {
		w.WriteHeader(http.StatusAccepted)
	})

	req := httptest.NewRequest(http.MethodPost, "/pipeline/tasks/_search", nil)
	req.Header.Set("Authorization", "Bearer expected-token")
	recorder := httptest.NewRecorder()
	protected(recorder, req, nil)
	if recorder.Code != http.StatusAccepted {
		t.Fatalf("expected protected shared route to accept console self token, got %d", recorder.Code)
	}
}

func TestApplyConsoleLocalAPIAuth(t *testing.T) {
	originalCfg := global.Env().SystemConfig.APIConfig
	t.Cleanup(func() {
		global.Env().SystemConfig.APIConfig = originalCfg
	})

	global.Env().SystemConfig.APIConfig.Security.Enabled = true
	global.Env().SystemConfig.APIConfig.Security.Username = "local-user"
	global.Env().SystemConfig.APIConfig.Security.Password = "local-pass"

	req := httptest.NewRequest(http.MethodGet, "/stats", nil)
	applyConsoleLocalAPIAuth(req)

	username, password, ok := req.BasicAuth()
	if !ok {
		t.Fatal("expected local api auth to be applied")
	}
	if username != "local-user" || password != "local-pass" {
		t.Fatalf("unexpected local api auth credentials: %s/%s", username, password)
	}
}
