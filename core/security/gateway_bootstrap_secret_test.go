package security

import (
	"os"
	"path/filepath"
	"testing"
)

func TestEnsureGatewayBootstrapSecretPersistsSecurely(t *testing.T) {
	file := filepath.Join(t.TempDir(), GatewayBootstrapSecretFile)
	first, err := ensureGatewayBootstrapSecretFile(file)
	if err != nil {
		t.Fatal(err)
	}
	second, err := ensureGatewayBootstrapSecretFile(file)
	if err != nil {
		t.Fatal(err)
	}
	if first != second {
		t.Fatal("expected bootstrap secret to remain stable")
	}
	info, err := os.Stat(file)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("expected 0600 permissions, got %o", info.Mode().Perm())
	}
}
