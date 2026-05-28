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

	frameworkconfig "infini.sh/framework/core/config"
	"infini.sh/framework/core/global"
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

func TestResolveConsoleEndpointPriority(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "http://console.local/instance/_get_install_script", nil)

	t.Run("prefers configured endpoint", func(t *testing.T) {
		t.Setenv("INFINI_CONSOLE_ENDPOINT", "http://127.0.0.1:9000")
		got := resolveConsoleEndpoint(req, "https://configured.local:9443")
		if got != "https://configured.local:9443" {
			t.Fatalf("expected configured endpoint, got %q", got)
		}
	})

	t.Run("uses env endpoint when configured missing", func(t *testing.T) {
		t.Setenv("INFINI_CONSOLE_ENDPOINT", "http://127.0.0.1:9000")
		got := resolveConsoleEndpoint(req, "")
		if got != "http://127.0.0.1:9000" {
			t.Fatalf("expected env endpoint, got %q", got)
		}
	})
}

func TestResolveAgentReverseChannelEndpointPrefersAPIEndpointWhenAPIMTLSIsEnabled(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "https://console.local:9000/instance/_get_install_script", nil)
	req.TLS = &tls.ConnectionState{}
	oldWebConfig := global.Env().SystemConfig.WebAppConfig
	oldAPIConfig := global.Env().SystemConfig.APIConfig
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig = oldWebConfig
		global.Env().SystemConfig.APIConfig = oldAPIConfig
	})

	global.Env().SystemConfig.WebAppConfig.Enabled = true
	global.Env().SystemConfig.WebAppConfig.EmbeddingAPI = true
	global.Env().SystemConfig.WebAppConfig.TLSConfig.TLSEnabled = true
	global.Env().SystemConfig.WebAppConfig.NetworkConfig.Publish = "console-web.local:9000"
	global.Env().SystemConfig.APIConfig.Enabled = true
	global.Env().SystemConfig.APIConfig.WebsocketConfig.Enabled = true
	global.Env().SystemConfig.APIConfig.TLSConfig.TLSEnabled = true
	global.Env().SystemConfig.APIConfig.TLSConfig.TLSInsecureSkipVerify = false
	global.Env().SystemConfig.APIConfig.NetworkConfig.Publish = "console-api.local:2900"

	got := resolveAgentReverseChannelEndpoint(req, "")
	if got != "https://console-api.local:2900" {
		t.Fatalf("expected api endpoint, got %q", got)
	}
}

func TestResolveAgentReverseChannelEndpointPrefersWebEndpointWhenWebCanServeWSWithoutAPIMTLS(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "https://console.local:9000/instance/_get_install_script", nil)
	req.TLS = &tls.ConnectionState{}
	oldWebConfig := global.Env().SystemConfig.WebAppConfig
	oldAPIConfig := global.Env().SystemConfig.APIConfig
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig = oldWebConfig
		global.Env().SystemConfig.APIConfig = oldAPIConfig
	})

	global.Env().SystemConfig.WebAppConfig.Enabled = true
	global.Env().SystemConfig.WebAppConfig.EmbeddingAPI = true
	global.Env().SystemConfig.WebAppConfig.TLSConfig.TLSEnabled = true
	global.Env().SystemConfig.WebAppConfig.NetworkConfig.Publish = "console-web.local:9000"
	global.Env().SystemConfig.APIConfig.Enabled = true
	global.Env().SystemConfig.APIConfig.WebsocketConfig.Enabled = true
	global.Env().SystemConfig.APIConfig.TLSConfig.TLSEnabled = true
	global.Env().SystemConfig.APIConfig.TLSConfig.TLSInsecureSkipVerify = true
	global.Env().SystemConfig.APIConfig.NetworkConfig.Publish = "console-api.local:2900"

	got := resolveAgentReverseChannelEndpoint(req, "")
	if got != "https://console.local:9000" {
		t.Fatalf("expected web endpoint, got %q", got)
	}
}

