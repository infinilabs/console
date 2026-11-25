package filter

import (
	log "github.com/cihub/seelog"
	consolesecurity "infini.sh/console/core/security"
	"infini.sh/framework/core/api"
	common "infini.sh/framework/core/api/common"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/global"
	frameworksecurity "infini.sh/framework/core/security"
	"net/http"
)

func init() {
	api.RegisterUIFilter(&AuthFilter{})
}

type AuthFilter struct {
	api.Handler
}

func (f *AuthFilter) GetPriority() int {
	return 200
}

func (f *AuthFilter) ApplyFilter(
	method string,
	pattern string,
	options *api.HandlerOptions,
	next httprouter.Handle,
) httprouter.Handle {
	if options == nil || (!options.RequireLogin && !options.OptionLogin) || !common.IsAuthEnable() {
		log.Debug(method, ",", pattern, ",skip auth")
		return next
	}

	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		sessionUser, err := frameworksecurity.ValidateLogin(w, r)

		if global.Env().IsDebug {
			log.Debug(method, ",", pattern, ",", sessionUser, ",", err)
		}

		if sessionUser != nil && sessionUser.IsValid() {
			r = r.WithContext(frameworksecurity.AddUserToContext(r.Context(), prepareConsoleUIUser(sessionUser)))
		}

		if !options.OptionLogin {
			if err != nil || sessionUser == nil || !sessionUser.IsValid() {
				o := api.PrepareErrorJson("invalid login", http.StatusUnauthorized)
				f.WriteJSON(w, o, http.StatusUnauthorized)
				return
			}
		}

		next(w, r, ps)
	}
}

func prepareConsoleUIUser(sessionUser *frameworksecurity.UserSessionInfo) *frameworksecurity.UserSessionInfo {
	if sessionUser == nil {
		return nil
	}

	cloned := *sessionUser
	cloned.Roles = append([]string(nil), sessionUser.Roles...)
	if sessionUser.UserAssignedPermission != nil {
		cloned.UserAssignedPermission = frameworksecurity.NewUserAssignedPermission(sessionUser.UserAssignedPermission.GetPermissionKeys(), nil)
	}
	consolesecurity.EnsureFrameworkDefaultPermissions(&cloned)

	if hasConsoleAdminRole(cloned.Roles) {
		cloned.UserAssignedPermission = frameworksecurity.NewUserAssignedPermission(frameworksecurity.GetAllPermissionKeys(), nil)
		return &cloned
	}

	cloned.UserAssignedPermission = frameworksecurity.GetUserPermissions(&cloned)
	return &cloned
}

func hasConsoleAdminRole(roles []string) bool {
	for _, role := range roles {
		if role == consolesecurity.RoleAdminName || role == frameworksecurity.RoleAdmin {
			return true
		}
	}
	return false
}
