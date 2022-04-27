package biz

import (
	"errors"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/util"
	"strings"
)

type EsRequest struct {
	Doc       string `json:"doc"`
	Privilege string `json:"privilege"`
	ClusterRequest
	IndexRequest
}
type ClusterRequest struct {
	Cluster   []string `json:"cluster"`
	Privilege []string `json:"privilege"`
}
type IndexRequest struct {
	Cluster   []string `json:"cluster"`
	Index     []string `json:"index"`
	Privilege []string `json:"privilege"`
}

func NewIndexRequest(ps httprouter.Params, privilege []string) IndexRequest {
	index := ps.ByName("index")
	clusterId := ps.ByName("id")
	return IndexRequest{
		Cluster:   []string{clusterId},
		Index:     []string{index},
		Privilege: privilege,
	}
}
func NewClusterRequest(ps httprouter.Params, privilege []string) ClusterRequest {
	clusterId := ps.ByName("id")
	return ClusterRequest{
		Cluster:   []string{clusterId},
		Privilege: privilege,
	}
}

func ValidateIndex(req IndexRequest, userRole RolePermission) (err error) {

	userClusterMap := make(map[string]struct{})
	for _, v := range userRole.Cluster {
		userClusterMap[v] = struct{}{}
	}
	for _, v := range req.Cluster {
		if _, ok := userClusterMap[v]; !ok {
			err = errors.New("no cluster permission")
			return
		}
	}

	for _, val := range req.Privilege {
		position := strings.Index(val, ".")
		if position == -1 {
			err = errors.New("invalid privilege parmeter")
			return err
		}
		prefix := val[:position]
		for _, v := range req.Index {
			privilege, ok := userRole.IndexPrivilege[v]
			if !ok {
				err = errors.New("no index permission")
				return err
			}
			if util.StringInArray(privilege, prefix+".*") {
				return nil
			}
			if util.StringInArray(privilege, val) {
				return nil
			}

		}
	}

	return errors.New("no index api permission")
}
func ValidateCluster(req ClusterRequest, userRole RolePermission) (err error) {
	userClusterMap := make(map[string]struct{})
	for _, v := range userRole.Cluster {
		userClusterMap[v] = struct{}{}
	}
	for _, v := range req.Cluster {
		if _, ok := userClusterMap[v]; !ok {
			err = errors.New("no cluster permission")
			return
		}
	}

	// if include api.*  for example: cat.* , return nil
	for _, privilege := range req.Privilege {
		prefix := privilege[:strings.Index(privilege, ".")]

		if util.StringInArray(userRole.ClusterPrivilege, prefix+".*") {
			return nil
		}
		if util.StringInArray(userRole.ClusterPrivilege, privilege) {
			return nil
		}
	}

	return errors.New("no cluster api permission")
}

func CombineUserRoles(roleNames []string) RolePermission {
	newRole := RolePermission{}
	m := make(map[string][]string)
	for _, val := range roleNames {
		role := RoleMap[val]
		for _, v := range role.Cluster {
			newRole.Cluster = append(newRole.Cluster, v.Id)
		}
		for _, v := range role.ClusterPrivilege {
			newRole.ClusterPrivilege = append(newRole.ClusterPrivilege, v)
		}
		for _, v := range role.Platform {
			newRole.Platform = append(newRole.Platform, v)
		}
		for _, v := range role.Index {

			for _, name := range v.Name {
				if _, ok := m[name]; ok {
					m[name] = append(m[name], v.Privilege...)
				} else {
					m[name] = v.Privilege
				}

			}

		}
	}
	newRole.IndexPrivilege = m
	return newRole
}
func FilterCluster(roles []string, cluster []string) []string {
	newRole := CombineUserRoles(roles)
	userClusterMap := make(map[string]struct{}, 0)
	for _, v := range newRole.Cluster {
		userClusterMap[v] = struct{}{}
	}
	realCluster := make([]string, 0)
	for _, v := range cluster {
		if _, ok := userClusterMap[v]; ok {
			realCluster = append(realCluster, v)
		}
	}
	return realCluster
}
func FilterIndex(roles []string, index []string) []string {
	realIndex := make([]string, 0)
	newRole := CombineUserRoles(roles)
	for _, v := range index {
		if _, ok := newRole.IndexPrivilege[v]; ok {
			realIndex = append(realIndex, v)
		}
	}
	return realIndex
}
