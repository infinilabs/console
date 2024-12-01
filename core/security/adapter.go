/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package security

import (
	"fmt"
	"infini.sh/framework/core/orm"
)

type IRole interface {
	Get(id string) (Role, error)
	GetBy(field string, value interface{}) (Role, error)
	Update(role *Role) error
	Create(role *Role) (string, error)
	Delete(id string) error
	Search(keyword string, from, size int) (orm.Result, error)
}

type IUser interface {
	Get(id string) (User, error)
	GetBy(field string, value interface{}) (*User, error)
	Update(user *User) error
	Create(user *User) (string, error)
	Delete(id string) error
	Search(keyword string, from, size int) (orm.Result, error)
}

type SecurityRealm interface {
	GetType() string
	Authenticate(username, password string) (bool, *User, error) // Return true if authentication is successful, otherwise false
	Authorize(user *User) (bool, error)                          // Return true if authorization is granted, otherwise false
}

type Adapter struct {
	Role IRole
	User IUser
}

var adapterHandlers = map[string]Adapter{}

func RegisterAdapter(typ string, handler Adapter) {
	adapterHandlers[typ] = handler
}

func GetAdapter(typ string) Adapter {
	handler, ok := adapterHandlers[typ]
	if !ok {
		panic(fmt.Errorf("dal handler %s not found", typ))
	}
	return handler
}
