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
	"github.com/golang-jwt/jwt"
	"testing"
	"time"
)

func TestValidateAPIPermissionSupportsLegacyTemplateAliases(t *testing.T) {
	tests := []struct {
		name       string
		privilege  string
		permission string
	}{
		{
			name:       "template delete",
			privilege:  "template.delete",
			permission: "indices.delete_template",
		},
		{
			name:       "template exists",
			privilege:  "template.exists",
			permission: "indices.exists_template",
		},
		{
			name:       "template get",
			privilege:  "template.get",
			permission: "indices.get_template",
		},
		{
			name:       "template put",
			privilege:  "template.put",
			permission: "indices.put_template",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			apiPrivileges := map[string]struct{}{
				tt.privilege: {},
			}
			permissions := map[string]struct{}{
				tt.permission: {},
			}

			validateApiPermission(apiPrivileges, permissions)

			if len(apiPrivileges) != 0 {
				t.Fatalf("expected legacy permission %q to satisfy %q", tt.permission, tt.privilege)
			}
		})
	}
}

func issueTestToken(t *testing.T, userID string) string {
	t.Helper()

	expireAt := time.Now().Add(time.Hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, UserClaims{
		ShortUser: &ShortUser{
			Provider: "native",
			Username: "tester",
			UserId:   userID,
		},
		RegisteredClaims: &jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expireAt),
		},
	})

	tokenString, err := token.SignedString([]byte(Secret))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}

	userTokenLocker.Lock()
	tokenMap[userID] = Token{
		Value:    tokenString,
		ExpireIn: expireAt.Unix(),
	}
	userTokenLocker.Unlock()

	t.Cleanup(func() {
		userTokenLocker.Lock()
		delete(tokenMap, userID)
		userTokenLocker.Unlock()
	})

	return tokenString
}

func TestValidateLoginRejectsReplacedActiveToken(t *testing.T) {
	userID := "user-revoked"
	authorizationHeader := "Bearer " + issueTestToken(t, userID)
	if _, err := ValidateLogin(authorizationHeader); err != nil {
		t.Fatalf("expected token to validate before revoke, got %v", err)
	}

	userTokenLocker.Lock()
	tokenMap[userID] = Token{
		Value:    "replaced-token",
		ExpireIn: time.Now().Add(time.Hour).Unix(),
	}
	userTokenLocker.Unlock()

	if _, err := ValidateLogin(authorizationHeader); err == nil {
		t.Fatal("expected replaced token to be rejected")
	}
}

func TestValidateLoginRejectsStaleTokenValue(t *testing.T) {
	userID := "user-stale"
	authorizationHeader := "Bearer " + issueTestToken(t, userID)

	userTokenLocker.Lock()
	tokenMap[userID] = Token{
		Value:    "replacement-token",
		ExpireIn: time.Now().Add(time.Hour).Unix(),
	}
	userTokenLocker.Unlock()

	if _, err := ValidateLogin(authorizationHeader); err == nil {
		t.Fatal("expected stale token to be rejected")
	}
}

func TestValidateLoginSupportsLegacyJwtField(t *testing.T) {
	userID := "user-legacy"
	tokenString := issueTestToken(t, userID)

	userTokenLocker.Lock()
	tokenMap[userID] = Token{
		JwtStr:   tokenString,
		ExpireIn: time.Now().Add(time.Hour).Unix(),
	}
	userTokenLocker.Unlock()

	if _, err := ValidateLogin("Bearer " + tokenString); err != nil {
		t.Fatalf("expected legacy jwt field to remain valid, got %v", err)
	}
}
