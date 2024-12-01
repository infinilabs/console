/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package security

import (
	"github.com/golang-jwt/jwt"
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/util"
	"time"
)

func GenerateAccessToken(user *User) (map[string]interface{}, error) {

	var data map[string]interface{}
	roles, privilege := user.GetPermissions()

	token1 := jwt.NewWithClaims(jwt.SigningMethodHS256, UserClaims{
		ShortUser: &ShortUser{
			Provider: user.AuthProvider,
			Username: user.Username,
			UserId:   user.ID,
			Roles:    roles,
		},
		RegisteredClaims: &jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	})

	tokenString, err := token1.SignedString([]byte(Secret))
	if tokenString == "" || err != nil {
		return nil, errors.Errorf("failed to generate access_token for user: %v", user.Username)
	}

	token := Token{ExpireIn: time.Now().Unix() + 86400}
	SetUserToken(user.ID, token)

	data = util.MapStr{
		"access_token": tokenString,
		"username":     user.Username,
		"id":           user.ID,
		"expire_in":    86400,
		"roles":        roles,
		"privilege":    privilege,
	}

	data["status"] = "ok"

	return data, err

}
