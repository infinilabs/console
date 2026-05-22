package api

import (
	"net/http/httptest"
	"testing"
)

func TestAgentReverseChannelOnConnectAllowsGenericWebsocket(t *testing.T) {
	manager := newAgentReverseChannelManager()
	req := httptest.NewRequest("GET", "/ws", nil)

	if err := manager.onConnect("session-1", nil, req); err != nil {
		t.Fatalf("expected generic websocket connection to pass, got %v", err)
	}

	if len(manager.pendingSessions) != 0 {
		t.Fatalf("expected no pending reverse sessions, got %d", len(manager.pendingSessions))
	}
}
