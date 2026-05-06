package task

import "testing"

func TestResolveSetupTemplateSettingsUsesProvidedValues(t *testing.T) {
	request := &SetupRequest{
		PrimaryShards:      3,
		AutoExpandReplicas: "0-2",
	}

	primaryShards, autoExpandReplicas, err := resolveSetupTemplateSettings(nil, request)
	if err != nil {
		t.Fatalf("resolveSetupTemplateSettings returned error: %v", err)
	}
	if primaryShards != 3 {
		t.Fatalf("expected primary shards 3, got %d", primaryShards)
	}
	if autoExpandReplicas != "0-2" {
		t.Fatalf("expected auto expand replicas 0-2, got %s", autoExpandReplicas)
	}
}

func TestResolveSetupTemplateSettingsUsesDefaultAutoExpandReplicas(t *testing.T) {
	request := &SetupRequest{
		PrimaryShards: 2,
	}

	_, autoExpandReplicas, err := resolveSetupTemplateSettings(nil, request)
	if err != nil {
		t.Fatalf("resolveSetupTemplateSettings returned error: %v", err)
	}
	if autoExpandReplicas != defaultSetupAutoExpandReplicas {
		t.Fatalf("expected default auto expand replicas %s, got %s", defaultSetupAutoExpandReplicas, autoExpandReplicas)
	}
}

func TestResolveSetupTemplateSettingsRejectsInvalidAutoExpandReplicas(t *testing.T) {
	request := &SetupRequest{
		PrimaryShards:      1,
		AutoExpandReplicas: "bad-value",
	}

	if _, _, err := resolveSetupTemplateSettings(nil, request); err == nil {
		t.Fatal("expected invalid auto expand replicas to return an error")
	}
}
