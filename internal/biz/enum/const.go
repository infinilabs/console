package enum

import (
	"time"
)

var UserRead = []string{"system.user:read"}
var UserAll = []string{"system.user:all"}

var RoleRead = []string{"system.role:read"}
var RoleAll = []string{"system.role:all"}

var RuleRead = []string{"rule::read"}
var RuleAll = []string{"rule::read", "rule::write"}

var InstanceRead = []string{"instance::read"}
var InstanceAll = []string{"instance::read", "instance::write"}
var AdminPrivilege = []string{
	"system.role:read", "system.role:all", "system.user:read", "system.user:all",
}

var BuildRoles = make(map[string]map[string]interface{}, 0)

func init() {

	BuildRoles["admin"] = map[string]interface{}{
		"id":          "admin",
		"name":        "管理员",
		"platform":    []string{"system.role:all", "system.user:all"},
		"builtin":     true,
		"description": "is admin",
		"created":     time.Now(),
	}

	//自定义角色=》 =》permissionKey
	// userrole=> [cluster::all,clust] =>  permissionValue [cluster::read,cluster::write]
	// login=> userrole=> cluster::all =>permissionList[]
	// cluster search api require = (cluster::read)
	//Permission = map[string][]string{
	//
	//	UserRead : {UserRead},
	//	UserAll: {UserRead, UserWrite},
	//}
	//zhangsan  userrole [cluster::read,cluster::write]
	// cluster/_search reqire(cluster::read)

}
