package biz

import (
	"fmt"
	"infini.sh/console/internal/biz/enum"
)

var ClusterApis = make([]string, 0)
var EsApis = make(map[string][]string)
var RolePermission = make(map[string][]string)

type RoleType = string

const (
	Console      RoleType = "console"
	Elastisearch RoleType = "elasticsearch"
)

type IRole interface {
	ListPermission() interface{}
}
type ConsoleRole struct{}
type ElasticsearchRole struct{}

func NewRole(typ string) (r IRole, err error) {
	switch typ {
	case Console:
		r = &ConsoleRole{}

	case Elastisearch:
		r = &ElasticsearchRole{}
	default:
		err = fmt.Errorf("role type %s not support", typ)
	}
	return
}

type ConsolePermisson struct {
	Api  []string `json:"api"`
	Menu []Menu   `json:"menu"`
}
type Menu struct {
	Id         string   `json:"id"`
	Name       string   `json:"name"`
	Permission []string `json:"permission,omitempty"`
	Children   []Menu   `json:"children,omitempty"`
}

func (r ConsoleRole) ListPermission() interface{} {

	//	{
	//		Id:   "cluster_elasticsearch_refresh",
	//		Name: "集群监控刷新",
	//	},
	//	{
	//		Id:   "cluster_activities",
	//		Name: "集群动态",
	//	},
	//	{
	//		Id:   "cluster_activities_search",
	//		Name: "集群动态搜索",
	//	},
	//
	//}
	menu := []Menu{
		{
			Id:   "cluster",
			Name: "平台管理",
			Children: []Menu{
				{
					Id:         "cluster_overview",
					Name:       "平台概览",
					Permission: []string{"none", "write", "read"},
				},
				{

					Id:         "cluster_elasticsearch",
					Name:       "集群监控",
					Permission: []string{"none", "write", "read"},
				}, {

					Id:         "cluster_activities",
					Name:       "集群动态",
					Permission: []string{"none", "write", "read"},
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
func (r ElasticsearchRole) ListPermission() interface{} {
	list := ElasticsearchPermisson{
		ClusterPrivileges: ClusterApis,
		IndexPrivileges:   EsApis["indices"],
	}
	return list
}

type ElasticsearchPermisson struct {
	IndexPrivileges   []string `json:"index_privileges"`
	ClusterPrivileges []string `json:"cluster_privileges"`
}
