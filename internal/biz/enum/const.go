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
	//自定义角色=》内置角色 =》权限列表
	// userrole=> cluster；read =>  permissionList
	// login=> userrole=> cluster:read =>permissionList
	// search require = (search)
	//Permission = map[string][]string{
	//
	//	UserRead : {UserRead},
	//	UserAll: {UserRead, UserWrite},
	//}

}
