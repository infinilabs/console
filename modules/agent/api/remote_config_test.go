package api

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	config2 "infini.sh/framework/core/config"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
)

func TestRenderAgentTaskTemplateConfigProducesValidYAML(t *testing.T) {
	content := "elasticsearch:" + renderAgentTaskElasticsearchConfig(
		"cluster-1_node-1",
		"uuid:cluster",
		"8.13.4",
		"easysearch",
		"https://192.168.3.8:9200",
		"agent-user",
		"$[[keystore.cluster-1_password]]",
	) + "\npipeline:" + renderAgentTaskPipelineConfig(
		"cluster-1_node-1",
		"cluster-1",
		"Quartz: primary #1",
		"uuid:cluster",
		false,
		true,
		[]string{`C:\Program Files\Agent\logs`},
	)

	cfg, err := config2.NewConfigWithYAML([]byte(content), "generated_metrics_tasks.yml")
	if err != nil {
		t.Fatalf("expected generated yaml to parse, got error: %v\n%s", err, content)
	}

	var parsed struct {
		Elasticsearch []struct {
			ID          string   `config:"id"`
			ClusterUUID string   `config:"cluster_uuid"`
			Monitored   bool     `config:"monitored"`
			Endpoints   []string `config:"endpoints"`
			BasicAuth   struct {
				Password string `config:"password"`
			} `config:"basic_auth"`
		} `config:"elasticsearch"`
		Pipeline []struct {
			Name      string `config:"name"`
			Processor []struct {
				NodeStats struct {
					Labels struct {
						ClusterName string `config:"cluster_name"`
					} `config:"labels"`
				} `config:"es_node_stats"`
				Logs struct {
					LogsPath string `config:"logs_path"`
				} `config:"es_logs_processor"`
			} `config:"processor"`
		} `config:"pipeline"`
	}
	if err := cfg.Unpack(&parsed); err != nil {
		t.Fatalf("expected generated yaml to unpack, got error: %v", err)
	}

	if len(parsed.Elasticsearch) != 1 {
		t.Fatalf("expected 1 elasticsearch config, got %d", len(parsed.Elasticsearch))
	}
	if got := parsed.Elasticsearch[0].ID; got != "cluster-1_node-1" {
		t.Fatalf("expected elasticsearch id to round-trip, got %#v", got)
	}
	if got := parsed.Elasticsearch[0].ClusterUUID; got != "uuid:cluster" {
		t.Fatalf("expected cluster uuid to round-trip, got %#v", got)
	}
	if !parsed.Elasticsearch[0].Monitored {
		t.Fatalf("expected generated elasticsearch config to enable monitoring")
	}
	if got := parsed.Elasticsearch[0].BasicAuth.Password; got != "$[[keystore.cluster-1_password]]" {
		t.Fatalf("expected password placeholder to round-trip, got %#v", got)
	}
	if len(parsed.Elasticsearch[0].Endpoints) != 1 || parsed.Elasticsearch[0].Endpoints[0] != "https://192.168.3.8:9200" {
		t.Fatalf("expected single endpoint array, got %#v", parsed.Elasticsearch[0].Endpoints)
	}
	if len(parsed.Pipeline) != 2 {
		t.Fatalf("expected 2 pipelines, got %d", len(parsed.Pipeline))
	}
	if got := parsed.Pipeline[0].Processor[0].NodeStats.Labels.ClusterName; got != "Quartz: primary #1" {
		t.Fatalf("expected cluster name to round-trip, got %#v", got)
	}
	if got := parsed.Pipeline[1].Processor[0].Logs.LogsPath; got != `C:\Program Files\Agent\logs` {
		t.Fatalf("expected logs path to round-trip, got %#v", got)
	}
	if !strings.Contains(content, `endpoints: ["https://192.168.3.8:9200"]`) {
		t.Fatalf("expected endpoint string to be quoted safely, got: %s", content)
	}
	if strings.Contains(content, "configs.template:") {
		t.Fatalf("expected generated config to be fully rendered, got: %s", content)
	}
}

