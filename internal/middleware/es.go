package middleware

import (
	"infini.sh/console/internal/biz"
	httprouter "infini.sh/framework/core/api/router"
	"net/http"
)

func IndexRequired(h httprouter.Handle, route ...string) httprouter.Handle {

	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		claims, err := biz.ValidateLogin(r.Header.Get("Authorization"))
		if err != nil {
			w = handleError(w, http.StatusUnauthorized, err)
			return
		}
		newRole := biz.CombineUserRoles(claims.Roles)

		indexReq := biz.NewIndexRequest(ps, route)

		err = biz.ValidateIndex(indexReq, newRole)
		if err != nil {
			w = handleError(w, http.StatusForbidden, err)
			return
		}
		h(w, r, ps)
	}
}
func ClusterRequired(h httprouter.Handle, route ...string) httprouter.Handle {

	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		claims, err := biz.ValidateLogin(r.Header.Get("Authorization"))
		if err != nil {
			w = handleError(w, http.StatusUnauthorized, err)
			return
		}
		//newRole := biz.CombineUserRoles(claims.Roles)
		clusterReq := biz.NewClusterRequest(ps, route)

		err = biz.ValidateCluster(clusterReq, claims.Roles)
		if err != nil {
			w = handleError(w, http.StatusForbidden, err)
			return
		}
		h(w, r, ps)
	}
}
