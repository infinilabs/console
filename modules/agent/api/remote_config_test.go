package api

import (
	"strings"
	"testing"

	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
)

func TestRewriteLegacyAgentConfigContent(t *testing.T) {
	global.Register(elastic.GlobalSystemElasticsearchID, "system")
	cfg := elastic.ElasticsearchConfig{
		Distribution: elastic.Easysearch,
	}
	cfg.ID = "system"
	elastic.UpdateConfig(cfg)

	instance := model.Instance{}
	instance.Application.Name = "agent"

	got := rewriteLegacyAgentConfigContent(instance, "password: $[[SETUP_AGENT_PASSWORD]]")

	if !strings.Contains(got, "$[[keystore."+systemClusterIngestPasswordKey+"]]") {
		t.Fatalf("expected legacy placeholder to be rewritten, got %q", got)
	}
}

func TestRewriteLegacyAgentConfigContentSkipsNonAgentInstances(t *testing.T) {
	instance := model.Instance{}
	instance.Application.Name = "console"

	content := "password: $[[SETUP_AGENT_PASSWORD]]"
	got := rewriteLegacyAgentConfigContent(instance, content)
	if got != content {
		t.Fatalf("expected content to stay unchanged, got %q", got)
	}
}
