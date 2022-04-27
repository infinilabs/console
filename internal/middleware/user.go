package middleware

import (
	"infini.sh/console/internal/biz"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/util"
	"net/http"
)

func LoginRequired(h httprouter.Handle) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

		claims, err := biz.ValidateLogin(r.Header.Get("Authorization"))
		if err != nil {
			w = handleError(w, http.StatusUnauthorized, err)
			return
		}
		r = r.WithContext(biz.NewUserContext(r.Context(), claims))
		h(w, r, ps)
	}
}
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
		newRole := biz.CombineUserRoles(claims.Roles)
		clusterReq := biz.NewClusterRequest(ps, route)

		err = biz.ValidateCluster(clusterReq, newRole)
		if err != nil {
			w = handleError(w, http.StatusForbidden, err)
			return
		}
		h(w, r, ps)
	}
}
func EsPermissionRequired(h httprouter.Handle) httprouter.Handle {

	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		//claims, err := biz.ValidateLogin(r.Header.Get("Authorization"))
		//if err != nil {
		//	w = handleError(w, http.StatusUnauthorized, err)
		//	return
		//}
		//req := biz.NewEsRequest(r, ps)
		//newRole := biz.CombineUserRoles(claims.Roles)
		//err = biz.ValidateEsPermission(req, newRole)
		//if err != nil {
		//	w = handleError(w, http.StatusForbidden, err)
		//	return
		//}
		h(w, r, ps)
	}
}

func PermissionRequired(h httprouter.Handle, permissions ...string) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		claims, err := biz.ValidateLogin(r.Header.Get("Authorization"))
		if err != nil {

			w = handleError(w, http.StatusUnauthorized, err)

			return
		}
		err = biz.ValidatePermission(claims, permissions)
		if err != nil {
			w = handleError(w, http.StatusForbidden, err)
			return
		}
		r = r.WithContext(biz.NewUserContext(r.Context(), claims))
		h(w, r, ps)
	}
}
func handleError(w http.ResponseWriter, statusCode int, err error) http.ResponseWriter {
	w.Header().Set("Content-type", util.ContentTypeJson)
	w.WriteHeader(statusCode)
	json := util.ToJson(util.MapStr{
		"error": util.MapStr{
			"status": statusCode,
			"reason": err.Error(),
		},
	}, true)
	w.Write([]byte(json))

	return w
}
