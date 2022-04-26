package biz

import "infini.sh/console/internal/core"

var ClusterApis = make(map[string][]string)
var IndexApis = make([]string, 0)

var RoleMap = make(map[string]Role)
var EsApiRoutes = core.NewRouter()

type Role struct {
	Name     string   `json:"name"`
	Platform []string `json:"platform,omitempty"`
	Cluster  []struct {
		Id   string `json:"id"`
		Name string `json:"name"`
	} `json:"cluster,omitempty"`
	ClusterPrivilege []string `json:"cluster_privilege,omitempty"`
	Index            []struct {
		Name      []string `json:"name"`
		Privilege []string `json:"privilege"`
	} `json:"index,omitempty"`
}
type RolePermission struct {
	Platform         []string `json:"platform,omitempty"`
	Cluster          []string `json:"cluster"`
	ClusterPrivilege []string `json:"cluster_privilege"`
	Index            []string `json:"index"`
	IndexPrivilege   []string `json:"index_privilege"`
}
type ConsolePermisson struct {
	Platform []Platform `json:"platform"`
}
type Platform struct {
	Id string `json:"id"`

	Privilege map[string]string `json:"privilege,omitempty"`
	Children  []Platform        `json:"children,omitempty"`
}

func (role ConsoleRole) ListPermission() interface{} {

	p := ConsolePermisson{}
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
