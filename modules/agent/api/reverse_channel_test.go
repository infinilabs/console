package api

import (
	"net/http/httptest"
	"testing"
)

func TestAgentReverseChannelOnConnectAllowsGenericWebsocket(t *testing.T) {
	req := httptest.NewRequest("GET", "/ws", nil)

	if err := onAgentReverseConnect("session-1", nil, req); err != nil {
		t.Fatalf("expected generic websocket connection to pass, got %v", err)
	}
}
