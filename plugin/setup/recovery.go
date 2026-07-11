package task

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"
	"syscall"

	"golang.org/x/crypto/ssh/terminal"
	"infini.sh/framework/core/credential"
	coreelastic "infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/keystore"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/lib/go-ucfg"
	elasticcommon "infini.sh/framework/modules/elastic/common"
)

const systemClusterPassKey = "SYSTEM_CLUSTER_PASS"

type recoveryCommandDeps struct {
	stdin            io.Reader
	stdout           io.Writer
	readPassword     func() ([]byte, error)
	writeSecret      func(key string, value []byte) error
	systemConfigPath string
	currentUsername  func() (string, error)
	validateAccess   func(username, password string) error
	syncCredential   func(username, password string) error
}

type systemClusterRecoveryConfig struct {
	ClusterID    string
	Endpoints    []string
	Username     string
	Version      string
	Distribution string
	IndexPrefix  string
}

func newRecoveryCommandDeps() recoveryCommandDeps {
	systemConfigPath := path.Join(global.Env().GetConfigDir(), "system_config.yml")
	return recoveryCommandDeps{
		stdin:  os.Stdin,
		stdout: os.Stdout,
		readPassword: func() ([]byte, error) {
			return terminal.ReadPassword(int(syscall.Stdin))
		},
		writeSecret:      keystore.SetValue,
		systemConfigPath: systemConfigPath,
		currentUsername: func() (string, error) {
			cfg, err := loadSystemClusterRecoveryConfig(systemConfigPath)
			if err != nil {
				return "", err
			}
			return cfg.Username, nil
		},
		validateAccess: func(username, password string) error {
			cfg, err := loadSystemClusterRecoveryConfig(systemConfigPath)
			if err != nil {
				return err
			}
			return validateSystemClusterRecoveryAccess(cfg, username, password)
		},
		syncCredential: func(username, password string) error {
			cfg, err := loadSystemClusterRecoveryConfig(systemConfigPath)
			if err != nil {
				return err
			}
			return syncSystemClusterRecoveryCredential(cfg, username, password)
		},
	}
}

func RunRecoveryCmd(args []string) error {
	return runRecoveryCmd(args, newRecoveryCommandDeps())
}

func runRecoveryCmd(args []string, deps recoveryCommandDeps) error {
	if deps.stdout == nil {
		deps.stdout = os.Stdout
	}
	if deps.stdin == nil {
		deps.stdin = os.Stdin
	}
	if deps.readPassword == nil {
		deps.readPassword = func() ([]byte, error) {
			return terminal.ReadPassword(int(syscall.Stdin))
		}
	}
	if deps.writeSecret == nil {
		deps.writeSecret = keystore.SetValue
	}
	if deps.currentUsername == nil {
		deps.currentUsername = func() (string, error) {
			return "", fmt.Errorf("system cluster username resolver is not configured")
		}
	}
	if deps.validateAccess == nil {
		deps.validateAccess = func(username, password string) error {
			return nil
		}
	}
	if deps.syncCredential == nil {
		deps.syncCredential = func(username, password string) error {
			return nil
		}
	}

	recoveryFS := flag.NewFlagSet("recovery", flag.ContinueOnError)
	recoveryFS.SetOutput(deps.stdout)
	var (
		password = recoveryFS.String("pass", "", "System cluster password")
		username = recoveryFS.String("user", "", "System cluster username")
		stdin    = recoveryFS.Bool("stdin", false, "Use stdin as the password source")
	)
	recoveryFS.Usage = func() {
		fmt.Fprintln(deps.stdout, "usage : recovery [<args>]")
		fmt.Fprintln(deps.stdout, "Update local system cluster credentials so Console can recover from external password rotation.")
		fmt.Fprintln(deps.stdout)
		fmt.Fprintln(deps.stdout, "Options:")
		recoveryFS.PrintDefaults()
		fmt.Fprintln(deps.stdout)
		fmt.Fprintln(deps.stdout, "Examples:")
		fmt.Fprintln(deps.stdout, "  ./console recovery -pass new-password")
		_, _ = io.WriteString(deps.stdout, "  printf '%s' 'new-password' | ./console recovery -stdin\n")
		fmt.Fprintln(deps.stdout, "  ./console recovery -user admin -pass new-password")
	}

	if err := recoveryFS.Parse(args); err != nil {
		return err
	}
	if len(recoveryFS.Args()) > 0 {
		return fmt.Errorf("unexpected arguments: %s", strings.Join(recoveryFS.Args(), " "))
	}

	resolvedPassword, err := resolveRecoveryPassword(strings.TrimSpace(*password), *stdin, deps)
	if err != nil {
		return err
	}
	if len(resolvedPassword) == 0 {
		return fmt.Errorf("system cluster password is required")
	}
	resolvedUsername := strings.TrimSpace(*username)
	if resolvedUsername == "" {
		currentUsername, err := deps.currentUsername()
		if err != nil {
			return err
		}
		resolvedUsername = strings.TrimSpace(currentUsername)
	}
	if resolvedUsername == "" {
		return fmt.Errorf("system cluster username is required")
	}

	if err := deps.validateAccess(resolvedUsername, string(resolvedPassword)); err != nil {
		return err
	}

	if err := deps.writeSecret(systemClusterPassKey, resolvedPassword); err != nil {
		return fmt.Errorf("update system cluster password: %w", err)
	}

	trimmedUser := strings.TrimSpace(*username)
	if trimmedUser != "" {
		if err := updateSystemClusterUsernameFile(deps.systemConfigPath, trimmedUser); err != nil {
			return err
		}
	}
	if err := deps.syncCredential(resolvedUsername, string(resolvedPassword)); err != nil {
		return err
	}

	fmt.Fprintln(deps.stdout, "system cluster recovery updated successfully")
	if trimmedUser != "" {
		fmt.Fprintf(deps.stdout, "system cluster username updated in %s\n", deps.systemConfigPath)
	}
	fmt.Fprintln(deps.stdout, "restart console to apply the change")
	return nil
}

