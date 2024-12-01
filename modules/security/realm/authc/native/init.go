/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package native

import (
	"errors"
	"fmt"
	log "github.com/cihub/seelog"
	"golang.org/x/crypto/bcrypt"
	rbac "infini.sh/console/core/security"
)

var handler rbac.Adapter

func init() {
	handler = rbac.Adapter{
		User: &User{},
		Role: &Role{},
	}
	rbac.RegisterAdapter(providerName, handler)
}

const providerName = "native"

type NativeRealm struct {
	// Implement any required fields
}

func (r *NativeRealm) GetType() string {
	return providerName
}

func (r *NativeRealm) Authenticate(username, password string) (bool, *rbac.User, error) {
	// Implement the authentication logic
	// Retrieve the user profile upon successful authentication
	// Return the authentication result, user profile, and any potential error

	user, err := handler.User.GetBy("name", username)
	if err != nil {
		return false, user, err
	}
	if user == nil {
		return false, nil, fmt.Errorf("user account [%s] not found", username)
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err == bcrypt.ErrMismatchedHashAndPassword {
		err = errors.New("incorrect password")
	}

	if err == nil {
		user.AuthProvider = providerName
		return true, user, nil
	}

	return false, nil, err
}

func (r *NativeRealm) Authorize(user *rbac.User) (bool, error) {

	var _, privilege = user.GetPermissions()

	if len(privilege) == 0 {
		log.Error("no privilege assigned to user:", user)
		return false, errors.New("no privilege assigned to this user:" + user.Username)
	}

	return true, nil
}
