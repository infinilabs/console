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

type Role struct {
	Platform []string `json:"platform,omitempty"`
	Cluster  []struct {
		Id   string `json:"id"`
		Name string `json:"name"`
	} `json:"cluster,omitempty"`
	ClusterPrivilege []map[string][]string `json:"cluster_privilege,omitempty"`
	Index            []struct {
		Name      []string `json:"name"`
		Privilege []string `json:"privilege"`
	} `json:"index,omitempty"`
}

var Admin Role
var BuildRoles = make(map[string]map[string]interface{}, 0)

func init() {
	Admin = Role{
		Platform: AdminPrivilege,
	}

	UserMenu := Menu{
		Id:        "system_user",
		Privilege: "all",
	}
	RoleMenu := Menu{
		Id: "system_role",

		Privilege: "all",
	}
	AdminMenu := []Menu{
		UserMenu, RoleMenu,
	}

	BuildRoles["admin"] = map[string]interface{}{
		"id":          "admin",
		"name":        "管理员",
		"permission":  AdminMenu,
		"builtin":     true,
		"description": "is admin",
		"created":     time.Now(),
	}

	BuildRoles["user_admin"] = map[string]interface{}{
		"id":          "user_admin",
		"name":        "用户管理员",
		"permission":  UserMenu,
		"builtin":     true,
		"description": "is user admin",
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
