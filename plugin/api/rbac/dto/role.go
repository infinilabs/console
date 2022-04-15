package dto

type CreateRoleReq struct {
	Name        string      `json:"name"`
	Description string      `json:"description" `
	RoleType    string      `json:"type" `
	Permission  interface{} `json:"permission"`
}
type UpdateRoleReq struct {
	Description string      `json:"description" `
	Permission  interface{} `json:"permission"`
}
type ElasticsearchPermission struct {
	Cluster          []string `json:"cluster" `
	Index            []string `json:"index" `
	ClusterPrivilege []string `json:"cluster_privilege" `
	IndexPrivilege   []string `json:"index_privilege" `
}
