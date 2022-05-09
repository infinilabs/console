package rbac

import (
	"encoding/json"
	"github.com/mitchellh/mapstructure"
	"infini.sh/console/internal/biz"
	"infini.sh/console/internal/biz/enum"
	"infini.sh/console/model/rbac"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"os"
	"path"
	log "github.com/cihub/seelog"
)

type Rbac struct {
	api.Handler
}

func init() {

	//r := Rbac{}
	//api.HandleAPIMethod(api.GET, "/permission/:type", r.ListPermission)
	//api.HandleAPIMethod(api.POST, "/role/:type", m.PermissionRequired(r.CreateRole, enum.RoleAllPermission...))
	//api.HandleAPIMethod(api.GET, "/role/:id", m.PermissionRequired(r.GetRole, enum.RoleReadPermission...))
	//api.HandleAPIMethod(api.DELETE, "/role/:id", m.PermissionRequired(r.DeleteRole, enum.RoleAllPermission...))
	//api.HandleAPIMethod(api.PUT, "/role/:id", m.PermissionRequired(r.UpdateRole, enum.RoleAllPermission...))
	//api.HandleAPIMethod(api.GET, "/role/_search", m.PermissionRequired(r.SearchRole, enum.RoleReadPermission...))
	//
	//api.HandleAPIMethod(api.POST, "/user", m.PermissionRequired(r.CreateUser, enum.UserAllPermission...))
	//api.HandleAPIMethod(api.GET, "/user/:id", m.PermissionRequired(r.GetUser, enum.UserReadPermission...))
	//api.HandleAPIMethod(api.DELETE, "/user/:id", m.PermissionRequired(r.DeleteUser, enum.UserAllPermission...))
	//api.HandleAPIMethod(api.PUT, "/user/:id", m.PermissionRequired(r.UpdateUser, enum.UserAllPermission...))
	//api.HandleAPIMethod(api.PUT, "/user/:id/role", m.PermissionRequired(r.UpdateUserRole, enum.UserAllPermission...))
	//api.HandleAPIMethod(api.GET, "/user/_search", m.PermissionRequired(r.SearchUser, enum.UserReadPermission...))
	//api.HandleAPIMethod(api.PUT, "/user/:id/password", m.PermissionRequired(r.UpdateUserPassword, enum.UserAllPermission...))
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

	//bytes, err = util.FileGetContent(path.Join(pwd, "/config/map.json"))
	//if err != nil {
	//	panic("load json file err " + err.Error())
	//}
	//esapiMap := make(map[string]string)
	//err = json.Unmarshal(bytes, &esapiMap)
	//if err != nil {
	//	panic("json config unmarshal err " + err.Error())
	//}
	//for k, v := range esapiMap {
	//	s := strings.Split(k, "-")
	//	biz.EsApiRoutes.AddRoute(s[0], s[1], v)
	//}

}
func loadRolePermission() {
	biz.RoleMap = make(map[string]rbac.Role)

	biz.RoleMap["admin"] = rbac.Role{
		Privilege: rbac.RolePrivilege{
			Platform: enum.AdminPrivilege,
		},
	}

	res, err := biz.SearchRole("", 0, 1000)
	if err != nil {
		log.Error(err)
		return
	}
	response := elastic.SearchResponse{}
	util.FromJSONBytes(res.Raw, &response)

	for _, v := range response.Hits.Hits {
		var role rbac.Role
		delete(v.Source, "created")
		delete(v.Source, "updated")
		err = mapstructure.Decode(v.Source, &role)
		if err != nil {
			log.Error(err)
			return
		}
		biz.RoleMap[role.Name] = role
	}

}
func Init() {
	loadJsonConfig()
	loadRolePermission()
}
