package api

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	config2 "infini.sh/framework/core/config"
	"infini.sh/framework/core/util"
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
	if !strings.Contains(content, `CLUSTER_ENDPOINT: "https://192.168.3.8:9200"`) {
		t.Fatalf("expected endpoint string to be quoted safely, got: %s", content)
	}
}

func TestTaskConfigTemplateRendersEndpointArrayForLegacyAgent(t *testing.T) {
	templatePath := filepath.Join("..", "..", "..", "config", "setup", "common", "data", "task_config_tpl.dat")
	if _, err := os.Stat(templatePath); err != nil {
		t.Fatalf("failed to stat task template: %v", err)
	}

	cfg, err := config2.NewConfigWithTemplate(config2.ConfigTemplate{
		Path: templatePath,
		Variable: util.MapStr{
			"TASK_ID":                     "cluster-1_node-1",
			"CLUSTER_ID":                  "cluster-1",
			"CLUSTER_NAME":                "Cluster 1",
			"CLUSTER_UUID":                "uuid:cluster",
			"NODE_UUID":                   "node:uuid",
			"CLUSTER_VERSION":             "8.13.4",
			"CLUSTER_DISTRIBUTION":        "easysearch",
			"CLUSTER_ENDPOINT":            "http://192.168.3.8:9200",
			"CLUSTER_USERNAME":            "agent-user",
			"CLUSTER_PASSWORD":            "$[[keystore.cluster-1_password]]",
			"CLUSTER_LEVEL_TASKS_ENABLED": false,
			"NODE_LEVEL_TASKS_ENABLED":    true,
			"NODE_LOGS_PATH":              "/var/log/elasticsearch",
		},
	})
	if err != nil {
		t.Fatalf("expected task template to render, got %v", err)
	}

	var parsed struct {
		Elasticsearch []struct {
			Endpoints []string `config:"endpoints"`
		} `config:"elasticsearch"`
	}
	if err := cfg.Unpack(&parsed); err != nil {
		t.Fatalf("expected rendered task config to unpack, got %v", err)
	}
	if len(parsed.Elasticsearch) != 1 || len(parsed.Elasticsearch[0].Endpoints) != 1 || parsed.Elasticsearch[0].Endpoints[0] != "http://192.168.3.8:9200" {
		t.Fatalf("expected single endpoint array, got %#v", parsed.Elasticsearch)
	}
}
