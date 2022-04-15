package rbac

import (
	"infini.sh/console/plugin/api/rbac/biz"
	"infini.sh/console/plugin/api/rbac/dto"
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
	log "src/github.com/cihub/seelog"
)

type CreateUserReq struct {
	Username string `json:"username" `
	Password string `json:"password" `
	Name     string `json:"name" `
	Phone    string `json:"phone" `
	Email    string `json:"email" `
}

func (h Rbac) CreateUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

	var req dto.CreateUser
	err := h.DecodeJSON(r, &req)
	if err != nil {
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	id, err := biz.CreateUser(req)
	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_ = h.WriteJSON(w, CreateResponse(id), http.StatusOK)
	return

}

func (h Rbac) GetUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	user, err := biz.GetUser(id)
	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, Response{Hit: user}, http.StatusOK)
	return
}

func (h Rbac) UpdateUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	var req dto.UpdateUser
	err := h.DecodeJSON(r, &req)
	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = biz.UpdateUser(id, req)
	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_ = h.WriteJSON(w, UpdateResponse(id), http.StatusOK)
	return
}

func (h Rbac) UpdateUserRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	var req dto.UpdateUserRole
	err := h.DecodeJSON(r, &req)
	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = biz.UpdateUserRole(id, req)

	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_ = h.WriteJSON(w, UpdateResponse(id), http.StatusOK)
	return
}

func (h Rbac) DeleteUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	err := biz.DeleteUser(id)

	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_ = h.WriteJSON(w, DeleteResponse(id), http.StatusOK)
	return
}

func (h Rbac) SearchUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var (
		keyword = h.GetParameterOrDefault(r, "keyword", "")
		from    = h.GetIntOrDefault(r, "from", 0)
		size    = h.GetIntOrDefault(r, "size", 20)
	)

	res, err := biz.SearchUser(keyword, from, size)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, Response{Hit: res.Result, Total: res.Total}, http.StatusOK)
	return

}
