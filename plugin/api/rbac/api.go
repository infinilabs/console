package rbac

import (
	"encoding/json"
	"infini.sh/console/internal/biz"
	"infini.sh/console/internal/biz/enum"
	m "infini.sh/console/internal/middleware"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/util"
	"os"
	"path"
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
	//
	//}
	//
	//err = json.Unmarshal(bytes, &biz.EsApiMap)
	//if err != nil {
	//	panic("json config unmarshal err " + err.Error())
	//}

}
func loadRolePermission() {
	biz.RolePermission = make(map[string]enum.Role)

	biz.RolePermission["admin"] = enum.Admin

}
func Init() {
	loadJsonConfig()
	loadRolePermission()
}

func existInternalUser() {
	//user, err := biz.GetUser("admin")
	//if errors.Is(err, elastic.ErrNotFound) {
	//	user.ID = "admin"
	//	user.Username = "admin"
	//	hash, _ := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
	//
	//	user.Password = string(hash)
	//	user.Email = ""
	//	user.Phone = ""
	//	user.Name = ""
	//
	//
	//	user.Created = time.Now()
	//	user.Updated = time.Now()
	//
	//}
}
func existInternalRole() {

}
