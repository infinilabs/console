package security

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"infini.sh/framework/core/global"
)

const (
	GatewayBootstrapSecretFile   = "gateway-bootstrap.secret"
	GatewayBootstrapSecretHeader = "X-Console-Bootstrap-Secret"
)

// EnsureGatewayBootstrapSecret creates a persistent, high-entropy secret used
// only by the Gateway Docker bootstrap endpoint.
func EnsureGatewayBootstrapSecret() (string, error) {
	configDir := global.Env().GetConfigDir()
	if strings.TrimSpace(configDir) == "" {
		return "", fmt.Errorf("Console config directory is empty")
	}
	if err := os.MkdirAll(configDir, 0o750); err != nil {
		return "", fmt.Errorf("create Console config directory: %w", err)
	}
	return ensureGatewayBootstrapSecretFile(filepath.Join(configDir, GatewayBootstrapSecretFile))
}

func ValidateGatewayBootstrapSecret(candidate string) bool {
	if candidate == "" {
		return false
	}
	configDir := global.Env().GetConfigDir()
	if strings.TrimSpace(configDir) == "" {
		return false
	}
	stored, err := os.ReadFile(filepath.Join(configDir, GatewayBootstrapSecretFile))
	if err != nil {
		return false
	}
	expected := strings.TrimSpace(string(stored))
	if expected == "" || len(expected) != len(candidate) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(expected), []byte(candidate)) == 1
}

func ensureGatewayBootstrapSecretFile(file string) (string, error) {
	if value, err := os.ReadFile(file); err == nil {
		secret := strings.TrimSpace(string(value))
		if len(secret) >= 32 {
			if err := os.Chmod(file, 0o600); err != nil {
				return "", fmt.Errorf("secure Console bootstrap secret permissions: %w", err)
			}
			return secret, nil
		}
	} else if !os.IsNotExist(err) {
		return "", fmt.Errorf("read Console bootstrap secret: %w", err)
	}

	random := make([]byte, 48)
	if _, err := rand.Read(random); err != nil {
		return "", fmt.Errorf("generate Console bootstrap secret: %w", err)
	}
	secret := base64.RawURLEncoding.EncodeToString(random)
	tmp := file + ".tmp"
	f, err := os.OpenFile(tmp, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o600)
	if err != nil {
		return "", fmt.Errorf("create Console bootstrap secret: %w", err)
	}
	if _, err = f.WriteString(secret + "\n"); err == nil {
		err = f.Sync()
	}
	closeErr := f.Close()
	if err == nil {
		err = closeErr
	}
	if err != nil {
		_ = os.Remove(tmp)
		return "", fmt.Errorf("write Console bootstrap secret: %w", err)
	}
	if err := os.Rename(tmp, file); err != nil {
		_ = os.Remove(tmp)
		return "", fmt.Errorf("persist Console bootstrap secret: %w", err)
	}
	return secret, nil
}
