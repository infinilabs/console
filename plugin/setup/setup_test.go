// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

package task

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	api2 "infini.sh/framework/core/api"
	config2 "infini.sh/framework/core/config"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
)

func TestInvokeSetupCallbackRunsOnlyOnce(t *testing.T) {
	previousCallbacks := setupFinishedCallback
	previousOnce := setupCallbackOnce
	defer func() {
		setupFinishedCallback = previousCallbacks
		setupCallbackOnce = previousOnce
	}()

	setupFinishedCallback = nil
	setupCallbackOnce = sync.Once{}

	count := 0
	RegisterSetupCallback(func() {
		count++
	})
	RegisterSetupCallback(func() {
		count++
	})

	InvokeSetupCallback()
	InvokeSetupCallback()

	if count != 2 {
		t.Fatalf("expected callbacks to run once each, got %d invocations", count)
	}
}

func TestAcquireSetupInitialization(t *testing.T) {
	releaseSetupInitialization()
	defer releaseSetupInitialization()

	if !acquireSetupInitialization() {
		t.Fatal("expected first acquire to succeed")
	}
	if acquireSetupInitialization() {
		t.Fatal("expected second acquire to fail while initialization is running")
	}

	releaseSetupInitialization()

	if !acquireSetupInitialization() {
		t.Fatal("expected acquire to succeed after release")
	}
}

func TestEnsureSystemClusterBasicAuthSkipsWhenSystemClusterUnavailable(t *testing.T) {
	previous := global.Lookup(elastic.GlobalSystemElasticsearchID)
	defer global.Register(elastic.GlobalSystemElasticsearchID, previous)

	global.Register(elastic.GlobalSystemElasticsearchID, "")

	if err := EnsureSystemClusterBasicAuth(); err != nil {
		t.Fatalf("expected nil error when system cluster id is unavailable, got %v", err)
	}
}

func TestSystemIngestTemplateHostsRendersAsYAMLArray(t *testing.T) {
	content := string(mustReadSetupDataFile(t, "system_ingest_config.dat"))
	content = strings.ReplaceAll(content, "$[[SETUP_AGENT_USERNAME]]", "infini-ingest")
	content = strings.ReplaceAll(content, "$[[SETUP_AGENT_PASSWORD_KEY]]", "SYSTEM_CLUSTER_INGEST_PASSWORD")
	content = strings.ReplaceAll(content, "$[[SETUP_SCHEME]]", "http")
	content = strings.ReplaceAll(content, "$[[SETUP_HOSTS]]", `["192.168.3.8:9200"]`)
	content = strings.ReplaceAll(content, "$[[SETUP_INDEX_PREFIX]]", ".infini_")

	if _, err := config2.NewConfigWithYAML([]byte(content), "system_ingest_config.yml"); err != nil {
		t.Fatalf("expected rendered system_ingest_config to parse, got %v\n%s", err, content)
	}
	if !strings.Contains(content, `hosts: ["192.168.3.8:9200"]`) {
		t.Fatalf("expected hosts array rendering, got:\n%s", content)
	}
}

func TestTaskConfigTemplateAllowsArrayEndpointSubstitution(t *testing.T) {
	content := string(mustReadSetupDataFile(t, "task_config_tpl.dat"))
	content = strings.ReplaceAll(content, "$[[CLUSTER_ENDPOINT]]", `http://192.168.3.8:9200`)

	if _, err := config2.NewConfigWithYAML([]byte(content), "task_config.tpl"); err != nil {
		t.Fatalf("expected task_config.tpl to parse after endpoint substitution, got %v\n%s", err, content)
	}
	if !strings.Contains(content, `endpoints: ["http://192.168.3.8:9200"]`) {
		t.Fatalf("expected endpoints array rendering, got:\n%s", content)
	}
}

