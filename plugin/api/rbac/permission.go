package rbac

import (
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

type RoleType = string

const (
	Console      RoleType = "console"
	Elastisearch RoleType = "elasticsearch"
)

type Response struct {
	Hit interface{} `json:"hit"`
}

func (h Permisson) ListPermission(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	return
}
