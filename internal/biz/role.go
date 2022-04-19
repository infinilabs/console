package biz

import (
	"fmt"
	"infini.sh/console/internal/dto"
	"infini.sh/console/model/rbac"
	"infini.sh/framework/core/event"
	log "src/github.com/cihub/seelog"

	"infini.sh/framework/core/util"
	"strings"
	"time"

	"infini.sh/framework/core/orm"
)

func CreateRole(localUser *User, req dto.CreateRole) (id string, err error) {

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
	if err != nil {
		return
	}
	id = role.ID
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "role",
		Type:     "create",
		Labels: util.MapStr{
			"id":          id,
			"name":        req.Name,
			"description": req.Description,
			"permission":  req.Permission,
			"type":        req.RoleType,
			"created":     role.Created.Format("2006-01-02 15:04:05"),
			"updated":     role.Updated.Format("2006-01-02 15:04:05"),
		},
		User: util.MapStr{
			"userid":   localUser.UserId,
			"username": localUser.Username,
		},
	}, nil, nil))

	if err != nil {
		log.Error(err)
	}
	return
}
func DeleteRole(localUser *User, id string) (err error) {
	role := rbac.Role{}
	role.ID = id
	_, err = orm.Get(&role)
	if err != nil {
		err = ErrNotFound
		return
	}
	err = orm.Delete(role)
	if err != nil {
		return
	}
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "role",
		Type:     "delete",
		Labels: util.MapStr{
			"id": id,
		},
		User: util.MapStr{
			"userid":   localUser.UserId,
			"username": localUser.Username,
		},
	}, util.MapStr{
		"id":          id,
		"name":        role.Name,
		"description": role.Description,
		"permission":  role.Permission,
		"type":        role.RoleType,
		"created":     role.Created.Format("2006-01-02 15:04:05"),
		"updated":     role.Updated.Format("2006-01-02 15:04:05"),
	}, nil))

	return
}

func UpdateRole(localUser *User, id string, req dto.UpdateRole) (err error) {
	role := rbac.Role{}
	role.ID = id
	_, err = orm.Get(&role)
	if err != nil {
		err = ErrNotFound
		return
	}
	changeLog, _ := util.DiffTwoObject(role, req)
	role.Description = req.Description
	role.Permission = req.Permission
	role.Updated = time.Now()
	err = orm.Save(role)
	if err != nil {
		return
	}
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "role",
		Type:     "update",
		Labels: util.MapStr{
			"id":          id,
			"description": role.Description,
			"permission":  role.Permission,
			"updated":     role.Updated,
		},
		User: util.MapStr{
			"userid":   localUser.UserId,
			"username": localUser.Username,
		},
	}, nil, changeLog))
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
