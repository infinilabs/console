package biz

import (
	"fmt"
	"infini.sh/console/internal/dto"
	"infini.sh/console/model/rbac"

	"infini.sh/framework/core/util"
	"strings"
	"time"

	"infini.sh/framework/core/orm"
)

func CreateRole(req dto.CreateRole) (id string, err error) {

	q := orm.Query{Size: 1000}
	q.Conds = orm.And(orm.Eq("name", req.Name))

	err, result := orm.Search(rbac.Role{}, &q)
	if err != nil {
		return
	}
	if result.Total > 0 {
		err = fmt.Errorf("role name %s already exists", req.Name)
		return
	}

	role := &rbac.Role{
		Name:        req.Name,
		Description: req.Description,
		RoleType:    req.RoleType,
		Permission:  req.Permission,
	}
	role.ID = util.GetUUID()
	role.Created = time.Now()
	role.Updated = time.Now()
	err = orm.Save(role)
	id = role.ID
	return
}
func DeleteRole(id string) (err error) {
	role := rbac.Role{}
	role.ID = id
	_, err = orm.Get(&role)
	if err != nil {
		err = ErrNotFound
		return
	}
	return orm.Delete(role)
}

func UpdateRole(id string, req dto.UpdateRole) (err error) {
	role := rbac.Role{}
	role.ID = id
	_, err = orm.Get(&role)
	if err != nil {
		err = ErrNotFound
		return
	}
	role.Description = req.Description
	role.Permission = req.Permission
	role.Updated = time.Now()
	err = orm.Save(role)
	return
}
func GetRole(id string) (role rbac.Role, err error) {

	role.ID = id
	_, err = orm.Get(&role)
	if err != nil {
		err = ErrNotFound
		return
	}
	return
}
func SearchRole(keyword string, from, size int) (roles orm.Result, err error) {
	query := orm.Query{}

	queryDSL := `{"query":{"bool":{"must":[%s]}}, "from": %d,"size": %d}`
	mustBuilder := &strings.Builder{}

	if keyword != "" {
		mustBuilder.WriteString(fmt.Sprintf(`{"query_string":{"default_field":"*","query": "%s"}}`, keyword))
	}
	queryDSL = fmt.Sprintf(queryDSL, mustBuilder.String(), from, size)
	query.RawQuery = []byte(queryDSL)

	err, roles = orm.Search(rbac.Role{}, &query)

	return
}
