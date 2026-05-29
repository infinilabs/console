package api

import (
	"testing"

	"infini.sh/framework/core/credential"
)

func TestCredentialNameConflictIgnoresExcludedID(t *testing.T) {
	items := []credential.Credential{
		{Name: "shared-name"},
	}
	items[0].ID = "cred-1"

	if hasCredentialNameConflict(items, "cred-1") {
		t.Fatalf("expected excluded credential id to be ignored")
	}
}

func TestCredentialNameConflictDetectsDifferentID(t *testing.T) {
	items := []credential.Credential{
		{Name: "shared-name"},
	}
	items[0].ID = "cred-2"

	if !hasCredentialNameConflict(items, "cred-1") {
		t.Fatalf("expected different credential id to be treated as conflict")
	}
}

func TestValidateCredentialUpdateRejectsTypeChange(t *testing.T) {
	current := &credential.Credential{Type: credential.BasicAuth}
	next := &credential.Credential{Type: credential.Token}

	if err := validateCredentialUpdate(current, next); err == nil {
		t.Fatalf("expected credential type change to be rejected")
	}
}

func TestValidateCredentialUpdateAllowsSameType(t *testing.T) {
	current := &credential.Credential{Type: credential.BasicAuth}
	next := &credential.Credential{Type: credential.BasicAuth}

	if err := validateCredentialUpdate(current, next); err != nil {
		t.Fatalf("expected same credential type to be allowed, got %v", err)
	}
}
