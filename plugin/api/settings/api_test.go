package settings

import (
	"context"
	"net/http"
	"strings"
	"testing"

	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
)

func TestSetILMRetentionDays(t *testing.T) {
	policy := map[string]interface{}{
		"phases": map[string]interface{}{
			"hot": map[string]interface{}{
				"actions": map[string]interface{}{
					"rollover": map[string]interface{}{
						"max_age":  "30d",
						"max_size": "50gb",
					},
				},
			},
			"delete": map[string]interface{}{
				"min_age": "30d",
			},
		},
	}

	if err := setILMRetentionDays(policy, 90); err != nil {
		t.Fatalf("setILMRetentionDays returned error: %v", err)
	}

	days, err := getILMRetentionDays(policy)
	if err != nil {
		t.Fatalf("getILMRetentionDays returned error: %v", err)
	}
	if days != 90 {
		t.Fatalf("expected 90 retention days, got %d", days)
	}
}

func TestNormalizeRetentionSize(t *testing.T) {
	size, err := normalizeRetentionSize("50 GB")
	if err != nil {
		t.Fatalf("normalizeRetentionSize returned error: %v", err)
	}
	if size != "50gb" {
		t.Fatalf("expected normalized size 50gb, got %s", size)
	}
}

func TestRenderSetupDataTemplateContentSupportsNestedPlaceholders(t *testing.T) {
	content := `password: "$[[keystore.$[[SETUP_AGENT_PASSWORD_KEY]]]]"` + "\n" + `hosts: $[[SETUP_HOSTS]]`
	rendered, err := renderSetupDataTemplateContent(content, map[string]string{
		"SETUP_AGENT_PASSWORD_KEY": "SYSTEM_CLUSTER_INGEST_PASSWORD",
		"SETUP_HOSTS":              `["192.168.3.8:9200"]`,
	})
	if err != nil {
		t.Fatalf("renderSetupDataTemplateContent returned error: %v", err)
	}
	if !strings.Contains(rendered, `password: "$[[keystore.SYSTEM_CLUSTER_INGEST_PASSWORD]]"`) {
		t.Fatalf("expected nested password placeholder to be resolved, got %s", rendered)
	}
	if !strings.Contains(rendered, `hosts: ["192.168.3.8:9200"]`) {
		t.Fatalf("expected hosts array to be rendered, got %s", rendered)
	}
}

func TestResolveSystemClusterEndpointsAndHosts(t *testing.T) {
	cfg := &elastic.ElasticsearchConfig{
		Endpoints: []string{"https://192.168.3.8:9200", "https://192.168.3.9:9200"},
	}
	schema, endpoints, hosts, err := resolveSystemClusterEndpointsAndHosts(cfg)
	if err != nil {
		t.Fatalf("resolveSystemClusterEndpointsAndHosts returned error: %v", err)
	}
	if schema != "https" {
		t.Fatalf("expected https schema, got %s", schema)
	}
	if len(endpoints) != 2 || endpoints[0] != "https://192.168.3.8:9200" || endpoints[1] != "https://192.168.3.9:9200" {
		t.Fatalf("unexpected endpoints %#v", endpoints)
	}
	if len(hosts) != 2 || hosts[0] != "192.168.3.8:9200" || hosts[1] != "192.168.3.9:9200" {
		t.Fatalf("unexpected hosts %#v", hosts)
	}
}

func TestSetILMRetentionDaysFromStates(t *testing.T) {
	policy := map[string]interface{}{
		"states": []interface{}{
			map[string]interface{}{
				"name": "hot",
				"actions": []interface{}{
					map[string]interface{}{
						"rollover": map[string]interface{}{
							"min_index_age": "30d",
						},
					},
				},
				"transitions": []interface{}{
					map[string]interface{}{
						"state_name": "delete",
						"conditions": map[string]interface{}{
							"min_index_age": "30d",
						},
					},
				},
			},
		},
	}

	if err := setILMRetentionDays(policy, 7); err != nil {
		t.Fatalf("setILMRetentionDays returned error for states payload: %v", err)
	}

	days, err := getILMRetentionDays(policy)
	if err != nil {
		t.Fatalf("getILMRetentionDays returned error for states payload: %v", err)
	}
	if days != 7 {
		t.Fatalf("expected 7 retention days, got %d", days)
	}
}

