/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package oauth

import (
	"encoding/base64"
	log "github.com/cihub/seelog"
	"github.com/google/go-github/github"
	"golang.org/x/oauth2"
	rbac "infini.sh/console/core/security"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/util"
	"math/rand"
	"net/http"
	"strings"
	"time"
)

func (h APIHandler) getDefaultRoles() []rbac.UserRole {
	if len(oAuthConfig.DefaultRoles) == 0 {
		return nil
	}

	if len(defaultOAuthRoles) > 0 {
		return defaultOAuthRoles
	}

	roles := h.getRolesByRoleIDs(oAuthConfig.DefaultRoles)
	if len(roles) > 0 {
		defaultOAuthRoles = roles
	}
	return roles
}

func (h APIHandler) getRolesByRoleIDs(roles []string) []rbac.UserRole {
	out := []rbac.UserRole{}
	for _, v := range roles {
		role, err := h.Adapter.Role.Get(v)
		if err != nil {
			if !strings.Contains(err.Error(), "record not found") {
				panic(err)
			}

			//try name
			role, err = h.Adapter.Role.GetBy("name", v)
			if err != nil {
				continue
			}
		}
		out = append(out, rbac.UserRole{ID: role.ID, Name: role.Name})
	}
	return out
}

const oauthSession string = "oauth-session"

func (h APIHandler) AuthHandler(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
	b := make([]byte, 16)
	rand.Read(b)

	state := base64.URLEncoding.EncodeToString(b)

	session, err := api.GetSessionStore(r, oauthSession)
	session.Values["state"] = state
	session.Values["redirect_url"] = h.Get(r, "redirect_url", "")
	err = session.Save(r, w)
	if err != nil {
		http.Redirect(w, r, joinError(oAuthConfig.FailedPage, err), 302)
		return
	}

	url := oauthCfg.AuthCodeURL(state)
	http.Redirect(w, r, url, 302)
}

func joinError(url string, err error) string {
	if err != nil {
		return url + "?err=" + util.UrlEncode(err.Error())
	}
	return url
}

func (h APIHandler) CallbackHandler(w http.ResponseWriter, r *http.Request, p httprouter.Params) {

	session, err := api.GetSessionStore(r, oauthSession)
	if err != nil {
		log.Error(w, "failed to sso, aborted")
		http.Redirect(w, r, joinError(oAuthConfig.FailedPage, err), 302)
		return
	}

	if r.URL.Query().Get("state") != session.Values["state"] {
		log.Error("failed to sso, no state match; possible csrf OR cookies not enabled")
		http.Redirect(w, r, joinError(oAuthConfig.FailedPage, err), 302)
		return
	}

	tkn, err := oauthCfg.Exchange(oauth2.NoContext, r.URL.Query().Get("code"))
	if err != nil {
		log.Error("failed to sso, there was an issue getting your token")
		http.Redirect(w, r, joinError(oAuthConfig.FailedPage, err), 302)
		return
	}

	if !tkn.Valid() {
		log.Error("failed to sso, retreived invalid token")
		http.Redirect(w, r, joinError(oAuthConfig.FailedPage, err), 302)
		return
	}

	//only for github, TODO
	client := github.NewClient(oauthCfg.Client(oauth2.NoContext, tkn))

	user, res, err := client.Users.Get(oauth2.NoContext, "")
	if err != nil {
		if res != nil {
			log.Error("failed to sso, error getting name:", err, res.String())
		}
		http.Redirect(w, r, joinError(oAuthConfig.FailedPage, err), 302)
		return
	}

	if user != nil {
		roles := []rbac.UserRole{}

		var id, name, email string
		if user.Login != nil && *user.Login != "" {
			id = *user.Login
		}
		if user.Name != nil && *user.Name != "" {
			name = *user.Name
		}
		if user.Email != nil && *user.Email != "" {
			email = *user.Email
		}

		if id == "" {
			log.Error("failed to sso, user id can't be nil")
			http.Redirect(w, r, joinError(oAuthConfig.FailedPage, err), 302)
			return
		}

		if name == "" {
			name = id
		}

		//get by roleMapping
		roles = h.getRoleMapping(user)
		if len(roles) > 0 {
			u := &rbac.User{
				AuthProvider: "github",
				Username:     id,
				Nickname:     name,
				Email:        email,
				Roles:        roles,
			}

			u.ID = id

			//generate access token
			data, err := rbac.GenerateAccessToken(u)
			if err != nil {
				http.Redirect(w, r, joinError(oAuthConfig.FailedPage, err), 302)
				return
			}

			token := rbac.Token{ExpireIn: time.Now().Unix() + 86400}
			rbac.SetUserToken(u.ID, token)

			//data["status"] = "ok"
			url := oAuthConfig.SuccessPage + "?payload=" + util.UrlEncode(util.MustToJSON(data))
			http.Redirect(w, r, url, 302)
			return
		}
	}
	http.Redirect(w, r, joinError(oAuthConfig.FailedPage, err), 302)
}

func (h APIHandler) getRoleMapping(user *github.User) []rbac.UserRole {
	roles := []rbac.UserRole{}

	if user != nil {
		if len(oAuthConfig.RoleMapping) > 0 {
			r, ok := oAuthConfig.RoleMapping[*user.Login]
			if ok {
				roles = h.getRolesByRoleIDs(r)
			}
		}
	}

	if len(roles) == 0 {
		return h.getDefaultRoles()
	}
	return roles
}

const providerName = "oauth"

type OAuthRealm struct {
	// Implement any required fields
}

//func (r *OAuthRealm) GetType() string{
//	return providerName
//}

//func (r *OAuthRealm) Authenticate(username, password string) (bool, *rbac.User, error) {
//
//	//if user == nil {
//	//	return false,nil, fmt.Errorf("user account [%s] not found", username)
//	//}
//
//	return false,nil, err
//}
//
//func (r *OAuthRealm) Authorize(user *rbac.User) (bool, error) {
//	var _, privilege = user.GetPermissions()
//
//	if len(privilege) == 0 {
//		log.Error("no privilege assigned to user:", user)
//		return false, errors.New("no privilege assigned to this user:" + user.Name)
//	}
//
//	return true,nil
//}
