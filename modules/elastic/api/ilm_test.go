package api

import (
	"context"
	"net/http"
	"strings"
	"testing"

	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
)

func TestPutVersionedILMPolicyUsesExistingSeqNoAndPrimaryTerm(t *testing.T) {
	requester := &mockILMRequester{
		responses: map[string]*util.Result{
			"GET http://example.com/_plugins/_ism/policies/metrics": {
				StatusCode: http.StatusOK,
				Body:       []byte(`{"_id":"metrics","_seq_no":7,"_primary_term":3,"policy":{"policy_id":"metrics"}}`),
			},
			"PUT http://example.com/_plugins/_ism/policies/metrics?if_seq_no=7&if_primary_term=3": {
				StatusCode: http.StatusOK,
				Body:       []byte(`{"_id":"metrics","_seq_no":8,"_primary_term":3}`),
			},
		},
	}

	err := putVersionedILMPolicy(
		requester,
		&elastic.ElasticsearchConfig{Endpoint: "http://example.com"},
		"/_plugins/_ism/policies/metrics",
		[]byte(`{"policy":{"policy_id":"metrics"}}`),
	)
	if err != nil {
		t.Fatalf("putVersionedILMPolicy returned error: %v", err)
	}

	if len(requester.calls) != 2 {
		t.Fatalf("expected 2 requests, got %#v", requester.calls)
	}
	if requester.calls[1] != "PUT http://example.com/_plugins/_ism/policies/metrics?if_seq_no=7&if_primary_term=3" {
		t.Fatalf("expected versioned put request, got %s", requester.calls[1])
	}
}

func TestPutVersionedILMPolicyCreatesWhenPolicyMissing(t *testing.T) {
	requester := &mockILMRequester{
		responses: map[string]*util.Result{
			"GET http://example.com/_plugins/_ism/policies/metrics": {
				StatusCode: http.StatusNotFound,
				Body:       []byte(`{"error":"not found"}`),
			},
			"PUT http://example.com/_plugins/_ism/policies/metrics": {
				StatusCode: http.StatusCreated,
				Body:       []byte(`{"_id":"metrics","_seq_no":1,"_primary_term":1}`),
			},
		},
	}

	err := putVersionedILMPolicy(
		requester,
		&elastic.ElasticsearchConfig{Endpoint: "http://example.com"},
		"/_plugins/_ism/policies/metrics",
		[]byte(`{"policy":{"policy_id":"metrics"}}`),
	)
	if err != nil {
		t.Fatalf("putVersionedILMPolicy returned error: %v", err)
	}

	if len(requester.calls) != 2 {
		t.Fatalf("expected 2 requests, got %#v", requester.calls)
	}
	if requester.calls[1] != "PUT http://example.com/_plugins/_ism/policies/metrics" {
		t.Fatalf("expected create put request without version params, got %s", requester.calls[1])
	}
}

func TestSanitizeILMPolicyForTargetRemovesWaitForSnapshotWhenSLMMissing(t *testing.T) {
	requester := &mockILMRequester{
		responses: map[string]*util.Result{
			"GET http://example.com/_slm/policy/daily-backup": {
				StatusCode: http.StatusNotFound,
				Body:       []byte(`{"error":"not found"}`),
			},
		},
	}

	body, err := sanitizeILMPolicyForTarget(
		requester,
		&elastic.ElasticsearchConfig{Endpoint: "http://example.com", Distribution: elastic.Elasticsearch, Version: "8.13.0"},
		[]byte(`{"policy":{"phases":{"delete":{"min_age":"90d","actions":{"delete":{"delete_searchable_snapshot":true},"wait_for_snapshot":{"policy":"daily-backup"}}}}}}`),
	)
	if err != nil {
		t.Fatalf("sanitizeILMPolicyForTarget returned error: %v", err)
	}

	output := string(body)
	if strings.Contains(output, "wait_for_snapshot") {
		t.Fatalf("expected wait_for_snapshot to be removed, got %s", output)
	}
	if !strings.Contains(output, "delete_searchable_snapshot") {
		t.Fatalf("expected delete_searchable_snapshot to be preserved, got %s", output)
	}
}

