package email

import (
	"crypto/tls"
	"errors"
	"testing"

	consolemodel "infini.sh/console/model"
	frameworkmodel "infini.sh/framework/core/model"
	ucfg "infini.sh/framework/lib/go-ucfg"
)

func TestNewEmailTestDialerDefaultsToTLS12(t *testing.T) {
	server := &consolemodel.EmailServer{
		Host: "smtp.example.org",
		Port: 587,
		TLS:  true,
		Auth: &frameworkmodel.BasicAuth{
			Username: "tester",
			Password: ucfg.SecretString("secret"),
		},
	}

	dialer, err := newEmailTestDialer(server)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if dialer.Host != server.Host {
		t.Fatalf("expected host %q, got %q", server.Host, dialer.Host)
	}

	if dialer.Port != server.Port {
		t.Fatalf("expected port %d, got %d", server.Port, dialer.Port)
	}

	if dialer.Username != server.Auth.Username {
		t.Fatalf("expected username %q, got %q", server.Auth.Username, dialer.Username)
	}

	if dialer.Password != server.Auth.Password.Get() {
		t.Fatalf("expected password to be copied to dialer")
	}

	if !dialer.SSL {
		t.Fatal("expected SSL flag to follow email server TLS setting")
	}

	if dialer.TLSConfig == nil {
		t.Fatal("expected TLS config to be initialized")
	}

	if !dialer.TLSConfig.InsecureSkipVerify {
		t.Fatal("expected InsecureSkipVerify to stay enabled for SMTP test requests")
	}

	if dialer.TLSConfig.MinVersion != tls.VersionTLS12 {
		t.Fatalf("expected default TLS min version %v, got %v", tls.VersionTLS12, dialer.TLSConfig.MinVersion)
	}

	if server.TLSMinVersion != "" {
		t.Fatalf("expected helper not to mutate TLSMinVersion, got %q", server.TLSMinVersion)
	}
}

func TestNewEmailTestDialerRespectsExplicitTLSVersion(t *testing.T) {
	server := &consolemodel.EmailServer{
		Host:          "smtp.example.org",
		Port:          465,
		TLS:           false,
		TLSMinVersion: consolemodel.TLSVersion13,
		Auth: &frameworkmodel.BasicAuth{
			Username: "tester",
			Password: ucfg.SecretString("secret"),
		},
	}

	dialer, err := newEmailTestDialer(server)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if dialer.TLSConfig == nil {
		t.Fatal("expected TLS config to be initialized")
	}

	if dialer.TLSConfig.MinVersion != tls.VersionTLS13 {
		t.Fatalf("expected explicit TLS min version %v, got %v", tls.VersionTLS13, dialer.TLSConfig.MinVersion)
	}

	if dialer.SSL {
		t.Fatal("expected SSL flag to follow email server TLS setting")
	}
}

func TestNewEmailTestDialerRejectsUnsupportedTLSVersion(t *testing.T) {
	server := &consolemodel.EmailServer{
		Host:          "smtp.example.org",
		Port:          587,
		TLSMinVersion: "TLS99",
		Auth: &frameworkmodel.BasicAuth{
			Username: "tester",
			Password: ucfg.SecretString("secret"),
		},
	}

	_, err := newEmailTestDialer(server)
	if err == nil {
		t.Fatal("expected unsupported TLS version to fail")
	}
}

func TestNewEmailTLSConfigSetsServerName(t *testing.T) {
	cfg := newEmailTLSConfig("smtp.example.com", tls.VersionTLS13)

	if cfg.ServerName != "smtp.example.com" {
		t.Fatalf("expected server name to be preserved, got %q", cfg.ServerName)
	}
	if cfg.MinVersion != tls.VersionTLS13 {
		t.Fatalf("expected min TLS version %d, got %d", tls.VersionTLS13, cfg.MinVersion)
	}
	if !cfg.InsecureSkipVerify {
		t.Fatal("expected insecure skip verify to remain enabled")
	}
}

func TestClassifyEmailServerTestSendErrorSenderMismatch(t *testing.T) {
	server := &consolemodel.EmailServer{
		Sender: "hello@example.com",
		Auth: &frameworkmodel.BasicAuth{
			Username: "notify@example.com",
			Password: ucfg.SecretString("secret"),
		},
	}

	key, reason := classifyEmailServerTestSendError(server, server.Sender, errors.New("gomail: could not send email 1: 550 5.7.1 authentication is required"))
	if key != emailServerTestErrorKeySenderMismatch {
		t.Fatalf("expected sender mismatch key, got %q", key)
	}
	if reason == "" {
		t.Fatal("expected a human-readable reason")
	}
}

func TestClassifyEmailServerTestSendErrorSMTPAuthFailure(t *testing.T) {
	server := &consolemodel.EmailServer{
		Auth: &frameworkmodel.BasicAuth{
			Username: "notify@example.com",
			Password: ucfg.SecretString("secret"),
		},
	}

	key, reason := classifyEmailServerTestSendError(server, "notify@example.com", errors.New("535 Authentication failed"))
	if key != emailServerTestErrorKeySMTPAuthFailed {
		t.Fatalf("expected SMTP auth failure key, got %q", key)
	}
	if reason == "" {
		t.Fatal("expected a human-readable reason")
	}
}

func TestClassifyEmailServerTestSendErrorPassesUnknownErrorsThrough(t *testing.T) {
	key, reason := classifyEmailServerTestSendError(nil, "", errors.New("dial tcp: connection refused"))
	if key != "" {
		t.Fatalf("expected no key, got %q", key)
	}
	if reason != "dial tcp: connection refused" {
		t.Fatalf("expected original reason, got %q", reason)
	}
}
