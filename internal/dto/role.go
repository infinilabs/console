package dto

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
