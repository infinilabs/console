package server

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
)

func TestShouldFallbackInstanceInfoPath(t *testing.T) {
	testCases := []struct {
		name   string
		path   string
		res    *util.Result
		err    error
		expect bool
	}{
		{
			name:   "fallback on agent 404",
			path:   "/agent/_info",
			res:    &util.Result{StatusCode: http.StatusNotFound},
			err:    assertiveError("request error"),
			expect: true,
		},
		{
			name:   "no fallback on agent 401",
			path:   "/agent/_info",
			res:    &util.Result{StatusCode: http.StatusUnauthorized},
			err:    assertiveError("request error"),
			expect: false,
		},
		{
			name:   "fallback on transport error",
			path:   "/agent/_info",
			err:    assertiveError("dial tcp"),
			expect: true,
		},
		{
			name:   "no fallback on non agent path",
			path:   "/_info",
			res:    &util.Result{StatusCode: http.StatusNotFound},
			err:    assertiveError("request error"),
			expect: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if actual := shouldFallbackInstanceInfoPath(tc.path, tc.res, tc.err); actual != tc.expect {
				t.Fatalf("unexpected fallback result: got %v want %v", actual, tc.expect)
			}
		})
	}
}

func TestProxyInstanceRequestUsesRegisteredProvider(t *testing.T) {
	originalProviders := instanceProxyProviders
	instanceProxyProviders = nil
	defer func() {
		instanceProxyProviders = originalProviders
	}()

	called := false
	RegisterInstanceProxyProvider(func(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, bool, error) {
		called = true
		if instance == nil || instance.ID != "agent-1" {
			t.Fatalf("unexpected instance: %#v", instance)
		}
		if req == nil || req.Path != "/stats" {
			t.Fatalf("unexpected request: %#v", req)
		}
		if out, ok := responseObjectToUnMarshall.(*util.MapStr); ok {
			(*out)["system"] = util.MapStr{"cpu": 12}
		} else {
			t.Fatalf("unexpected response object type: %T", responseObjectToUnMarshall)
		}
		return &util.Result{StatusCode: http.StatusOK}, true, nil
	})

	stats := util.MapStr{}
	instance := &model.Instance{}
	instance.ID = "agent-1"

	ok := fetchManagedInstanceStats(nil, instance, &stats)
	if !ok {
		t.Fatal("expected stats fetch to succeed")
	}
	if !called {
		t.Fatal("expected registered proxy provider to be called")
	}
	if _, exists := stats["system"]; !exists {
		t.Fatalf("expected stats to be populated, got %#v", stats)
	}
}

func TestFetchManagedInstanceStatsReturnsFalseOnProxyError(t *testing.T) {
	originalProviders := instanceProxyProviders
	instanceProxyProviders = nil
	defer func() {
		instanceProxyProviders = originalProviders
	}()

	RegisterInstanceProxyProvider(func(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, bool, error) {
		return nil, true, assertiveError("boom")
	})

	instance := &model.Instance{}
	instance.ID = "agent-1"

	if fetchManagedInstanceStats(nil, instance, &util.MapStr{}) {
		t.Fatal("expected stats fetch to fail")
	}
}

func TestGetRuntimeInstanceInfoUsesAgentInfoPathForAgentInstance(t *testing.T) {
	originalProviders := instanceProxyProviders
	instanceProxyProviders = nil
	defer func() {
		instanceProxyProviders = originalProviders
	}()

	RegisterInstanceProxyProvider(func(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, bool, error) {
		if req == nil || req.Path != "/agent/_info" {
			t.Fatalf("unexpected request path: %#v", req)
		}
		if out, ok := responseObjectToUnMarshall.(*model.Instance); ok {
			out.Name = "agent-a"
		} else {
			t.Fatalf("unexpected response object type: %T", responseObjectToUnMarshall)
		}
		return &util.Result{StatusCode: http.StatusOK}, true, nil
	})

	instance := &model.Instance{
		Application: env.Application{Name: "agent"},
	}
	instance.ID = "agent-1"

	info, err := (&APIHandler{}).getRuntimeInstanceInfo(instance)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if info == nil || info.Name != "agent-a" {
		t.Fatalf("unexpected runtime instance info: %#v", info)
	}
}

func TestShouldReuseCurrentRequestAuthForEndpoint(t *testing.T) {
	originalEnv := global.Env()
	testEnv := env.EmptyEnv()
	testEnv.SystemConfig.WebAppConfig = config.WebAppConfig{Enabled: true}
	testEnv.SystemConfig.WebAppConfig.NetworkConfig.Binding = "0.0.0.0:9000"
	global.RegisterEnv(testEnv)
	defer global.RegisterEnv(originalEnv)

	if !shouldReuseCurrentRequestAuthForEndpoint("https://127.0.0.1:9000") {
		t.Fatal("expected loopback console web endpoint to reuse current request auth")
	}
	if shouldReuseCurrentRequestAuthForEndpoint("https://127.0.0.1:9443") {
		t.Fatal("expected different port not to reuse current request auth")
	}
	if shouldReuseCurrentRequestAuthForEndpoint("https://203.0.113.10:9000") {
		t.Fatal("expected remote host not to reuse current request auth")
	}
}

