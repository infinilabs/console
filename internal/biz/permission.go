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
	Id   string `json:"id"`
	Name string `json:"name"`
}

func (r ConsoleRole) ListPermission() interface{} {
	//list := []ConsolePermisson{
	//	{
	//		Id:   "cluster_overview",
	//		Name: "平台概览",
	//	},
	//	{
	//		Id:   "cluster_search",
	//		Name: "平台搜索",
	//	},
	//	{
	//		Id:   "cluster_elasticsearch",
	//		Name: "集群监控",
	//	},
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
	m := make(map[string]map[string][]string)
	m["api"]["用户管理"] = enum.AdminUser
	m["api"]["角色管理"] = enum.AdminRole
	return m
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
