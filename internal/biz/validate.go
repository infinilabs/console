package biz

import (
	"errors"
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

type EsRequest struct {
	Method  string   `json:"method"`
	Cluster []string `json:"cluster"`

	Index []string `json:"index"`
	Doc   string   `json:"doc"`
	Path  string   `json:"path"`
}

func NewEsRequest(r *http.Request, ps httprouter.Params) EsRequest {

	//GET elasticsearch/c6dgjtgvi076f32oibj0/index/test/_mappings
	clusterId := ps.ByName("id")
	index := ps.ByName("index")

	doc := ps.ByName("docId")
	//如果index存在，说明调用的是index api
	return EsRequest{
		Cluster: []string{clusterId},
		Index:   []string{index},
		Doc:     doc,
		Path:    r.URL.Path,
		Method:  r.Method,
	}
}
func ValidateEsPermission(req EsRequest, userRole Role) (err error) {

	route, err := EsApiRoutes.Handle(req.Method, req.Path)
	if err != nil {

		return
	}
	if len(req.Index) > 0 {
		err = validateIndex(req, userRole, route)
		if err != nil {
			return err
		}
	}
	err = validateCluster(req, userRole, route)
	return
}
func validateIndex(req EsRequest, userRole Role, route string) (err error) {
	userIndexMap := make(map[string]struct{})
	privilegeMap := make(map[string]struct{})
	for _, val := range userRole.Index {
		for _, v := range val.Name {
			userIndexMap[v] = struct{}{}
		}
		for _, v := range val.Privilege {
			privilegeMap[v] = struct{}{}
		}
	}

	for _, v := range req.Index {
		if _, ok := userIndexMap[v]; !ok {
			err = errors.New("no index permission")
			return
		}
	}

	if _, ok := privilegeMap[route]; !ok {
		err = errors.New("no index api permission")
		return
	}

	return
}
func validateCluster(req EsRequest, userRole Role, route string) (err error) {
	userClusterMap := make(map[string]struct{})
	for _, v := range userRole.Cluster {
		userClusterMap[v.Id] = struct{}{}
	}
	for _, v := range req.Cluster {
		if _, ok := userClusterMap[v]; !ok {
			err = errors.New("no cluster permission")
			return
		}
	}

	tmp := make([]string, 0)
	for _, val := range userRole.ClusterPrivilege {
		for _, v := range val {
			tmp = append(tmp, v...)
		}

	}
	for _, v := range tmp {
		if v == route {
			return nil
		}
	}
	return errors.New("no cluster api permission")
}
func CombineUserRoles(roleNames []string) Role {
	newRole := Role{}
	for _, v := range roleNames {
		r := RoleMap[v]
		newRole.Cluster = append(newRole.Cluster, r.Cluster...)
		newRole.Platform = append(newRole.Platform, r.Platform...)
		newRole.Index = append(newRole.Index, r.Index...)
		newRole.ClusterPrivilege = append(newRole.ClusterPrivilege, r.ClusterPrivilege...)
	}
	return newRole
}
