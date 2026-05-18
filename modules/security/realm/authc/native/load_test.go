package native

import (
	"testing"

	rbac "infini.sh/console/core/security"
	"infini.sh/framework/core/orm"
)

func cloneRoleMap(src map[string]rbac.Role) map[string]rbac.Role {
	dst := make(map[string]rbac.Role, len(src))
	for k, v := range src {
		dst[k] = v
	}
	return dst
}

func TestLoadRemoteRolePermissionSkipsWhenORMUnavailable(t *testing.T) {
	if orm.HasHandler() {
		t.Skip("test requires ORM handler to be unregistered")
	}

	previousRoleMap := cloneRoleMap(rbac.RoleMap)
	defer func() {
		rbac.RoleMap = previousRoleMap
	}()

	loadRemoteRolePermission()

	if len(rbac.RoleMap) != len(rbac.BuiltinRoles) {
		t.Fatalf("expected only builtin roles to be loaded, got %d roles", len(rbac.RoleMap))
	}
	for name, role := range rbac.BuiltinRoles {
		got, ok := rbac.RoleMap[name]
		if !ok {
			t.Fatalf("expected builtin role %q to be present", name)
		}
		if got.Name != role.Name {
			t.Fatalf("expected builtin role %q, got %q", role.Name, got.Name)
		}
	}
}
