package rbac

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/internal/biz"
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

func (h Rbac) ListPermission(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	typ := ps.MustGetParameter("type")

	err := biz.IsAllowRoleType(typ)
	if err != nil {
		h.Error400(w, err.Error())
		return
	}
	role, err := biz.NewRole(typ)

	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	permissions := role.ListPermission()
	h.WriteOKJSON(w, permissions)
	return
}
