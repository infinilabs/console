package api

import (
	"net/http"
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

type assertError string

func (e assertError) Error() string {
	return string(e)
}
