package rbac

import (
	log "github.com/cihub/seelog"
	"infini.sh/console/internal/biz"
	"infini.sh/console/internal/biz/enum"
	"infini.sh/console/internal/core"
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
		h.Error(w, err)
		return
	}
	irole, err := biz.NewRole(roleType)
	if err != nil {
		h.Error(w, err)
		return
	}

	err = h.DecodeJSON(r, &irole)
	if err != nil {
		h.Error400(w, err.Error())
		return
	}
	var id string
	id, err = irole.Create(localUser)

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
	total := response.GetTotal()
	var index string
	for _, v := range list {
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
	localUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		log.Error(err.Error())
		h.Error(w, err)
		return
	}
	model, err := biz.GetRole(id)
	if err != nil {
		h.Error(w, err)
		return
	}
	irole, err := biz.NewRole(model.RoleType)
	if err != nil {
		h.Error(w, err)
		return
	}

	err = h.DecodeJSON(r, &irole)
	if err != nil {
		h.Error400(w, err.Error())
		return
	}

	err = irole.Update(localUser, model)

	if err != nil {
		_ = log.Error(err.Error())
		h.Error(w, err)
		return
	}
	_ = h.WriteOKJSON(w, core.UpdateResponse(id))
	return
}
