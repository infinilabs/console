package api

import (
	"encoding/base64"
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
