package rbac

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/internal/biz"
	"infini.sh/console/internal/biz/enum"
	"infini.sh/console/internal/core"
	"infini.sh/console/model/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"net/http"
)

func (h Rbac) CreateRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	roleType := ps.MustGetParameter("type")

	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	err = biz.IsAllowRoleType(roleType)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	role := &rbac.Role{
		Type: roleType,
	}
	err = h.DecodeJSON(r, role)
	if err != nil {
		h.Error400(w, err.Error())
		return
	}

	var id string
	id, err = biz.CreateRole(localUser, role)

	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
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
		h.ErrorInternalServer(w, err.Error())
		return
	}
	response := elastic.SearchResponse{}
	util.FromJSONBytes(res.Raw, &response)

	hits := response.Hits.Hits
	list := make([]elastic.IndexDocument, 0)
	total := response.GetTotal()
	var index string
	for _, v := range hits {
		index = v.Index
	}
	for k, v := range enum.BuildRoles {
		list = append(list, elastic.IndexDocument{
			ID:     k,
			Index:  index,
			Type:   "_doc",
			Source: v,
		})
		total++
	}
	list = append(list, hits...)
	response.Hits.Hits = list
	response.Hits.Total = total

	h.WriteOKJSON(w, response)
	return

}

func (h Rbac) GetRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	role, err := biz.GetRole(id)

	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
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
		h.ErrorInternalServer(w, err.Error())
		return
	}
	err = biz.DeleteRole(localUser, id)

	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	_ = h.WriteOKJSON(w, core.DeleteResponse(id))
	return
}

func (h Rbac) UpdateRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("id")
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	role := &rbac.Role{}
	err = h.DecodeJSON(r, role)
	if err != nil {
		h.Error400(w, err.Error())
		return
	}
	role.ID = id
	err = biz.UpdateRole(localUser, role)

	if err != nil {
		_ = log.Error(err.Error())
		h.ErrorInternalServer(w, err.Error())
		return
	}
	_ = h.WriteOKJSON(w, core.UpdateResponse(id))
	return
}
