package biz

var ClusterApis = make(map[string][]string)
var IndexApis = make([]string, 0)

var RolePermission = make(map[string][]string)

type ConsolePermisson struct {
	Menu []Menu `json:"menu"`
}
type Menu struct {
	Id        string   `json:"id"`
	Name      string   `json:"name"`
	Privilege []string `json:"privilege,omitempty"`
	Children  []Menu   `json:"children,omitempty"`
}

func (role ConsoleRole) ListPermission() interface{} {
	menu := []Menu{
		{
			Id:   "system",
			Name: "系统管理",
			Children: []Menu{
				{
					Id:        "system_user",
					Name:      "用户管理",
					Privilege: []string{"none", "read", "all"},
				},
				{

					Id:        "system_role",
					Name:      "角色管理",
					Privilege: []string{"none", "read", "all"},
				},
			},
		},
	}
	p := ConsolePermisson{

		Menu: menu,
	}
	return p
}
func (role ElasticsearchRole) ListPermission() interface{} {
	list := ElasticsearchPermisson{
		ClusterPrivileges: ClusterApis,
		IndexPrivileges:   IndexApis,
	}
	return list
}

type ElasticsearchPermisson struct {
	IndexPrivileges   []string            `json:"index_privileges"`
	ClusterPrivileges map[string][]string `json:"cluster_privileges"`
}
