package biz

import (
	"errors"
	httprouter "infini.sh/framework/core/api/router"
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

//func ValidateEsPermission(req EsRequest, userRole RolePermission) (err error) {
//
//	route, err := EsApiRoutes.Handle(req.Method, req.Path)
//	if err != nil {
//
//		return
//	}
//	if len(req.Index) > 0 {
//		err = ValidateIndex(req, userRole, route)
//		if err != nil {
//			return err
//		}
//	}
//	err = ValidateCluster(req, userRole, route)
//	return
//}
func ValidateIndex(req IndexRequest, userRole RolePermission) (err error) {
	userIndexMap := make(map[string]struct{})

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
	for _, v := range userRole.Index {
		userIndexMap[v] = struct{}{}
	}

	for _, v := range req.Index {
		if _, ok := userIndexMap[v]; !ok {
			err = errors.New("no index permission")
			return
		}
	}
	for _, val := range req.Privilege {
		prefix := val[:strings.Index(val, ".")]
		for _, v := range req.Index {
			privilege, ok := userRole.IndexPrivilege[v]
			if !ok {
				err = errors.New("no index api permission in user role")
				return err
			}
			for _, p := range privilege {
				if p == prefix+".*" {
					return nil
				}
				if p == val {
					return nil
				}
			}
		}
	}

	return errors.New("no index api permission in user role")
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
		for _, v := range userRole.ClusterPrivilege {
			if v == prefix+".*" {

				return nil
			}
			if v == privilege {
				return nil
			}
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
			newRole.Index = append(newRole.Index, v.Name...)
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
