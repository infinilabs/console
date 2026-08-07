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

package security

import (
	"fmt"
	"net/http"
	"strings"

	rbac "infini.sh/console/core/security"
	"infini.sh/console/modules/security/realm"
	"infini.sh/framework/core/orm"
	frameworksecurity "infini.sh/framework/core/security"
	frameworkrbac "infini.sh/framework/modules/security/native"
)

type frameworkNativeAccountProvider struct {
	adapter rbac.Adapter
}

var hasNonNativeRealm = realm.HasNonNativeRealm

func (p frameworkNativeAccountProvider) GetUserByID(id string) (bool, *frameworksecurity.UserAccount, error) {
	user, err := p.adapter.User.Get(id)
	if err != nil {
		return false, nil, err
	}
	if user.ID == "" || !user.IsEnabled() {
		return false, nil, nil
	}
	return true, toFrameworkUserAccount(&user), nil
}

func (p frameworkNativeAccountProvider) GetUserByLogin(login string) (bool, *frameworksecurity.UserAccount, error) {
	user, err := p.adapter.User.GetBy("name", login)
	if err != nil {
		return false, nil, err
	}
	if user == nil || user.ID == "" {
		if hasNonNativeRealm() {
			return true, &frameworksecurity.UserAccount{
				Name: login,
			}, nil
		}
		return false, nil, nil
	}
	if !user.IsEnabled() {
		return false, nil, nil
	}
	return true, toFrameworkUserAccount(user), nil
}

func (p frameworkNativeAccountProvider) CreateUser(name, login, password string, force bool) (*frameworksecurity.UserAccount, error) {
	user := &rbac.User{
		Username: login,
		Nickname: name,
		Email:    login,
	}
	material, err := frameworksecurity.GeneratePasswordMaterial(password)
	if err != nil {
		return nil, err
	}
	user.Password = material.Hash
	user.PasswordSalt = material.Salt
	user.PasswordVerifier = material.Verifier

	id, err := p.adapter.User.Create(user)
	if err != nil {
		return nil, err
	}
	user.ID = id
	return toFrameworkUserAccount(user), nil
}

type frameworkRealmPasswordLoginProvider struct{}

func (frameworkRealmPasswordLoginProvider) AuthenticateByPassword(login, password string) (*frameworksecurity.UserSessionInfo, error) {
	ok, user, err := realm.Authenticate(login, password)
	if err != nil || !ok || user == nil {
		return nil, nil
	}

	ok, err = realm.Authorize(user)
	if err != nil || !ok {
		return nil, err
	}

	sessionUser := &frameworksecurity.UserSessionInfo{
		Provider: normalizeFrameworkProvider(user.AuthProvider),
		Login:    user.Username,
		Roles:    roleNames(user.Roles),
	}
	sessionUser.SetUserID(user.ID)
	_, privilege := user.GetPermissions()
	sessionUser.UserAssignedPermission = frameworksecurity.NewUserAssignedPermission(
		rbac.ExpandFrameworkPermissionKeysForPlatformPrivileges(privilege),
		nil,
	)
	return rbac.EnsureFrameworkDefaultPermissions(sessionUser), nil
}

