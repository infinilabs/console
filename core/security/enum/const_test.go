package enum

import (
	"testing"
)

func TestDiscoverPermissionsIncludeLayoutAccess(t *testing.T) {
	has := func(permissions []string, target string) bool {
		for _, permission := range permissions {
			if permission == target {
				return true
			}
		}
		return false
	}

	if !has(DiscoverReadPermission, PermissionLayoutRead) {
		t.Fatalf("expected discover read permissions to include %q", PermissionLayoutRead)
	}

	if !has(DiscoverAllPermission, PermissionLayoutRead) {
		t.Fatalf("expected discover all permissions to include %q", PermissionLayoutRead)
	}

	if !has(DiscoverAllPermission, PermissionLayoutWrite) {
		t.Fatalf("expected discover all permissions to include %q", PermissionLayoutWrite)
	}
}
