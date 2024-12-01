package core

import (
	"infini.sh/console/core/security"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"net/http"
)

// Handler is the object of http handler
type Handler struct {
	api.Handler
}

var authEnabled = false

// BasicAuth register api with basic auth
func BasicAuth(h httprouter.Handle, requiredUser, requiredPassword string) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		// Get the Basic Authentication credentials
		user, password, hasAuth := r.BasicAuth()

		if hasAuth && user == requiredUser && password == requiredPassword {
			// Delegate request to the given handle
			h(w, r, ps)
		} else {
			// Request Basic Authentication otherwise
			w.Header().Set("WWW-Authenticate", "Basic realm=Restricted")
			http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		}
	}
}

func EnableAuth(enable bool) {
	authEnabled = enable
}

func IsAuthEnable() bool {
	return authEnabled
}

func (handler Handler) RequireLogin(h httprouter.Handle) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

		if authEnabled {
			claims, err := security.ValidateLogin(r.Header.Get("Authorization"))
			if err != nil {
				handler.WriteError(w, err.Error(), http.StatusUnauthorized)
				return
			}
			r = r.WithContext(security.NewUserContext(r.Context(), claims))
		}

		h(w, r, ps)
	}
}

func (handler Handler) RequirePermission(h httprouter.Handle, permissions ...string) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

		if global.Env().SetupRequired() {
			return
		}

		if authEnabled {
			claims, err := security.ValidateLogin(r.Header.Get("Authorization"))
			if err != nil {
				handler.WriteError(w, err.Error(), http.StatusUnauthorized)
				return
			}
			err = security.ValidatePermission(claims, permissions)
			if err != nil {
				handler.WriteError(w, err.Error(), http.StatusForbidden)
				return
			}
			r = r.WithContext(security.NewUserContext(r.Context(), claims))
		}

		h(w, r, ps)
	}
}

func (handler Handler) RequireClusterPermission(h httprouter.Handle, permissions ...string) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

		if authEnabled {
			id := ps.ByName("id")
			claims, err := security.ValidateLogin(r.Header.Get("Authorization"))
			if err != nil {
				handler.WriteError(w, err.Error(), http.StatusUnauthorized)
				return
			}
			r = r.WithContext(security.NewUserContext(r.Context(), claims))
			hasAllPrivilege, clusterIDs := security.GetCurrentUserCluster(r)
			if !hasAllPrivilege && (len(clusterIDs) == 0 || !util.StringInArray(clusterIDs, id)) {
				w.WriteHeader(http.StatusForbidden)
				w.Write([]byte(http.StatusText(http.StatusForbidden)))
				return
			}
		}

		h(w, r, ps)
	}
}

func (handler Handler) GetCurrentUser(req *http.Request) string {
	if authEnabled {
		claims, ok := req.Context().Value("user").(*security.UserClaims)
		if ok {
			return claims.Username
		}
	}
	return ""
}