func TestEffectiveInstanceProbeAccessTokenUsesCurrentBearerForLocalConsoleEndpoint(t *testing.T) {
	originalEnv := global.Env()
	testEnv := env.EmptyEnv()
	testEnv.SystemConfig.WebAppConfig = config.WebAppConfig{Enabled: true}
	testEnv.SystemConfig.WebAppConfig.NetworkConfig.Binding = "0.0.0.0:9000"
	global.RegisterEnv(testEnv)
	defer global.RegisterEnv(originalEnv)

	req := httptest.NewRequest(http.MethodPost, "/instance/try_connect", nil)
	req.Header.Set("Authorization", "Bearer current-console-token")

	if got := effectiveInstanceProbeAccessToken(req, "https://127.0.0.1:9000", ""); got != "current-console-token" {
		t.Fatalf("expected current bearer token to be reused for local console endpoint, got %q", got)
	}
	if got := effectiveInstanceProbeAccessToken(req, "https://203.0.113.10:9000", ""); got != "" {
		t.Fatalf("expected remote endpoint not to reuse current bearer token, got %q", got)
	}
	if got := effectiveInstanceProbeAccessToken(req, "https://127.0.0.1:9000", "explicit-token"); got != "explicit-token" {
		t.Fatalf("expected explicit access token to win, got %q", got)
	}
}

func TestEffectiveManagedInstanceAccessTokenUsesCurrentBearerForLocalConsoleEndpoint(t *testing.T) {
	originalEnv := global.Env()
	testEnv := env.EmptyEnv()
	testEnv.SystemConfig.WebAppConfig = config.WebAppConfig{Enabled: true}
	testEnv.SystemConfig.WebAppConfig.NetworkConfig.Binding = "0.0.0.0:9000"
	global.RegisterEnv(testEnv)
	defer global.RegisterEnv(originalEnv)

	req := httptest.NewRequest(http.MethodGet, "/instance/stats", nil)
	req.Header.Set("Authorization", "Bearer current-console-token")

	localConsole := &model.Instance{Endpoint: "https://127.0.0.1:9000"}
	if got := effectiveManagedInstanceAccessToken(req, localConsole); got != "current-console-token" {
		t.Fatalf("expected current bearer token to be reused for local console endpoint, got %q", got)
	}

	localConsole.AccessCredentialID = "stored-access-credential"
	if got := effectiveManagedInstanceAccessToken(req, localConsole); got != "" {
		t.Fatalf("expected stored access credential to win over current bearer token, got %q", got)
	}

	remote := &model.Instance{Endpoint: "https://203.0.113.10:9000"}
	if got := effectiveManagedInstanceAccessToken(req, remote); got != "" {
		t.Fatalf("expected remote endpoint not to reuse current bearer token, got %q", got)
	}
}

func TestShouldFetchManagedInstanceStatsLocallyUsesCurrentInstanceID(t *testing.T) {
	originalEnv := global.Env()
	testEnv := env.EmptyEnv()
	testEnv.SystemConfig.NodeConfig.ID = "console-self"
	global.RegisterEnv(testEnv)
	defer global.RegisterEnv(originalEnv)

	instance := &model.Instance{
		Endpoint: "https://203.0.113.10:9443",
	}
	instance.ID = "console-self"
	if !shouldFetchManagedInstanceStatsLocally(instance) {
		t.Fatal("expected current instance ID to force local stats fetch")
	}
}

