package biz

import (
	"errors"
	"fmt"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"net/http"
	"src/github.com/golang-jwt/jwt"
	"strings"
	"time"
)

type UserClaims struct {
	*jwt.RegisteredClaims
	*User
}
type User struct {
	Username      string              `json:"username"`
	UserId        string              `json:"user_id"`
	ApiPermission map[string]struct{} `json:"api_permission"`
}

const Secret = "console"

func Login(username string, password string) (m map[string]interface{}, err error) {

	u, _ := global.Env().GetConfig("bootstrap.username", "admin")
	p, _ := global.Env().GetConfig("bootstrap.password", "admin")

	if u != username || p != password {
		err = errors.New("invalid username or password")
		return
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, UserClaims{
		User: &User{
			Username: u,
			UserId:   "admin",
			ApiPermission: map[string]struct{}{
				"account.profile": struct{}{},
			},
		},
		RegisteredClaims: &jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	})

	tokenString, err := token.SignedString([]byte(Secret))
	if err != nil {

		return
	}
	m = util.MapStr{
		"access_token": tokenString,
		"username":     u,
		"userid":       "admin",
	}

	return

}

func ValidateLogin(authorizationHeader string) (clams *UserClaims, err error) {

	if authorizationHeader == "" {
		err = errors.New("authorization header is empty")
		return
	}
	fields := strings.Fields(authorizationHeader)
	if fields[0] != "Bearer" || len(fields) != 2 {
		err = errors.New("authorization header is invalid")
		return
	}
	tokenString := fields[1]
	token, err := jwt.ParseWithClaims(tokenString, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(Secret), nil
	})
	if err != nil {
		return
	}
	if clams, ok := token.Claims.(*UserClaims); ok && token.Valid {
		return clams, nil
	}
	if clams.UserId == "" {
		err = errors.New("user id is empty")
		return
	}
	return

}
func ValidatePermission(r *http.Request, permissions string) (err error) {
	reqUser, err := FromUserContext(r.Context())
	if err != nil {

		return
	}
	if reqUser.UserId == "" {
		err = errors.New("user id is empty")
		return
	}
	if reqUser.ApiPermission == nil {
		err = errors.New("api permission is empty")
		return
	}

	if _, ok := reqUser.ApiPermission[permissions]; !ok {
		err = errors.New("permission denied")
		return
	}

	return

}
