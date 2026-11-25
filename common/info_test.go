package common

import (
	"testing"

	"infini.sh/framework/core/util"
)

func TestSanitizeInstanceInfoMap(t *testing.T) {
	payload := util.MapStr{
		"id":          "node-1",
		"name":        "console-a",
		"application": util.MapStr{"name": "console"},
		"endpoint":    "http://127.0.0.1:2900",
		"host":        util.MapStr{"name": "host-a"},
		"network":     util.MapStr{"ip": []string{"10.0.0.1"}},
		"basic_auth":  util.MapStr{"username": "admin"},
	}

	sanitized := SanitizeInstanceInfoMap(payload)

	if sanitized["id"] != "node-1" {
		t.Fatalf("expected id to be preserved, got %v", sanitized["id"])
	}
	if _, ok := sanitized["endpoint"]; ok {
		t.Fatalf("expected endpoint to be removed")
	}
	if _, ok := sanitized["host"]; ok {
		t.Fatalf("expected host to be removed")
	}
	if _, ok := sanitized["network"]; ok {
		t.Fatalf("expected network to be removed")
	}
	if _, ok := sanitized["basic_auth"]; ok {
		t.Fatalf("expected basic_auth to be removed")
	}
}
