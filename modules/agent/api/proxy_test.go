package api

import (
	"net/http"
	"testing"
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