func resolveRecoveryPassword(explicitPassword string, useStdin bool, deps recoveryCommandDeps) ([]byte, error) {
	if explicitPassword != "" {
		return []byte(explicitPassword), nil
	}

	if useStdin {
		value, err := io.ReadAll(deps.stdin)
		if err != nil {
			return nil, fmt.Errorf("could not read password from stdin: %w", err)
		}
		return bytes.TrimRight(value, "\r\n"), nil
	}

	fmt.Fprint(deps.stdout, "Enter system cluster password: ")
	value, err := deps.readPassword()
	fmt.Fprintln(deps.stdout)
	if err != nil {
		return nil, fmt.Errorf("could not read password from terminal: %w", err)
	}
	return bytes.TrimSpace(value), nil
}

func updateSystemClusterUsernameFile(filePath, username string) error {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("read system config [%s]: %w", filePath, err)
	}

	updatedContent, found, err := updateSystemClusterUsernameContent(string(content), username)
	if err != nil {
		return err
	}
	if !found {
		return fmt.Errorf("CLUSTER_USER not found in system config [%s]", filePath)
	}

	if _, err := util.FilePutContent(filePath, updatedContent); err != nil {
		return fmt.Errorf("write system config [%s]: %w", filePath, err)
	}
	return nil
}

func updateSystemClusterUsernameContent(content, username string) (string, bool, error) {
	username = strings.TrimSpace(username)
	if username == "" {
		return "", false, fmt.Errorf("system cluster username is required")
	}

	lines := strings.Split(content, "\n")
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if !strings.HasPrefix(trimmed, "CLUSTER_USER:") {
			continue
		}

		idx := strings.Index(line, "CLUSTER_USER:")
		if idx < 0 {
			continue
		}

		lines[i] = line[:idx] + "CLUSTER_USER: " + strconv.Quote(username)
		return strings.Join(lines, "\n"), true, nil
	}

	return content, false, nil
}

func loadSystemClusterRecoveryConfig(filePath string) (*systemClusterRecoveryConfig, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("read system config [%s]: %w", filePath, err)
	}

	cfg := &systemClusterRecoveryConfig{
		ClusterID:   GlobalSystemElasticsearchID,
		IndexPrefix: ".infini_",
	}
	for _, line := range strings.Split(string(content), "\n") {
		trimmed := strings.TrimSpace(line)
		switch {
		case strings.HasPrefix(trimmed, "CLUSTER_ID:"):
			cfg.ClusterID = parseTemplateVariableValue(trimmed)
		case strings.HasPrefix(trimmed, "CLUSTER_ENDPOINT:"):
			raw := parseTemplateVariableValue(trimmed)

			var endpoints []string
			if err := json.Unmarshal([]byte(raw), &endpoints); err != nil {
				return nil, fmt.Errorf("parse CLUSTER_ENDPOINT failed: %w", err)
			}

			cfg.Endpoints = endpoints
		case strings.HasPrefix(trimmed, "CLUSTER_USER:"):
			cfg.Username = parseTemplateVariableValue(trimmed)
		case strings.HasPrefix(trimmed, "CLUSTER_VER:"):
			cfg.Version = parseTemplateVariableValue(trimmed)
		case strings.HasPrefix(trimmed, "CLUSTER_DISTRIBUTION:"):
			cfg.Distribution = parseTemplateVariableValue(trimmed)
		case strings.HasPrefix(trimmed, "INDEX_PREFIX:"):
			cfg.IndexPrefix = parseTemplateVariableValue(trimmed)
		}
	}

	if len(cfg.Endpoints) < 1 {
		return nil, fmt.Errorf("CLUSTER_ENDPOINT not found in system config [%s]", filePath)
	}
	return cfg, nil
}

func parseTemplateVariableValue(line string) string {
	idx := strings.Index(line, ":")
	if idx < 0 {
		return ""
	}
	value := strings.TrimSpace(line[idx+1:])
	if unquoted, err := strconv.Unquote(value); err == nil {
		return strings.TrimSpace(unquoted)
	}
	return strings.Trim(value, "\"'")
}