func TestResolveAgentReverseChannelEndpointFallsBackToAPIEndpoint(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "http://console.local/instance/_get_install_script", nil)
	oldWebConfig := global.Env().SystemConfig.WebAppConfig
	oldAPIConfig := global.Env().SystemConfig.APIConfig
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig = oldWebConfig
		global.Env().SystemConfig.APIConfig = oldAPIConfig
	})

	global.Env().SystemConfig.WebAppConfig.Enabled = true
	global.Env().SystemConfig.WebAppConfig.EmbeddingAPI = false
	global.Env().SystemConfig.WebAppConfig.WebsocketConfig.Enabled = false
	global.Env().SystemConfig.APIConfig.Enabled = true
	global.Env().SystemConfig.APIConfig.WebsocketConfig.Enabled = true
	global.Env().SystemConfig.APIConfig.TLSConfig.TLSEnabled = true
	global.Env().SystemConfig.APIConfig.NetworkConfig.Publish = "console-api.local:2900"

	got := resolveAgentReverseChannelEndpoint(req, "")
	if got != "https://console-api.local:2900" {
		t.Fatalf("expected api endpoint, got %q", got)
	}
}

func TestResolveAgentReverseChannelEndpointUsesAPIEndpointForReverseMTLSWhenWebCannotServeWS(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "https://console.local/instance/_get_install_script", nil)
	req.TLS = &tls.ConnectionState{}
	oldWebConfig := global.Env().SystemConfig.WebAppConfig
	oldAPIConfig := global.Env().SystemConfig.APIConfig
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig = oldWebConfig
		global.Env().SystemConfig.APIConfig = oldAPIConfig
	})

	global.Env().SystemConfig.WebAppConfig.Enabled = true
	global.Env().SystemConfig.WebAppConfig.EmbeddingAPI = false
	global.Env().SystemConfig.WebAppConfig.WebsocketConfig.Enabled = false
	global.Env().SystemConfig.APIConfig.Enabled = true
	global.Env().SystemConfig.APIConfig.WebsocketConfig.Enabled = true
	global.Env().SystemConfig.APIConfig.TLSConfig.TLSEnabled = true
	global.Env().SystemConfig.APIConfig.TLSConfig.TLSInsecureSkipVerify = false
	global.Env().SystemConfig.APIConfig.NetworkConfig.Publish = "console-api.local:2900"

	got := resolveAgentReverseChannelEndpoint(req, "")
	if got != "https://console-api.local:2900" {
		t.Fatalf("expected api endpoint, got %q", got)
	}
}

func TestResolveAgentReverseChannelEndpointsPrefersConfiguredList(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "https://console.local:9000/instance/_get_install_script", nil)
	got := resolveAgentReverseChannelEndpoints(req, []string{
		" https://console-api-1.local:9443 ",
		"",
		"https://console-api-2.local:9443",
	})

	expected := []string{
		"https://console-api-1.local:9443",
		"https://console-api-2.local:9443",
	}
	if strings.Join(got, ",") != strings.Join(expected, ",") {
		t.Fatalf("expected %v, got %v", expected, got)
	}
}

func TestBuildGatewayInstallCommand(t *testing.T) {
	command := buildGatewayInstallCommand(
		"https://console.local/instance/_get_gateway_install_script?token=abc",
		"/srv/gateway",
	)

	expected := `curl -ksSL "https://console.local/instance/_get_gateway_install_script?token=abc" |sudo bash -s -- -d "/srv/gateway"`
	if command != expected {
		t.Fatalf("expected %q, got %q", expected, command)
	}
}

func TestResolveInstallDirUsesDefault(t *testing.T) {
	got := resolveInstallDir("", defaultAgentInstallDir)
	if got != defaultAgentInstallDir {
		t.Fatalf("expected %q, got %q", defaultAgentInstallDir, got)
	}
}

func TestResolveInstallDirHonorsConfiguredValue(t *testing.T) {
	got := resolveInstallDir("/srv/custom-agent", defaultAgentInstallDir)
	if got != "/srv/custom-agent" {
		t.Fatalf("expected %q, got %q", "/srv/custom-agent", got)
	}
}

