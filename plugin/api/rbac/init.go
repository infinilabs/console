package rbac

import (
	"encoding/json"
	"infini.sh/console/plugin/api/rbac/biz"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/util"
	"os"
	"path"
)

type Permisson struct {
	api.Handler
}

func registerRouter() {
	p := Permisson{}

	api.HandleAPIMethod(api.GET, "/permission/:type", p.ListPermission)

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
