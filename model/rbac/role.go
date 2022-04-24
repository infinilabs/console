package rbac

import (
	"infini.sh/framework/core/orm"
)

type Role struct {
	orm.ORMObjectBase
	Name        string   `json:"name" elastic_mapping:"name:{type:keyword}"`
	Description string   `json:"description" elastic_mapping:"description:{type:text}"`
	RoleType    string   `json:"type" elastic_mapping:"type:{type:keyword}"`
	Platform    []string `json:"platform,omitempty" `
	BuiltIn     bool     `json:"builtin" elastic_mapping:"builtin:{type:boolean}"` //是否内置

	Cluster []struct {
		Id   string `json:"id"`
		Name string `json:"name"`
	} `json:"cluster,omitempty"`
	ClusterPrivilege []map[string][]string `json:"cluster_privilege,omitempty"`
	Index            []struct {
		Name      []string `json:"name"`
		Privilege []string `json:"privilege"`
	} `json:"index,omitempty"`
}
type ConsolePermission struct {
	Api  []string `json:"api"`
	Menu []Menu   `json:"menu"`
}

type Menu struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	Privilege string `json:"privilege"`
}

type ElasticRole struct {
	orm.ORMObjectBase
	Name        string `json:"name" elastic_mapping:"name:{type:keyword}"`
	Description string `json:"description" elastic_mapping:"description:{type:text}"`
	RoleType    string `json:"type" elastic_mapping:"type:{type:keyword}"`
	BuiltIn     bool   `json:"builtin" elastic_mapping:"builtin:{type:boolean}"` //是否内置
	Cluster     []struct {
		Id   string `json:"id"`
		Name string `json:"name"`
	} `json:"cluster,omitempty"`
	ClusterPrivilege []map[string][]string `json:"cluster_privilege,omitempty"`
	Index            []struct {
		Name      []string `json:"name"`
		Privilege []string `json:"privilege"`
	} `json:"index,omitempty"`
}