func validateSystemClusterRecoveryAccess(cfg *systemClusterRecoveryConfig, username, password string) error {
	client, cleanup, err := newSystemClusterRecoveryClient(cfg, username, password)
	if err != nil {
		return err
	}
	defer cleanup()

	if _, err := client.ClusterHealth(context.Background()); err != nil {
		return fmt.Errorf("validate system cluster access: %w", err)
	}
	return nil
}

func syncSystemClusterRecoveryCredential(cfg *systemClusterRecoveryConfig, username, password string) error {
	client, cleanup, err := newSystemClusterRecoveryClient(cfg, username, password)
	if err != nil {
		return err
	}
	defer cleanup()

	clusterConfig, err := loadSystemClusterDocument(client, cfg.IndexPrefix, cfg.ClusterID)
	if err != nil {
		return err
	}

	credentialDoc, err := buildUpdatedSystemClusterCredential(client, cfg.IndexPrefix, clusterConfig, username, password)
	if err != nil {
		return err
	}
	if credentialDoc != nil {
		if _, err := client.Index(cfg.IndexPrefix+"credential", "", credentialDoc.ID, credentialDoc, "wait_for"); err != nil {
			return fmt.Errorf("update system cluster credential: %w", err)
		}
		clusterConfig.CredentialID = credentialDoc.ID
		clusterConfig.BasicAuth = nil
	}
	if _, err := client.Index(cfg.IndexPrefix+"cluster", "", clusterConfig.ID, clusterConfig, "wait_for"); err != nil {
		return fmt.Errorf("update system cluster config: %w", err)
	}
	return nil
}

func newSystemClusterRecoveryClient(cfg *systemClusterRecoveryConfig, username, password string) (coreelastic.API, func(), error) {
	if cfg == nil {
		return nil, nil, fmt.Errorf("system cluster config is required")
	}

	tempID := cfg.ClusterID + "-recovery"
	tempConf := coreelastic.ElasticsearchConfig{
		ORMObjectBase: orm.ORMObjectBase{ID: tempID},
		Name:          cfg.ClusterID,
		Enabled:       true,
		Endpoints:     cfg.Endpoints,
		Version:       cfg.Version,
		Distribution:  cfg.Distribution,
		BasicAuth: &model.BasicAuth{
			Username: username,
			Password: ucfg.SecretString(password),
		},
	}
	client, err := elasticcommon.InitElasticInstanceWithoutMetadata(tempConf)
	if err != nil {
		return nil, nil, err
	}
	return client, func() {
		coreelastic.RemoveInstance(tempID)
	}, nil
}

func loadSystemClusterDocument(client coreelastic.API, indexPrefix, clusterID string) (*coreelastic.ElasticsearchConfig, error) {
	clusterConfig := &coreelastic.ElasticsearchConfig{}
	if err := loadSystemClusterSource(client, indexPrefix+"cluster", clusterID, clusterConfig); err != nil {
		return nil, err
	}
	clusterConfig.ID = clusterID
	return clusterConfig, nil
}

func buildUpdatedSystemClusterCredential(client coreelastic.API, indexPrefix string, clusterConfig *coreelastic.ElasticsearchConfig, username, password string) (*credential.Credential, error) {
	if clusterConfig == nil {
		return nil, fmt.Errorf("system cluster config is required")
	}

	cred := &credential.Credential{}
	if strings.TrimSpace(clusterConfig.CredentialID) != "" {
		if err := loadSystemClusterSource(client, indexPrefix+"credential", clusterConfig.CredentialID, cred); err != nil {
			return nil, err
		}
		cred.ID = clusterConfig.CredentialID
	} else {
		cred.ID = util.GetUUID()
		cred.Name = fmt.Sprintf("%s (Platform)", clusterConfig.Name)
		if cred.Name == " (Platform)" {
			cred.Name = "INFINI_SYSTEM (Platform)"
		}
	}

	cred.Type = credential.BasicAuth
	cred.Tags = []string{"ES"}
	cred.Invalid = false
	cred.Payload = map[string]interface{}{
		credential.BasicAuth: map[string]interface{}{
			"username": username,
			"password": password,
		},
	}
	if err := cred.Encode(); err != nil {
		return nil, fmt.Errorf("encode system cluster credential: %w", err)
	}
	return cred, nil
}

func loadSystemClusterSource(client coreelastic.API, indexName, documentID string, target interface{}) error {
	response, err := client.Get(indexName, "", documentID)
	if err != nil {
		return err
	}
	if response == nil || response.RawResult == nil {
		return fmt.Errorf("document [%s] not found in index [%s]", documentID, indexName)
	}
	if response.RawResult.StatusCode == http.StatusNotFound {
		return fmt.Errorf("document [%s] not found in index [%s]", documentID, indexName)
	}
	source, err := response.GetBytesByJsonPath("_source")
	if err != nil {
		return err
	}
	if len(source) == 0 {
		return fmt.Errorf("document [%s] not found in index [%s]", documentID, indexName)
	}
	if err := util.FromJSONBytes(source, target); err != nil {
		return err
	}
	return nil
}
