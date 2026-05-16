package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestEnsureSelfHostedPackageDirs(t *testing.T) {
	basePath := t.TempDir()

	if err := EnsureSelfHostedPackageDirs(basePath); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}

	for _, relativeDir := range []string{
		filepath.Join("agent", "stable"),
		filepath.Join("gateway", "stable"),
	} {
		dirPath := filepath.Join(basePath, relativeDir)
		info, err := os.Stat(dirPath)
		if err != nil {
			t.Fatalf("expected %s to exist: %v", dirPath, err)
		}
		if !info.IsDir() {
			t.Fatalf("expected %s to be a directory", dirPath)
		}
	}
}
