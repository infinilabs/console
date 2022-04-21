package rbac

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/internal/biz"
	"infini.sh/console/internal/biz/enum"
	"infini.sh/console/internal/core"
	"infini.sh/console/internal/dto"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"net/http"
)

func (h Rbac) CreateRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	roleType := ps.MustGetParameter("type")
	var err error

	var req dto.CreateRole
	err = h.DecodeJSON(r, &req)
	if err != nil {
		h.Error400(w, err.Error())
		return
	}
	req.RoleType = roleType

	var id string
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.Error(w, err)
		return
	}
	id, err = biz.CreateRole(localUser, req)
	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}

	_ = h.WriteOKJSON(w, core.CreateResponse(id))
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
	response := elastic.SearchResponse{}
	util.FromJSONBytes(res.Raw, &response)

	list := response.Hits.Hits
	var index string
	for _, v := range list {
		index = v.Index
	}

	list = append(list, elastic.IndexDocument{
		ID:     "admin",
		Index:  index,
		Type:   "_doc",
		Source: enum.BuildRoles["admin"],
	})
	response.Hits.Hits = list
	response.Hits.Total = response.GetTotal() + 1

	h.WriteOKJSON(w, response)
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
	h.WriteOKJSON(w, core.Response{Hit: role})
	return
}

func (h Rbac) DeleteRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")

	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.Error(w, err)
		return
	}
	err = biz.DeleteRole(localUser, id)

	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	_ = h.WriteOKJSON(w, core.DeleteResponse(id))
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
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.Error(w, err)
		return
	}
	err = biz.UpdateRole(localUser, id, req)

	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	_ = h.WriteOKJSON(w, core.UpdateResponse(id))
	return
}