func TestSetupRegistersReplayNonceAPI(t *testing.T) {
	oldEnv := global.Env()
	testEnv := env.EmptyEnv()
	testEnv.SystemConfig.PathConfig.Data = t.TempDir()
	testEnv.EnableSetup(true)
	global.RegisterEnv(testEnv)
	defer global.RegisterEnv(oldEnv)

	module := &Module{}
	module.Setup()

	req := httptest.NewRequest(http.MethodPost, "https://console.local/account/replay_nonce", bytes.NewBufferString(`{"method":"POST","path":"/setup/_validate"}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	api2.ServeRegisteredAPIRequest(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, resp.Code, resp.Body.String())
	}

	var body map[string]interface{}
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	nonce, ok := body["nonce"].(string)
	if !ok || nonce == "" {
		t.Fatalf("expected nonce in response, got %#v", body)
	}
}

func TestGatewayRelayTemplateRendersAsChildConfig(t *testing.T) {
	content := renderGatewaySetupData(t, "gateway_relay.dat")

	if _, err := config2.NewConfigWithYAML([]byte(content), "relay.yml"); err != nil {
		t.Fatalf("expected rendered relay config to parse, got %v\n%s", err, content)
	}
	assertNoChildConfigGlobals(t, content)
	assertContainsAll(t, content,
		`binding: 0.0.0.0:8081`,
		`password: "$[[keystore.SYSTEM_CLUSTER_INGEST_PASSWORD]]"`,
		`queue_name_prefix: gateway_relay_async_bulk`,
		`elasticsearch: gateway_relay_system`,
		`name: gateway_relay_bulk_request_ingest`,
	)
}

func TestGatewayMigrationTemplateRendersAsChildConfig(t *testing.T) {
	content := renderGatewaySetupData(t, "gateway_migration.dat")

	if _, err := config2.NewConfigWithYAML([]byte(content), "migration.yml"); err != nil {
		t.Fatalf("expected rendered migration config to parse, got %v\n%s", err, content)
	}
	assertNoChildConfigGlobals(t, content)
	assertContainsAll(t, content,
		`binding: 0.0.0.0:8082`,
		`password: "$[[keystore.SYSTEM_CLUSTER_INGEST_PASSWORD]]"`,
		`name: logging-server`,
		`queue_name_prefix: gateway_migration_async_bulk`,
		`name: gateway_migration_async_ingest_bulk_requests`,
		`name: gateway_migration_request_logging_merge`,
	)
}

func TestAgentSetupTemplateSeedsRelayAndMigrationGatewayConfigs(t *testing.T) {
	content := string(mustReadSetupTemplateFile(t, "agent.tpl"))

	assertContainsAll(t, content,
		`"location": "relay.yml"`,
		`"name": "relay.yml"`,
		`"location": "migration.yml"`,
		`"name": "migration.yml"`,
		`"id": "gateway_migration_yml"`,
	)
	if strings.Contains(content, "agent_relay_gateway_config.yml") {
		t.Fatalf("expected old relay file name to be removed, got:\n%s", content)
	}
}

func renderGatewaySetupData(t *testing.T, name string) string {
	t.Helper()

	content := string(mustReadSetupDataFile(t, name))
	content = strings.ReplaceAll(content, "$[[SETUP_AGENT_USERNAME]]", "infini-ingest")
	content = strings.ReplaceAll(content, "$[[SETUP_AGENT_PASSWORD_KEY]]", "SYSTEM_CLUSTER_INGEST_PASSWORD")
	content = strings.ReplaceAll(content, "$[[SETUP_ENDPOINTS]]", `["https://192.168.3.185:9201"]`)
	content = strings.ReplaceAll(content, "$[[SETUP_INDEX_PREFIX]]", ".infini_")
	return content
}

func assertNoChildConfigGlobals(t *testing.T, content string) {
	t.Helper()

	for _, forbidden := range []string{
		"allow_multi_instance:",
		"path.data:",
		"path.logs:",
		"path.configs:",
		"configs.auto_reload:",
		"\napi:",
		"\nnode:",
	} {
		if strings.Contains(content, forbidden) {
			t.Fatalf("expected child config to omit %q, got:\n%s", forbidden, content)
		}
	}
}

func assertContainsAll(t *testing.T, content string, expected ...string) {
	t.Helper()

	for _, item := range expected {
		if !strings.Contains(content, item) {
			t.Fatalf("expected content to contain %q, got:\n%s", item, content)
		}
	}
}

func mustReadSetupTemplateFile(t *testing.T, name string) []byte {
	t.Helper()

	path := filepath.Join("..", "..", "config", "setup", "common", name)
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read %s: %v", name, err)
	}
	return content
}

func mustReadSetupDataFile(t *testing.T, name string) []byte {
	t.Helper()

	path := filepath.Join("..", "..", "config", "setup", "common", "data", name)
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read %s: %v", name, err)
	}
	return content
}
