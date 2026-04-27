package common

import (
	"strings"
	"testing"

	"infini.sh/console/model"
	modelalerting "infini.sh/console/model/alerting"
)

func TestSelectFallbackEmailServerID(t *testing.T) {
	server := model.EmailServer{}
	server.ID = "smtp-1"

	serverID, err := selectFallbackEmailServerID([]model.EmailServer{
		server,
	})
	if err != nil {
		t.Fatalf("expected single enabled server to be selected, got error: %v", err)
	}
	if serverID != "smtp-1" {
		t.Fatalf("expected smtp-1, got %q", serverID)
	}
}

func TestSelectFallbackEmailServerIDWithoutEnabledServer(t *testing.T) {
	_, err := selectFallbackEmailServerID(nil)
	if err == nil {
		t.Fatal("expected error when no enabled smtp server exists")
	}
	if !strings.Contains(err.Error(), "no enabled smtp server") {
		t.Fatalf("expected missing-server hint, got %v", err)
	}
}

func TestSelectFallbackEmailServerIDWithMultipleEnabledServers(t *testing.T) {
	server1 := model.EmailServer{}
	server1.ID = "smtp-1"
	server2 := model.EmailServer{}
	server2.ID = "smtp-2"

	_, err := selectFallbackEmailServerID([]model.EmailServer{
		server1,
		server2,
	})
	if err == nil {
		t.Fatal("expected error when multiple enabled smtp servers exist")
	}
	if !strings.Contains(err.Error(), "multiple enabled smtp servers") {
		t.Fatalf("expected multi-server hint, got %v", err)
	}
}

func TestEnsureEmailRecipients(t *testing.T) {
	err := ensureEmailRecipients(nil)
	if err == nil {
		t.Fatal("expected nil email config to fail")
	}

	email := &modelalerting.Email{}
	err = ensureEmailRecipients(email)
	if err == nil {
		t.Fatal("expected missing recipients to fail")
	}
	if !strings.Contains(err.Error(), "at least one recipient") {
		t.Fatalf("expected recipient hint, got %v", err)
	}

	email.Recipients.To = []string{"ops@example.com"}
	if err = ensureEmailRecipients(email); err != nil {
		t.Fatalf("expected configured recipients to pass, got %v", err)
	}
}
