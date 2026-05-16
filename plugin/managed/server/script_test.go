package server

import (
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetDefaultEndpoint(t *testing.T) {
	tests := []struct {
		name     string
		setup    func(req *http.Request)
		expected string
	}{
		{
			name: "tls request uses https",
			setup: func(req *http.Request) {
				req.TLS = &tls.ConnectionState{}
			},
			expected: "https://console.local",
		},
		{
			name: "forwarded proto and host override request",
			setup: func(req *http.Request) {
				req.Host = "127.0.0.1:9000"
				req.Header.Set("X-Forwarded-Proto", "https")
				req.Header.Set("X-Forwarded-Host", "console.example.com")
			},
			expected: "https://console.example.com",
		},
		{
			name: "forwarded header provides proto and host",
			setup: func(req *http.Request) {
				req.Host = "127.0.0.1:9000"
				req.Header.Set("Forwarded", `for=127.0.0.1;proto=https;host=console.example.com:9443`)
			},
			expected: "https://console.example.com:9443",
		},
		{
			name: "plain request uses http host",
			setup: func(req *http.Request) {
			},
			expected: "http://console.local",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "http://console.local/instance/_get_install_script", nil)
			tt.setup(req)

			if got := getDefaultEndpoint(req); got != tt.expected {
				t.Fatalf("expected %q, got %q", tt.expected, got)
			}
		})
	}
}