func TestFormatBuildVersion(t *testing.T) {
	if got := formatBuildVersion("1.2.3", "456"); got != "1.2.3-456" {
		t.Fatalf("expected combined build version, got %q", got)
	}
	if got := formatBuildVersion("1.2.3", ""); got != "1.2.3" {
		t.Fatalf("expected plain version when build number missing, got %q", got)
	}
	if got := formatBuildVersion("", "456"); got != "" {
		t.Fatalf("expected empty version when version missing, got %q", got)
	}
}

func TestGetDefaultInstallVersionPrefersConfiguredValue(t *testing.T) {
	if got := getDefaultInstallVersion("2.0.0-999"); got != "2.0.0-999" {
		t.Fatalf("expected configured version to win, got %q", got)
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

func TestAgentInstallTemplateKeepsEmbeddedAPIDisabledWhenReverseChannelEnabled(t *testing.T) {
	templatePath := filepath.Join("..", "..", "..", "config", "install_agent.tpl")
	content, err := os.ReadFile(templatePath)
	if err != nil {
		t.Fatalf("failed to read agent install template: %v", err)
	}

	rendered := strings.NewReplacer(
		"{{base_url}}", "https://mirror.local/agent/stable",
		"{{version}}", "1.2.3-4567",
		"{{console_endpoint}}", "https://console.local",
		"{{reverse_channel_endpoints}}", `["https://console-api.local:2900"]`,
		"{{embedding_api}}", "false",
		"{{websocket_enabled}}", "false",
		"{{client_crt}}", "CLIENT_CERT",
		"{{client_key}}", "CLIENT_KEY",
		"{{ca_crt}}", "CA_CERT",
		"{{port}}", "2900",
	).Replace(string(content))

	expectedSnippets := []string{
		`cat <<EOF > ${install_dir}/agent.yml`,
		`embedding_api: false`,
		`websocket:`,
		`enabled: false`,
		`REVERSE_CHANNEL_ENDPOINTS: ["https://console-api.local:2900"]`,
		`reverse_channel_endpoints: \$[[env.REVERSE_CHANNEL_ENDPOINTS]]`,
		`cert_file: "config/client.crt"`,
		`skip_insecure_verify: false`,
	}

	for _, snippet := range expectedSnippets {
		if !strings.Contains(rendered, snippet) {
			t.Fatalf("expected rendered template to contain %q", snippet)
		}
	}
}

func TestAgentInstallTemplateEnablesEmbeddedAPIWithoutReverseChannel(t *testing.T) {
	templatePath := filepath.Join("..", "..", "..", "config", "install_agent.tpl")
	content, err := os.ReadFile(templatePath)
	if err != nil {
		t.Fatalf("failed to read agent install template: %v", err)
	}

	rendered := strings.NewReplacer(
		"{{base_url}}", "https://mirror.local/agent/stable",
		"{{version}}", "1.2.3-4567",
		"{{console_endpoint}}", "https://console.local",
		"{{console_domain}}", "console.local",
		"{{reverse_channel_endpoints}}", `[]`,
		"{{embedding_api}}", "true",
		"{{websocket_enabled}}", "true",
		"{{client_crt}}", "CLIENT_CERT",
		"{{client_key}}", "CLIENT_KEY",
		"{{ca_crt}}", "CA_CERT",
		"{{port}}", "2900",
	).Replace(string(content))

	expectedSnippets := []string{
		`embedding_api: true`,
		`enabled: true`,
		`base_path: /ws`,
		`REVERSE_CHANNEL_ENDPOINTS: []`,
		`default_domain: "console.local"`,
	}

	for _, snippet := range expectedSnippets {
		if !strings.Contains(rendered, snippet) {
			t.Fatalf("expected rendered template to contain %q", snippet)
		}
	}
}

func TestGetEndpointHostname(t *testing.T) {
	if got := getEndpointHostname("https://demo.infini.cloud:9000/console"); got != "demo.infini.cloud" {
		t.Fatalf("expected demo.infini.cloud, got %q", got)
	}
}

func TestResolveConsoleTLSServerNameUsesEndpointHostnameWhenItIsDNS(t *testing.T) {
	if got := resolveConsoleTLSServerName("https://console.local:9000"); got != "console.local" {
		t.Fatalf("expected console.local, got %q", got)
	}
}

func TestResolveConsoleTLSServerNameFallsBackToTLSDefaultDomainForIPEndpoint(t *testing.T) {
	oldWebConfig := global.Env().SystemConfig.WebAppConfig
	oldAPIConfig := global.Env().SystemConfig.APIConfig
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig = oldWebConfig
		global.Env().SystemConfig.APIConfig = oldAPIConfig
	})

	global.Env().SystemConfig.WebAppConfig.Enabled = true
	global.Env().SystemConfig.WebAppConfig.NetworkConfig.Publish = "0.0.0.0:9000"
	global.Env().SystemConfig.WebAppConfig.TLSConfig = frameworkconfig.TLSConfig{
		TLSEnabled:    true,
		DefaultDomain: "console.example.com",
	}
	global.Env().SystemConfig.APIConfig = frameworkconfig.APIConfig{}

	if got := resolveConsoleTLSServerName("https://192.168.3.8:9000"); got != "console.example.com" {
		t.Fatalf("expected console.example.com, got %q", got)
	}
}

