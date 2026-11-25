package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolveSelfHostedPackageBasePathUsesExecutableDir(t *testing.T) {
	executablePath, err := os.Executable()
	if err != nil {
		t.Fatalf("failed to get executable path: %v", err)
	}

	got, err := ResolveSelfHostedPackageBasePath(".public")
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}

	expected := filepath.Join(filepath.Dir(executablePath), ".public")
	if got != expected {
		t.Fatalf("expected %q, got %q", expected, got)
	}
}

func TestEnsureSelfHostedPackageDirsCreatesExpectedStructure(t *testing.T) {
	baseDir := t.TempDir()
	if err := EnsureSelfHostedPackageDirs(baseDir); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}

	for _, relativeDir := range []string{
		filepath.Join("agent", "stable"),
		filepath.Join("gateway", "stable"),
	} {
		fullPath := filepath.Join(baseDir, relativeDir)
		info, err := os.Stat(fullPath)
		if err != nil {
			t.Fatalf("expected %q to exist: %v", fullPath, err)
		}
		if !info.IsDir() {
			t.Fatalf("expected %q to be a directory", fullPath)
		}
	}
}
