package rbac

import (
	"errors"
	"infini.sh/console/internal/biz"
	"infini.sh/console/internal/dto"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/modules/elastic"
	"net/http"
	log "src/github.com/cihub/seelog"
)

type CreateUserReq struct {
	Username string   `json:"username" `
	Password string   `json:"password" `
	Name     string   `json:"name" `
	Phone    string   `json:"phone" `
	Email    string   `json:"email" `
	Tags     []string `json:"tags"`
}

func (h Rbac) CreateUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

	var req dto.CreateUser
	err := h.DecodeJSON(r, &req)
	if err != nil {
		h.Error(w, err)
		return
	}
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.Error(w, err)
		return
	}
	id, err := biz.CreateUser(localUser, req)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	_ = h.WriteOKJSON(w, CreateResponse(id))
	return

}

func (h Rbac) GetUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	user, err := biz.GetUser(id)
	if errors.Is(err, elastic.ErrNotFound) {
		h.WriteJSON(w, NotFoundResponse(id), http.StatusNotFound)
		return
	}

	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	h.WriteOKJSON(w, Response{Hit: user})
	return
}

func (h Rbac) UpdateUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	var req dto.UpdateUser
	err := h.DecodeJSON(r, &req)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.Error(w, err)
		return
	}
	err = biz.UpdateUser(localUser, id, req)

	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	_ = h.WriteOKJSON(w, UpdateResponse(id))
	return
}

func (h Rbac) UpdateUserRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	var req dto.UpdateUserRole
	err := h.DecodeJSON(r, &req)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.Error(w, err)
		return
	}
	err = biz.UpdateUserRole(localUser, id, req)

	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	_ = h.WriteOKJSON(w, UpdateResponse(id))
	return
}

func (h Rbac) DeleteUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.Error(w, err)
		return
	}
	err = biz.DeleteUser(localUser, id)
	if errors.Is(err, elastic.ErrNotFound) {
		h.WriteJSON(w, NotFoundResponse(id), http.StatusNotFound)
		return
	}
	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	_ = h.WriteOKJSON(w, DeleteResponse(id))
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
		log.Error(err.Error())
		h.Error(w, err)
		return
	}

	h.WriteOKJSON(w, Response{Hit: res.Result, Total: res.Total})
	return

}
