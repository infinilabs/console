package security

import (
	"bytes"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"

	api2 "infini.sh/framework/core/api"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
)

func newSecurityTestBinding(t *testing.T) string {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen on random port: %v", err)
	}
	defer listener.Close()

	return listener.Addr().String()
}

func TestAccessTokenUIRoutesAreRegistered(t *testing.T) {
	oldEnv := global.Env()
	testEnv := env.EmptyEnv()
	testEnv.SystemConfig.PathConfig.Data = t.TempDir()
	testEnv.SystemConfig.WebAppConfig.Security.Enabled = false
	global.RegisterEnv(testEnv)
	defer global.RegisterEnv(oldEnv)

	for _, callback := range global.GetFuncBeforeSetup() {
		callback()
	}

	webCfg := config.WebAppConfig{}
	webCfg.NetworkConfig.Binding = newSecurityTestBinding(t)
	api2.StartWeb(webCfg)
	defer api2.StopWeb(webCfg)

	req := httptest.NewRequest(http.MethodPost, "http://console.local/auth/access_token", bytes.NewBufferString(`{}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	func() {
		defer func() {
			_ = recover()
		}()
		if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
			t.Fatalf("serve ui request: %v", err)
		}
	}()

	if resp.Code == http.StatusNotFound {
		t.Fatal("expected /auth/access_token to be registered on the UI router, got 404")
	}
}
