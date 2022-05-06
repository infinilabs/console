package dto

type UpdateRole struct {
	Description      string   `json:"description" `
	Platform         []string `json:"platform"`
	Cluster          []string `json:"cluster" `
	Index            []string `json:"index" `
	ClusterPrivilege []string `json:"cluster_privilege" `
	IndexPrivilege   []string `json:"index_privilege" `
}

type ElasticsearchPermission struct {
	Cluster          []string `json:"cluster" `
	Index            []string `json:"index" `
	ClusterPrivilege []string `json:"cluster_privilege" `
	IndexPrivilege   []string `json:"index_privilege" `
}
type CreateUser struct {
	NickName string `json:"nick_name"`

	Name  string   `json:"name"`
	Email string   `json:"email"`
	Phone string   `json:"phone"`
	Roles []Role   `json:"roles"`
	Tags  []string `json:"tags"`
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
	Roles []Role   `json:"roles"`
}
type UpdateUserRole struct {
	Roles []Role `json:"roles"`
}
type UpdateUserPassword struct {
	Password string `json:"password"`
}
