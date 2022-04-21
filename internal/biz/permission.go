package biz

import (
	"fmt"
	"infini.sh/console/internal/biz/enum"
)

var ClusterApis = make(map[string][]string)
var IndexApis = make([]string, 0)
var EsApis = make(map[string][]string)
var RolePermission = make(map[string][]string)

type RoleType = string

const (
	Console      RoleType = "console"
	Elastisearch RoleType = "elasticsearch"
)

type IRole interface {
	ListPermission() interface{}

	Create(localUser *User) (id string, err error)
}
type ConsoleRole struct {
	Name        string     `json:"name"`
	Description string     `json:"description" `
	RoleType    string     `json:"type" `
	Permission  Permission `json:"permission"`
}
type Permission struct {
	Api  []string         `json:"api"`
	Menu []MenuPermission `json:"menu"`
}
type MenuPermission struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	Privilege string `json:"privilege"`
}
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
	Id        string   `json:"id"`
	Name      string   `json:"name"`
	Privilege []string `json:"privilege,omitempty"`
	Children  []Menu   `json:"children,omitempty"`
}

func (role ConsoleRole) Create(localUser *User) (id string, err error) {
	return
}
func (role ElasticsearchRole) Create(localUser *User) (id string, err error) {
	return
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
