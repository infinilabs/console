package enum

import "time"

var UserRead = []string{"user::read"}
var UserAll = []string{"user::read", "user::write"}

var RoleRead = []string{"role::read"}
var RoleAll = []string{"role::read", "role::write"}

//const RuleRead = "rule::read"
//const RuleAll = "rule::all"
//
//const InstanceRead = "instance::read"
//const InstanceAll = "instance::all"

var Admin []string
var BuildRoles = make(map[string]map[string]interface{}, 0)
var Permission = make(map[string][]string)

func init() {
	Admin = append(Admin, UserAll...)
	Admin = append(Admin, RoleAll...)
	BuildRoles["admin"] = map[string]interface{}{
		"id":          "admin",
		"name":        "admin",
		"permission":  Admin,
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
