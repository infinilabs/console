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
			w = handleError(w, err)
			return
		}
		r = r.WithContext(biz.NewUserContext(r.Context(), claims))
		h(w, r, ps)
	}
}

func PermissionRequired(h httprouter.Handle, permissions string) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		err := biz.ValidatePermission(r, permissions)
		if err != nil {
			w = handleError(w, err)
			return
		}
		h(w, r, ps)
	}
}
func handleError(w http.ResponseWriter, err error) http.ResponseWriter {
	w.Header().Set("Content-type", util.ContentTypeJson)
	w.WriteHeader(http.StatusUnauthorized)
	w.Write([]byte(`{"error":"` + err.Error() + `"}`))
	return w
}
