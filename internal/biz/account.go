package biz

import (
	"errors"
	"github.com/golang-jwt/jwt"
	"github.com/mitchellh/mapstructure"
	"golang.org/x/crypto/bcrypt"
	"infini.sh/console/internal/dto"
	"infini.sh/console/model/rbac"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"

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
type Account struct {
	ID       string          `json:"id,omitempty"     `
	Created  string          `json:"created,omitempty" `
	Updated  string          `json:"updated,omitempty" `
	Username string          `json:"username" elastic_mapping:"username:{type:keyword}"`
	Password string          `json:"password" elastic_mapping:"password:{type:text}"`
	Name     string          `json:"name" elastic_mapping:"name:{type:keyword}"`
	Phone    string          `json:"phone" elastic_mapping:"phone:{type:keyword}"`
	Email    string          `json:"email" elastic_mapping:"email:{type:keyword}"`
	Tags     []string        `json:"tags" elastic_mapping:"tags:{type:text}"`
	Roles    []rbac.UserRole `json:"roles"`
}

const Secret = "console"

func authenticateUser(username string, password string) (user Account, err error) {

	err, result := orm.GetBy("username", username, rbac.User{})
	if err != nil {
		err = ErrNotFound
		return
	}
	if result.Total == 0 {
		err = errors.New("user not found")
		return
	}

	err = mapstructure.Decode(result.Result[0], &user)
	if err != nil {
		return
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err == bcrypt.ErrMismatchedHashAndPassword {
		err = errors.New("password incorrect")
		return
	}

	return
}
func authenticateAdmin(username string, password string) (user Account, err error) {

	u, _ := global.Env().GetConfig("bootstrap.username", "admin")
	p, _ := global.Env().GetConfig("bootstrap.password", "admin")

	if u != username || p != password {
		err = errors.New("invalid username or password")
		return
	}
	user.ID = username
	user.Username = username
	user.Roles = []rbac.UserRole{{
		Id: "admin", Name: "admin",
	}}
	return user, nil
}
func authorize(user Account) (m map[string]interface{}, err error) {

	var roles, privilege []string
	for _, v := range user.Roles {
		role := RoleMap[v.Name]
		roles = append(roles, v.Name)
		privilege = append(privilege, role.Platform...)
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, UserClaims{
		User: &User{
			Username: user.Username,
			UserId:   user.ID,
			Roles:    roles,
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
		"roles":        roles,
		"privilege":    privilege,
	}
	return
}
func Login(username string, password string) (m map[string]interface{}, err error) {
	var user Account
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
	TokenMap[user.ID] = Token{ExpireIn: time.Now().Unix() + 86400}
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

		return
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword))
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
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "user",
		Type:     "update",
		Labels: util.MapStr{
			"old_password": req.OldPassword,
			"new_password": req.NewPassword,
		},
		User: util.MapStr{
			"userid":   user.ID,
			"username": user.Username,
		},
	}, nil, nil))
	return
}
func UpdateProfile(localUser *User, req dto.UpdateProfile) (err error) {
	user := rbac.User{}
	user.ID = localUser.UserId
	_, err = orm.Get(&user)
	if err != nil {
		return
	}
	user.Name = req.Name
	user.Email = req.Email
	user.Phone = req.Phone
	err = orm.Save(&user)
	if err != nil {
		return
	}
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "user",
		Type:     "update",
		Labels: util.MapStr{
			"name":  req.Name,
			"email": req.Email,
			"phone": req.Phone,
		},
		User: util.MapStr{
			"userid":   user.ID,
			"username": user.Username,
		},
	}, nil, nil))
	return
}
