package config

import (
	"os"
	"path/filepath"
	"strings"
)

func EnsureSelfHostedPackageDirs(basePath string) error {
	basePath, err := ResolveSelfHostedPackageBasePath(basePath)
	if err != nil {
		return err
	}
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

func ResolveSelfHostedPackageBasePath(basePath string) (string, error) {
	basePath = strings.TrimSpace(basePath)
	if basePath == "" || filepath.IsAbs(basePath) {
		return basePath, nil
	}

	executablePath, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Join(filepath.Dir(executablePath), basePath), nil
}
