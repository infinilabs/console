package common

import (
	"strings"
	"testing"

	"infini.sh/framework/core/model"
)

func TestBuildManagerCredentialName(t *testing.T) {
	name := BuildManagerCredentialName(&model.Instance{Name: "Shazam"})
	if name != "Shazam (Agent)" {
		t.Fatalf("unexpected manager credential name: %s", name)
	}
	if strings.Contains(name, "INFINI_SYSTEM") {
		t.Fatalf("manager credential name should not contain system prefix: %s", name)
	}
}

func TestBuildAccessCredentialName(t *testing.T) {
	name := BuildAccessCredentialName(&model.Instance{Name: "Shazam"})
	if name != "Shazam (Agent Access)" {
		t.Fatalf("unexpected access credential name: %s", name)
	}
	if strings.Contains(name, "INFINI_SYSTEM") {
		t.Fatalf("access credential name should not contain system prefix: %s", name)
	}
}

func TestBuildPendingManagerCredentialName(t *testing.T) {
	name := BuildPendingManagerCredentialName()
	if !strings.HasSuffix(name, " (Agent)") {
		t.Fatalf("unexpected pending credential name: %s", name)
	}
	if strings.Contains(name, "INFINI_SYSTEM") {
		t.Fatalf("pending credential name should not contain system prefix: %s", name)
	}
}
