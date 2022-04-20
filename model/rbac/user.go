package rbac

import "infini.sh/framework/core/orm"

type User struct {
	orm.ORMObjectBase
	Username string     `json:"username" elastic_mapping:"username:{type:keyword}"`
	Password string     `json:"password" elastic_mapping:"password:{type:text}"`
	Name     string     `json:"name" elastic_mapping:"name:{type:keyword}"`
	Phone    string     `json:"phone" elastic_mapping:"phone:{type:keyword}"`
	Email    string     `json:"email" elastic_mapping:"email:{type:keyword}"`
	Roles    []UserRole `json:"roles"`
	Tags     []string   `json:"tags,omitempty" elastic_mapping:"tags:{type:text}"`
}
type UserRole struct {
	Id   string `json:"id" elastic_mapping:"id:{type:keyword}"`
	Name string `json:"name" elastic_mapping:"name:{type:keyword}" `
}
