package server

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/security"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/security/access_token"
)

var managedRegisterPermission = security.GetOrInitPermission("managed", "instance", "register")
var managedExchangePermission = security.GetOrInitPermission("managed", "instance", "exchange")
var managedSyncPermission = security.GetOrInitPermission("managed", "config", "sync")

var errManagedTokenInvalid = errors.New("managed token is invalid")
var errManagedTokenExpired = errors.New("managed token is expired")

func getBootstrapTokenPermissions() []security.PermissionKey {
	return []security.PermissionKey{
		managedRegisterPermission,
		managedExchangePermission,
	}
}

func getManagerTokenPermissions() []security.PermissionKey {
	return []security.PermissionKey{
		managedRegisterPermission,
		managedExchangePermission,
		managedSyncPermission,
	}
}

func newManagedTokenUser(userID string, instance *model.Instance) *security.UserSessionInfo {
	user := &security.UserSessionInfo{
		Provider: "managed_agent",
		Login:    userID,
	}
	if instance != nil && strings.TrimSpace(instance.ID) != "" {
		user.Login = instance.ID
		user.Set("instance_id", instance.ID)
		user.Set("instance_name", instance.Name)
		user.Set("endpoint", instance.Endpoint)
	}
	user.SetUserID(userID)
	return user
}

func issueManagedAPIToken(user *security.UserSessionInfo, name, typeName string, expiredAt int64, permissions []security.PermissionKey) (string, error) {
	res, err := access_token.CreateAPIToken(user, name, typeName, expiredAt, permissions)
	if err != nil {
		return "", err
	}

	token, ok := res["access_token"].(string)
	if !ok || strings.TrimSpace(token) == "" {
		return "", fmt.Errorf("failed to create managed api token")
	}
	return token, nil
}

func getManagedAPIToken(token string) (*security.AccessToken, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, errManagedTokenInvalid
	}

	record, err := access_token.GetToken(token)
	if err != nil {
		return nil, errManagedTokenInvalid
	}
	if record.ExpireIn > 0 && time.Now().After(time.Unix(record.ExpireIn, 0)) {
		return nil, errManagedTokenExpired
	}
	return record, nil
}

func getEffectiveManagedPermissions(token *security.AccessToken) []security.PermissionKey {
	if token == nil {
		return nil
	}

	permissions := token.Permissions
	if global.Env().SystemConfig.WebAppConfig.Security.Authentication.AccessToken.Native {
		// In native mode, effective permissions are limited by both the token and
		// the current owner's permissions, so revoked user permissions take effect
		// immediately for managed tokens as well.
		tokenLevel := security.ConvertPermissionKeysToHashSet(token.Permissions)

		user := security.UserSessionInfo{Provider: "native"}
		user.SetUserID(token.GetOwnerID())

		userLevel := security.ConvertPermissionKeysToHashSet(security.GetAllPermissionsForUser(&user))
		permissions = security.ConvertPermissionHashSetToKeys(security.IntersectSetsFast(tokenLevel, userLevel))
	}

	return permissions
}

func requireManagedPermissions(token *security.AccessToken, permissions ...security.PermissionKey) error {
	if len(permissions) == 0 {
		return nil
	}
	if token == nil {
		return errManagedTokenInvalid
	}

	if !util.IsSuperset(
		security.ConvertPermissionKeysToHashSet(getEffectiveManagedPermissions(token)),
		security.ConvertPermissionKeysToHashSet(permissions),
	) {
		return errManagedTokenInvalid
	}
	return nil
}

func requireManagedInstance(token *security.AccessToken, instance *model.Instance) error {
	if token == nil || instance == nil || strings.TrimSpace(instance.ID) == "" {
		return errManagedTokenInvalid
	}

	tokenInstanceID, ok := token.GetString("instance_id")
	if !ok || strings.TrimSpace(tokenInstanceID) == "" || tokenInstanceID != instance.ID {
		return errManagedTokenInvalid
	}
	return nil
}
