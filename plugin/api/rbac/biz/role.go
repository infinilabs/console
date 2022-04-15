package biz

import (
	"fmt"
	"infini.sh/console/model/rbac"
	"infini.sh/console/plugin/api/rbac/dto"
	"infini.sh/framework/core/util"
	"time"

	"infini.sh/framework/core/orm"
)

func CreateRole(req dto.CreateRoleReq) (id string, err error) {

	q := &orm.Query{Size: 1000}
	q.Conds = orm.And(orm.Eq("name", req.Name))

	err, result := orm.Search(rbac.Role{}, q)
	if err != nil {
		return
	}

	fmt.Println(string(result.Raw))
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
	return
}
func DeleteRole(id string) (err error) {
	role := &rbac.Role{}
	role.ID = id
	_, err = orm.Get(&role)
	if err != nil {
		return
	}
	return orm.Delete(role)
}
func isExistRole(o interface{}) (err error) {
	_, err = orm.Get(o)
	if err != nil {
		return
	}

	return
}
func UpdateRole(id string, req dto.UpdateRoleReq) (err error) {
	role := rbac.Role{}
	role.ID = id
	_, err = orm.Get(&role)
	if err != nil {
		return
	}
	role.Description = req.Description
	role.Permission = req.Permission
	err = orm.Save(role)
	return
}
func GetRole(id string) (role rbac.Role, err error) {

	role.ID = id
	_, err = orm.Get(&role)
	if err != nil {
		return
	}

	return
}
func SearchRole() (roles []rbac.Role, err error) {
	return
}
