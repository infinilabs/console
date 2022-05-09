package biz

import (
	"errors"
	"fmt"
	"infini.sh/console/internal/biz/enum"
	"infini.sh/console/model/rbac"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	log "src/github.com/cihub/seelog"
	"strings"
	"time"
)

type RoleType = string

const (
	Platform      RoleType = "platform"
	Elasticsearch RoleType = "elasticsearch"
)

func UpdateRole(role *rbac.Role) (err error) {
	model, err := GetRole(role.ID)
	if err != nil {
		return err
	}
	role.Type = model.Type
	role.Created = model.Created
	role.Updated = time.Now()
	err = orm.Save(role)
	return
}

func CreateRole(localUser *ShortUser, role *rbac.Role) (id string, err error) {
	if role.Name == "" {
		err = errors.New("role name is require")
		return
	}
	if _, ok := enum.BuildRoles[role.Name]; ok {
		err = fmt.Errorf("role name %s already exists", role.Name)
		return
	}
	q := orm.Query{Size: 1}
	q.Conds = orm.And(orm.Eq("name", role.Name))

	err, result := orm.Search(rbac.Role{}, &q)
	if err != nil {
		return
	}
	if result.Total > 0 {
		err = fmt.Errorf("role name %s already exists", role.Name)
		return
	}

	role.ID = util.GetUUID()
	role.Created = time.Now()
	role.Updated = time.Now()
	err = orm.Save(role)
	if err != nil {
		return
	}
	id = role.ID
	RoleMap[role.Name] = *role
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "role",
		Type:     "create",
		Labels: util.MapStr{
			"id":          id,
			"name":        role.Name,
			"description": role.Description,
			"privilege":    role.Privilege,
			"type":        role.Type,
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
func DeleteRole(localUser *ShortUser, id string) (err error) {
	role := rbac.Role{}
	role.ID = id
	roleName := role.Name
	_, err = orm.Get(&role)
	if err != nil {
		return
	}

	err = orm.Delete(&role)
	if err != nil {
		return
	}

	delete(RoleMap, roleName)

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
		"id":                id,
		"name":              role.Name,
		"description":       role.Description,
		"type":              role.Type,
		"created":           role.Created.Format("2006-01-02 15:04:05"),
		"updated":           role.Updated.Format("2006-01-02 15:04:05"),
	}, nil))

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
func IsAllowRoleType(roleType string) (err error) {
	if roleType != Platform && roleType != Elasticsearch {
		err = fmt.Errorf("invalid role type %s ", roleType)
		return
	}
	return
}
