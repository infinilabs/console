package rbac

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/internal/biz"
	"infini.sh/console/internal/core"

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
	h.WriteOKJSON(w, core.Response{
		Hit: permissions,
	})
	return
}
