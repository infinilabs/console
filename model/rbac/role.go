package rbac

import (
	"time"
)

type Role struct {
	ID      string    `json:"id,omitempty"      elastic_meta:"_id" elastic_mapping:"id: { type: keyword }"`
	Created time.Time `json:"created,omitempty" elastic_mapping:"created: { type: date }"`
	Updated time.Time `json:"updated,omitempty" elastic_mapping:"updated: { type: date }"`
	Name string `json:"name"  elastic_mapping:"name: { type: keyword }"`
	Type string `json:"type" elastic_mapping:"type: { type: keyword }"`
	Description string `json:"description"  elastic_mapping:"description: { type: text }"`
	Builtin bool `json:"builtin" elastic_mapping:"builtin: { type: boolean }"`
	Privilege RolePrivilege `json:"privilege" elastic_mapping:"privilege: { type: object }"`
}

type RolePrivilege struct {
	Platform []string `json:"platform,omitempty" elastic_mapping:"platform: { type: keyword }"`
	Elasticsearch ElasticsearchPrivilege `json:"elasticsearch,omitempty" elastic_mapping:"elasticsearch: { type: object }"`
}

type ElasticsearchPrivilege struct {
	Cluster ClusterPrivilege `json:"cluster,omitempty" elastic_mapping:"cluster: { type: object }"`
	Index []IndexPrivilege `json:"index,omitempty" elastic_mapping:"index: { type: object }"`
}

type InnerCluster struct {
	ID string `json:"id" elastic_mapping:"id: { type: keyword }"`
	Name string `json:"name" elastic_mapping:"name: { type: keyword }"`
}
type ClusterPrivilege struct {
	Resources []InnerCluster `json:"resources,omitempty" elastic_mapping:"resources: { type: object }"`
	Permissions []string `json:"permissions,omitempty" elastic_mapping:"permissions: { type: keyword }"`
}

type IndexPrivilege struct {
	Name []string `json:"name,omitempty" elastic_mapping:"name: { type: keyword }"`
	Permissions []string `json:"permissions,omitempty" elastic_mapping:"permissions: { type: keyword }"`
}