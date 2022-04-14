package rbac

import (
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

type CreateRoleReq struct {
	Name        string      `json:"name"`
	Description string      `json:"description" `
	RoleType    string      `json:"type" `
	Permission  interface{} `json:"permission"`
}
type ElasticsearchPermission struct {
	Cluster          []string `json:"cluster" `
	Index            []string `json:"index" `
	ClusterPrivilege []string `json:"cluster_privilege" `
	IndexPrivilege   []string `json:"index_privilege" `
}

func (h Rbac) CreateRole(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	roleType := ps.MustGetParameter("type")
	err := validateRoleType(roleType)
	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

}
func (h Rbac) ListRole(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	roleType := ps.MustGetParameter("type")
	err := validateRoleType(roleType)
	if err != nil {
		_ = log.Error(err.Error())
		_ = h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
func (h Rbac) GetRole(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	_ = ps.MustGetParameter("id")

}
func (h Rbac) DeleteRole(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	_ = ps.MustGetParameter("id")
}
func (h Rbac) UpdateRole(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	_ = ps.MustGetParameter("id")
}
