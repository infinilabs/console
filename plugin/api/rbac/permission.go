package rbac

import (
	log "github.com/cihub/seelog"
	"github.com/pkg/errors"
	"infini.sh/console/internal/biz"

	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

type RoleType = string

const (
	Console      RoleType = "console"
	Elastisearch RoleType = "elasticsearch"
)

func validateRoleType(roleType RoleType) (err error) {
	if roleType != Console && roleType != Elastisearch {
		err = errors.New("unsupport type parmeter " + roleType)
	}
	return
}
func (h Rbac) ListPermission(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	typ := ps.MustGetParameter("type")
	err := validateRoleType(typ)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	var permissons interface{}
	switch typ {
	case Console:
		permissons, err = biz.ListConsolePermisson()

	case Elastisearch:
		permissons, err = biz.ListElasticsearchPermisson()
	}
	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}

	_ = h.WriteJSON(w, Response{
		Hit: permissons,
	}, http.StatusOK)
	return
}
