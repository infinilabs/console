package api

import (
	"net/http"
	"testing"

	"infini.sh/framework/core/util"
)

func TestIsAgentReverseProxyPathAllowed(t *testing.T) {
	testCases := []struct {
		name   string
		method string
		path   string
		expect bool
	}{
		{name: "queue stats", method: http.MethodGet, path: "/queue/stats", expect: true},
		{name: "queue consumer offset", method: http.MethodPut, path: "/queue/test/consumer/default/offset", expect: true},
		{name: "task list with query", method: http.MethodGet, path: "/pipeline/tasks/?size=10", expect: true},
		{name: "config root", method: http.MethodGet, path: "/config/", expect: true},
		{name: "unsupported path", method: http.MethodPost, path: "/setting/logger", expect: false},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if actual := isAgentReverseProxyPathAllowed(tc.method, tc.path); actual != tc.expect {
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
