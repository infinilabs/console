// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package security

import (
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt"
	"infini.sh/console/core/security/enum"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/radix"
	"infini.sh/framework/core/util"
	"net/http"
	"strings"
	"time"
)

type EsRequest struct {
	Doc       string `json:"doc"`
	Privilege string `json:"privilege"`
	ClusterRequest
	IndexRequest
}

type ClusterRequest struct {
	Cluster   string   `json:"cluster"`
	Privilege []string `json:"privilege"`
}

type IndexRequest struct {
	Cluster   string   `json:"cluster"`
	Index     string   `json:"index"`
	Privilege []string `json:"privilege"`
}

type ElasticsearchAPIPrivilege map[string]map[string]struct{}

func (ep ElasticsearchAPIPrivilege) Merge(epa ElasticsearchAPIPrivilege) {
	for k, permissions := range epa {
		if _, ok := ep[k]; ok {
			for permission := range permissions {
				ep[k][permission] = struct{}{}
			}
		} else {
			ep[k] = permissions
		}
	}
}

type RolePermission struct {
	Platform         []string `json:"platform,omitempty"`
	ElasticPrivilege struct {
		Cluster ElasticsearchAPIPrivilege
		Index   map[string]ElasticsearchAPIPrivilege
	}
}

func NewIndexRequest(ps httprouter.Params, privilege []string) IndexRequest {
	index := ps.ByName("index")
	clusterId := ps.ByName("id")
	return IndexRequest{
		Cluster:   clusterId,
		Index:     index,
		Privilege: privilege,
	}
}

func NewClusterRequest(ps httprouter.Params, privilege []string) ClusterRequest {
	clusterId := ps.ByName("id")
	return ClusterRequest{
		Cluster:   clusterId,
		Privilege: privilege,
	}
}

func validateApiPermission(apiPrivileges map[string]struct{}, permissions map[string]struct{}) {
	if _, ok := permissions["*"]; ok {
		for privilege := range apiPrivileges {
			delete(apiPrivileges, privilege)
		}
		return
	}
	for permission := range permissions {
		if _, ok := apiPrivileges[permission]; ok {
			delete(apiPrivileges, permission)
		}
	}
	for privilege := range apiPrivileges {
		position := strings.Index(privilege, ".")
		if position == -1 {
			continue
		}
		prefix := privilege[:position]

		if _, ok := permissions[prefix+".*"]; ok {
			delete(apiPrivileges, privilege)
		}
	}
}
func validateIndexPermission(indexName string, apiPrivileges map[string]struct{}, privilege ElasticsearchAPIPrivilege) bool {
	permissions, hasAll := privilege["*"]
	if hasAll {
		validateApiPermission(apiPrivileges, permissions)
	}
	for indexPattern, v := range privilege {
		if radix.Match(indexPattern, indexName) {
			validateApiPermission(apiPrivileges, v)
		}
	}

	return len(apiPrivileges) == 0
}

func ValidateIndex(req IndexRequest, userRole RolePermission) (err error) {
	var (
		apiPrivileges = map[string]struct{}{}
		allowed       bool
	)

	for _, privilege := range req.Privilege {
		apiPrivileges[privilege] = struct{}{}
	}
	indexPermissions, hasAllCluster := userRole.ElasticPrivilege.Index["*"]
	if hasAllCluster {
		allowed = validateIndexPermission(req.Index, apiPrivileges, indexPermissions)
		if allowed {
			return nil
		}
	}
	if _, ok := userRole.ElasticPrivilege.Index[req.Cluster]; !ok {
		if !hasAllCluster {
			return fmt.Errorf("no permission of cluster [%s]", req.Cluster)
		}
		return fmt.Errorf("no index permission %s of cluster [%s]", req.Privilege, req.Cluster)
	}
	allowed = validateIndexPermission(req.Index, apiPrivileges, userRole.ElasticPrivilege.Index[req.Cluster])
	if allowed {
		return nil
	}
	var apiPermission string
	for k := range apiPrivileges {
		apiPermission = k
	}

	return fmt.Errorf("no index api permission: %s", apiPermission)

}

func ValidateCluster(req ClusterRequest, userRole RolePermission) (err error) {
	var (
		apiPrivileges = map[string]struct{}{}
	)

	for _, privilege := range req.Privilege {
		apiPrivileges[privilege] = struct{}{}
	}

	clusterPermissions, hasAllCluster := userRole.ElasticPrivilege.Cluster["*"]
	if hasAllCluster {
		validateApiPermission(apiPrivileges, clusterPermissions)
		if len(apiPrivileges) == 0 {
			return nil
		}
	}
	if _, ok := userRole.ElasticPrivilege.Cluster[req.Cluster]; !ok && !hasAllCluster {
		return fmt.Errorf("no permission of cluster [%s]", req.Cluster)
	}
	validateApiPermission(apiPrivileges, userRole.ElasticPrivilege.Cluster[req.Cluster])
	if len(apiPrivileges) == 0 {
		return nil
	}
	var apiPermission string
	for k := range apiPrivileges {
		apiPermission = k
	}

	return fmt.Errorf("no cluster api permission: %s", apiPermission)
}

