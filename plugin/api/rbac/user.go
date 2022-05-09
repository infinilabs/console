package rbac

import (
	"errors"
	"infini.sh/console/internal/biz"
	"infini.sh/console/internal/core"
	"infini.sh/console/internal/dto"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/util"
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
		h.Error400(w, err.Error())
		return
	}
	if req.Name == ""  {

		h.Error400(w, "username and phone and email is require")
		return
	}
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	id, pass, err := biz.CreateUser(localUser, req)
	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	_ = h.WriteOKJSON(w, util.MapStr{
		"_id":      id,
		"password": pass,
		"result":   "created",
	})
	return

}

func (h Rbac) GetUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	user, err := biz.GetUser(id)
	if errors.Is(err, elastic.ErrNotFound) {
		h.WriteJSON(w, core.NotFoundResponse(id), http.StatusNotFound)
		return
	}

	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	h.WriteOKJSON(w, core.FoundResponse(id, user))
	return
}

func (h Rbac) UpdateUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	var req dto.UpdateUser
	err := h.DecodeJSON(r, &req)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error400(w, err.Error())
		return
	}
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	err = biz.UpdateUser(localUser, id, req)

	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	_ = h.WriteOKJSON(w, core.UpdateResponse(id))
	return
}

func (h Rbac) UpdateUserRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	var req dto.UpdateUserRole
	err := h.DecodeJSON(r, &req)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error400(w, err.Error())
		return
	}
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	err = biz.UpdateUserRole(localUser, id, req)

	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	_ = h.WriteOKJSON(w, core.UpdateResponse(id))
	return
}

func (h Rbac) DeleteUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	err = biz.DeleteUser(localUser, id)
	if errors.Is(err, elastic.ErrNotFound) {
		h.WriteJSON(w, core.NotFoundResponse(id), http.StatusNotFound)
		return
	}
	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	_ = h.WriteOKJSON(w, core.DeleteResponse(id))
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
		h.ErrorInternalServer(w, err.Error())
		return
	}

	h.Write(w, res.Raw)
	return

}
func (h Rbac) UpdateUserPassword(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	var req dto.UpdateUserPassword
	err := h.DecodeJSON(r, &req)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error400(w, err.Error())
		return
	}
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	err = biz.UpdateUserPassword(localUser, id, req.Password)
	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}

	_ = h.WriteOKJSON(w, core.UpdateResponse(id))
	return

}
