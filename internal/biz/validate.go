package biz

import (
	"errors"
	"fmt"
	"infini.sh/console/internal/biz/enum"
	"infini.sh/console/model/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/util"
	"src/github.com/golang-jwt/jwt"
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

func ValidateElasticsearch(req rbac.ElasticsearchPrivilege, roleNames []string) (err error) {

	return nil
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
			err = errors.New("invalid privilege parameter")
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
				continue
			}
			if util.StringInArray(privilege, val) {
				continue
			}
			return fmt.Errorf("no index api permission: %s", val)
		}
	}

	return nil
}
func ValidateCluster(req ClusterRequest, roleNames []string) (err error) {
	userClusterMap := GetRoleClusterMap(roleNames)
	for _, v := range req.Cluster {
		userClusterPermissions, ok := userClusterMap[v]
		if !ok && userClusterMap["*"] == nil{
			err = fmt.Errorf("no cluster[%s] permission", v)
			return
		}
		if util.StringInArray(userClusterPermissions, "*") {
			continue
		}
		// if include api.*  for example: cat.* , return nil
		for _, privilege := range req.Privilege {
			prefix := privilege[:strings.Index(privilege, ".")]

			if util.StringInArray(userClusterPermissions, prefix+".*") {
				continue
			}
			if util.StringInArray(userClusterPermissions, privilege) {
				continue
			}
			return fmt.Errorf("no cluster api permission: %s", privilege)
		}
	}
	return nil

}

func CombineUserRoles(roleNames []string) RolePermission {
	newRole := RolePermission{}
	m := make(map[string][]string)
	for _, val := range roleNames {
		role := RoleMap[val]
		for _, v := range role.Privilege.Elasticsearch.Cluster.Resources {
			newRole.Cluster = append(newRole.Cluster, v.ID)
		}
		for _, v := range role.Privilege.Elasticsearch.Cluster.Permissions {
			newRole.ClusterPrivilege = append(newRole.ClusterPrivilege, v)
		}
		for _, v := range role.Privilege.Platform {
			newRole.Platform = append(newRole.Platform, v)
		}
		for _, v := range role.Privilege.Elasticsearch.Index {

			for _, name := range v.Name {
				if _, ok := m[name]; ok {
					m[name] = append(m[name], v.Permissions...)
				} else {
					m[name] = v.Permissions
				}

			}

		}
	}
	newRole.IndexPrivilege = m
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
func GetRoleCluster(roles []string) []string {
	userClusterMap := GetRoleClusterMap(roles)
	realCluster := make([]string, 0, len(userClusterMap))
	for k, _ := range userClusterMap {
		realCluster = append(realCluster, k)
	}
	return realCluster
}
func GetRoleIndex(roles, clusterIDs []string) map[string][]string {
	userClusterMap := make(map[string]struct{}, len(clusterIDs))
	for _, clusterID := range clusterIDs {
		userClusterMap[clusterID] = struct{}{}
	}
	realIndex := map[string][]string{}
	for _, roleName := range roles {
		role, ok := RoleMap[roleName]
		if ok {
			for _, ic := range role.Privilege.Elasticsearch.Cluster.Resources {
				if _, ok = userClusterMap[ic.ID]; !ok {
					continue
				}
				for _, ip := range role.Privilege.Elasticsearch.Index {
					realIndex[ic.ID] = append(realIndex[ic.ID], ip.Name...)
				}
			}
		}
	}
	return realIndex
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
	tokenVal, ok := TokenMap[clams.UserId]
	if !ok {
		err = errors.New("token is invalid")
		return
	}
	if tokenVal.ExpireIn < time.Now().Unix() {
		err = errors.New("token is expire in")
		delete(TokenMap, clams.UserId)
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
