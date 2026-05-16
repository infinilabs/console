package config

import (
	"os"
	"path/filepath"
	"strings"
)

func EnsureSelfHostedPackageDirs(basePath string) error {
	basePath = strings.TrimSpace(basePath)
	if basePath == "" {
		return nil
	}

	for _, relativeDir := range []string{
		filepath.Join("agent", "stable"),
		filepath.Join("gateway", "stable"),
	} {
		if err := os.MkdirAll(filepath.Join(basePath, relativeDir), 0o755); err != nil {
			return err
		}
	}

	return nil
}
