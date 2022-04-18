package rbac

import (
	"encoding/json"
	"infini.sh/console/internal/biz"
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
	api.HandleAPIMethod(api.GET, "/permission/:type", m.LoginRequired(m.PermissionRequired(r.ListPermission, "list.permission")))
	api.HandleAPIMethod(api.POST, "/role/:type", m.LoginRequired(m.PermissionRequired(r.CreateRole, "create.role")))
	api.HandleAPIMethod(api.GET, "/role/:id", m.LoginRequired(m.PermissionRequired(r.GetRole, "get.role")))
	api.HandleAPIMethod(api.DELETE, "/role/:id", m.LoginRequired(m.PermissionRequired(r.DeleteRole, "delete.role")))
	api.HandleAPIMethod(api.PUT, "/role/:id", m.LoginRequired(m.PermissionRequired(r.UpdateRole, "update.role")))
	api.HandleAPIMethod(api.GET, "/role/_search", m.LoginRequired(m.PermissionRequired(r.SearchRole, "search.role")))

	api.HandleAPIMethod(api.POST, "/user", m.LoginRequired(m.PermissionRequired(r.CreateUser, "create.user")))
	api.HandleAPIMethod(api.GET, "/user/:id", m.LoginRequired(m.PermissionRequired(r.GetUser, "get.user")))
	api.HandleAPIMethod(api.GET, "/user/search", m.LoginRequired(m.PermissionRequired(r.SearchUser, "search.user")))
	api.HandleAPIMethod(api.DELETE, "/user/:id", m.LoginRequired(m.PermissionRequired(r.DeleteUser, "delete.user")))
	api.HandleAPIMethod(api.PUT, "/user/:id", m.LoginRequired(m.PermissionRequired(r.UpdateUser, "update.user")))
	api.HandleAPIMethod(api.PUT, "/user/:id/role", m.LoginRequired(m.PermissionRequired(r.UpdateUserRole, "update.user.role")))
	api.HandleAPIMethod(api.GET, "/user/_search", m.LoginRequired(m.PermissionRequired(r.SearchUser, "search.user")))

}

//TODO 权限一级配置全局变量，
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
func init() {
	registerRouter()
	loadJsonConfig()
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
