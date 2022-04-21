package biz

import (
	"infini.sh/console/internal/biz/enum"
)

var ClusterApis = make(map[string][]string)
var IndexApis = make([]string, 0)

var RolePermission = make(map[string][]string)

type ConsolePermisson struct {
	Api  []string `json:"api"`
	Menu []Menu   `json:"menu"`
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
			Id:   "cluster",
			Name: "平台管理",
			Children: []Menu{
				{
					Id:        "cluster_overview",
					Name:      "平台概览",
					Privilege: []string{"none", "write", "read"},
				},
				{

					Id:        "cluster_elasticsearch",
					Name:      "集群监控",
					Privilege: []string{"none", "write", "read"},
				}, {

					Id:        "cluster_activities",
					Name:      "集群动态",
					Privilege: []string{"none", "write", "read"},
				},
			},
		},
	}
	p := ConsolePermisson{
		Api:  enum.All,
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
