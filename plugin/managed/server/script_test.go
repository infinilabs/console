package server

import (
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"infini.sh/framework/core/util"
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

func TestBuildGatewayInstallCommand(t *testing.T) {
	command := buildGatewayInstallCommand(
		"https://console.local/instance/_get_gateway_install_script?token=abc",
		"https://mirror.local/gateway/stable",
		"/srv/gateway",
		"1.2.3-4567",
	)

	expected := `curl -ksSL "https://console.local/instance/_get_gateway_install_script?token=abc" |sudo bash -s -- -d "/srv/gateway" -u "https://mirror.local/gateway/stable" -v "1.2.3-4567"`
	if command != expected {
		t.Fatalf("expected %q, got %q", expected, command)
	}
}

func TestGatewayInstallTemplateBootstrapsManagedConfig(t *testing.T) {
	templatePath := filepath.Join("..", "..", "..", "config", "install_gateway.tpl")
	content, err := os.ReadFile(templatePath)
	if err != nil {
		t.Fatalf("failed to read gateway install template: %v", err)
	}

	rendered := strings.NewReplacer(
		"{{base_url}}", "https://mirror.local/gateway/stable",
		"{{version}}", "1.2.3-4567",
		"{{console_endpoint}}", "https://console.local",
		"{{client_crt}}", "CLIENT_CERT",
		"{{client_key}}", "CLIENT_KEY",
		"{{ca_crt}}", "CA_CERT",
		"{{port}}", "2900",
	).Replace(string(content))

	expectedSnippets := []string{
		`echo -e "${ca_crt}" > ${install_dir}/config/ca.crt`,
		`cat <<EOF > ${install_dir}/gateway.yml`,
		`configs.auto_reload: true`,
		`managed: true`,
		`panic_on_config_error: false`,
		`    - "${server}"`,
		`cert_file: "config/client.crt"`,
		`macos_svc=/Library/LaunchDaemons/gateway.plist`,
		`linux_svc=/etc/systemd/system/gateway.service`,
		`(cd "${install_dir}" && $gateway_svc -service install &>/dev/null)`,
		`(cd "${install_dir}" && $gateway_svc -service start &>/dev/null)`,
		`Congratulations, gateway install success!`,
	}

	for _, snippet := range expectedSnippets {
		if !strings.Contains(rendered, snippet) {
			t.Fatalf("expected rendered template to contain %q", snippet)
		}
	}
}

func TestBuildInstallCommandAlwaysIncludesDownloadURL(t *testing.T) {
	command := buildInstallCommand(
		"https://console.local/instance/_get_install_script?token=abc",
		"https://console.local/agent/stable",
		"/srv/agent",
		"1.2.3-4567",
	)

	expected := `curl -ksSL "https://console.local/instance/_get_install_script?token=abc" |sudo bash -s -- -t "/srv/agent" -u "https://console.local/agent/stable" -v "1.2.3-4567"`
	if command != expected {
		t.Fatalf("expected %q, got %q", expected, command)
	}
}

func TestResolvePackageDownloadURLUsesConsoleStaticPath(t *testing.T) {
	got, err := resolvePackageDownloadURL("https://console.local/console", "", agentPackageRelativePath)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	expected := "https://console.local/console/agent/stable"
	if got != expected {
		t.Fatalf("expected %q, got %q", expected, got)
	}
}

func TestResolvePackageDownloadURLHonorsConfiguredOverride(t *testing.T) {
	got, err := resolvePackageDownloadURL("https://console.local", "https://mirror.local/custom/agent", agentPackageRelativePath)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	expected := "https://mirror.local/custom/agent"
	if got != expected {
		t.Fatalf("expected %q, got %q", expected, got)
	}
}

func TestValidateInstallTokenRejectsWrongProduct(t *testing.T) {
	token := util.GetUUID()
	expiredTokenCache.Put(token, &Token{
		CreatedAt: time.Now(),
		UserID:    "u1",
		Product:   installProductAgent,
	})
	t.Cleanup(func() {
		expiredTokenCache.Delete(token)
	})

	if _, err := validateInstallToken(token, installProductGateway); err == nil {
		t.Fatal("expected product mismatch to be rejected")
	}
}
