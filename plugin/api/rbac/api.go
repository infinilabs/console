package rbac

import (
	"encoding/json"
	"infini.sh/console/internal/biz"
	"infini.sh/console/internal/biz/enum"
	m "infini.sh/console/internal/middleware"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"os"
	"path"
	log "src/github.com/cihub/seelog"
	"src/github.com/mitchellh/mapstructure"
	"strings"
)

type Rbac struct {
	api.Handler
}

func init() {
	r := Rbac{}
	api.HandleAPIMethod(api.GET, "/permission/:type", r.ListPermission)
	api.HandleAPIMethod(api.POST, "/role/:type", m.PermissionRequired(r.CreateRole, enum.RoleAll...))
	api.HandleAPIMethod(api.GET, "/role/:id", m.PermissionRequired(r.GetRole, enum.RoleRead...))
	api.HandleAPIMethod(api.DELETE, "/role/:id", m.PermissionRequired(r.DeleteRole, enum.RoleAll...))
	api.HandleAPIMethod(api.PUT, "/role/:id", m.PermissionRequired(r.UpdateRole, enum.RoleAll...))
	api.HandleAPIMethod(api.GET, "/role/_search", m.PermissionRequired(r.SearchRole, enum.RoleRead...))

	api.HandleAPIMethod(api.POST, "/user", m.PermissionRequired(r.CreateUser, enum.UserAll...))
	api.HandleAPIMethod(api.GET, "/user/:id", m.PermissionRequired(r.GetUser, enum.UserRead...))
	api.HandleAPIMethod(api.DELETE, "/user/:id", m.PermissionRequired(r.DeleteUser, enum.UserAll...))
	api.HandleAPIMethod(api.PUT, "/user/:id", m.PermissionRequired(r.UpdateUser, enum.UserAll...))
	api.HandleAPIMethod(api.PUT, "/user/:id/role", m.PermissionRequired(r.UpdateUserRole, enum.UserAll...))
	api.HandleAPIMethod(api.GET, "/user/_search", m.PermissionRequired(r.SearchUser, enum.UserRead...))
	api.HandleAPIMethod(api.PUT, "/user/:id/password", m.PermissionRequired(r.UpdateUserPassword, enum.UserAll...))
}

func loadJsonConfig() {
	pwd, _ := os.Getwd()

	bytes, err := util.FileGetContent(path.Join(pwd, "/config/permission.json"))
	if err != nil {
		panic("load json file err " + err.Error())

	}
	apis := make(map[string][]string)
	err = json.Unmarshal(bytes, &apis)
	if err != nil {
		panic("json config unmarshal err " + err.Error())
	}
	biz.IndexApis = apis["indices"]
	delete(apis, "indices")
	biz.ClusterApis = apis

	bytes, err = util.FileGetContent(path.Join(pwd, "/config/map.json"))
	if err != nil {
		panic("load json file err " + err.Error())
	}
	esapiMap := make(map[string]string)
	err = json.Unmarshal(bytes, &esapiMap)
	if err != nil {
		panic("json config unmarshal err " + err.Error())
	}
	for k, v := range esapiMap {
		s := strings.Split(k, "-")
		biz.EsApiRoutes.AddRoute(s[0], s[1], v)
	}

}
func loadRolePermission() {
	biz.RoleMap = make(map[string]biz.Role)

	biz.RoleMap["admin"] = biz.Role{
		Platform: enum.AdminPrivilege,
		Cluster: []struct {
			Id   string `json:"id"`
			Name string `json:"name"`
		}{
			{
				Id:   "c97rd2les10hml00pgh0",
				Name: "docker-cluster",
			},
		},
		ClusterPrivilege: []string{"cat.*"},
		Index: []struct {
			Name      []string `json:"name"`
			Privilege []string `json:"privilege"`
		}{
			{
				Name:      []string{".infini_rbac-role"},
				Privilege: []string{"indices.get_mapping"},
			},
			{
				Name:      []string{".infini_rbac-user", ".infini_rbac-role"},
				Privilege: []string{"cat.*"},
			},
		},
	}
	res, err := biz.SearchRole("", 0, 100)
	if err != nil {
		log.Error(err)
		return
	}
	response := elastic.SearchResponse{}
	util.FromJSONBytes(res.Raw, &response)

	for _, v := range response.Hits.Hits {
		var role biz.Role
		err = mapstructure.Decode(v.Source, &role)
		if err != nil {
			return
		}
		biz.RoleMap[role.Name] = role
	}

}
func Init() {
	loadJsonConfig()
	loadRolePermission()
}
