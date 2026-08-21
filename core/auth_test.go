package core

import (
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"testing"

	httprouter "infini.sh/framework/core/api/router"
)

func TestRequestUsesSecureTransport(t *testing.T) {
	tests := []struct {
		name   string
		setup  func(req *http.Request)
		secure bool
	}{
		{
			name: "tls request",
			setup: func(req *http.Request) {
				req.TLS = &tls.ConnectionState{}
			},
			secure: true,
		},
		{
			name: "forwarded proto",
			setup: func(req *http.Request) {
				req.Header.Set("X-Forwarded-Proto", "https")
			},
			secure: true,
		},
		{
			name: "forwarded header",
			setup: func(req *http.Request) {
				req.Header.Set("Forwarded", `for=127.0.0.1;proto=https;host=console.local`)
			},
			secure: true,
		},
		{
			name: "plain http",
			setup: func(req *http.Request) {
			},
			secure: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "http://console.local/account/login", nil)
			tt.setup(req)

			if RequestUsesSecureTransport(req) != tt.secure {
				t.Fatalf("expected secure=%v", tt.secure)
			}
		})
	}
}

func TestRequireSecureTransport(t *testing.T) {
	handler := Handler{}
	called := false
	protected := handler.RequireSecureTransport(func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		called = true
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "http://console.local/account/login", nil)
	resp := httptest.NewRecorder()

	protected(resp, req, nil)

	if called {
		t.Fatal("expected insecure request to be blocked")
	}
	if resp.Code != http.StatusUpgradeRequired {
		t.Fatalf("expected status %d, got %d", http.StatusUpgradeRequired, resp.Code)
	}
}
