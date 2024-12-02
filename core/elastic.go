package core

import (
	rbac "infini.sh/console/core/security"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/radix"
	"infini.sh/framework/core/util"
	"net/http"
)

func (handler Handler) IndexRequired(h httprouter.Handle, route ...string) httprouter.Handle {

	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		if api.IsAuthEnable() {
			claims, err := rbac.ValidateLogin(r.Header.Get("Authorization"))
			if err != nil {
				handler.WriteError(w, err.Error(), http.StatusUnauthorized)
				return
			}
			newRole := rbac.CombineUserRoles(claims.Roles)

			indexReq := rbac.NewIndexRequest(ps, route)

			err = rbac.ValidateIndex(indexReq, newRole)
			if err != nil {
				handler.WriteError(w, err.Error(), http.StatusForbidden)
				return
			}
		}

		h(w, r, ps)
	}
}

func (handler Handler) ClusterRequired(h httprouter.Handle, route ...string) httprouter.Handle {

	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

		if api.IsAuthEnable() {
			claims, err := rbac.ValidateLogin(r.Header.Get("Authorization"))
			if err != nil {
				handler.WriteError(w, err.Error(), http.StatusUnauthorized)
				return
			}
			//newRole := biz.CombineUserRoles(claims.Roles)
			clusterReq := rbac.NewClusterRequest(ps, route)
			newRole := rbac.CombineUserRoles(claims.Roles)
			err = rbac.ValidateCluster(clusterReq, newRole)
			if err != nil {
				handler.WriteError(w, err.Error(), http.StatusForbidden)
				return
			}
		}

		h(w, r, ps)
	}
}

func (handler Handler) GetClusterFilter(r *http.Request, field string) (util.MapStr, bool) {
	if !api.IsAuthEnable() {
		return nil, true
	}
	hasAllPrivilege, clusterIds := rbac.GetCurrentUserCluster(r)
	if hasAllPrivilege {
		return nil, true
	}
	if len(clusterIds) == 0 {
		return nil, false
	}
	return util.MapStr{
		"terms": util.MapStr{
			field: clusterIds,
		},
	}, false
}
func (handler Handler) GetAllowedClusters(r *http.Request) ([]string, bool) {
	if !api.IsAuthEnable() {
		return nil, true
	}
	hasAllPrivilege, clusterIds := rbac.GetCurrentUserCluster(r)
	return clusterIds, hasAllPrivilege
}

func (handler Handler) GetAllowedIndices(r *http.Request, clusterID string) ([]string, bool) {
	if !api.IsAuthEnable() {
		return nil, true
	}
	hasAllPrivilege, indices := handler.GetCurrentUserClusterIndex(r, clusterID)
	if hasAllPrivilege {
		return nil, true
	}
	return indices, false
}

func (handler Handler) IsIndexAllowed(r *http.Request, clusterID string, indexName string) bool {
	if !api.IsAuthEnable() {
		return true
	}
	hasAllPrivilege, indices := handler.GetCurrentUserClusterIndex(r, clusterID)
	if hasAllPrivilege {
		return true
	}
	if len(indices) == 0 {
		return false
	}
	return radix.Compile(indices...).Match(indexName)
}

func (handler Handler) ValidateProxyRequest(req *http.Request, clusterID string) (bool, string, error) {
	if !api.IsAuthEnable() {
		return false, "", nil
	}
	claims, err := rbac.ValidateLogin(req.Header.Get("Authorization"))
	if err != nil {
		return false, "", err
	}
	if util.StringInArray(claims.Roles, rbac.RoleAdminName) {
		return true, "", nil
	}

	permission, params, matched := rbac.SearchAPIPermission("elasticsearch", req.Method, req.URL.Path)
	if matched && permission != "" {

		newRole := rbac.CombineUserRoles(claims.Roles)
		if indexName, ok := params["index_name"]; ok {

			indexReq := rbac.IndexRequest{
				Cluster:   clusterID,
				Index:     indexName,
				Privilege: []string{permission},
			}

			err = rbac.ValidateIndex(indexReq, newRole)
			if err != nil {
				return false, permission, err
			}
		} else {
			clusterReq := rbac.ClusterRequest{
				Cluster:   clusterID,
				Privilege: []string{permission},
			}
			err = rbac.ValidateCluster(clusterReq, newRole)
			if err != nil {
				return false, permission, err
			}
		}
	}
	return false, permission, nil
}

func (handler Handler) GetCurrentUserIndex(req *http.Request) (bool, map[string][]string) {
	if !api.IsAuthEnable() {
		return true, nil
	}
	ctxVal := req.Context().Value("user")
	if userClaims, ok := ctxVal.(*rbac.UserClaims); ok {
		roles := userClaims.Roles
		var realIndex = map[string][]string{}
		for _, roleName := range roles {
			role, ok := rbac.RoleMap[roleName]
			if ok {
				for _, ic := range role.Privilege.Elasticsearch.Cluster.Resources {
					for _, ip := range role.Privilege.Elasticsearch.Index {
						if ic.ID == "*" && util.StringInArray(ip.Name, "*") {
							return true, nil
						}
						realIndex[ic.ID] = append(realIndex[ic.ID], ip.Name...)
					}
				}
			}
		}
		return false, realIndex
	}
	return false, nil
}

func (handler Handler) GetCurrentUserClusterIndex(req *http.Request, clusterID string) (bool, []string) {
	ctxVal := req.Context().Value("user")
	if userClaims, ok := ctxVal.(*rbac.UserClaims); ok {
		return rbac.GetRoleIndex(userClaims.Roles, clusterID)
	} else {
		panic("user context value not found")
	}
}
