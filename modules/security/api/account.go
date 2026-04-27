// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package api

import (
	"fmt"
	log "github.com/cihub/seelog"
	"golang.org/x/crypto/bcrypt"
	rbac "infini.sh/console/core/security"
	"infini.sh/console/modules/security/realm"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/util"
	"net/http"
	"strings"
)

const userInSession = "user_session:"

// const SSOProvider = "sso"
const NativeProvider = "native"

//const LDAPProvider = "ldap"

func (h APIHandler) Logout(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	reqUser, err := rbac.FromUserContext(r.Context())
	if err != nil {
		if api.IsAuthEnable() {
			claims, validateErr := rbac.ValidateLogin(r.Header.Get("Authorization"))
			if validateErr != nil {
				h.WriteError(w, validateErr.Error(), http.StatusUnauthorized)
				return
			}
			reqUser = claims.ShortUser
		}
	}

	if reqUser != nil && reqUser.UserId != "" {
		rbac.DeleteUserToken(reqUser.UserId)
	}
	h.WriteOKJSON(w, util.MapStr{
		"status": "ok",
	})
}

func (h APIHandler) LoginChallenge(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var req struct {
		Username string `json:"username"`
		UserName string `json:"userName"`
	}
	err := h.DecodeJSON(r, &req)
	if err != nil {
		h.Error400(w, err.Error())
		return
	}

	username := normalizedUsername(req.Username, req.UserName)
	if username == "" {
		h.Error400(w, "username is required")
		return
	}

	user, err := h.User.GetBy("name", username)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}

	if user == nil || !rbac.CanUsePasswordChallenge(user) {
		h.WriteOKJSON(w, util.MapStr{
			"status": "ok",
			"method": "plain",
		})
		return
	}

	challenge := rbac.NewLoginChallenge(username)
	h.WriteOKJSON(w, util.MapStr{
		"status":       "ok",
		"method":       rbac.PasswordChallengeMethod,
		"algorithm":    rbac.PasswordChallengeAlgorithm,
		"iterations":   rbac.PasswordChallengeIterations,
		"challenge_id": challenge.ID,
		"nonce":        challenge.Nonce,
		"salt":         user.PasswordSalt,
	})
}

func (h APIHandler) Profile(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	reqUser, err := rbac.FromUserContext(r.Context())
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}

	if reqUser.Provider == NativeProvider {
		user, err := h.User.Get(reqUser.UserId)
		if err != nil {
			log.Error(err)
			h.ErrorInternalServer(w, err.Error())
			return
		}
		if user.Nickname == "" {
			user.Nickname = user.Username
		}

		u := util.MapStr{
			"user_id":   user.ID,
			"name":      user.Username,
			"email":     user.Email,
			"nick_name": user.Nickname,
			"phone":     user.Phone,
		}

		h.WriteOKJSON(w, api.FoundResponse(reqUser.UserId, u))
	} else {

		//TODO fetch external profile

		u := util.MapStr{
			"user_id":   reqUser.UserId,
			"name":      reqUser.Username,
			"email":     "",               //TOOD, save user profile come from SSO
			"nick_name": reqUser.Username, //TODO
			"phone":     "",               //TODO
		}
		h.WriteOKJSON(w, api.FoundResponse(reqUser.UserId, u))
	}

}

func (h APIHandler) UpdatePassword(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	reqUser, err := rbac.FromUserContext(r.Context())
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	var req struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}
	err = h.DecodeJSON(r, &req)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}

	user, err := h.User.Get(reqUser.UserId)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword))
	if err == bcrypt.ErrMismatchedHashAndPassword {
		h.ErrorInternalServer(w, "old password is not correct")
		return
	}
	err = rbac.SetPassword(&user, req.NewPassword)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	err = h.User.Update(&user)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	h.WriteOKJSON(w, api.UpdateResponse(reqUser.UserId))
	return
}

func (h APIHandler) UpdateProfile(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	reqUser, err := rbac.FromUserContext(r.Context())
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	var req struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
		Email string `json:"email"`
	}
	err = h.DecodeJSON(r, &req)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	user, err := h.User.Get(reqUser.UserId)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	user.Username = req.Name
	user.Email = req.Email
	user.Phone = req.Phone
	err = h.User.Update(&user)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	h.WriteOKJSON(w, api.UpdateResponse(reqUser.UserId))
	return
}

func (h APIHandler) Login(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var req struct {
		Username    string `json:"username"`
		UserName    string `json:"userName"`
		Password    string `json:"password"`
		ChallengeID string `json:"challenge_id"`
		Proof       string `json:"proof"`
	}
	err := h.DecodeJSON(r, &req)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}

	var user *rbac.User
	username := normalizedUsername(req.Username, req.UserName)
	if username == "" {
		h.Error400(w, "username is required")
		return
	}

	//check user validation
	var ok bool
	if req.ChallengeID != "" || req.Proof != "" {
		ok, user, err = h.authenticateChallengeLogin(username, req.ChallengeID, req.Proof)
	} else {
		ok, user, err = realm.Authenticate(username, req.Password)
	}
	if err != nil {
		h.WriteError(w, err.Error(), 500)
		return
	}

	if !ok {
		h.WriteError(w, "invalid username or password", 403)
		return
	}

	if user == nil {
		h.ErrorInternalServer(w, fmt.Sprintf("failed to authenticate user: %v", username))
		return
	}

	if user.AuthProvider == NativeProvider && req.Password != "" {
		if err := h.ensurePasswordChallenge(user, req.Password); err != nil {
			log.Warnf("failed to migrate password verifier for user [%s]: %v", username, err)
		}
	}

	//check permissions
	ok, err = realm.Authorize(user)
	if err != nil || !ok {
		h.ErrorInternalServer(w, fmt.Sprintf("failed to authorize user: %v", username))
		return
	}

	//fetch user profile
	//TODO
	if user.Nickname == "" {
		user.Nickname = user.Username
	}

	//generate access token
	token, err := rbac.GenerateAccessToken(user)
	if err != nil {
		h.ErrorInternalServer(w, fmt.Sprintf("failed to authorize user: %v", username))
		return
	}

	//api.SetSession(w, r, userInSession+req.Username, req.Username)
	h.WriteOKJSON(w, token)
}

func normalizedUsername(username, userName string) string {
	username = strings.TrimSpace(username)
	if username != "" {
		return username
	}
	return strings.TrimSpace(userName)
}

func (h APIHandler) authenticateChallengeLogin(username, challengeID, proof string) (bool, *rbac.User, error) {
	if challengeID == "" || proof == "" {
		return false, nil, fmt.Errorf("challenge response is incomplete")
	}

	challenge, err := rbac.ConsumeLoginChallenge(challengeID, username)
	if err != nil {
		return false, nil, err
	}

	user, err := h.User.GetBy("name", username)
	if err != nil {
		return false, nil, err
	}
	if user == nil {
		return false, nil, fmt.Errorf("invalid username or password")
	}
	if !rbac.CanUsePasswordChallenge(user) {
		return false, nil, fmt.Errorf("password challenge is not available")
	}
	if !rbac.VerifyPasswordProof(user.PasswordVerifier, username, challenge.ID, challenge.Nonce, proof) {
		return false, nil, fmt.Errorf("incorrect password")
	}

	user.AuthProvider = NativeProvider
	return true, user, nil
}

func (h APIHandler) ensurePasswordChallenge(user *rbac.User, password string) error {
	if user == nil || password == "" || rbac.CanUsePasswordChallenge(user) {
		return nil
	}
	if err := rbac.EnsurePasswordChallenge(user, password); err != nil {
		return err
	}
	return h.User.Update(user)
}
