package enum

import (
	"infini.sh/console/model/rbac"
	"infini.sh/framework/core/orm"
)

const CreateUser = "create_user"
const UpdateUser = "update_user"
const DeleteUser = "delete_user"
const GetUser = "get_user"
const SearchUser = "search_user"

const CreateRole = "create_role"
const UpdateRole = "update_role"
const DeleteRole = "delete_role"
const GetRole = "get_role"
const SearchRole = "search_role"
const ListPermission = "list_permission"

const CreateRule = "create_rule"
const UpdateRule = "update_rule"
const DeleteRule = "delete_rule"
const GetRule = "get_rule"
const SearchRule = "search_rule"

const CreateInstance = "create_instance"
const UpdateInstance = "update_instance"
const DeleteInstance = "delete_instance"
const GetInstance = "get_instance"
const SearchInstance = "search_instance"
const GetInstanceStatus = "get_instance_status"
const ConnectInstance = "connect_instance"
const InstanceProxy = "instance_proxy"

var Admin = []string{CreateUser, UpdateUser, DeleteUser, GetUser, SearchUser, CreateRole, UpdateRole, DeleteRole, GetRole, SearchRole, ListPermission}
var AdminUser = []string{CreateUser, UpdateUser, DeleteUser, GetUser, SearchUser}

var BuildRoles = []rbac.Role{
	{
		ORMObjectBase: orm.ORMObjectBase{
			ID: "admin",
		},
		Name:        "admin",
		Description: "管理员",
		RoleType:    "console",
		Permission: rbac.ConsolePermission{
			ApiPermission: Admin,
		},
		BuiltIn: true,
	},
	{
		ORMObjectBase: orm.ORMObjectBase{
			ID: "admin_user",
		},
		Name:        "admin_user",
		Description: "用户模块管理员",
		RoleType:    "console",
		Permission: rbac.ConsolePermission{
			ApiPermission: AdminUser,
		},
		BuiltIn: true,
	},
}
