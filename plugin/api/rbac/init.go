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

func registerRouter() {
	r := Rbac{}
	api.HandleAPIMethod(api.GET, "/permission/:type", m.PermissionRequired(r.ListPermission, enum.ListPermission))
	api.HandleAPIMethod(api.POST, "/role/:type", m.PermissionRequired(r.CreateRole, enum.CreateRole))
	api.HandleAPIMethod(api.GET, "/role/:id", m.PermissionRequired(r.GetRole, enum.GetRole))
	api.HandleAPIMethod(api.DELETE, "/role/:id", m.PermissionRequired(r.DeleteRole, enum.DeleteRole))
	api.HandleAPIMethod(api.PUT, "/role/:id", m.PermissionRequired(r.UpdateRole, enum.UpdateRole))
	api.HandleAPIMethod(api.GET, "/role/_search", m.PermissionRequired(r.SearchRole, enum.ListRole))

	api.HandleAPIMethod(api.POST, "/user", m.PermissionRequired(r.CreateUser, enum.CreateUser))
	api.HandleAPIMethod(api.GET, "/user/:id", m.PermissionRequired(r.GetUser, enum.GetUser))
	api.HandleAPIMethod(api.GET, "/user/search", m.PermissionRequired(r.SearchUser, enum.ListUser))
	api.HandleAPIMethod(api.DELETE, "/user/:id", m.PermissionRequired(r.DeleteUser, enum.DeleteUser))
	api.HandleAPIMethod(api.PUT, "/user/:id", m.PermissionRequired(r.UpdateUser, enum.UpdateUser))
	api.HandleAPIMethod(api.PUT, "/user/:id/role", m.PermissionRequired(r.UpdateUserRole, enum.UpdateUser))
	api.HandleAPIMethod(api.GET, "/user/_search", m.PermissionRequired(r.SearchUser, enum.ListUser))

}

func loadJsonConfig() {
	pwd, _ := os.Getwd()

	bytes, err := util.FileGetContent(path.Join(pwd, "/config/permission.json"))
	if err != nil {
		panic("load json file err " + err.Error())

	}

	err = json.Unmarshal(bytes, &biz.EsApis)
	if err != nil {
		panic("json config unmarshal err " + err.Error())
	}
	list := make([]string, 0)
	list = append(list, "*")
	for k := range biz.EsApis {
		list = append(list, k)
	}
	biz.ClusterApis = list

}
func loadRolePermission() {
	biz.RolePermission = make(map[string][]string)
	biz.RolePermission["admin_user"] = []string{enum.GetUser}
}
func init() {
	registerRouter()
	loadJsonConfig()
	loadRolePermission()
}

type Response struct {
	Total  int64       `json:"total,omitempty"`
	Hit    interface{} `json:"hit,omitempty"`
	Id     string      `json:"_id,omitempty"`
	Result string      `json:"result,omitempty"`
}
type NotFoundResp struct {
	Found bool   `json:"found"`
	Id    string `json:"_id,omitempty"`
}

func CreateResponse(id string) Response {
	return Response{
		Id:     id,
		Result: "created",
	}
}
func UpdateResponse(id string) Response {
	return Response{
		Id:     id,
		Result: "updated",
	}
}
func DeleteResponse(id string) Response {
	return Response{
		Id:     id,
		Result: "deleted",
	}
}
func NotFoundResponse(id string) NotFoundResp {
	return NotFoundResp{
		Id:    id,
		Found: false,
	}
}
