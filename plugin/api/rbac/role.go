package rbac

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/internal/biz"
	"infini.sh/console/internal/dto"

	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

func (h Rbac) CreateRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	roleType := ps.MustGetParameter("type")
	var err error
	err = validateRoleType(roleType)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}

	var req dto.CreateRole
	err = h.DecodeJSON(r, &req)
	if err != nil {
		h.Error(w, err)
		return
	}
	req.RoleType = roleType

	var id string
	id, err = biz.CreateRole(req)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	_ = h.WriteJSON(w, CreateResponse(id), http.StatusOK)
	return

}

func (h Rbac) SearchRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

	var (
		keyword = h.GetParameterOrDefault(r, "keyword", "")
		from    = h.GetIntOrDefault(r, "from", 0)
		size    = h.GetIntOrDefault(r, "size", 20)
	)

	res, err := biz.SearchRole(keyword, from, size)
	if err != nil {
		log.Error(err)
		h.Error(w, err)
		return
	}

	h.WriteJSON(w, Response{Hit: res.Result, Total: res.Total}, http.StatusOK)
	return

}

func (h Rbac) GetRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	role, err := biz.GetRole(id)

	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
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
		h.Error(w, err)
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
		h.Error(w, err)
		return
	}
	err = biz.UpdateRole(id, req)

	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	_ = h.WriteJSON(w, UpdateResponse(id), http.StatusOK)
	return
}
