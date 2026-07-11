package api

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	_ "infini.sh/console/modules/security/realm/authc/native"
	api2 "infini.sh/framework/core/api"
	config2 "infini.sh/framework/core/config"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
)

func TestInitRegistersPublicLoginUIRoutes(t *testing.T) {
	oldEnv := global.Env()
	testEnv := env.EmptyEnv()
	testEnv.SystemConfig.PathConfig.Data = t.TempDir()
	global.RegisterEnv(testEnv)
	defer global.RegisterEnv(oldEnv)

	Init()

	webCfg := config2.WebAppConfig{}
	webCfg.NetworkConfig.Binding = "127.0.0.1:0"
	api2.StartWeb(webCfg)
	defer api2.StopWeb(webCfg)

	tests := []struct {
		name string
		path string
		body string
	}{
		{
			name: "replay nonce",
			path: "/account/replay_nonce",
			body: `{"method":"POST","path":"/account/login"}`,
		},
		{
			name: "login challenge",
			path: "/account/login/challenge",
			body: `{"login":""}`,
		},
		{
			name: "login",
			path: "/account/login",
			body: `{"login":""}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "https://console.local"+tt.path, bytes.NewBufferString(tt.body))
			req.Header.Set("Content-Type", "application/json")
			resp := httptest.NewRecorder()

			if err := api2.ServeRegisteredUIRequest(resp, req); err != nil {
				t.Fatalf("serve ui request: %v", err)
			}

			if resp.Code == http.StatusNotFound {
				t.Fatalf("expected %s to be registered on the UI router, got 404", tt.path)
			}
		})
	}
}
