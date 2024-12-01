package core

import (
	"github.com/emirpasic/gods/sets/hashset"
)

const (
	ROLE_GUEST string = "guest"
	ROLE_ADMIN string = "admin"
)

const (
	//GUEST
	PERMISSION_SNAPSHOT_VIEW string = "view_snapshot"

	//ADMIN
	PERMISSION_ADMIN_MINIMAL string = "admin_minimal"
)

func GetPermissionsByRole(role string) (*hashset.Set, error) {
	initRolesMap()
	return rolesMap[role], nil
}

var rolesMap = map[string]*hashset.Set{}

func initRolesMap() {
	if rolesMap != nil {
		return
	}
	set := hashset.New()
	set.Add(PERMISSION_SNAPSHOT_VIEW)
	rolesMap[ROLE_GUEST] = set
}
