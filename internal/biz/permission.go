package biz

import (
	"infini.sh/console/internal/core"
	"infini.sh/console/model/rbac"
)

var ClusterApis = make(map[string][]string)
var IndexApis = make([]string, 50)

var RoleMap = make(map[string]rbac.Role)

type Token struct {
	JwtStr   string `json:"jwt_str"`
	Value    string `json:"value"`
	ExpireIn int64  `json:"expire_in"`
}

var TokenMap = make(map[string]Token)

var EsApiRoutes = core.NewRouter()


type RolePermission struct {
	Platform         []string `json:"platform,omitempty"`
	Cluster          []string `json:"cluster"`
	ClusterPrivilege []string `json:"cluster_privilege"`

	IndexPrivilege map[string][]string `json:"index_privilege"`
}

func ListElasticsearchPermission() interface{} {
	list := ElasticsearchPermission{
		ClusterPrivileges: ClusterApis,
		IndexPrivileges:   IndexApis,
	}
	return list
}

type ElasticsearchPermission struct {
	IndexPrivileges   []string            `json:"index_privileges"`
	ClusterPrivileges map[string][]string `json:"cluster_privileges"`
}
