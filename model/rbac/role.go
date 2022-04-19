package rbac

import (
	"infini.sh/framework/core/orm"
	"time"
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
	ApiPermission []string `json:"api_permission"`
	//ID   string `json:"id" elastic_mapping:"id:{type:keyword}"`
	//Name string `json:"name" elastic_mapping:"name:{type:keyword}"`
}
type ElasticsearchPermission struct {
	Cluster          []string `json:"cluster" elastic_mapping:"cluster:{type:object}"`
	Index            []string `json:"index" elastic_mapping:"index:{type:object}"`
	ClusterPrivilege []string `json:"cluster_privilege" elastic_mapping:"cluster_privilege:{type:object}"`
	IndexPrivilege   []string `json:"index_privilege" elastic_mapping:"index_privilege:{type:object}"`
}

type ConsoleOperate struct {
	UserId string `json:"user_id" elastic_mapping:"user_id:{type:keyword}"`
}
type Operation struct {
	Id        string    `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Metadata  struct {
		Labels struct {
			Userid   string `json:"userid"`
			Username string `json:"username"`
		} `json:"labels"`
		Category string `json:"category"`
		Group    string `json:"group"`
		Name     string `json:"name"`
		Type     string `json:"type"`
	} `json:"metadata"`
	Changelog []struct {
		From string   `json:"from"`
		Path []string `json:"path"`
		To   string   `json:"to"`
		Type string   `json:"type"`
	} `json:"changelog"`
	Payload interface{} `json:"payload"`
}
