package rbac

import (
	"time"
)

type User struct {
	ID      string    `json:"id,omitempty"      elastic_meta:"_id" elastic_mapping:"id: { type: keyword }"`
	Created time.Time `json:"created,omitempty" elastic_mapping:"created: { type: date }"`
	Updated time.Time `json:"updated,omitempty" elastic_mapping:"updated: { type: date }"`
	Name string `json:"name"  elastic_mapping:"name: { type: keyword }"`
	NickName string `json:"nick_name"  elastic_mapping:"nick_name: { type: keyword }"`
	Password string `json:"password"  elastic_mapping:"password: { type: keyword }"`
	Email string `json:"email" elastic_mapping:"email: { type: keyword }"`
	Phone string `json:"phone" elastic_mapping:"phone: { type: keyword }"`
	Tags []string    `json:"tags" elastic_mapping:"mobile: { type: keyword }"`
	Roles []UserRole `json:"roles" elastic_mapping:"roles: { type: object }"`
}

type UserRole struct {
	ID string `json:"id" elastic_mapping:"id: { type: keyword }"`
	Name string `json:"name" elastic_mapping:"name: { type: keyword }"`
}