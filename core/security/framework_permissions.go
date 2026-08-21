package security

import (
	"sort"

	"infini.sh/console/core/security/enum"
	frameworksecurity "infini.sh/framework/core/security"
)

func ExpandFrameworkPermissionKeysForPlatformPrivileges(privileges []string) []frameworksecurity.PermissionKey {
	permissionSet := map[frameworksecurity.PermissionKey]struct{}{}
	add := func(keys ...frameworksecurity.PermissionKey) {
		for _, key := range keys {
			if key == "" {
				continue
			}
			permissionSet[key] = struct{}{}
		}
	}

	for _, privilege := range privileges {
		add(frameworksecurity.PermissionKey(privilege))
		switch privilege {
		case enum.SecurityAll:
			add(
				frameworksecurity.GetOrInitPermission("generic", "security:auth:api-token", frameworksecurity.Create),
				frameworksecurity.GetOrInitPermission("generic", "security:auth:api-token", frameworksecurity.Update),
				frameworksecurity.GetOrInitPermission("generic", "security:auth:api-token", frameworksecurity.Delete),
				frameworksecurity.GetOrInitPermission("generic", "security:auth:api-token", frameworksecurity.Search),
			)
		case enum.SecurityRead:
			add(
				frameworksecurity.GetOrInitPermission("generic", "security:auth:api-token", frameworksecurity.Search),
			)
		}
	}

	if len(permissionSet) == 0 {
		return nil
	}

	keys := make([]frameworksecurity.PermissionKey, 0, len(permissionSet))
	for key := range permissionSet {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(i, j int) bool {
		return keys[i] < keys[j]
	})
	return keys
}
