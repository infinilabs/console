package email

import (
	"strings"
	"testing"
)

func TestResolveServerUsesLiveEnabledServer(t *testing.T) {
	previousByID := loadEmailServerForProcessor
	previousAll := loadEmailServersForProcessor
	defer func() {
		loadEmailServerForProcessor = previousByID
		loadEmailServersForProcessor = previousAll
	}()

	loadEmailServerForProcessor = func(serverID string) (*EmailServerConfig, error) {
		cfg := &EmailServerConfig{}
		cfg.Server.Host = "smtp.example.com"
		cfg.Server.Port = 465
		cfg.Server.TLS = true
		cfg.Auth.Username = "ops@example.com"
		normalizeEmailServerConfig(cfg)
		return cfg, nil
	}
	loadEmailServersForProcessor = func() (map[string]*EmailServerConfig, error) {
		t.Fatal("unexpected fallback server query")
		return nil, nil
	}

	processor := &EmailProcessor{
		config: &EmailProcessorConfig{
			Servers: map[string]*EmailServerConfig{},
		},
	}
	resolvedID, server, err := processor.resolveServer("smtp-live")
	if err != nil {
		t.Fatalf("expected live server lookup to succeed, got %v", err)
	}
	if resolvedID != "smtp-live" {
		t.Fatalf("expected smtp-live, got %s", resolvedID)
	}
	if server.Server.Host != "smtp.example.com" {
		t.Fatalf("expected resolved server host, got %s", server.Server.Host)
	}
	if server.SendFrom != "ops@example.com" {
		t.Fatalf("expected send-from normalized from username, got %s", server.SendFrom)
	}
}

func TestResolveServerFallsBackToOnlyEnabledServer(t *testing.T) {
	previousByID := loadEmailServerForProcessor
	previousAll := loadEmailServersForProcessor
	defer func() {
		loadEmailServerForProcessor = previousByID
		loadEmailServersForProcessor = previousAll
	}()

	loadEmailServerForProcessor = func(serverID string) (*EmailServerConfig, error) {
		return nil, nil
	}
	loadEmailServersForProcessor = func() (map[string]*EmailServerConfig, error) {
		cfg := &EmailServerConfig{}
		cfg.Server.Host = "smtp.example.com"
		cfg.Auth.Username = "ops@example.com"
		normalizeEmailServerConfig(cfg)
		return map[string]*EmailServerConfig{
			"smtp-fallback": cfg,
		}, nil
	}

	processor := &EmailProcessor{
		config: &EmailProcessorConfig{
			Servers: map[string]*EmailServerConfig{},
		},
	}
	resolvedID, _, err := processor.resolveServer("smtp-stale")
	if err != nil {
		t.Fatalf("expected single fallback server to be selected, got %v", err)
	}
	if resolvedID != "smtp-fallback" {
		t.Fatalf("expected smtp-fallback, got %s", resolvedID)
	}
}

func TestResolveServerFailsWithMultipleEnabledServers(t *testing.T) {
	previousByID := loadEmailServerForProcessor
	previousAll := loadEmailServersForProcessor
	defer func() {
		loadEmailServerForProcessor = previousByID
		loadEmailServersForProcessor = previousAll
	}()

	loadEmailServerForProcessor = func(serverID string) (*EmailServerConfig, error) {
		return nil, nil
	}
	loadEmailServersForProcessor = func() (map[string]*EmailServerConfig, error) {
		return map[string]*EmailServerConfig{
			"smtp-1": {},
			"smtp-2": {},
		}, nil
	}

	processor := &EmailProcessor{
		config: &EmailProcessorConfig{
			Servers: map[string]*EmailServerConfig{},
		},
	}
	_, _, err := processor.resolveServer("smtp-stale")
	if err == nil {
		t.Fatal("expected multiple enabled smtp servers to fail")
	}
	if !strings.Contains(err.Error(), "multiple enabled smtp servers") {
		t.Fatalf("expected multi-server hint, got %v", err)
	}
}