func TestSetILMRetentionMaxSize(t *testing.T) {
	policy := map[string]interface{}{
		"phases": map[string]interface{}{
			"hot": map[string]interface{}{
				"actions": map[string]interface{}{
					"rollover": map[string]interface{}{
						"max_age":  "30d",
						"max_size": "50gb",
					},
				},
			},
			"delete": map[string]interface{}{
				"min_age": "30d",
			},
		},
	}

	if err := setILMRetentionMaxSize(policy, "80 GB"); err != nil {
		t.Fatalf("setILMRetentionMaxSize returned error: %v", err)
	}

	size, err := getILMRetentionMaxSize(policy)
	if err != nil {
		t.Fatalf("getILMRetentionMaxSize returned error: %v", err)
	}
	if size != "80gb" {
		t.Fatalf("expected 80gb retention size, got %s", size)
	}
}

func TestNormalizeILMPolicyForPutFromStates(t *testing.T) {
	policy := map[string]interface{}{
		"states": []interface{}{
			map[string]interface{}{
				"name": "hot",
				"actions": []interface{}{
					map[string]interface{}{
						"retry": map[string]interface{}{
							"count":   3,
							"backoff": "exponential",
							"delay":   "1m",
						},
						"rollover": map[string]interface{}{
							"min_index_age": "30d",
							"min_size":      "50gb",
							"min_doc_count": 100000000,
						},
					},
					map[string]interface{}{
						"retry": map[string]interface{}{
							"count":   3,
							"backoff": "exponential",
							"delay":   "1m",
						},
						"index_priority": map[string]interface{}{
							"priority": 100,
						},
					},
				},
				"transitions": []interface{}{
					map[string]interface{}{
						"state_name": "delete",
						"conditions": map[string]interface{}{
							"min_index_age": "30d",
						},
					},
				},
			},
			map[string]interface{}{
				"name": "delete",
				"actions": []interface{}{
					map[string]interface{}{
						"delete": nil,
					},
				},
			},
		},
	}

	if err := setILMRetentionDays(policy, 7); err != nil {
		t.Fatalf("setILMRetentionDays returned error for states payload: %v", err)
	}

	normalized, err := normalizeILMPolicyForPut(policy)
	if err != nil {
		t.Fatalf("normalizeILMPolicyForPut returned error: %v", err)
	}

	phases := normalized["phases"].(map[string]interface{})
	hotPhase := phases["hot"].(map[string]interface{})
	if got := hotPhase["min_age"]; got != "0ms" {
		t.Fatalf("expected hot min_age 0ms, got %v", got)
	}
	hotActions := hotPhase["actions"].(map[string]interface{})
	rollover := hotActions["rollover"].(map[string]interface{})
	if got := rollover["max_age"]; got != "7d" {
		t.Fatalf("expected rollover max_age 7d, got %v", got)
	}
	if got := rollover["max_size"]; got != "50gb" {
		t.Fatalf("expected rollover max_size 50gb, got %v", got)
	}
	if got := rollover["max_docs"]; got != 100000000 {
		t.Fatalf("expected rollover max_docs 100000000, got %v", got)
	}
	if _, exists := rollover["min_index_age"]; exists {
		t.Fatalf("expected rollover min_index_age to be removed, got %#v", rollover)
	}
	if _, exists := rollover["min_size"]; exists {
		t.Fatalf("expected rollover min_size to be removed, got %#v", rollover)
	}
	if _, exists := rollover["min_doc_count"]; exists {
		t.Fatalf("expected rollover min_doc_count to be removed, got %#v", rollover)
	}
	if _, exists := hotActions["retry"]; exists {
		t.Fatalf("expected retry metadata to be stripped from ILM actions, got %#v", hotActions)
	}

	setPriority := hotActions["set_priority"].(map[string]interface{})
	if got := setPriority["priority"]; got != 100 {
		t.Fatalf("expected set_priority priority 100, got %v", got)
	}

	deletePhase := phases["delete"].(map[string]interface{})
	if got := deletePhase["min_age"]; got != "7d" {
		t.Fatalf("expected delete min_age 7d, got %v", got)
	}
	deleteActions := deletePhase["actions"].(map[string]interface{})
	if got := deleteActions["delete"]; got == nil {
		t.Fatalf("expected delete action payload to be an object, got nil")
	}
	if deletePayload, ok := deleteActions["delete"].(map[string]interface{}); !ok || len(deletePayload) != 0 {
		t.Fatalf("expected empty delete action payload, got %#v", deleteActions["delete"])
	}
}

