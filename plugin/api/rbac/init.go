package rbac

import (
	"encoding/json"
	"infini.sh/console/plugin/api/rbac/biz"
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
	api.HandleAPIMethod(api.GET, "/permission/:type", r.ListPermission)
	api.HandleAPIMethod(api.POST, "/role/:type", r.CreateRole)
	api.HandleAPIMethod(api.GET, "/role/:id", r.GetRole)
	api.HandleAPIMethod(api.DELETE, "/role/:id", r.DeleteRole)
	api.HandleAPIMethod(api.PUT, "/role/:id", r.UpdateRole)
	api.HandleAPIMethod(api.GET, "/roles/:type", r.ListRole)

	api.HandleAPIMethod(api.GET, "/user/:id", r.ListRole)
	api.HandleAPIMethod(api.GET, "/users", r.ListRole)
	api.HandleAPIMethod(api.DELETE, "/user/:id", r.ListRole)
	api.HandleAPIMethod(api.GET, "/users", r.ListRole)

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
	Hit    interface{} `json:"hit,omitempty"`
	Id     string      `json:"_id,omitempty"`
	Result string      `json:"result,omitempty"`
	Found  bool        `json:"found,omitempty"`
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
func NotFoundResponse(id string) Response {
	return Response{
		Id:    id,
		Found: false,
	}
}