func registerFrameworkAccountBridge() {
	adapter := rbac.GetAdapter("native")
	frameworkrbac.RegisterPasswordChallengeUpgradePersister(func(ctx *orm.Context, user *frameworksecurity.UserAccount) error {
		return persistFrameworkChallengeUpgrade(adapter, user)
	})
	frameworksecurity.RegisterAuthenticationProvider("console-native-account-bridge", frameworkNativeAccountProvider{adapter: adapter})
	frameworksecurity.RegisterAccountPasswordLoginProvider("console-realm-password-login", frameworkRealmPasswordLoginProvider{})
	frameworksecurity.RegisterHTTPAuthFilterProviderWithPriority("console-bearer-token", func(_ http.ResponseWriter, r *http.Request) (*frameworksecurity.UserClaims, error) {
		authorization := strings.TrimSpace(r.Header.Get("Authorization"))
		if authorization == "" {
			return nil, nil
		}

		sessionUser, frameworkErr := frameworksecurity.ValidateAuthorizationHeader(authorization)
		if frameworkErr == nil && sessionUser != nil && sessionUser.IsValid() {
			if err := validateNativeAccountEnabled(adapter, sessionUser); err != nil {
				return nil, err
			}
			bridgedClaims := frameworksecurity.NewUserClaims()
			bridgedClaims.UserSessionInfo = sessionUser
			return bridgedClaims, nil
		}

		claims, err := rbac.ValidateLogin(authorization)
		if err != nil || claims == nil {
			return nil, err
		}
		if err := validateLegacyNativeAccountEnabled(adapter, claims); err != nil {
			return nil, err
		}
		sessionUser = claims.ToSessionInfo()
		if sessionUser == nil {
			return nil, nil
		}
		sessionUser.Provider = normalizeFrameworkProvider(sessionUser.Provider)
		rbac.EnsureFrameworkDefaultPermissions(sessionUser)

		bridgedClaims := frameworksecurity.NewUserClaims()
		bridgedClaims.UserSessionInfo = sessionUser
		if claims.RegisteredClaims != nil {
			bridgedClaims.RegisteredClaims = claims.RegisteredClaims
		}
		return bridgedClaims, nil
	}, 15)
	frameworksecurity.RegisterSessionTokenResponseDecorator("console-platform-privilege", func(token map[string]interface{}, user *frameworksecurity.UserSessionInfo) {
		if user == nil {
			return
		}
		token["privilege"] = rbac.CombineUserRoles(user.Roles).Platform
	})
}

func validateNativeAccountEnabled(adapter rbac.Adapter, sessionUser *frameworksecurity.UserSessionInfo) error {
	if sessionUser == nil || !isNativeProvider(sessionUser.Provider) {
		return nil
	}
	userID := strings.TrimSpace(sessionUser.UserID)
	if userID == "" {
		return fmt.Errorf("user id is empty")
	}
	user, err := adapter.User.Get(userID)
	if err != nil {
		return err
	}
	if !user.IsEnabled() {
		return fmt.Errorf("user account [%s] is disabled", sessionUser.Login)
	}
	return nil
}

func validateLegacyNativeAccountEnabled(adapter rbac.Adapter, claims *rbac.UserClaims) error {
	if claims == nil || claims.ShortUser == nil || !isNativeProvider(claims.ShortUser.Provider) {
		return nil
	}
	userID := strings.TrimSpace(claims.ShortUser.UserId)
	if userID == "" {
		return fmt.Errorf("user id is empty")
	}
	user, err := adapter.User.Get(userID)
	if err != nil {
		return err
	}
	if !user.IsEnabled() {
		rbac.DeleteUserToken(userID)
		return fmt.Errorf("user account [%s] is disabled", claims.ShortUser.Username)
	}
	return nil
}

func isNativeProvider(provider string) bool {
	normalized := strings.ToLower(strings.TrimSpace(provider))
	return normalized == "" || normalized == "native" || normalized == strings.ToLower(frameworksecurity.DefaultNativeAuthBackend)
}

func persistFrameworkChallengeUpgrade(adapter rbac.Adapter, user *frameworksecurity.UserAccount) error {
	if user == nil || user.ID == "" {
		return nil
	}
	legacyUser, err := adapter.User.Get(user.ID)
	if err != nil {
		return err
	}
	if legacyUser.ID == "" {
		return fmt.Errorf("legacy user [%s] not found", user.ID)
	}
	legacyUser.PasswordSalt = user.PasswordSalt
	legacyUser.PasswordVerifier = user.PasswordVerifier
	return adapter.User.Update(&legacyUser)
}

func toFrameworkUserAccount(user *rbac.User) *frameworksecurity.UserAccount {
	if user == nil {
		return nil
	}

	account := &frameworksecurity.UserAccount{
		Name:             user.Username,
		Email:            user.Email,
		Roles:            roleNames(user.Roles),
		Password:         user.Password,
		PasswordSalt:     user.PasswordSalt,
		PasswordVerifier: user.PasswordVerifier,
	}
	account.ID = user.ID
	return account
}

func roleNames(roles []rbac.UserRole) []string {
	out := make([]string, 0, len(roles))
	for _, role := range roles {
		out = append(out, role.Name)
	}
	return out
}

func normalizeFrameworkProvider(provider string) string {
	if strings.EqualFold(strings.TrimSpace(provider), "native") {
		return frameworksecurity.DefaultNativeAuthBackend
	}
	return provider
}