func TestSanitizeILMPolicyForTargetPreservesWaitForSnapshotWhenSLMExists(t *testing.T) {
	requester := &mockILMRequester{
		responses: map[string]*util.Result{
			"GET http://example.com/_slm/policy/daily-backup": {
				StatusCode: http.StatusOK,
				Body:       []byte(`{"policies":{"daily-backup":{"version":1}}}`),
			},
		},
	}

	body, err := sanitizeILMPolicyForTarget(
		requester,
		&elastic.ElasticsearchConfig{Endpoint: "http://example.com", Distribution: elastic.Elasticsearch, Version: "8.13.0"},
		[]byte(`{"policy":{"phases":{"delete":{"min_age":"90d","actions":{"wait_for_snapshot":{"policy":"daily-backup"}}}}}}`),
	)
	if err != nil {
		t.Fatalf("sanitizeILMPolicyForTarget returned error: %v", err)
	}

	if !strings.Contains(string(body), "wait_for_snapshot") {
		t.Fatalf("expected wait_for_snapshot to be preserved, got %s", string(body))
	}
}

func TestSanitizeILMPolicyForTargetRemovesWaitForSnapshotBeforeEightOne(t *testing.T) {
	body, err := sanitizeILMPolicyForTarget(
		&mockILMRequester{},
		&elastic.ElasticsearchConfig{Endpoint: "http://example.com", Distribution: elastic.Elasticsearch, Version: "8.0.0"},
		[]byte(`{"policy":{"phases":{"delete":{"actions":{"wait_for_snapshot":{"policy":"daily-backup"}}}}}}`),
	)
	if err != nil {
		t.Fatalf("sanitizeILMPolicyForTarget returned error: %v", err)
	}

	if strings.Contains(string(body), "wait_for_snapshot") {
		t.Fatalf("expected wait_for_snapshot to be removed before 8.1, got %s", string(body))
	}
}

func TestSanitizeILMPolicyForTargetRemovesDeleteSearchableSnapshotBeforeEightThirteen(t *testing.T) {
	body, err := sanitizeILMPolicyForTarget(
		&mockILMRequester{},
		&elastic.ElasticsearchConfig{Endpoint: "http://example.com", Distribution: elastic.Elasticsearch, Version: "8.12.0"},
		[]byte(`{"policy":{"phases":{"delete":{"actions":{"delete":{"delete_searchable_snapshot":true}}}}}}`),
	)
	if err != nil {
		t.Fatalf("sanitizeILMPolicyForTarget returned error: %v", err)
	}

	if strings.Contains(string(body), "delete_searchable_snapshot") {
		t.Fatalf("expected delete_searchable_snapshot to be removed before 8.13, got %s", string(body))
	}
}

func TestSanitizeILMPolicyForTargetRemovesWaitForSnapshotForOpensearch(t *testing.T) {
	body, err := sanitizeILMPolicyForTarget(
		&mockILMRequester{},
		&elastic.ElasticsearchConfig{Endpoint: "http://example.com", Distribution: elastic.Opensearch},
		[]byte(`{"policy":{"states":[{"name":"delete","actions":[{"wait_for_snapshot":{"policy":"daily-backup"}},{"delete":{}}]}]}}`),
	)
	if err != nil {
		t.Fatalf("sanitizeILMPolicyForTarget returned error: %v", err)
	}

	if strings.Contains(string(body), "wait_for_snapshot") {
		t.Fatalf("expected wait_for_snapshot to be removed for opensearch payload, got %s", string(body))
	}
	if strings.Contains(string(body), "delete_searchable_snapshot") {
		t.Fatalf("expected delete_searchable_snapshot to be removed for opensearch payload, got %s", string(body))
	}
}

type mockILMRequester struct {
	responses map[string]*util.Result
	calls     []string
}

func (m *mockILMRequester) Request(_ context.Context, method, requestURL string, _ []byte) (*util.Result, error) {
	key := method + " " + requestURL
	m.calls = append(m.calls, key)
	if response, ok := m.responses[key]; ok {
		return response, nil
	}
	return &util.Result{
		StatusCode: http.StatusNotFound,
		Body:       []byte(`{"error":"not found"}`),
	}, nil
}
