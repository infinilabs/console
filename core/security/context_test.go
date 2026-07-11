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
	"context"
	"testing"

	frameworksecurity "infini.sh/framework/core/security"
)

// Console handlers should still be able to read the current user after middleware
// starts writing framework-native session users into request contexts.
func TestFromUserContextReadsFrameworkSessionUser(t *testing.T) {
	sessionUser := &frameworksecurity.UserSessionInfo{
		Provider: "native",
		Login:    "admin@example.org",
		Roles:    []string{"admin"},
	}
	sessionUser.SetUserID("user-1")

	ctx := frameworksecurity.AddUserToContext(context.Background(), sessionUser)
	user, err := FromUserContext(ctx)
	if err != nil {
		t.Fatalf("from user context: %v", err)
	}
	if user.Username != "admin@example.org" {
		t.Fatalf("expected username to map from framework session, got %q", user.Username)
	}
	if user.UserId != "user-1" {
		t.Fatalf("expected user id to map from framework session, got %q", user.UserId)
	}
}

// While console auth middleware is still in place it should populate both the legacy
// console context key and the framework-native session context used by shared helpers.
func TestNewUserContextAlsoSeedsFrameworkContext(t *testing.T) {
	ctx := NewUserContext(context.Background(), &UserClaims{
		ShortUser: &ShortUser{
			Provider: "native",
			Username: "admin@example.org",
			UserId:   "user-1",
			Roles:    []string{"admin"},
		},
	})

	sessionUser, err := frameworksecurity.GetUserFromContext(ctx)
	if err != nil {
		t.Fatalf("framework get user from context: %v", err)
	}
	if sessionUser.Login != "admin@example.org" {
		t.Fatalf("expected framework session login, got %q", sessionUser.Login)
	}
	if sessionUser.UserID != "user-1" {
		t.Fatalf("expected framework session user id, got %q", sessionUser.UserID)
	}
}

func TestEnsureFrameworkDefaultPermissionsAddsLicenseInfoOnce(t *testing.T) {
	sessionUser := &frameworksecurity.UserSessionInfo{
		UserAssignedPermission: frameworksecurity.NewUserAssignedPermission([]frameworksecurity.PermissionKey{
			frameworksecurity.GetSimplePermission("cluster", "unit", "read"),
			frameworksecurity.GetSimplePermission("generic", "license", "info"),
		}, nil),
	}

	EnsureFrameworkDefaultPermissions(sessionUser)
	EnsureFrameworkDefaultPermissions(sessionUser)

	if sessionUser.UserAssignedPermission == nil {
		t.Fatalf("expected user assigned permissions to be initialized")
	}
	permissions := sessionUser.UserAssignedPermission.GetPermissionKeys()
	if len(permissions) != 2 {
		t.Fatalf("expected default permissions to be added once, got %v", permissions)
	}
}
