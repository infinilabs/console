package api

import (
	"strings"
	"testing"

	config2 "infini.sh/framework/core/config"
)

func TestRenderAgentTaskTemplateConfigProducesValidYAML(t *testing.T) {
	content := "configs.template:" + renderAgentTaskTemplateConfig(
		"cluster-1_node-1",
		"cluster-1",
		"Quartz: primary #1",
		"uuid:cluster",
		"node:uuid",
		"8.13.4",
		"easysearch",
		"https://192.168.3.8:9200",
		"agent-user",
		"$[[keystore.cluster-1_password]]",
		false,
		true,
		`C:\Program Files\Agent\logs`,
	)

	cfg, err := config2.NewConfigWithYAML([]byte(content), "generated_metrics_tasks.yml")
	if err != nil {
		t.Fatalf("expected generated yaml to parse, got error: %v\n%s", err, content)
	}

	var templates config2.TemplateConfigs
	if err := cfg.Unpack(&templates); err != nil {
		t.Fatalf("expected generated yaml to unpack, got error: %v", err)
	}

	if len(templates.Templates) != 1 {
		t.Fatalf("expected 1 template, got %d", len(templates.Templates))
	}

	vars := templates.Templates[0].Variable
	if got := vars["CLUSTER_NAME"]; got != "Quartz: primary #1" {
		t.Fatalf("expected cluster name to round-trip, got %#v", got)
	}
	if got := vars["NODE_LOGS_PATH"]; got != `C:\Program Files\Agent\logs` {
		t.Fatalf("expected logs path to round-trip, got %#v", got)
	}
	if got := vars["CLUSTER_PASSWORD"]; got != "$[[keystore.cluster-1_password]]" {
		t.Fatalf("expected password placeholder to round-trip, got %#v", got)
	}
	if !strings.Contains(content, `CLUSTER_ENDPOINT: ["https://192.168.3.8:9200"]`) {
		t.Fatalf("expected endpoint array to be quoted safely, got: %s", content)
	}
}