func TestResolveConsoleTLSServerNameFallsBackToCertificateDNSNameForIPEndpoint(t *testing.T) {
	oldWebConfig := global.Env().SystemConfig.WebAppConfig
	oldAPIConfig := global.Env().SystemConfig.APIConfig
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig = oldWebConfig
		global.Env().SystemConfig.APIConfig = oldAPIConfig
	})

	rootCert, rootKey, rootPEM := util.GetRootCert()
	certPEM, _, err := util.GenerateServerCert(rootCert, rootKey, rootPEM, []string{"console.example.com"})
	if err != nil {
		t.Fatalf("failed to generate server cert: %v", err)
	}

	tempDir := t.TempDir()
	certFile := filepath.Join(tempDir, "server.crt")
	if err := os.WriteFile(certFile, certPEM, 0600); err != nil {
		t.Fatalf("failed to write cert file: %v", err)
	}

	global.Env().SystemConfig.WebAppConfig.Enabled = true
	global.Env().SystemConfig.WebAppConfig.NetworkConfig.Publish = "0.0.0.0:9000"
	global.Env().SystemConfig.WebAppConfig.TLSConfig = frameworkconfig.TLSConfig{
		TLSEnabled:  true,
		TLSCertFile: certFile,
	}
	global.Env().SystemConfig.APIConfig = frameworkconfig.APIConfig{}

	if got := resolveConsoleTLSServerName("https://192.168.3.8:9000"); got != "console.example.com" {
		t.Fatalf("expected console.example.com, got %q", got)
	}
}

func TestLegacyAgentInstallTemplateSetsConfigTLSServerName(t *testing.T) {
	templatePath := filepath.Join("..", "..", "..", "config", "install_legency_agent.tpl")
	content, err := os.ReadFile(templatePath)
	if err != nil {
		t.Fatalf("failed to read legacy agent install template: %v", err)
	}

	rendered := strings.NewReplacer(
		"{{base_url}}", "https://mirror.local/agent/stable",
		"{{version}}", "1.30.3-4567",
		"{{console_endpoint}}", "https://console.local",
		"{{console_domain}}", "console.local",
		"{{client_crt}}", "CLIENT_CERT",
		"{{client_key}}", "CLIENT_KEY",
		"{{ca_crt}}", "CA_CERT",
		"{{port}}", "2900",
		"{{token}}", "TOKEN",
		"{{manager_token}}", "MANAGER_TOKEN",
		"{{manager_token_key}}", "MANAGER_TOKEN_KEY",
		"{{manager_token_id}}", "MANAGER_TOKEN_ID",
	).Replace(string(content))

	expectedSnippets := []string{
		`servers: # config servers`,
		`    default_domain: "console.local"`,
		`    skip_insecure_verify: false`,
	}

	for _, snippet := range expectedSnippets {
		if !strings.Contains(rendered, snippet) {
			t.Fatalf("expected rendered template to contain %q", snippet)
		}
	}
}

