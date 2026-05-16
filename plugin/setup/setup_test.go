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
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	config2 "infini.sh/framework/core/config"
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

func mustReadSetupDataFile(t *testing.T, name string) []byte {
	t.Helper()

	path := filepath.Join("..", "..", "config", "setup", "common", "data", name)
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read %s: %v", name, err)
	}
	return content
}
