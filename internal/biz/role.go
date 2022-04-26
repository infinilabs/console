package biz

import (
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
	Console      RoleType = "console"
	Elastisearch RoleType = "elasticsearch"
)

type IRole interface {
	ListPermission() interface{}
	Create(localUser *User) (id string, err error)
	Update(localUser *User, model rbac.Role) (err error)
}
type ConsoleRole struct {
	Name        string   `json:"name"`
	Description string   `json:"description" `
	RoleType    string   `json:"type" `
	Platform    []string `json:"platform,omitempty"`
}

type ElasticsearchRole struct {
	Name        string `json:"name"`
	Description string `json:"description" `
	RoleType    string `json:"type" `
	Cluster     []struct {
		Id   string `json:"id"`
		Name string `json:"name"`
	} `json:"cluster,omitempty"`
	ClusterPrivilege []string `json:"cluster_privilege,omitempty"`
	Index            []struct {
		Name      []string `json:"name"`
		Privilege []string `json:"privilege"`
	} `json:"index,omitempty"`
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
func (role ConsoleRole) Update(localUser *User, model rbac.Role) (err error) {

	changeLog, _ := util.DiffTwoObject(model, role)
	model.Description = role.Description
	model.Platform = role.Platform
	model.Updated = time.Now()
	err = orm.Save(model)
	if err != nil {
		return
	}
	RoleMap[role.Name] = Role{
		Name:     model.Name,
		Platform: model.Platform,
	}
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "role",
		Type:     "update",
		Labels: util.MapStr{
			"id":          model.ID,
			"description": model.Description,
			"platform":    model.Platform,
			"updated":     model.Updated,
		},
		User: util.MapStr{
			"userid":   localUser.UserId,
			"username": localUser.Username,
		},
	}, nil, changeLog))

	return
}
func (role ElasticsearchRole) Update(localUser *User, model rbac.Role) (err error) {

	changeLog, _ := util.DiffTwoObject(model, role)
	model.Description = role.Description
	model.Cluster = role.Cluster
	model.Index = role.Index
	model.ClusterPrivilege = role.ClusterPrivilege
	model.Updated = time.Now()
	err = orm.Save(model)
	if err != nil {
		return
	}
	RoleMap[role.Name] = Role{
		Name:             model.Name,
		Cluster:          model.Cluster,
		ClusterPrivilege: model.ClusterPrivilege,
		Index:            model.Index,
	}
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "role",
		Type:     "update",
		Labels: util.MapStr{
			"id":          model.ID,
			"description": model.Description,
			"platform":    model.Platform,
			"updated":     model.Updated,
		},
		User: util.MapStr{
			"userid":   localUser.UserId,
			"username": localUser.Username,
		},
	}, nil, changeLog))

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
		Platform:    role.Platform,
	}
	newRole.ID = util.GetUUID()
	newRole.Created = time.Now()
	newRole.Updated = time.Now()
	err = orm.Save(&newRole)
	if err != nil {
		return
	}
	id = newRole.ID
	RoleMap[role.Name] = Role{
		Name:     newRole.Name,
		Platform: newRole.Platform,
	}
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "role",
		Type:     "create",
		Labels: util.MapStr{
			"id":          id,
			"name":        role.Name,
			"description": role.Description,
			"platform":    role.Platform,
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
	RoleMap[role.Name] = Role{
		Name:             newRole.Name,
		Cluster:          newRole.Cluster,
		ClusterPrivilege: newRole.ClusterPrivilege,
		Index:            newRole.Index,
	}
	err = orm.Save(GenerateEvent(event.ActivityMetadata{
		Category: "platform",
		Group:    "rbac",
		Name:     "role",
		Type:     "create",
		Labels: util.MapStr{
			"id":                id,
			"name":              newRole.Name,
			"description":       newRole.Description,
			"cluster":           newRole.Cluster,
			"index":             newRole.Index,
			"cluster_privilege": newRole.ClusterPrivilege,
			"type":              newRole.RoleType,
			"created":           newRole.Created.Format("2006-01-02 15:04:05"),
			"updated":           newRole.Updated.Format("2006-01-02 15:04:05"),
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

	err = orm.Delete(&role)
	if err != nil {
		return
	}
	delete(RoleMap, role.Name)
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
		"platform":          role.Platform,
		"cluster":           role.Cluster,
		"index":             role.Index,
		"cluster_privilege": role.ClusterPrivilege,
		"type":              role.RoleType,
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
func ListRoleByName(names []string) (roles []rbac.Role, err error) {

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
