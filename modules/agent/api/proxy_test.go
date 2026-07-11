package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"infini.sh/framework/core/env"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
)

func TestShouldAttemptAgentReverseProxy(t *testing.T) {
	agentInstance := &model.Instance{Application: env.Application{Name: "agent"}}
	otherInstance := &model.Instance{Application: env.Application{Name: "gateway"}}

	testCases := []struct {
		name      string
		instance  *model.Instance
		req       *util.Request
		connected bool
		expect    bool
	}{
		{name: "connected agent uses reverse for arbitrary path", instance: agentInstance, req: &util.Request{Method: http.MethodGet, Path: "/any/path"}, connected: true, expect: true},
		{name: "path no longer gates reverse", instance: agentInstance, req: &util.Request{Method: http.MethodPost, Path: "/totally/custom"}, connected: true, expect: true},
		{name: "disconnected agent skips reverse", instance: agentInstance, req: &util.Request{Method: http.MethodGet, Path: "/queue/stats"}, connected: false, expect: false},
		{name: "non agent skips reverse", instance: otherInstance, req: &util.Request{Method: http.MethodGet, Path: "/queue/stats"}, connected: true, expect: false},
		{name: "nil request skips reverse", instance: agentInstance, connected: true, expect: false},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if actual := shouldAttemptAgentReverseProxy(tc.instance, tc.req, tc.connected); actual != tc.expect {
				t.Fatalf("unexpected match result: %v", actual)
			}
		})
	}
}

func TestShouldFallbackToDirectAgentProxy(t *testing.T) {
	testCases := []struct {
		name   string
		res    *util.Result
		err    error
		expect bool
	}{
		{name: "no error", err: nil, expect: false},
		{name: "not found", res: &util.Result{StatusCode: http.StatusNotFound}, err: assertError("not found"), expect: true},
		{name: "disconnected", err: errAgentReverseChannelDisconnected, expect: true},
		{name: "not connected", err: errAgentReverseChannelNotConnected, expect: true},
		{name: "other error", err: assertError("boom"), expect: false},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if actual := shouldFallbackToDirectAgentProxy(tc.res, tc.err); actual != tc.expect {
				t.Fatalf("unexpected fallback result: %v", actual)
			}
		})
	}
}

func TestProxyAgentRequestFallsBackToDirectWhenReverseChannelIsNotConnected(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/elasticsearch/logs/_list" {
			t.Fatalf("unexpected request path: %s", r.URL.Path)
		}
		if r.Method != http.MethodPost {
			t.Fatalf("unexpected request method: %s", r.Method)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"success":true,"result":["app.log"]}`))
	}))
	defer server.Close()

	instance := &model.Instance{
		Endpoint: "http://agent-api.local:2900",
		Services: []model.ServiceInfo{
			{Name: "api", Endpoint: "http://agent-api.local:2900"},
			{Name: "web", Endpoint: server.URL},
		},
	}
	instance.ID = "agent-direct-only"
	instance.Application.Name = "agent"

	resBody := map[string]interface{}{}
	res, err := proxyAgentRequest(instance, &util.Request{
		Method: http.MethodPost,
		Path:   "/elasticsearch/logs/_list",
		Body:   []byte(`{"logs_path":"/var/log/elasticsearch"}`),
	}, &resBody)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res == nil || res.StatusCode != http.StatusOK {
		t.Fatalf("unexpected response: %#v", res)
	}
	if resBody["success"] != true {
		t.Fatalf("expected success body, got %#v", resBody)
	}
}

type assertError string

func (e assertError) Error() string {
	return string(e)
}
