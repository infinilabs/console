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
	api.HandleAPIMethod(api.POST, "/role", r.CreateRole)
	api.HandleAPIMethod(api.GET, "/role/:id", r.GetRole)
	api.HandleAPIMethod(api.DELETE, "/role/:id", r.DeleteRole)
	api.HandleAPIMethod(api.PUT, "/role/:id", r.UpdateRole)
	api.HandleAPIMethod(api.GET, "/roles", r.ListRole)

}
func loadJsonConfig() {
	pwd, _ := os.Getwd()

	bytes, err := util.FileGetContent(path.Join(pwd, "/config/permission.json"))
	if err != nil {
		panic("load json file err " + err.Error())

	}

	err = json.Unmarshal(bytes, &biz.CategoryApi)
	if err != nil {
		panic("json config unmarshal err " + err.Error())

	}
}
func init() {
	registerRouter()
	loadJsonConfig()
}