func CombineUserRoles(roleNames []string) RolePermission {
	newRole := RolePermission{}
	clusterPrivilege := ElasticsearchAPIPrivilege{}
	indexPrivilege := map[string]ElasticsearchAPIPrivilege{}
	platformM := map[string]struct{}{}
	for _, val := range roleNames {
		role := RoleMap[val]
		for _, pm := range role.Privilege.Platform {
			if _, ok := platformM[pm]; !ok {
				newRole.Platform = append(newRole.Platform, pm)
				platformM[pm] = struct{}{}
			}

		}

		singleIndexPrivileges := ElasticsearchAPIPrivilege{}
		for _, ip := range role.Privilege.Elasticsearch.Index {
			for _, indexName := range ip.Name {
				if _, ok := singleIndexPrivileges[indexName]; !ok {
					singleIndexPrivileges[indexName] = map[string]struct{}{}
				}
				for _, permission := range ip.Permissions {
					singleIndexPrivileges[indexName][permission] = struct{}{}
				}
			}
		}

		for _, cp := range role.Privilege.Elasticsearch.Cluster.Resources {
			if _, ok := indexPrivilege[cp.ID]; ok {
				indexPrivilege[cp.ID].Merge(singleIndexPrivileges)
			} else {
				indexPrivilege[cp.ID] = singleIndexPrivileges
			}
			var (
				privileges map[string]struct{}
				ok         bool
			)
			if privileges, ok = clusterPrivilege[cp.ID]; !ok {
				privileges = map[string]struct{}{}
			}
			for _, permission := range role.Privilege.Elasticsearch.Cluster.Permissions {
				privileges[permission] = struct{}{}
			}
			clusterPrivilege[cp.ID] = privileges
		}

	}
	newRole.ElasticPrivilege.Cluster = clusterPrivilege
	newRole.ElasticPrivilege.Index = indexPrivilege
	return newRole
}

func GetRoleClusterMap(roles []string) map[string][]string {
	userClusterMap := make(map[string][]string, 0)
	for _, roleName := range roles {
		role, ok := RoleMap[roleName]
		if ok {
			for _, ic := range role.Privilege.Elasticsearch.Cluster.Resources {
				userClusterMap[ic.ID] = append(userClusterMap[ic.ID], role.Privilege.Elasticsearch.Cluster.Permissions...)
			}
		}
	}
	return userClusterMap
}

// GetRoleCluster get cluster id by given role names
// return true when has all cluster privilege, otherwise return cluster id list
func GetRoleCluster(roles []string) (bool, []string) {
	userClusterMap := GetRoleClusterMap(roles)
	if _, ok := userClusterMap["*"]; ok {
		return true, nil
	}
	realCluster := make([]string, 0, len(userClusterMap))
	for k, _ := range userClusterMap {
		realCluster = append(realCluster, k)
	}
	return false, realCluster
}

// GetCurrentUserCluster get cluster id by current login user
// return true when has all cluster privilege, otherwise return cluster id list
func GetCurrentUserCluster(req *http.Request) (bool, []string) {
	ctxVal := req.Context().Value("user")
	if userClaims, ok := ctxVal.(*UserClaims); ok {
		return GetRoleCluster(userClaims.Roles)
	} else {
		panic("user context value not found")
	}
}

func GetRoleIndex(roles []string, clusterID string) (bool, []string) {
	var realIndex []string
	for _, roleName := range roles {
		role, ok := RoleMap[roleName]
		if ok {
			for _, ic := range role.Privilege.Elasticsearch.Cluster.Resources {
				if ic.ID != "*" && ic.ID != clusterID {
					continue
				}
				for _, ip := range role.Privilege.Elasticsearch.Index {
					if util.StringInArray(ip.Name, "*") {
						return true, nil
					}
					realIndex = append(realIndex, ip.Name...)
				}
			}
		}
	}
	return false, realIndex
}

func ValidateLogin(authorizationHeader string) (clams *UserClaims, err error) {

	if authorizationHeader == "" {
		err = errors.New("authorization header is empty")
		return
	}
	fields := strings.Fields(authorizationHeader)
	if fields[0] != "Bearer" || len(fields) != 2 {
		err = errors.New("authorization header is invalid")
		return
	}
	tokenString := fields[1]

	token, err := jwt.ParseWithClaims(tokenString, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(Secret), nil
	})
	if err != nil {
		return
	}
	clams, ok := token.Claims.(*UserClaims)

	if clams.UserId == "" {
		err = errors.New("user id is empty")
		return
	}
	//fmt.Println("user token", clams.UserId, TokenMap[clams.UserId])
	tokenVal := GetUserToken(clams.UserId)
	if tokenVal == nil {
		err = errors.New("token is invalid")
		return
	}
	if tokenVal.ExpireIn < time.Now().Unix() {
		err = errors.New("token is expire in")
		DeleteUserToken(clams.UserId)
		return
	}
	if ok && token.Valid {
		return clams, nil
	}
	return

}

func ValidatePermission(claims *UserClaims, permissions []string) (err error) {

	user := claims.ShortUser

	if user.UserId == "" {
		err = errors.New("user id is empty")
		return
	}
	if user.Roles == nil {
		err = errors.New("api permission is empty")
		return
	}

	// 权限校验
	userPermissions := make([]string, 0)
	for _, role := range user.Roles {
		if _, ok := RoleMap[role]; ok {
			for _, v := range RoleMap[role].Privilege.Platform {
				userPermissions = append(userPermissions, v)
			}
		}
	}
	userPermissionMap := make(map[string]struct{})
	for _, val := range userPermissions {
		for _, v := range enum.PermissionMap[val] {
			userPermissionMap[v] = struct{}{}
		}

	}

	for _, v := range permissions {
		if _, ok := userPermissionMap[v]; !ok {
			err = errors.New("permission denied")
			return
		}
	}
	return nil

}

func SearchAPIPermission(typ string, method, path string) (permission string, params map[string]string, matched bool) {
	method = strings.ToLower(method)
	router := GetAPIPermissionRouter(typ)
	if router == nil {
		panic(fmt.Errorf("can not found api permission router of %s", typ))
	}
	return router.Search(method, path)
}
