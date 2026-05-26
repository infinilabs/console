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

package api

import (
	"golang.org/x/crypto/bcrypt"
	rbac "infini.sh/console/core/security"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	frameworksecurity "infini.sh/framework/core/security"
	"net/http"
)

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

	material, err := frameworksecurity.GeneratePasswordMaterial(req.NewPassword)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	user.Password = material.Hash
	user.PasswordSalt = material.Salt
	user.PasswordVerifier = material.Verifier

	err = h.User.Update(&user)
	if err != nil {
		h.ErrorInternalServer(w, err.Error())
		return
	}
	h.WriteOKJSON(w, api.UpdateResponse(reqUser.UserId))
}
