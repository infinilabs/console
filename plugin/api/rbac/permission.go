package rbac

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/internal/biz"

	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

func (h Rbac) ListPermission(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	typ := ps.MustGetParameter("type")
	role, err := biz.NewRole(typ)

	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	permissions := role.ListPermission()
	h.WriteOKJSON(w, Response{
		Hit: permissions,
	})
	return
}
