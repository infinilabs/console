package biz

import (
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
	"infini.sh/console/internal/dto"
	"infini.sh/console/model/rbac"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"strings"
	"time"
)

type UserClaims struct {
	*jwt.RegisteredClaims
	*User
}
type User struct {
	Username string   `json:"username"`
	UserId   string   `json:"user_id"`
	Roles    []string `json:"roles"`
}

const Secret = "console"

func authenticateUser(username string, password string) (user rbac.User, err error) {

	err, result := orm.GetBy("username", username, rbac.User{})
	if err != nil {
		err = ErrNotFound
		return
	}
	if result.Total == 0 {
		err = errors.New("user not found")
		return
	}
	user = result.Result[0].(rbac.User)
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err == bcrypt.ErrMismatchedHashAndPassword {
		err = errors.New("password incorrect")
		return
	}

	return
}
func authenticateAdmin(username string, password string) (user rbac.User, err error) {

	u, _ := global.Env().GetConfig("bootstrap.username", "admin")
	p, _ := global.Env().GetConfig("bootstrap.password", "admin")

	if u != username || p != password {
		err = errors.New("invalid username or password")
		return
	}
	user.ID = username
	user.Username = username
	return user, nil
}
func authorize(user rbac.User) (m map[string]interface{}, err error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, UserClaims{
		User: &User{
			Username: user.Username,
			UserId:   user.ID,
			Roles:    []string{"admin_user"},
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
		"username":     user.Username,
		"id":           user.ID,
		"expire_in":    86400,
		"roles":        []string{"admin_user"},
	}
	return
}
func Login(username string, password string) (m map[string]interface{}, err error) {
	var user rbac.User
	if username == "admin" {
		user, err = authenticateAdmin(username, password)
		if err != nil {
			return nil, err
		}

	} else {
		user, err = authenticateUser(username, password)
		if err != nil {
			return nil, err
		}
	}

	m, err = authorize(user)
	if err != nil {
		return
	}
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "login",
		Type:     "create",
		Labels: util.MapStr{
			"username": username,
			"password": password,
		},
		User: util.MapStr{
			"userid":   user.ID,
			"username": user.Username,
		},
	}, nil, nil))
	return
}
func UpdatePassword(localUser *User, req dto.UpdatePassword) (err error) {
	user := rbac.User{}
	user.ID = localUser.UserId
	_, err = orm.Get(&user)
	if err != nil {
		err = ErrNotFound
		return
	}
	err = bcrypt.CompareHashAndPassword([]byte(req.OldPassword), []byte(user.Password))
	if err == bcrypt.ErrMismatchedHashAndPassword {
		err = errors.New("old password is not correct")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return
	}
	user.Password = string(hash)
	err = orm.Save(&user)
	if err != nil {
		return
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
func ValidatePermission(claims *UserClaims, permissions []string) (err error) {

	reqUser := claims.User

	if reqUser.UserId == "" {
		err = errors.New("user id is empty")
		return
	}
	if reqUser.Roles == nil {
		err = errors.New("api permission is empty")
		return
	}

	// 权限校验
	userPermissionMap := make(map[string]struct{})
	for _, role := range reqUser.Roles {
		if _, ok := RolePermission[role]; ok {
			for _, v := range RolePermission[role] {
				userPermissionMap[v] = struct{}{}
			}
		}
	}
	var count int
	for _, v := range permissions {
		if _, ok := userPermissionMap[v]; ok {
			count++
			continue
		}
	}
	if count == len(permissions) {
		return nil
	}
	err = errors.New("permission denied")
	return

}
