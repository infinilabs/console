package api

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v4"
	consolesecurity "infini.sh/console/core/security"
	securityapi "infini.sh/console/modules/security/api"
	api2 "infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	_ "infini.sh/framework/modules/security/account"
	_ "infini.sh/framework/modules/security/http_filters"
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

func TestConsoleAccountProfileUsesConsoleTokenOnUI(t *testing.T) {
	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
	})

	global.Env().SystemConfig.WebAppConfig.Security.Enabled = true

	webCfg := config.WebAppConfig{}
	webCfg.NetworkConfig.Binding = "127.0.0.1:0"

	api2.StartWeb(webCfg)
	resp := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/account/profile", nil)
	req.Header.Set("Authorization", "Bearer "+issueConsoleTestToken(t, "profile-user"))
	if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
		t.Fatalf("serve original profile route: %v", err)
	}
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected framework /account/profile ui route to reject console token before override, got %d", resp.Code)
	}
	api2.StopWeb(webCfg)

	securityapi.Init()
	registerConsoleAccountProxyUIRoutes(consoleSelfAPIHandler{})

	api2.StartWeb(webCfg)
	defer api2.StopWeb(webCfg)

	resp = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/account/profile", nil)
	req.Header.Set("Authorization", "Bearer "+issueConsoleTestToken(t, "profile-user-override"))
	if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
		t.Fatalf("serve overridden profile route: %v", err)
	}
	if resp.Code != http.StatusOK {
		t.Fatalf("expected console token to work on overridden /account/profile ui route, got %d", resp.Code)
	}
}

func TestRefreshConsoleSelfAPIProxyUIRoutesMirrorsLateProtectedAPIRoutes(t *testing.T) {
	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
	})

	global.Env().SystemConfig.WebAppConfig.Security.Enabled = false

	initConsoleSelfAPI()

	api2.HandleAPIMethod(api2.GET, "/late-ui-proxy-route", func(w http.ResponseWriter, _ *http.Request, _ httprouter.Params) {
		w.WriteHeader(http.StatusNoContent)
	})

	resp := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/late-ui-proxy-route", nil)
	if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
		t.Fatalf("serve late ui route before refresh: %v", err)
	}
	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected late API route to be absent before refresh, got %d", resp.Code)
	}

	RefreshConsoleSelfAPIProxyUIRoutes()

	webCfg := config.WebAppConfig{}
	webCfg.NetworkConfig.Binding = "127.0.0.1:0"
	api2.StartWeb(webCfg)
	defer api2.StopWeb(webCfg)

	resp = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/late-ui-proxy-route", nil)
	if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
		t.Fatalf("serve late ui route after refresh: %v", err)
	}
	if resp.Code != http.StatusNoContent {
		t.Fatalf("expected late API route to be mirrored after refresh, got %d", resp.Code)
	}
}

func TestRefreshConsoleSelfAPIProxyUIRoutesKeepsPublicAPIRoutesPublic(t *testing.T) {
	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
	})

	global.Env().SystemConfig.WebAppConfig.Security.Enabled = true

	initConsoleSelfAPI()

	api2.HandleAPIMethod(api2.GET, "/late-public-ui-proxy-route", func(w http.ResponseWriter, _ *http.Request, _ httprouter.Params) {
		w.WriteHeader(http.StatusAccepted)
	}, api2.AllowPublicAccess())

	RefreshConsoleSelfAPIProxyUIRoutes()

	webCfg := config.WebAppConfig{}
	webCfg.NetworkConfig.Binding = "127.0.0.1:0"
	api2.StartWeb(webCfg)
	defer api2.StopWeb(webCfg)

	resp := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/late-public-ui-proxy-route", nil)
	if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
		t.Fatalf("serve late public ui route: %v", err)
	}
	if resp.Code != http.StatusAccepted {
		t.Fatalf("expected public API route to stay public on UI mirror, got %d", resp.Code)
	}
}

func TestRefreshConsoleSelfAPIProxyUIRoutesMirrorsLateProtectedAPIRoutesAfterWebStart(t *testing.T) {
	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
	})

	global.Env().SystemConfig.WebAppConfig.Security.Enabled = false

	initConsoleSelfAPI()

	webCfg := config.WebAppConfig{}
	webCfg.NetworkConfig.Binding = "127.0.0.1:0"
	api2.StartWeb(webCfg)
	defer api2.StopWeb(webCfg)

	api2.HandleAPIMethod(api2.GET, "/late-runtime-ui-proxy-route", func(w http.ResponseWriter, _ *http.Request, _ httprouter.Params) {
		w.WriteHeader(http.StatusNoContent)
	})

	resp := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/late-runtime-ui-proxy-route", nil)
	if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
		t.Fatalf("serve runtime ui route before refresh: %v", err)
	}
	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected late API route to be absent before runtime refresh, got %d", resp.Code)
	}

	RefreshConsoleSelfAPIProxyUIRoutes()

	resp = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/late-runtime-ui-proxy-route", nil)
	if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
		t.Fatalf("serve runtime ui route after refresh: %v", err)
	}
	if resp.Code != http.StatusNoContent {
		t.Fatalf("expected late API route to be mirrored after runtime refresh, got %d", resp.Code)
	}
}

func issueConsoleTestToken(t *testing.T, userID string) string {
	t.Helper()

	expireAt := time.Now().Add(time.Hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, consolesecurity.UserClaims{
		ShortUser: &consolesecurity.ShortUser{
			Provider: "native",
			Username: "tester",
			UserId:   userID,
			Roles:    []string{"Administrator"},
		},
		RegisteredClaims: &jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expireAt),
		},
	})

	tokenString, err := token.SignedString([]byte(consolesecurity.Secret))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}

	consolesecurity.SetUserToken(userID, consolesecurity.Token{
		Value:    tokenString,
		ExpireIn: expireAt.Unix(),
	})
	t.Cleanup(func() {
		consolesecurity.DeleteUserToken(userID)
	})

	return tokenString
}