func TestBuildInstallCommandUsesScriptDefaults(t *testing.T) {
	command := buildInstallCommand(
		"https://console.local/instance/_get_install_script?token=abc",
		"/srv/agent",
	)

	expected := `curl -ksSL "https://console.local/instance/_get_install_script?token=abc" |sudo bash -s -- -t "/srv/agent"`
	if command != expected {
		t.Fatalf("expected %q, got %q", expected, command)
	}
}

func TestBuildInstallScriptURLHonorsReverseChannelOption(t *testing.T) {
	withoutReverse, err := buildInstallScriptURL("https://console.local", "abc", "1.2.3", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if strings.Contains(withoutReverse, "enable_reverse_channel=true") {
		t.Fatalf("did not expect reverse channel flag in %q", withoutReverse)
	}

	withReverse, err := buildInstallScriptURL("https://console.local", "abc", "1.2.3", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(withReverse, "enable_reverse_channel=true") {
		t.Fatalf("expected reverse channel flag in %q", withReverse)
	}
}

func TestRenderAgentReverseChannelEndpoints(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "https://console.local:9000/instance/_get_install_script", nil)

	if got := renderAgentReverseChannelEndpoints(req, nil, false); got != "[]" {
		t.Fatalf("expected reverse channel disabled output, got %q", got)
	}

	if got := renderAgentReverseChannelEndpoints(req, nil, true); got != `["${server}"]` {
		t.Fatalf("expected default server placeholder, got %q", got)
	}

	got := renderAgentReverseChannelEndpoints(req, []string{"https://console-api.local:9443"}, true)
	if got != `["https://console-api.local:9443"]` {
		t.Fatalf("expected configured endpoints, got %q", got)
	}
}

func TestResolvePackageDownloadURLUsesOfficialDefault(t *testing.T) {
	got, err := resolvePackageDownloadURL("https://console.local/console", "", defaultAgentDownloadURL, agentPackageRelativePath)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	expected := defaultAgentDownloadURL
	if got != expected {
		t.Fatalf("expected %q, got %q", expected, got)
	}
}

func TestResolvePackageDownloadURLHonorsConfiguredOverride(t *testing.T) {
	got, err := resolvePackageDownloadURL("https://console.local", "https://mirror.local/custom/agent", defaultAgentDownloadURL, agentPackageRelativePath)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	expected := "https://mirror.local/custom/agent"
	if got != expected {
		t.Fatalf("expected %q, got %q", expected, got)
	}
}

func TestResolvePackageDownloadURLUsesConsoleSelfHostedPathWhenPackagesExist(t *testing.T) {
	executablePath, err := os.Executable()
	if err != nil {
		t.Fatalf("failed to get executable path: %v", err)
	}
	selfHostedDir := filepath.Join(filepath.Dir(executablePath), ".public", "gateway", "stable")
	if err := os.MkdirAll(selfHostedDir, 0o755); err != nil {
		t.Fatalf("failed to create self-hosted dir: %v", err)
	}
	testFile := filepath.Join(selfHostedDir, "gateway-1.2.3-linux-amd64.tar.gz")
	if err := os.WriteFile(testFile, []byte("test"), 0o644); err != nil {
		t.Fatalf("failed to write self-hosted package file: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Remove(testFile)
	})

	got, err := resolvePackageDownloadURL("https://console.local:9000", "", defaultGatewayDownloadURL, gatewayPackageRelativePath)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	expected := "https://console.local:9000/gateway/stable"
	if got != expected {
		t.Fatalf("expected %q, got %q", expected, got)
	}
}

func TestResolveGatewayDownloadURLUsesOfficialDefault(t *testing.T) {
	got, err := resolveGatewayDownloadURL("https://console.local", "")
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if got != defaultGatewayDownloadURL {
		t.Fatalf("expected %q, got %q", defaultGatewayDownloadURL, got)
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
