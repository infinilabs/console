package biz

import (
	"fmt"
	"infini.sh/console/model/rbac"
	"infini.sh/console/plugin/api/rbac/dto"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"strings"
	"time"
)

func DeleteUser(id string) (err error) {

	user := rbac.User{}
	user.ID = id
	_, err = orm.Get(&user)
	if err != nil {
		return
	}
	return orm.Delete(user)

}
func CreateUser(req dto.CreateUser) (id string, err error) {
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
			Id:   v.Id,
			Name: v.Name,
		})
	}
	user := rbac.User{
		Name:     req.Name,
		Username: req.Username,
		Password: util.MD5digest(req.Password),
		Email:    req.Email,
		Phone:    req.Phone,
		Roles:    roles,
	}
	user.ID = util.GetUUID()
	user.Created = time.Now()
	user.Updated = time.Now()
	err = orm.Save(&user)
	if err != nil {

		return
	}
	return user.ID, nil
}
func UpdateUser(id string, req dto.UpdateUser) (err error) {
	user := rbac.User{}
	user.ID = id
	_, err = orm.Get(&user)
	if err != nil {
		return
	}
	user.Name = req.Name
	user.Email = req.Email
	user.Phone = req.Phone
	user.Updated = time.Now()
	err = orm.Save(user)
	return
}
func UpdateUserRole(id string, req dto.UpdateUserRole) (err error) {
	user := rbac.User{}
	user.ID = id
	_, err = orm.Get(&user)
	if err != nil {
		return
	}
	roles := make([]rbac.UserRole, 0)
	for _, v := range req.Roles {
		roles = append(roles, rbac.UserRole{
			Id:   v.Id,
			Name: v.Name,
		})
	}
	user.Roles = roles
	user.Updated = time.Now()
	err = orm.Save(user)
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
