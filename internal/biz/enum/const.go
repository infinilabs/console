package enum

import (
	"time"
)

const UserRead = "system.user:read"
const UserAll = "system.user:all"

const RoleRead = "system.role:read"
const RoleAll = "system.role:all"

const RuleRead = "alerting.rule:read"
const RuleAll = "alerting.rule:all"

const InstanceRead = "gateway.instance:read"
const InstanceAll = "gateway.instance:all"

var AdminPrivilege = []string{
	UserRead, UserAll, RoleRead, RoleAll,
}

var BuildRoles = make(map[string]map[string]interface{}, 0)

func init() {

	BuildRoles["admin"] = map[string]interface{}{
		"id":          "admin",
		"name":        "管理员",
		"type":        "console",
		"platform":    AdminPrivilege,
		"builtin":     true,
		"description": "is admin",
		"created":     time.Now(),
	}

}