func TestSetISMRetentionDays(t *testing.T) {
	policy := map[string]interface{}{
		"states": []interface{}{
			map[string]interface{}{
				"name": "hot",
				"actions": []interface{}{
					map[string]interface{}{
						"rollover": map[string]interface{}{
							"min_index_age": "30d",
							"min_size":      "50gb",
						},
					},
				},
				"transitions": []interface{}{
					map[string]interface{}{
						"state_name": "delete",
						"conditions": map[string]interface{}{
							"min_index_age": "30d",
						},
					},
				},
			},
		},
	}

	if err := setISMRetentionDays(policy, 60); err != nil {
		t.Fatalf("setISMRetentionDays returned error: %v", err)
	}

	days, err := getISMRetentionDays(policy)
	if err != nil {
		t.Fatalf("getISMRetentionDays returned error: %v", err)
	}
	if days != 60 {
		t.Fatalf("expected 60 retention days, got %d", days)
	}
}

func TestSetISMRetentionMaxSize(t *testing.T) {
	policy := map[string]interface{}{
		"states": []interface{}{
			map[string]interface{}{
				"name": "hot",
				"actions": []interface{}{
					map[string]interface{}{
						"rollover": map[string]interface{}{
							"min_index_age": "30d",
							"min_size":      "50gb",
						},
					},
				},
			},
		},
	}

	if err := setISMRetentionMaxSize(policy, "120g"); err != nil {
		t.Fatalf("setISMRetentionMaxSize returned error: %v", err)
	}

	size, err := getISMRetentionMaxSize(policy)
	if err != nil {
		t.Fatalf("getISMRetentionMaxSize returned error: %v", err)
	}
	if size != "120gb" {
		t.Fatalf("expected 120gb retention size, got %s", size)
	}
}

func TestGetManagedRollupJobIDs(t *testing.T) {
	jobIDs := getManagedRollupJobIDs(map[string]interface{}{
		"jobs": []interface{}{
			map[string]interface{}{
				"config": map[string]interface{}{
					"id": "rollup_node_stats",
				},
			},
			map[string]interface{}{
				"config": map[string]interface{}{
					"id": "custom_job",
				},
			},
			map[string]interface{}{
				"config": map[string]interface{}{
					"id": " rollup_cluster_stats ",
				},
			},
		},
	})
	if len(jobIDs) != 2 {
		t.Fatalf("expected 2 managed rollup jobs, got %#v", jobIDs)
	}
	if jobIDs[0] != "rollup_node_stats" || jobIDs[1] != "rollup_cluster_stats" {
		t.Fatalf("unexpected managed rollup job ids %#v", jobIDs)
	}
}

func TestUpdateRollupJobsStopsManagedJobsIndividually(t *testing.T) {
	requester := &mockRawRequester{
		responses: map[string]*util.Result{
			"GET http://example.com/_rollup/jobs": {
				StatusCode: http.StatusOK,
				Body: []byte(`{"jobs":[
					{"config":{"id":"rollup_node_stats"}},
					{"config":{"id":"custom_job"}},
					{"config":{"id":"rollup_cluster_health"}}
				]}`),
			},
			"POST http://example.com/_rollup/jobs/rollup_node_stats/_stop": {
				StatusCode: http.StatusOK,
				Body:       []byte(`{"stopped":true}`),
			},
			"POST http://example.com/_rollup/jobs/rollup_cluster_health/_stop": {
				StatusCode: http.StatusOK,
				Body:       []byte(`{"stopped":true}`),
			},
		},
	}

	if err := updateRollupJobs(requester, &elastic.ElasticsearchConfig{Endpoint: "http://example.com"}, "stop"); err != nil {
		t.Fatalf("updateRollupJobs returned error: %v", err)
	}

	if len(requester.calls) != 3 {
		t.Fatalf("expected 3 requests, got %#v", requester.calls)
	}
	if requester.calls[0] != "GET http://example.com/_rollup/jobs" {
		t.Fatalf("expected rollup jobs list request first, got %s", requester.calls[0])
	}
	if strings.Contains(strings.Join(requester.calls, "\n"), "custom_job") {
		t.Fatalf("expected custom job to be skipped, got %#v", requester.calls)
	}
}

type mockRawRequester struct {
	responses map[string]*util.Result
	calls     []string
}

