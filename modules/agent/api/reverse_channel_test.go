package api

import (
	"encoding/base64"
	"errors"
	"net/http"
	"testing"
)

func TestAgentReverseChannelAcceptResponse(t *testing.T) {
	manager := newAgentReverseChannelManager()
	pending := &pendingAgentReverseResponse{
		instanceID: "instance-1",
		done:       make(chan struct{}),
	}

	manager.pendingResponses["req-1"] = pending
	manager.acceptResponse(agentReverseResponseMessage{
		RequestID:  "req-1",
		InstanceID: "instance-1",
		Chunk:      base64.StdEncoding.EncodeToString([]byte("hello ")),
	})
	manager.acceptResponse(agentReverseResponseMessage{
		RequestID:  "req-1",
		InstanceID: "instance-1",
		Chunk:      base64.StdEncoding.EncodeToString([]byte("world")),
		Status:     http.StatusOK,
		Done:       true,
	})

	<-pending.done

	if pending.status != http.StatusOK {
		t.Fatalf("unexpected status: %d", pending.status)
	}
	if pending.body.String() != "hello world" {
		t.Fatalf("unexpected body: %s", pending.body.String())
	}
	if pending.err != nil {
		t.Fatalf("unexpected error: %v", pending.err)
	}
}

func TestWaitForReconnect(t *testing.T) {
	manager := newAgentReverseChannelManager()

	go func() {
		manager.mu.Lock()
		manager.activeSessions["instance-1"] = "session-1"
		manager.activeSessionsByID["session-1"] = "instance-1"
		manager.mu.Unlock()
	}()

	if !manager.waitForReconnect(t.Context(), "instance-1") {
		t.Fatal("expected reconnect wait to observe active session")
	}
}

func TestOnDisconnectUsesSentinelError(t *testing.T) {
	manager := newAgentReverseChannelManager()
	manager.activeSessions["instance-1"] = "session-1"
	manager.activeSessionsByID["session-1"] = "instance-1"
	pending := &pendingAgentReverseResponse{
		instanceID: "instance-1",
		done:       make(chan struct{}),
	}
	manager.pendingResponses["req-1"] = pending

	manager.onDisconnect("session-1")

	<-pending.done
	if !errors.Is(pending.err, errAgentReverseChannelDisconnected) {
		t.Fatalf("unexpected error: %v", pending.err)
	}
}
