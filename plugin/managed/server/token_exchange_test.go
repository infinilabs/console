package server

import (
	"testing"

	"infini.sh/framework/core/model"
	"infini.sh/framework/core/security"
)

func TestRequireManagedPermissionsRejectsMissingPermission(t *testing.T) {
	token := &security.AccessToken{
		Permissions: []security.PermissionKey{managedRegisterPermission},
	}

	if err := requireManagedPermissions(token, managedSyncPermission); err == nil {
		t.Fatal("expected missing managed sync permission to be rejected")
	}
}

func TestRequireManagedInstanceRejectsMismatchedInstance(t *testing.T) {
	token := &security.AccessToken{}
	token.Set("instance_id", "instance-1")

	instance := &model.Instance{}
	instance.ID = "instance-2"
	if err := requireManagedInstance(token, instance); err == nil {
		t.Fatal("expected mismatched instance id to be rejected")
	}
}
