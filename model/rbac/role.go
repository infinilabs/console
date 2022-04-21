package rbac

import (
	"infini.sh/framework/core/orm"
)

type Role struct {
	orm.ORMObjectBase
	Name        string      `json:"name" elastic_mapping:"name:{type:keyword}"`
	Description string      `json:"description" elastic_mapping:"description:{type:text}"`
	RoleType    string      `json:"type" elastic_mapping:"type:{type:keyword}"`
	Permission  interface{} `json:"permission" elastic_mapping:"permission:{type:object}"`
	BuiltIn     bool        `json:"builtin" elastic_mapping:"builtin:{type:boolean}"` //是否内置
}
type ConsolePermission struct {
	Api  []string `json:"api"`
	Menu []Menu   `json:"menu"`
}

type Menu struct {
	Id         string `json:"id"`
	Name       string `json:"name"`
	Permission string `json:"permission"`
}
type ElasticsearchPermission struct {
	Cluster          []string `json:"cluster" elastic_mapping:"cluster:{type:object}"`
	Index            []string `json:"index" elastic_mapping:"index:{type:object}"`
	ClusterPrivilege []string `json:"cluster_privilege" elastic_mapping:"cluster_privilege:{type:object}"`
	IndexPrivilege   []string `json:"index_privilege" elastic_mapping:"index_privilege:{type:object}"`
}
