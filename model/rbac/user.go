package rbac

import "infini.sh/framework/core/orm"

type User struct {
	orm.ORMObjectBase
	Username string     `json:"username" elastic_mapping:"username:{type:keyword}"`
	Password string     `json:"password" elastic_mapping:"password:{type:text}"`
	Name     string     `json:"name" elastic_mapping:"name:{type:keyword}"`
	Phone    string     `json:"phone" elastic_mapping:"phone:{type:keyword}"`
	Email    string     `json:"email" elastic_mapping:"email:{type:keyword}"`
	Roles    []UserRole `json:"roles" elastic_mapping:"roles:{type:text}"`
	Tags     []string   `json:"tags" elastic_mapping:"tags:{type:text}"`
}
type UserRole struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}
