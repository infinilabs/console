package security

import (
	"testing"

	"infini.sh/console/core/security/enum"
	frameworksecurity "infini.sh/framework/core/security"
)

func TestExpandFrameworkPermissionKeysForPlatformPrivileges(t *testing.T) {
	keys := ExpandFrameworkPermissionKeysForPlatformPrivileges([]string{enum.SecurityAll})

	has := func(target frameworksecurity.PermissionKey) bool {
		for _, key := range keys {
			if key == target {
				return true
			}
		}
		return false
	}

	if !has(frameworksecurity.PermissionKey(enum.SecurityAll)) {
		t.Fatalf("expected platform privilege %q to be preserved", enum.SecurityAll)
	}

	if !has(frameworksecurity.GetOrInitPermission("generic", "security:auth:api-token", frameworksecurity.Create)) {
		t.Fatal("expected create access token permission to be included for system.security:all")
	}

	if !has(frameworksecurity.GetOrInitPermission("generic", "security:auth:api-token", frameworksecurity.Search)) {
		t.Fatal("expected search access token permission to be included for system.security:all")
	}
}
