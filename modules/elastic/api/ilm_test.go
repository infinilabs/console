package api

import (
	"context"
	"net/http"
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
