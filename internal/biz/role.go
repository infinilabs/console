package biz

import (
	"fmt"
	"infini.sh/console/internal/biz/enum"
	"infini.sh/console/internal/dto"
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
	Console      RoleType = "console"
	Elastisearch RoleType = "elasticsearch"
)

type IRole interface {
	ListPermission() interface{}
	Create(localUser *User) (id string, err error)
}
type ConsoleRole struct {
	Name        string     `json:"name"`
	Description string     `json:"description" `
	RoleType    string     `json:"type" `
	Permission  Permission `json:"permission"`
}
type Permission struct {
	Menu []MenuPermission `json:"menu"`
}
type MenuPermission struct {
	Id        string `json:"id"`
	Privilege string `json:"privilege"`
}
type ElasticsearchRole struct {
	Name        string `json:"name"`
	Description string `json:"description" `
	RoleType    string `json:"type" `
	rbac.ElasticRole
}

func NewRole(typ string) (r IRole, err error) {
	switch typ {
	case Console:
		r = &ConsoleRole{
			RoleType: typ,
		}

	case Elastisearch:
		r = &ElasticsearchRole{
			RoleType: typ,
		}
	default:
		err = fmt.Errorf("role type %s not support", typ)
	}
	return
}

func (role ConsoleRole) Create(localUser *User) (id string, err error) {
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

	newRole := rbac.Role{
		Name:        role.Name,
		Description: role.Description,
		RoleType:    role.RoleType,
		Permission:  role.Permission,
	}
	newRole.ID = util.GetUUID()
	newRole.Created = time.Now()
	newRole.Updated = time.Now()
	err = orm.Save(&newRole)
	if err != nil {
		return
	}
	id = newRole.ID
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "role",
		Type:     "create",
		Labels: util.MapStr{
			"id":          id,
			"name":        role.Name,
			"description": role.Description,
			"permission":  role.Permission,
			"type":        role.RoleType,
			"created":     newRole.Created.Format("2006-01-02 15:04:05"),
			"updated":     newRole.Updated.Format("2006-01-02 15:04:05"),
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
func (role ElasticsearchRole) Create(localUser *User) (id string, err error) {

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

	newRole := rbac.Role{
		Name:        role.Name,
		Description: role.Description,
		RoleType:    role.RoleType,
	}
	newRole.Cluster = role.Cluster
	newRole.Index = role.Index
	newRole.ClusterPrivilege = role.ClusterPrivilege
	newRole.ID = util.GetUUID()
	newRole.Created = time.Now()
	newRole.Updated = time.Now()
	err = orm.Save(&newRole)
	if err != nil {
		return
	}
	id = newRole.ID
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "role",
		Type:     "create",
		Labels: util.MapStr{
			"id":          id,
			"name":        role.Name,
			"description": role.Description,

			"type":    role.RoleType,
			"created": newRole.Created.Format("2006-01-02 15:04:05"),
			"updated": newRole.Updated.Format("2006-01-02 15:04:05"),
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

func UpdateRole(localUser *User, id string, req dto.UpdateConsoleRole) (err error) {
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
func IsAllowRoleType(roleType string) (err error) {
	if roleType != Console && roleType != Elastisearch {
		err = fmt.Errorf("invalid role type %s ", roleType)
		return
	}
	return
}
