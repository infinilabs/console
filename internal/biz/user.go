package biz

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"infini.sh/console/internal/dto"
	"infini.sh/console/model/rbac"
	"infini.sh/framework/core/event"

	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"strings"
	"time"
)

var ErrNotFound = fmt.Errorf("not found")

func DeleteUser(localUser *ShortUser, id string) (err error) {

	user := rbac.User{}
	user.ID = id
	_, err = orm.Get(&user)
	if err != nil {
		return
	}
	err = orm.Delete(user)
	if err != nil {
		return
	}

	delete(TokenMap, id)
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "user",
		Type:     "delete",
		Labels: util.MapStr{
			"id": id,
		},
		User: util.MapStr{
			"userid":   localUser.UserId,
			"username": localUser.Username,
		},
	}, util.MapStr{
		"id":       id,
		"name": user.Name,
		"email":    user.Email,
		"phone":    user.Phone,
		"password": user.Password,
		"nickname":     user.NickName,
		"tags":     user.Tags,
		"roles":    user.Roles,
		"created":  user.Created,
		"updated":  user.Updated,
	}, nil))
	return
}
func CreateUser(localUser *ShortUser, req dto.CreateUser) (id string, password string, err error) {
	q := orm.Query{Size: 1000}
	q.Conds = orm.And(orm.Eq("name", req.Name))

	err, result := orm.Search(rbac.User{}, &q)
	if err != nil {
		return
	}
	if result.Total > 0 {
		err = fmt.Errorf("user name %s already exists", req.Name)
		return
	}

	roles := make([]rbac.UserRole, 0)
	for _, v := range req.Roles {
		roles = append(roles, rbac.UserRole{
			ID:   v.Id,
			Name: v.Name,
		})
	}
	randStr := util.GenerateRandomString(8)
	hash, err := bcrypt.GenerateFromPassword([]byte(randStr), bcrypt.DefaultCost)
	if err != nil {
		return
	}
	user := rbac.User{
		Name:     req.Name,
		NickName: req.NickName,
		Password: string(hash),
		Email:    req.Email,
		Phone:    req.Phone,
		Roles:    roles,
		Tags:     req.Tags,
	}
	user.ID = util.GetUUID()
	user.Created = time.Now()
	user.Updated = time.Now()
	err = orm.Save(&user)
	if err != nil {

		return
	}
	id = user.ID
	password = randStr
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "user",
		Type:     "create",
		Labels: util.MapStr{
			"id":       id,
			"name": user.Name,
			"email":    user.Email,
			"phone":    user.Phone,
			"password": user.Password,
			"nick_name":     user.NickName,
			"tags":     user.Tags,
			"roles":    user.Roles,
			"created":  user.Created,
			"updated":  user.Updated,
		},
		User: util.MapStr{
			"userid":   localUser.UserId,
			"username": localUser.Username,
		},
	}, nil, nil))
	return
}
func UpdateUser(localUser *ShortUser, id string, req dto.UpdateUser) (err error) {
	user := rbac.User{}
	user.ID = id
	_, err = orm.Get(&user)
	if err != nil {
		return
	}
	roles := make([]rbac.UserRole, 0)
	for _, v := range req.Roles {
		roles = append(roles, rbac.UserRole{
			ID:   v.Id,
			Name: v.Name,
		})
	}
	changeLog, _ := util.DiffTwoObject(user, req)
	user.Name = req.Name
	user.Email = req.Email
	user.Phone = req.Phone
	user.Tags = req.Tags
	user.Roles = roles
	user.Updated = time.Now()
	err = orm.Save(&user)
	if err != nil {
		return
	}
	delete(TokenMap, id)

	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "user",
		Type:     "update",
		Labels: util.MapStr{
			"id":      id,
			"email":   user.Email,
			"phone":   user.Phone,
			"name":    user.Name,
			"tags":    user.Tags,
			"roles":   roles,
			"updated": user.Updated,
		},
		User: util.MapStr{
			"userid":   localUser.UserId,
			"username": localUser.Username,
		},
	}, nil, changeLog))
	return
}
func UpdateUserRole(localUser *ShortUser, id string, req dto.UpdateUserRole) (err error) {
	user := rbac.User{}
	user.ID = id
	_, err = orm.Get(&user)
	if err != nil {

		return
	}
	changeLog, _ := util.DiffTwoObject(user, req)
	roles := make([]rbac.UserRole, 0)
	for _, v := range req.Roles {
		roles = append(roles, rbac.UserRole{
			ID:   v.Id,
			Name: v.Name,
		})
	}
	user.Roles = roles
	user.Updated = time.Now()
	err = orm.Save(&user)
	if err != nil {
		return
	}
	delete(TokenMap, id)
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "user",
		Type:     "update",
		Labels: util.MapStr{
			"id":      id,
			"roles":   user.Roles,
			"updated": user.Updated,
		},
		User: util.MapStr{
			"userid":   localUser.UserId,
			"username": localUser.Username,
		},
	}, nil, changeLog))
	return

}
func GetUser(id string) (user rbac.User, err error) {

	user.ID = id
	_, err = orm.Get(&user)
	if err != nil {
		return
	}
	return

}
func SearchUser(keyword string, from, size int) (users orm.Result, err error) {
	query := orm.Query{}

	queryDSL := `{"query":{"bool":{"must":[%s]}}, "from": %d,"size": %d}`
	mustBuilder := &strings.Builder{}

	if keyword != "" {
		mustBuilder.WriteString(fmt.Sprintf(`{"query_string":{"default_field":"*","query": "%s"}}`, keyword))
	}
	queryDSL = fmt.Sprintf(queryDSL, mustBuilder.String(), from, size)
	query.RawQuery = []byte(queryDSL)

	err, users = orm.Search(rbac.User{}, &query)

	return

}
func UpdateUserPassword(localUser *ShortUser, id string, password string) (err error) {
	user := rbac.User{}
	user.ID = id
	_, err = orm.Get(&user)
	if err != nil {

		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return
	}
	user.Password = string(hash)
	user.Updated = time.Now()
	err = orm.Save(&user)
	if err != nil {
		return
	}
	if localUser.UserId == id {
		delete(TokenMap, localUser.UserId)
	}
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "user",
		Type:     "update",
		Labels: util.MapStr{
			"id":       id,
			"password": password,
			"updated":  user.Updated,
		},
		User: util.MapStr{
			"userid":   localUser.UserId,
			"username": localUser.Username,
		},
	}, nil, nil))
	return
}
