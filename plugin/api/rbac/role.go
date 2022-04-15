package rbac

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/plugin/api/rbac/biz"
	"infini.sh/console/plugin/api/rbac/dto"
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

func (h Rbac) CreateRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	roleType := ps.MustGetParameter("type")
	var err error
	err = validateRoleType(roleType)
	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var req dto.CreateRole
	err = h.DecodeJSON(r, &req)
	if err != nil {
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	req.RoleType = roleType

	var id string
	id, err = biz.CreateRole(req)
	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_ = h.WriteJSON(w, CreateResponse(id), http.StatusOK)
	return

}

func (h Rbac) SearchRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

	roleType := ps.MustGetParameter("type")
	err := validateRoleType(roleType)
	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	return
}

func (h Rbac) GetRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	role, err := biz.GetRole(id)

	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, Response{Hit: role}, http.StatusOK)
	return
}

func (h Rbac) DeleteRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	err := biz.DeleteRole(id)
	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_ = h.WriteJSON(w, DeleteResponse(id), http.StatusOK)
	return
}

func (h Rbac) UpdateRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	var req dto.UpdateRole
	err := h.DecodeJSON(r, &req)
	if err != nil {
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = biz.UpdateRole(id, req)

	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_ = h.WriteJSON(w, UpdateResponse(id), http.StatusOK)
	return
}
