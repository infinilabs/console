package dto

type CreateConsoleRole struct {
	Name        string         `json:"name"`
	Description string         `json:"description" `
	RoleType    string         `json:"type" `
	Permission  RolePermission `json:"permission"`
}
type RolePermission struct {
	Api  []string `json:"api"`
	Menu []Menu   `json:"menu"`
}
type Menu struct {
	Id     string `json:"id"`
	Name   string `json:"name"`
	Switch string `json:"switch"`
}
type UpdateConsoleRole struct {
	Description string         `json:"description" `
	Permission  RolePermission `json:"permission"`
}
type CreateEsRole struct {
	Name        string                  `json:"name"`
	Description string                  `json:"description" `
	RoleType    string                  `json:"type" `
	Permission  ElasticsearchPermission `json:"permission"`
}
type ElasticsearchPermission struct {
	Cluster          []string `json:"cluster" `
	Index            []string `json:"index" `
	ClusterPrivilege []string `json:"cluster_privilege" `
	IndexPrivilege   []string `json:"index_privilege" `
}
type CreateUser struct {
	Username string   `json:"username"`
	Password string   `json:"password"`
	Name     string   `json:"name"`
	Email    string   `json:"email"`
	Phone    string   `json:"phone"`
	Roles    []Role   `json:"roles"`
	Tags     []string `json:"tags"`
}
type Role struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}
type UpdateUser struct {
	Name  string   `json:"name"`
	Email string   `json:"email"`
	Phone string   `json:"phone"`
	Tags  []string `json:"tags"`
}
type UpdateUserRole struct {
	Roles []Role `json:"roles"`
}
