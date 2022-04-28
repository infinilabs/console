package enum

import (
	"time"
)

var PermissionMap = make(map[string][]string)

const (
	UserRead     = "system.user:read"
	UserAll      = "system.user:all"
	RoleRead     = "system.role:read"
	RoleAll      = "system.role:all"
	RuleRead     = "alerting.rule:read"
	RuleAll      = "alerting.rule:all"
	InstanceRead = "gateway.instance:read"
	InstanceAll  = "gateway.instance:all"
	FlowRead     = "gateway.flow:read"
	FlowAll      = "gateway.flow:all"
	IndexAll     = "data.index:read"
	IndexRead    = "data.index:all"
	ViewsAll     = "data.views:read"
	ViewsRead    = "data.views:all"
	DiscoverAll  = "data.discover:read"
	DiscoverRead = "data.discover:all"
	ClusterAll   = "system.cluster:all"
	ClusterRead  = "system.cluster:read"

	CommandAll  = "system.command:all"
	CommandRead = "system.command:read"

	EntryAll   = "gateway.entry:all"
	EntryRead  = "gateway.entry:read"
	RouterRead = "gateway.router:read"
	RouterAll  = "gateway.router:all"
)

var UserReadPermission = []string{"user:read"}
var UserAllPermission = []string{"user:read", "user:write"}

var RoleReadPermission = []string{"role:read"}
var RoleAllPermission = []string{"role:read", "role:write"}

var RuleReadPermission = []string{"rule:read"}
var RuleAllPermission = []string{"rule:read", "rule:write"}

var InstanceReadPermission = []string{"instance:read"}
var InstanceAllPermission = []string{"instance:all"}

var EntryReadPermission = []string{"entry:read"}
var EntryAllPermission = []string{"entry:all"}

var RouterReadPermission = []string{"router:read"}
var RouterAllPermission = []string{"router:all"}

var AdminPrivilege = []string{
	UserAll, RoleAll, RuleAll, EntryAll,
	InstanceAll, ClusterAll, CommandAll, RouterAll,
	FlowRead, FlowAll, IndexAll, ViewsAll,
	DiscoverAll,
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
	PermissionMap = map[string][]string{
		UserRead:     UserReadPermission,
		UserAll:      UserAllPermission,
		RoleRead:     RoleReadPermission,
		RoleAll:      RoleAllPermission,
		RuleRead:     RuleReadPermission,
		RuleAll:      RuleAllPermission,
		InstanceRead: InstanceReadPermission,
		InstanceAll:  InstanceAllPermission,
		EntryRead:    EntryReadPermission,
		EntryAll:     EntryAllPermission,
		RouterRead:   RouterReadPermission,
		RouterAll:    RouterAllPermission,
	}

}
