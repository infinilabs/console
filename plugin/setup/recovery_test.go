package task

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestUpdateSystemClusterUsernameContent(t *testing.T) {
	original := "configs.template:\n  - name: \"system\"\n    variable:\n      CLUSTER_USER: \"old-admin\"\n      CLUSTER_VER: \"8.0.0\"\n"

	updated, found, err := updateSystemClusterUsernameContent(original, "new-admin")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !found {
		t.Fatal("expected CLUSTER_USER to be found")
	}
	if !strings.Contains(updated, `CLUSTER_USER: "new-admin"`) {
		t.Fatalf("expected updated username, got:\n%s", updated)
	}
	if !strings.Contains(updated, `CLUSTER_VER: "8.0.0"`) {
		t.Fatalf("expected unrelated content to stay intact, got:\n%s", updated)
	}
}

func TestRunRecoveryCmdUpdatesPasswordAndUser(t *testing.T) {
	configDir := t.TempDir()
	systemConfigPath := filepath.Join(configDir, "system_config.yml")
	if err := os.WriteFile(systemConfigPath, []byte("configs.template:\n  - name: \"system\"\n    variable:\n      CLUSTER_USER: \"old-admin\"\n"), 0644); err != nil {
		t.Fatalf("write system config: %v", err)
	}

	var (
		storedKey        string
		storedValue      []byte
		stdout           bytes.Buffer
		validatedUser    string
		validatedPass    string
		syncedUser       string
		syncedPass       string
		currentUserCalls int
	)
	err := runRecoveryCmd([]string{"-pass", "new-password", "-user", "new-admin"}, recoveryCommandDeps{
		stdin:  strings.NewReader(""),
		stdout: &stdout,
		readPassword: func() ([]byte, error) {
			t.Fatal("unexpected password prompt")
			return nil, nil
		},
		writeSecret: func(key string, value []byte) error {
			storedKey = key
			storedValue = append([]byte(nil), value...)
			return nil
		},
		systemConfigPath: systemConfigPath,
		currentUsername: func() (string, error) {
			currentUserCalls++
			return "old-admin", nil
		},
		validateAccess: func(username, password string) error {
			validatedUser = username
			validatedPass = password
			return nil
		},
		syncCredential: func(username, password string) error {
			syncedUser = username
			syncedPass = password
			return nil
		},
	})
	if err != nil {
		t.Fatalf("run recovery command: %v", err)
	}
	if currentUserCalls != 0 {
		t.Fatalf("expected explicit user to skip current username lookup, got %d calls", currentUserCalls)
	}
	if validatedUser != "new-admin" || validatedPass != "new-password" {
		t.Fatalf("unexpected validated credential: %s / %s", validatedUser, validatedPass)
	}
	if syncedUser != "new-admin" || syncedPass != "new-password" {
		t.Fatalf("unexpected synced credential: %s / %s", syncedUser, syncedPass)
	}

	if storedKey != systemClusterPassKey {
		t.Fatalf("expected secret key %s, got %s", systemClusterPassKey, storedKey)
	}
	if string(storedValue) != "new-password" {
		t.Fatalf("expected password to be updated, got %q", string(storedValue))
	}

	content, err := os.ReadFile(systemConfigPath)
	if err != nil {
		t.Fatalf("read system config: %v", err)
	}
	if !strings.Contains(string(content), `CLUSTER_USER: "new-admin"`) {
		t.Fatalf("expected username to be updated, got:\n%s", string(content))
	}
	if !strings.Contains(stdout.String(), "restart console to apply the change") {
		t.Fatalf("expected restart hint in output, got: %s", stdout.String())
	}
}

func TestLoadSystemClusterRecoveryConfig(t *testing.T) {
	systemConfigPath := filepath.Join(t.TempDir(), "system_config.yml")
	content := `configs.template:
  - name: "system"
    variable:
      CLUSTER_ID: infini_default_system_cluster
      CLUSTER_ENDPOINT: "https://127.0.0.1:9200"
      CLUSTER_USER: "admin"
      CLUSTER_VER: "8.18.0"
      CLUSTER_DISTRIBUTION: "easysearch"
      INDEX_PREFIX: ".demo_"
`
	if err := os.WriteFile(systemConfigPath, []byte(content), 0644); err != nil {
		t.Fatalf("write system config: %v", err)
	}

	cfg, err := loadSystemClusterRecoveryConfig(systemConfigPath)
	if err != nil {
		t.Fatalf("load system config: %v", err)
	}
	if cfg.ClusterID != "infini_default_system_cluster" {
		t.Fatalf("unexpected cluster id: %s", cfg.ClusterID)
	}
	if cfg.Endpoint != "https://127.0.0.1:9200" {
		t.Fatalf("unexpected endpoint: %s", cfg.Endpoint)
	}
	if cfg.Username != "admin" {
		t.Fatalf("unexpected username: %s", cfg.Username)
	}
	if cfg.Version != "8.18.0" {
		t.Fatalf("unexpected version: %s", cfg.Version)
	}
	if cfg.Distribution != "easysearch" {
		t.Fatalf("unexpected distribution: %s", cfg.Distribution)
	}
	if cfg.IndexPrefix != ".demo_" {
		t.Fatalf("unexpected index prefix: %s", cfg.IndexPrefix)
	}
}
