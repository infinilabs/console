package security

import "testing"

func TestUserIsEnabledDefaultsToTrue(t *testing.T) {
	var user User
	if !user.IsEnabled() {
		t.Fatalf("expected user without enabled flag to be enabled by default")
	}
}

func TestUserSetEnabled(t *testing.T) {
	var user User
	user.SetEnabled(false)
	if user.IsEnabled() {
		t.Fatalf("expected user to be disabled after SetEnabled(false)")
	}

	user.SetEnabled(true)
	if !user.IsEnabled() {
		t.Fatalf("expected user to be enabled after SetEnabled(true)")
	}
}