func (m *mockRawRequester) Request(_ context.Context, method, requestURL string, _ []byte) (*util.Result, error) {
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

func TestSetRollupILMRetentionDaysFromStates(t *testing.T) {
	policy := map[string]interface{}{
		"states": []interface{}{
			map[string]interface{}{
				"name": "hot",
				"transitions": []interface{}{
					map[string]interface{}{
						"state_name": "delete",
						"conditions": map[string]interface{}{
							"min_index_age": "30d",
						},
					},
				},
			},
			map[string]interface{}{
				"name": "delete",
				"actions": []interface{}{
					map[string]interface{}{
						"delete": map[string]interface{}{
							"min_data_age": "30d",
						},
					},
				},
			},
		},
	}

	if err := setRollupILMRetentionDays(policy, 7); err != nil {
		t.Fatalf("setRollupILMRetentionDays returned error for states payload: %v", err)
	}

	states := policy["states"].([]interface{})
	hotState := states[0].(map[string]interface{})
	transition := hotState["transitions"].([]interface{})[0].(map[string]interface{})
	if got := transition["conditions"].(map[string]interface{})["min_index_age"]; got != "7d" {
		t.Fatalf("expected transition min_index_age 7d, got %v", got)
	}

	deleteState := states[1].(map[string]interface{})
	deleteAction := deleteState["actions"].([]interface{})[0].(map[string]interface{})["delete"].(map[string]interface{})
	if got := deleteAction["min_data_age"]; got != "7d" {
		t.Fatalf("expected delete min_data_age 7d, got %v", got)
	}
}

func TestNormalizeRollupILMPolicyForPutFromStates(t *testing.T) {
	policy := map[string]interface{}{
		"states": []interface{}{
			map[string]interface{}{
				"name": "hot",
				"transitions": []interface{}{
					map[string]interface{}{
						"state_name": "delete",
						"conditions": map[string]interface{}{
							"min_index_age": "30d",
						},
					},
				},
			},
			map[string]interface{}{
				"name": "delete",
				"actions": []interface{}{
					map[string]interface{}{
						"delete": map[string]interface{}{
							"timestamp_field": "timestamp.date_histogram",
							"min_data_age":    "30d",
						},
					},
				},
			},
		},
	}

	if err := setRollupILMRetentionDays(policy, 7); err != nil {
		t.Fatalf("setRollupILMRetentionDays returned error for states payload: %v", err)
	}

	normalized, err := normalizeILMPolicyForPut(policy)
	if err != nil {
		t.Fatalf("normalizeILMPolicyForPut returned error: %v", err)
	}

	phases := normalized["phases"].(map[string]interface{})
	deletePhase := phases["delete"].(map[string]interface{})
	if got := deletePhase["min_age"]; got != "7d" {
		t.Fatalf("expected delete min_age 7d, got %v", got)
	}

	deleteAction := deletePhase["actions"].(map[string]interface{})["delete"].(map[string]interface{})
	if got := deleteAction["min_data_age"]; got != "7d" {
		t.Fatalf("expected delete min_data_age 7d, got %v", got)
	}
	if got := deleteAction["timestamp_field"]; got != "timestamp.date_histogram" {
		t.Fatalf("expected timestamp_field to be preserved, got %v", got)
	}
}

func TestParseRetentionDays(t *testing.T) {
	days, err := parseRetentionDays("30d")
	if err != nil {
		t.Fatalf("parseRetentionDays returned error: %v", err)
	}
	if days != 30 {
		t.Fatalf("expected 30 retention days, got %d", days)
	}
}

func TestParseRetentionDaysFromPolicyID(t *testing.T) {
	days, err := parseRetentionDaysFromPolicyID("ilm_.infini_metrics-7days-retention")
	if err != nil {
		t.Fatalf("parseRetentionDaysFromPolicyID returned error: %v", err)
	}
	if days != 7 {
		t.Fatalf("expected 7 retention days, got %d", days)
	}
}

func TestSetRollupILMRetentionDays(t *testing.T) {
	policy := map[string]interface{}{
		"phases": map[string]interface{}{
			"hot": map[string]interface{}{
				"min_age": "0ms",
			},
			"delete": map[string]interface{}{
				"min_age": "30d",
				"actions": map[string]interface{}{
					"delete": map[string]interface{}{
						"min_data_age": "30d",
					},
				},
			},
		},
	}

	if err := setRollupILMRetentionDays(policy, 7); err != nil {
		t.Fatalf("setRollupILMRetentionDays returned error: %v", err)
	}

	deletePhase := policy["phases"].(map[string]interface{})["delete"].(map[string]interface{})
	if got := deletePhase["min_age"]; got != "7d" {
		t.Fatalf("expected delete min_age 7d, got %v", got)
	}
	deleteAction := deletePhase["actions"].(map[string]interface{})["delete"].(map[string]interface{})
	if got := deleteAction["min_data_age"]; got != "7d" {
		t.Fatalf("expected delete min_data_age 7d, got %v", got)
	}
}

func TestExtractILMPolicyByExactPolicyID(t *testing.T) {
	response := map[string]interface{}{
		"ilm_.infini_metrics-30days-retention": map[string]interface{}{
			"policy": map[string]interface{}{
				"phases": map[string]interface{}{},
			},
		},
	}

	policy, err := extractILMPolicy(response, "ilm_.infini_metrics-30days-retention")
	if err != nil {
		t.Fatalf("extractILMPolicy returned error: %v", err)
	}
	if _, ok := policy["phases"]; !ok {
		t.Fatalf("expected extracted policy phases, got %#v", policy)
	}
}

func TestExtractILMPolicyFromSingleEntryFallback(t *testing.T) {
	response := map[string]interface{}{
		"ilm_.infini_metrics-7days-retention": map[string]interface{}{
			"policy": map[string]interface{}{
				"phases": map[string]interface{}{},
			},
		},
	}

	policy, err := extractILMPolicy(response, "ilm_.infini_metrics-30days-retention")
	if err != nil {
		t.Fatalf("extractILMPolicy returned error: %v", err)
	}
	if _, ok := policy["phases"]; !ok {
		t.Fatalf("expected extracted policy phases, got %#v", policy)
	}
}

func TestExtractILMPolicyFromDirectBody(t *testing.T) {
	response := map[string]interface{}{
		"policy": map[string]interface{}{
			"phases": map[string]interface{}{},
		},
	}

	policy, err := extractILMPolicy(response, "ilm_.infini_metrics-30days-retention")
	if err != nil {
		t.Fatalf("extractILMPolicy returned error: %v", err)
	}
	if _, ok := policy["phases"]; !ok {
		t.Fatalf("expected extracted policy phases, got %#v", policy)
	}
}

func TestExtractILMPolicyConcurrencyWithoutMetadata(t *testing.T) {
	response := map[string]interface{}{
		"ilm_.infini_metrics-3days-retention": map[string]interface{}{
			"policy": map[string]interface{}{
				"phases": map[string]interface{}{},
			},
		},
	}

	seqNo, primaryTerm := extractILMPolicyConcurrency(response, "ilm_.infini_metrics-3days-retention")
	if seqNo != -1 || primaryTerm != -1 {
		t.Fatalf("expected missing concurrency metadata to return -1/-1, got %d/%d", seqNo, primaryTerm)
	}
}

func TestExtractILMPolicyConcurrencyFromWrapper(t *testing.T) {
	response := map[string]interface{}{
		"ilm_.infini_metrics-3days-retention": map[string]interface{}{
			"_seq_no":       float64(7),
			"_primary_term": float64(3),
			"policy": map[string]interface{}{
				"phases": map[string]interface{}{},
			},
		},
	}

	seqNo, primaryTerm := extractILMPolicyConcurrency(response, "ilm_.infini_metrics-3days-retention")
	if seqNo != 7 || primaryTerm != 3 {
		t.Fatalf("expected wrapper concurrency metadata 7/3, got %d/%d", seqNo, primaryTerm)
	}
}

func TestPutILMPolicySkipsConcurrencyWhenMetadataMissing(t *testing.T) {
	requester := &mockRawRequester{
		responses: map[string]*util.Result{
			"PUT http://example.com/_ilm/policy/ilm_.infini_metrics-3days-retention": {
				StatusCode: http.StatusOK,
				Body:       []byte(`{"acknowledged":true}`),
			},
		},
	}

	err := putILMPolicy(
		requester,
		&elastic.ElasticsearchConfig{Endpoint: "http://example.com"},
		"ilm_.infini_metrics-3days-retention",
		map[string]interface{}{
			"phases": map[string]interface{}{
				"hot": map[string]interface{}{
					"actions": map[string]interface{}{
						"rollover": map[string]interface{}{
							"max_age":  "3d",
							"max_size": "50gb",
						},
					},
				},
				"delete": map[string]interface{}{
					"min_age": "3d",
				},
			},
		},
		-1,
		-1,
	)
	if err != nil {
		t.Fatalf("putILMPolicy returned error: %v", err)
	}

	if len(requester.calls) != 1 {
		t.Fatalf("expected one request, got %#v", requester.calls)
	}
	if requester.calls[0] != "PUT http://example.com/_ilm/policy/ilm_.infini_metrics-3days-retention" {
		t.Fatalf("expected put without concurrency query, got %s", requester.calls[0])
	}
}
