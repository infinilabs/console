/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package security

import (
	"fmt"
	"infini.sh/console/core/security/enum"
	"infini.sh/framework/core/orm"
	"time"
)

type Role struct {
	orm.ORMObjectBase

	Name        string        `json:"name"  elastic_mapping:"name: { type: keyword }"`
	Type        string        `json:"type" elastic_mapping:"type: { type: keyword }"`
	Description string        `json:"description"  elastic_mapping:"description: { type: text }"`
	Builtin     bool          `json:"builtin" elastic_mapping:"builtin: { type: boolean }"`
	Privilege   RolePrivilege `json:"privilege" elastic_mapping:"privilege: { type: object }"`
}

type RolePrivilege struct {
	Platform      []string               `json:"platform,omitempty" elastic_mapping:"platform: { type: keyword }"`
	Elasticsearch ElasticsearchPrivilege `json:"elasticsearch,omitempty" elastic_mapping:"elasticsearch: { type: object }"`
}

type ElasticsearchPrivilege struct {
	Cluster ClusterPrivilege `json:"cluster,omitempty" elastic_mapping:"cluster: { type: object }"`
	Index   []IndexPrivilege `json:"index,omitempty" elastic_mapping:"index: { type: object }"`
}

type InnerCluster struct {
	ID   string `json:"id" elastic_mapping:"id: { type: keyword }"`
	Name string `json:"name" elastic_mapping:"name: { type: keyword }"`
}

type ClusterPrivilege struct {
	Resources   []InnerCluster `json:"resources,omitempty" elastic_mapping:"resources: { type: object }"`
	Permissions []string       `json:"permissions,omitempty" elastic_mapping:"permissions: { type: keyword }"`
}

type IndexPrivilege struct {
	Name        []string `json:"name,omitempty" elastic_mapping:"name: { type: keyword }"`
	Permissions []string `json:"permissions,omitempty" elastic_mapping:"permissions: { type: keyword }"`
}

type RoleType = string

const (
	Platform      RoleType = "platform"
	Elasticsearch RoleType = "elasticsearch"
)

func IsAllowRoleType(roleType string) (err error) {
	if roleType != Platform && roleType != Elasticsearch {
		err = fmt.Errorf("invalid role type %s ", roleType)
		return
	}
	return
}

var BuiltinRoles = make(map[string]Role, 0)

const RoleAdminName = "Administrator"

func init() {
	now := time.Now()
	BuiltinRoles[RoleAdminName] = Role{
		ORMObjectBase: orm.ORMObjectBase{
			ID:      RoleAdminName,
			Created: &now,
		},
		Name: RoleAdminName,
		Type: "platform",
		Privilege: RolePrivilege{
			Platform: enum.AdminPrivilege,
			Elasticsearch: ElasticsearchPrivilege{
				Cluster: ClusterPrivilege{
					Resources:   []InnerCluster{{"*", "*"}},
					Permissions: []string{"*"},
				},
				Index: []IndexPrivilege{
					{Name: []string{"*"},
						Permissions: []string{"*"},
					},
				},
			},
		},
		Builtin:     true,
		Description: "Administrator is a super role.",
	}
}
