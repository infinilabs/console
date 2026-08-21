package core

import (
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"infini.sh/console/core/security"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
)

func TestGetClusterFilterReturnsAllPrivilegeForAdministrator(t *testing.T) {
	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	global.Env().SystemConfig.WebAppConfig.Security.Enabled = true
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
	})

	originalRole, hadRole := security.RoleMap[security.RoleAdminName]
	security.RoleMap[security.RoleAdminName] = security.BuiltinRoles[security.RoleAdminName]
	t.Cleanup(func() {
		if hadRole {
			security.RoleMap[security.RoleAdminName] = originalRole
			return
		}
		delete(security.RoleMap, security.RoleAdminName)
	})

	req := newRequestWithRoles(security.RoleAdminName)

	clusterFilter, hasAllPrivilege := Handler{}.GetClusterFilter(req, "id")
	if !hasAllPrivilege {
		t.Fatalf("expected administrator to have all cluster privilege")
	}
	if clusterFilter != nil {
		t.Fatalf("expected no cluster filter for administrator, got %#v", clusterFilter)
	}
}

func TestGetClusterFilterNormalizesRestrictedClusterIDs(t *testing.T) {
	originalAuthEnabled := global.Env().SystemConfig.WebAppConfig.Security.Enabled
	global.Env().SystemConfig.WebAppConfig.Security.Enabled = true
	t.Cleanup(func() {
		global.Env().SystemConfig.WebAppConfig.Security.Enabled = originalAuthEnabled
	})

	roleName := "cluster-filter-normalization-test"
	security.RoleMap[roleName] = security.Role{
		Name: roleName,
		Privilege: security.RolePrivilege{
			Elasticsearch: security.ElasticsearchPrivilege{
				Cluster: security.ClusterPrivilege{
					Resources: []security.InnerCluster{
						{ID: " cluster-b "},
						{ID: ""},
						{ID: "cluster-a"},
						{ID: "cluster-a"},
					},
				},
			},
		},
	}
	t.Cleanup(func() {
		delete(security.RoleMap, roleName)
	})

	req := newRequestWithRoles(roleName)

	clusterFilter, hasAllPrivilege := Handler{}.GetClusterFilter(req, "id")
	if hasAllPrivilege {
		t.Fatalf("expected restricted role to require cluster filter")
	}
	expected := util.MapStr{
		"terms": util.MapStr{
			"id": []string{"cluster-a", "cluster-b"},
		},
	}
	if !reflect.DeepEqual(clusterFilter, expected) {
		t.Fatalf("expected normalized cluster filter %#v, got %#v", expected, clusterFilter)
	}
}

func TestBuildClusterFilterSkipsEmptyClusterIDs(t *testing.T) {
	clusterFilter := buildClusterFilter("id", []string{"", "  ", ""})
	if clusterFilter != nil {
		t.Fatalf("expected empty cluster IDs to produce nil filter, got %#v", clusterFilter)
	}
}

func newRequestWithRoles(roles ...string) *http.Request {
	req := httptest.NewRequest(http.MethodGet, "/_test", nil)
	return req.WithContext(security.NewUserContext(req.Context(), &security.UserClaims{
		ShortUser: &security.ShortUser{
			Username: "tester",
			Roles:    roles,
		},
	}))
}