func TestFetchManagedInstanceStatsUsesLocalHandlerForCurrentInstanceID(t *testing.T) {
	originalEnv := global.Env()
	testEnv := env.EmptyEnv()
	testEnv.SystemConfig.NodeConfig.ID = "console-self"
	global.RegisterEnv(testEnv)
	defer global.RegisterEnv(originalEnv)

	api.HandleAPIMethod(api.GET, "/stats", func(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"cluster":{"green":1}}`))
	})

	originalProviders := instanceProxyProviders
	instanceProxyProviders = nil
	defer func() {
		instanceProxyProviders = originalProviders
	}()
	RegisterInstanceProxyProvider(func(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, bool, error) {
		t.Fatal("expected self stats fetch to use local handler instead of proxy")
		return nil, true, nil
	})

	stats := util.MapStr{}
	instance := &model.Instance{
		Endpoint: "https://203.0.113.10:9443",
	}
	instance.ID = "console-self"
	if !fetchManagedInstanceStats(nil, instance, &stats) {
		t.Fatal("expected stats fetch to succeed")
	}
	cluster, ok := stats["cluster"].(map[string]interface{})
	if !ok || cluster["green"] == nil {
		t.Fatalf("unexpected stats payload: %#v", stats)
	}
}

func TestResolveInstanceWebsocketEndpointPrefersWebServiceForLogViewer(t *testing.T) {
	instance := &model.Instance{
		Endpoint: "https://127.0.0.1:2900",
		Services: []model.ServiceInfo{
			{Name: "api", Endpoint: "https://127.0.0.1:2900"},
			{Name: "web", Endpoint: "https://127.0.0.1:9000"},
		},
	}

	if got := resolveInstanceWebsocketEndpoint(instance, "/ws", "wss://127.0.0.1:2900"); got != "wss://127.0.0.1:9000" {
		t.Fatalf("expected web service websocket endpoint, got %q", got)
	}
}

func TestResolveInstanceWebsocketEndpointFallsBackToInstanceEndpoint(t *testing.T) {
	instance := &model.Instance{
		Endpoint: "http://127.0.0.1:2900",
		Services: []model.ServiceInfo{
			{Name: "api", Endpoint: "http://127.0.0.1:2900"},
		},
	}

	if got := resolveInstanceWebsocketEndpoint(instance, "/ws", ""); got != "ws://127.0.0.1:2900" {
		t.Fatalf("expected instance endpoint websocket fallback, got %q", got)
	}
}

func TestResolveInstanceWebsocketEndpointKeepsExplicitEndpointForNonLogPath(t *testing.T) {
	instance := &model.Instance{
		Endpoint: "https://127.0.0.1:2900",
		Services: []model.ServiceInfo{
			{Name: "web", Endpoint: "https://127.0.0.1:9000"},
		},
	}

	if got := resolveInstanceWebsocketEndpoint(instance, "/custom", "wss://127.0.0.1:9443/custom"); got != "wss://127.0.0.1:9443/custom" {
		t.Fatalf("expected explicit websocket target to be preserved, got %q", got)
	}
}

func TestRewriteWebsocketProxyHeadersRewritesOriginToTargetHost(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/ws_proxy?path=%2Fws", nil)
	req.Header.Set("Origin", "https://192.168.3.8:9000")

	target, err := url.Parse("ws://192.168.3.8:8080")
	if err != nil {
		t.Fatalf("failed to parse target: %v", err)
	}

	rewriteWebsocketProxyHeaders(req, target)

	if got := req.Host; got != "192.168.3.8:8080" {
		t.Fatalf("expected target host to be applied, got %q", got)
	}
	if got := req.Header.Get("Origin"); got != "http://192.168.3.8:8080" {
		t.Fatalf("expected origin to be rewritten for target websocket host, got %q", got)
	}
}

func TestRewriteWebsocketProxyHeadersKeepsOriginEmptyForNonBrowserClients(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/ws_proxy?path=%2Fws", nil)

	target, err := url.Parse("wss://127.0.0.1:9000")
	if err != nil {
		t.Fatalf("failed to parse target: %v", err)
	}

	rewriteWebsocketProxyHeaders(req, target)

	if got := req.Header.Get("Origin"); got != "" {
		t.Fatalf("expected empty origin to remain empty, got %q", got)
	}
	if got := req.Host; got != "127.0.0.1:9000" {
		t.Fatalf("expected target host to be applied, got %q", got)
	}
}

func TestProxyInstanceRequestUsesLocalHandlerForCurrentInstanceID(t *testing.T) {
	originalEnv := global.Env()
	testEnv := env.EmptyEnv()
	testEnv.SystemConfig.NodeConfig.ID = "console-self"
	testEnv.SystemConfig.APIConfig = config.APIConfig{
		Enabled: true,
		Security: config.APISecurityConfig{
			Enabled:  true,
			Username: "local_api_user",
			Password: "local_api_password",
		},
	}
	global.RegisterEnv(testEnv)
	defer global.RegisterEnv(originalEnv)

	api.HandleAPIMethod(api.GET, "/_managed/self_proxy_test", func(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		username, password, ok := req.BasicAuth()
		if !ok || username != "local_api_user" || password != "local_api_password" {
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"error":{"reason":"unauthorized"},"status":401}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true}`))
	})

	originalProviders := instanceProxyProviders
	instanceProxyProviders = nil
	defer func() {
		instanceProxyProviders = originalProviders
	}()
	RegisterInstanceProxyProvider(func(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, bool, error) {
		t.Fatal("expected self proxy to use local handler instead of proxy provider")
		return nil, true, nil
	})

	instance := &model.Instance{Endpoint: "https://203.0.113.10:9443"}
	instance.ID = "console-self"
	resp := util.MapStr{}

	res, err := proxyInstanceRequest(instance, &util.Request{
		Method: http.MethodGet,
		Path:   "/_managed/self_proxy_test",
	}, &resp)
	if err != nil {
		t.Fatalf("expected proxy to succeed, got %v", err)
	}
	if res == nil || res.StatusCode != http.StatusOK {
		t.Fatalf("unexpected proxy result: %#v", res)
	}
	if ok, _ := resp["ok"].(bool); !ok {
		t.Fatalf("unexpected response payload: %#v", resp)
	}
}

type assertiveError string

func (e assertiveError) Error() string {
	return string(e)
}
