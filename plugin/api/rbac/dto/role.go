package dto

type CreateRole struct {
	Name        string      `json:"name"`
	Description string      `json:"description" `
	RoleType    string      `json:"type" `
	Permission  interface{} `json:"permission"`
}
type UpdateRole struct {
	Description string      `json:"description" `
	Permission  interface{} `json:"permission"`
}
type ElasticsearchPermission struct {
	Cluster          []string `json:"cluster" `
	Index            []string `json:"index" `
	ClusterPrivilege []string `json:"cluster_privilege" `
	IndexPrivilege   []string `json:"index_privilege" `
}
type CreateUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Roles    []Role `json:"roles"`
}
type Role struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}
type UpdateUser struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	//	Roles []Role `json:"roles"`
}
type UpdateUserRole struct {
	Roles []Role `json:"roles"`
}