func TestRenderAgentTaskTemplateConfigSupportsMultipleLogsPaths(t *testing.T) {
	content := "elasticsearch:" + renderAgentTaskElasticsearchConfig(
		"cluster-1_node-1",
		"uuid:cluster",
		"8.13.4",
		"easysearch",
		"https://192.168.3.8:9200",
		"agent-user",
		"$[[keystore.cluster-1_password]]",
	) + "\npipeline:" + renderAgentTaskPipelineConfig(
		"cluster-1_node-1",
		"cluster-1",
		"Quartz: primary #1",
		"uuid:cluster",
		false,
		true,
		[]string{"/infini/easysearch/logs", "/infini/easysearch/gc"},
	)

	cfg, err := config2.NewConfigWithYAML([]byte(content), "generated_metrics_tasks.yml")
	if err != nil {
		t.Fatalf("expected generated yaml to parse, got error: %v\n%s", err, content)
	}

	var parsed struct {
		Pipeline []struct {
			Processor []struct {
				Logs struct {
					LogsPath []string `config:"logs_path"`
				} `config:"es_logs_processor"`
			} `config:"processor"`
		} `config:"pipeline"`
	}
	if err := cfg.Unpack(&parsed); err != nil {
		t.Fatalf("expected generated yaml to unpack, got error: %v", err)
	}

	if len(parsed.Pipeline) != 2 {
		t.Fatalf("expected 2 pipelines, got %d", len(parsed.Pipeline))
	}
	if got := parsed.Pipeline[1].Processor[0].Logs.LogsPath; len(got) != 2 || got[0] != "/infini/easysearch/logs" || got[1] != "/infini/easysearch/gc" {
		t.Fatalf("expected logs paths to round-trip, got %#v", got)
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
			Monitored bool     `config:"monitored"`
			Endpoints []string `config:"endpoints"`
		} `config:"elasticsearch"`
	}
	if err := cfg.Unpack(&parsed); err != nil {
		t.Fatalf("expected rendered task config to unpack, got %v", err)
	}
	if len(parsed.Elasticsearch) != 1 || !parsed.Elasticsearch[0].Monitored {
		t.Fatalf("expected rendered task config to enable monitoring, got %#v", parsed.Elasticsearch)
	}
	if len(parsed.Elasticsearch) != 1 || len(parsed.Elasticsearch[0].Endpoints) != 1 || parsed.Elasticsearch[0].Endpoints[0] != "http://192.168.3.8:9200" {
		t.Fatalf("expected single endpoint array, got %#v", parsed.Elasticsearch)
	}
}

func TestShouldSkipGatewayConfigByType(t *testing.T) {
	instance := model.Instance{
		Application: env.Application{Name: "gateway"},
		Labels: map[string]string{
			"service_type": "relay",
		},
	}

	relayDoc := map[string]interface{}{
		"metadata": map[string]interface{}{
			"labels": map[string]interface{}{
				"service_type": "relay",
			},
		},
		"payload": map[string]interface{}{
			"location": "relay.yml",
		},
	}
	if shouldSkipGatewayConfigByType(instance, relayDoc) {
		t.Fatal("expected relay gateway to keep relay config")
	}

	migrationDoc := map[string]interface{}{
		"metadata": map[string]interface{}{
			"labels": map[string]interface{}{
				"service_type": "migration",
			},
		},
		"payload": map[string]interface{}{
			"location": "migration.yml",
		},
	}
	if !shouldSkipGatewayConfigByType(instance, migrationDoc) {
		t.Fatal("expected relay gateway to skip migration config")
	}
}

func TestShouldSkipGatewayConfigByTypeWithLegacyConfigDoc(t *testing.T) {
	instance := model.Instance{
		Application: env.Application{Name: "gateway"},
		Labels: map[string]string{
			"service_type": "migration",
		},
	}

	legacyRelayDoc := map[string]interface{}{
		"payload": map[string]interface{}{
			"location": "relay.yml",
		},
	}
	if !shouldSkipGatewayConfigByType(instance, legacyRelayDoc) {
		t.Fatal("expected migration gateway to skip legacy relay config")
	}

	legacyMigrationDoc := map[string]interface{}{
		"payload": map[string]interface{}{
			"location": "migration.yml",
		},
	}
	if shouldSkipGatewayConfigByType(instance, legacyMigrationDoc) {
		t.Fatal("expected migration gateway to keep legacy migration config")
	}
}
