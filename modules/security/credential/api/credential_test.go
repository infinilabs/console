package api

import (
	"testing"

	agent_common "infini.sh/console/modules/agent/common"
	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/util"
)

func TestCredentialNameConflictIgnoresExcludedID(t *testing.T) {
	items := []credential.Credential{
		{Name: "shared-name"},
	}
	items[0].ID = "cred-1"

	if hasCredentialNameConflict(items, "cred-1") {
		t.Fatalf("expected excluded credential id to be ignored")
	}
}

func TestCredentialNameConflictDetectsDifferentID(t *testing.T) {
	items := []credential.Credential{
		{Name: "shared-name"},
	}
	items[0].ID = "cred-2"

	if !hasCredentialNameConflict(items, "cred-1") {
		t.Fatalf("expected different credential id to be treated as conflict")
	}
}

func TestValidateCredentialUpdateRejectsTypeChange(t *testing.T) {
	current := &credential.Credential{Type: credential.BasicAuth}
	next := &credential.Credential{Type: credential.Token}

	if err := validateCredentialUpdate(current, next); err == nil {
		t.Fatalf("expected credential type change to be rejected")
	}
}

func TestValidateCredentialUpdateAllowsSameType(t *testing.T) {
	current := &credential.Credential{Type: credential.BasicAuth}
	next := &credential.Credential{Type: credential.BasicAuth}

	if err := validateCredentialUpdate(current, next); err != nil {
		t.Fatalf("expected same credential type to be allowed, got %v", err)
	}
}

func TestBuildManagedPendingCredentialExclusion(t *testing.T) {
	clause := buildManagedPendingCredentialExclusion()
	boolClause, ok := clause["bool"].(util.MapStr)
	if !ok {
		t.Fatalf("expected bool clause, got %#v", clause["bool"])
	}
	mustQ, ok := boolClause["must"].([]interface{})
	if !ok {
		t.Fatalf("expected must clause, got %#v", boolClause["must"])
	}
	if len(mustQ) != len(agent_common.BuildPendingManagerCredentialTags()) {
		t.Fatalf("expected %d term clauses, got %d", len(agent_common.BuildPendingManagerCredentialTags()), len(mustQ))
	}
}

func TestBuildCredentialSearchQueryDSLExcludesPendingManagerCredentials(t *testing.T) {
	queryDSL := buildCredentialSearchQueryDSL("agent", 10, 5)
	query, ok := queryDSL["query"].(util.MapStr)
	if !ok {
		t.Fatalf("expected query clause, got %#v", queryDSL["query"])
	}
	boolQuery, ok := query["bool"].(util.MapStr)
	if !ok {
		t.Fatalf("expected bool query, got %#v", query["bool"])
	}
	if _, ok := boolQuery["must"]; !ok {
		t.Fatalf("expected keyword clause to be preserved")
	}
	mustNotQ, ok := boolQuery["must_not"].([]interface{})
	if !ok || len(mustNotQ) != 1 {
		t.Fatalf("expected single must_not clause, got %#v", boolQuery["must_not"])
	}
}
