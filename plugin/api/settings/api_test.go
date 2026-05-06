package settings

import "testing"

func mustMap(t *testing.T, value interface{}) map[string]interface{} {
	t.Helper()
	mapped, ok := castMap(value)
	if !ok {
		t.Fatalf("expected map payload, got %T", value)
	}
	return mapped
}

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

	phases := mustMap(t, normalized["phases"])
	hotPhase := mustMap(t, phases["hot"])
	if got := hotPhase["min_age"]; got != "0ms" {
		t.Fatalf("expected hot min_age 0ms, got %v", got)
	}
	hotActions := mustMap(t, hotPhase["actions"])
	rollover := mustMap(t, hotActions["rollover"])
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

	setPriority := mustMap(t, hotActions["set_priority"])
	if got := setPriority["priority"]; got != 100 {
		t.Fatalf("expected set_priority priority 100, got %v", got)
	}

	deletePhase := mustMap(t, phases["delete"])
	if got := deletePhase["min_age"]; got != "7d" {
		t.Fatalf("expected delete min_age 7d, got %v", got)
	}
	deleteActions := mustMap(t, deletePhase["actions"])
	if got := deleteActions["delete"]; got == nil {
		t.Fatalf("expected delete action payload to be an object, got nil")
	}
	deletePayload := mustMap(t, deleteActions["delete"])
	if len(deletePayload) != 0 {
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
	hotState := mustMap(t, states[0])
	transition := mustMap(t, hotState["transitions"].([]interface{})[0])
	if got := mustMap(t, transition["conditions"])["min_index_age"]; got != "7d" {
		t.Fatalf("expected transition min_index_age 7d, got %v", got)
	}

	deleteState := mustMap(t, states[1])
	deleteAction := mustMap(t, mustMap(t, deleteState["actions"].([]interface{})[0])["delete"])
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

	phases := mustMap(t, normalized["phases"])
	deletePhase := mustMap(t, phases["delete"])
	if got := deletePhase["min_age"]; got != "7d" {
		t.Fatalf("expected delete min_age 7d, got %v", got)
	}

	deleteAction := mustMap(t, mustMap(t, deletePhase["actions"])["delete"])
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

	deletePhase := mustMap(t, mustMap(t, policy["phases"])["delete"])
	if got := deletePhase["min_age"]; got != "7d" {
		t.Fatalf("expected delete min_age 7d, got %v", got)
	}
	deleteAction := mustMap(t, mustMap(t, deletePhase["actions"])["delete"])
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
