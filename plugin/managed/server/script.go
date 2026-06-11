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

/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package server

import (
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	log "github.com/cihub/seelog"
	goversion "github.com/hashicorp/go-version"
	console_common "infini.sh/console/common"
	consoleconfig "infini.sh/console/config"
	consolecore "infini.sh/console/core"
	"infini.sh/console/core/security"
	"infini.sh/console/modules/agent/common"
	httprouter "infini.sh/framework/core/api/router"
	frameworkconfig "infini.sh/framework/core/config"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/lib/fasttemplate"
	"io"
	"net"
	"net/url"
	"os"

	"net/http"
	"path"
	"strings"
	"time"
)

type Token struct {
	CreatedAt time.Time
	UserID    string
	Product   string
}

const ExpiredIn = time.Millisecond * 1000 * 60 * 60
const getInstallScriptAPI = "/instance/_get_install_script"
const getGatewayInstallScriptAPI = "/instance/_get_gateway_install_script"
const installScriptTemplate = "install_agent.tpl"
const gatewayInstallScriptTemplate = "install_gateway.tpl"
const legacyInstallScriptTemplate = "install_legacy_agent.tpl"
const legacyInstallScriptVersion = common.LegacyAgentMaxVersion
const installProductAgent = "agent"
const installProductGateway = "gateway"
const agentPackageRelativePath = "/agent/stable"
const gatewayPackageRelativePath = "/gateway/stable"
const defaultAgentDownloadURL = "https://release.infinilabs.com/agent/stable"
const defaultGatewayDownloadURL = "https://release.infinilabs.com/gateway/stable"
const defaultAgentInstallDir = "/infini/agent"
const defaultGatewayInstallDir = "/infini/gateway"
const defaultManagedGatewayAPIUsername = "managed_gateway"
const gatewayTypeRelay = "relay"
const gatewayTypeMigration = "migration"

var refreshManagedLocalTemplatesForInstall func() ([]string, error)
var expiredTokenCache = util.NewCacheWithExpireOnAdd(ExpiredIn, 100)

func SetRefreshManagedLocalTemplatesForInstall(refresh func() ([]string, error)) {
	refreshManagedLocalTemplatesForInstall = refresh
}

type gatewayConfig struct {
	Setup *gatewaySetupConfig `config:"setup"`
}

type gatewaySetupConfig struct {
	DownloadURL     string `config:"download_url"`
	InstallDir      string `config:"install_dir"`
	Version         string `config:"version"`
	ConsoleEndpoint string `config:"console_endpoint"`
	Port            string `config:"port"`
}

type installCommandRequest struct {
	GatewayEndpoints     []string `json:"gateway_endpoints"`
	ServiceType          string   `json:"service_type"`
	EnableReverseChannel bool     `json:"enable_reverse_channel"`
	NoService            bool     `json:"no_service"`
}

func renderAgentReverseChannelEndpoints(req *http.Request, configuredEndpoints []string, enabled bool) string {
	if !enabled {
		return "[]"
	}
	if len(configuredEndpoints) == 0 {
		return `["${server}"]`
	}
	return string(util.MustToJSONBytes(resolveAgentReverseChannelEndpoints(req, configuredEndpoints)))
}

func normalizeGatewayType(gatewayType string) string {
	switch strings.ToLower(strings.TrimSpace(gatewayType)) {
	case gatewayTypeRelay:
		return gatewayTypeRelay
	case gatewayTypeMigration:
		return gatewayTypeMigration
	default:
		return gatewayTypeMigration
	}
}

func normalizeManagedServerEndpoints(endpoints []string) []string {
	if len(endpoints) == 0 {
		return nil
	}
	result := make([]string, 0, len(endpoints))
	seen := map[string]struct{}{}
	for _, endpoint := range endpoints {
		normalized := strings.TrimRight(strings.TrimSpace(endpoint), "/")
		if normalized == "" {
			continue
		}
		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}
		result = append(result, normalized)
	}
	return result
}

func listGatewayManagedEndpoints(serviceType string) ([]string, error) {
	queryDSL := util.MapStr{
		"size": 1000,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{"term": util.MapStr{"application.name": "gateway"}},
				},
			},
		},
	}
	if serviceType != "" {
		queryDSL["query"] = util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{"term": util.MapStr{"application.name": "gateway"}},
					{"term": util.MapStr{"labels.service_type": serviceType}},
				},
			},
		}
	}
	q := orm.Query{
		RawQuery: util.MustToJSONBytes(queryDSL),
	}
	instances := []model.Instance{}
	if err, _ := orm.SearchWithJSONMapper(&instances, &q); err != nil {
		return nil, err
	}
	endpoints := make([]string, 0, len(instances))
	for _, instance := range instances {
		endpoint := strings.TrimSpace(strings.TrimRight(instance.GetEndpoint(), "/"))
		if endpoint == "" {
			continue
		}
		endpoints = append(endpoints, endpoint)
	}
	return normalizeManagedServerEndpoints(endpoints), nil
}

func resolveAgentRemoteConfigServers(consoleEndpoint string, requestedGatewayEndpoints []string) []string {
	if endpoints := normalizeManagedServerEndpoints(requestedGatewayEndpoints); len(endpoints) > 0 {
		return endpoints
	}
	if relayEndpoints, err := listGatewayManagedEndpoints(gatewayTypeRelay); err == nil && len(relayEndpoints) > 0 {
		return relayEndpoints
	}
	return []string{strings.TrimRight(strings.TrimSpace(consoleEndpoint), "/")}
}

func (h *APIHandler) generateInstallCommand(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	user, err := security.FromUserContext(req.Context())
	if err != nil || user == nil {
		h.WriteError(w, "user not found", http.StatusInternalServerError)
		return
	}
	agCfg := common.GetAgentConfig()
	if agCfg == nil || agCfg.Setup == nil {
		h.WriteError(w, "agent setup config was not found, please configure in the configuration file first", http.StatusInternalServerError)
		return
	}
	payload := installCommandRequest{}
	if req.Body != nil {
		defer req.Body.Close()
		if err := json.NewDecoder(req.Body).Decode(&payload); err != nil && err != io.EOF {
			h.WriteError(w, err.Error(), http.StatusBadRequest)
			return
		}
	}
	var (
		t        *Token
		tokenStr string
	)

	location := resolveInstallDir(agCfg.Setup.InstallDir, defaultAgentInstallDir)

	tokenStr = util.GetUUID()
	t = &Token{
		CreatedAt: time.Now(),
		UserID:    user.UserId,
		Product:   installProductAgent,
	}

	expiredTokenCache.Put(tokenStr, t)
	consoleEndpoint := resolveConsoleEndpoint(req, agCfg.Setup.ConsoleEndpoint)
	installVersion := strings.TrimSpace(agCfg.Setup.Version)
	endpoint, err := buildInstallScriptURL(consoleEndpoint, tokenStr, installVersion, payload.EnableReverseChannel, payload.GatewayEndpoints)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("build agent install script url failed: %v", err)
		return
	}
	downloadURL, err := resolveAgentDownloadURL(consoleEndpoint, agCfg.Setup.DownloadURL)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("resolve agent download url failed: %v", err)
		return
	}
	if strings.TrimSpace(agCfg.Setup.DownloadURL) == "" {
		logAutoResolvedDownloadURL("agent", downloadURL, defaultAgentDownloadURL)
	}

	h.WriteJSON(w, util.MapStr{
		"script":     buildInstallCommand(endpoint, location, payload.NoService),
		"token":      tokenStr,
		"expired_at": t.CreatedAt.Add(ExpiredIn),
	}, http.StatusOK)
}

func (h *APIHandler) prepareRegistration(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	agCfg := common.GetAgentConfig()
	consoleEndpoint := resolveConsoleEndpoint(req, "")
	if agCfg != nil && agCfg.Setup != nil {
		consoleEndpoint = resolveConsoleEndpoint(req, agCfg.Setup.ConsoleEndpoint)
	}

	record, tokenValue, err := common.CreatePendingManagerToken(common.AgentPendingTokenSourceUI)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"id":         record.ID,
		"endpoint":   consoleEndpoint,
		"token":      tokenValue,
		"expired_at": time.UnixMilli(record.ExpiresAt),
	}, http.StatusOK)
}

func (h *APIHandler) generateGatewayInstallCommand(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	user, err := security.FromUserContext(req.Context())
	if err != nil || user == nil {
		h.WriteError(w, "user not found", http.StatusInternalServerError)
		return
	}
	payload := installCommandRequest{}
	if req.Body != nil {
		defer req.Body.Close()
		if err := json.NewDecoder(req.Body).Decode(&payload); err != nil && err != io.EOF {
			h.WriteError(w, err.Error(), http.StatusBadRequest)
			return
		}
	}

	gwCfg := getGatewayConfig()
	if gwCfg == nil || gwCfg.Setup == nil {
		h.WriteError(w, "gateway setup config was not found, please configure in the configuration file first", http.StatusInternalServerError)
		return
	}

	location := resolveInstallDir(gwCfg.Setup.InstallDir, defaultGatewayInstallDir)
	tokenStr := util.GetUUID()
	t := &Token{
		CreatedAt: time.Now(),
		UserID:    user.UserId,
		Product:   installProductGateway,
	}
	expiredTokenCache.Put(tokenStr, t)

	consoleEndpoint := resolveConsoleEndpoint(req, gwCfg.Setup.ConsoleEndpoint)
	installVersion := strings.TrimSpace(gwCfg.Setup.Version)
	serviceType := normalizeGatewayType(payload.ServiceType)
	endpoint, err := buildInstallScriptURLForAPI(consoleEndpoint, getGatewayInstallScriptAPI, tokenStr, installVersion)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("build gateway install script url failed: %v", err)
		return
	}
	parsedEndpoint, err := url.Parse(endpoint)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("parse gateway install script url failed: %v", err)
		return
	}
	endpointQuery := parsedEndpoint.Query()
	endpointQuery.Set("service_type", serviceType)
	parsedEndpoint.RawQuery = endpointQuery.Encode()
	endpoint = parsedEndpoint.String()

	downloadURL, err := resolveGatewayDownloadURL(consoleEndpoint, gwCfg.Setup.DownloadURL)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("resolve gateway download url failed: %v", err)
		return
	}
	if strings.TrimSpace(gwCfg.Setup.DownloadURL) == "" {
		logAutoResolvedDownloadURL("gateway", downloadURL, defaultGatewayDownloadURL)
	}
	h.WriteJSON(w, util.MapStr{
		"script":     buildGatewayInstallCommand(endpoint, location, payload.NoService),
		"token":      tokenStr,
		"expired_at": t.CreatedAt.Add(ExpiredIn),
	}, http.StatusOK)
}

func buildInstallCommand(endpoint, location string, noService bool) string {
	shell := "sudo bash"
	extraArgs := ""
	if noService {
		shell = "bash"
		extraArgs = " --no-service"
	}
	command := fmt.Sprintf(`curl -ksSL %q |%s -s -- -t %q%s`,
		endpoint, shell, location, extraArgs)
	return command
}

func buildGatewayInstallCommand(endpoint, location string, noService bool) string {
	shell := "sudo bash"
	extraArgs := ""
	if noService {
		shell = "bash"
		extraArgs = " --no-service"
	}
	command := fmt.Sprintf(`curl -ksSL %q |%s -s -- -d %q%s`,
		endpoint, shell, location, extraArgs)
	return command
}

func buildInstallScriptURL(consoleEndpoint, tokenStr, installVersion string, enableReverseChannel bool, gatewayEndpoints []string) (string, error) {
	endpoint, err := buildInstallScriptURLForAPI(consoleEndpoint, getInstallScriptAPI, tokenStr, installVersion)
	if err != nil {
		return "", err
	}
	parsed, err := url.Parse(endpoint)
	if err != nil {
		return "", err
	}
	query := parsed.Query()
	if enableReverseChannel {
		query.Set("enable_reverse_channel", "true")
	}
	for _, endpoint := range normalizeManagedServerEndpoints(gatewayEndpoints) {
		query.Add("gateway_endpoint", endpoint)
	}
	parsed.RawQuery = query.Encode()
	return parsed.String(), nil
}

func formatBuildVersion(version, buildNumber string) string {
	version = strings.TrimSpace(version)
	buildNumber = strings.TrimSpace(buildNumber)
	if version == "" {
		return ""
	}
	if buildNumber == "" {
		return version
	}
	return fmt.Sprintf("%s-%s", version, buildNumber)
}

func getDefaultInstallVersion(configuredVersion string) string {
	configuredVersion = strings.TrimSpace(configuredVersion)
	if configuredVersion != "" {
		return configuredVersion
	}
	return formatBuildVersion(global.Env().GetVersion(), global.Env().GetBuildNumber())
}

func buildInstallScriptURLForAPI(consoleEndpoint, apiPath, tokenStr, installVersion string) (string, error) {
	parsedURL, err := url.Parse(consoleEndpoint)
	if err != nil {
		return "", err
	}
	parsedURL.Path = path.Join(parsedURL.Path, apiPath)

	query := parsedURL.Query()
	query.Set("token", tokenStr)
	if installVersion != "" {
		query.Set("version", installVersion)
	}
	parsedURL.RawQuery = query.Encode()
	return parsedURL.String(), nil
}

func resolveAgentDownloadURL(consoleEndpoint, downloadURL string) (string, error) {
	return resolvePackageDownloadURL(consoleEndpoint, downloadURL, defaultAgentDownloadURL, agentPackageRelativePath)
}

func resolveGatewayDownloadURL(consoleEndpoint, downloadURL string) (string, error) {
	return resolvePackageDownloadURL(consoleEndpoint, downloadURL, defaultGatewayDownloadURL, gatewayPackageRelativePath)
}

func resolvePackageDownloadURL(consoleEndpoint, downloadURL, defaultDownloadURL, relativePath string) (string, error) {
	normalized := strings.TrimRight(strings.TrimSpace(downloadURL), "/")
	if normalized != "" {
		return normalized, nil
	}

	hasSelfHostedPackages, err := consoleconfig.HasSelfHostedPackageFiles(global.Env().SystemConfig.WebAppConfig.UI.LocalPath, strings.TrimPrefix(relativePath, "/"))
	if err != nil {
		return "", err
	}
	if hasSelfHostedPackages {
		parsedURL, err := url.Parse(consoleEndpoint)
		if err != nil {
			return "", err
		}
		parsedURL.Path = path.Join(parsedURL.Path, relativePath)
		return parsedURL.String(), nil
	}
	return defaultDownloadURL, nil
}

func logAutoResolvedDownloadURL(product, downloadURL, defaultDownloadURL string) {
	if downloadURL == defaultDownloadURL {
		log.Warnf("%s.setup.download_url is empty, defaulting to public release mirror: %s", product, console_common.MaskLogEndpoint(downloadURL))
		return
	}
	log.Infof("%s.setup.download_url is empty, using Console self-hosted package path: %s", product, console_common.MaskLogEndpoint(downloadURL))
}

func resolveInstallDir(installDir, defaultInstallDir string) string {
	normalized := strings.TrimSpace(installDir)
	if normalized != "" {
		return normalized
	}
	return defaultInstallDir
}

func resolveConsoleEndpoint(req *http.Request, configuredEndpoint string) string {
	configuredEndpoint = strings.TrimRight(strings.TrimSpace(configuredEndpoint), "/")
	if configuredEndpoint != "" {
		return configuredEndpoint
	}

	if envEndpoint := strings.TrimRight(strings.TrimSpace(os.Getenv("INFINI_CONSOLE_ENDPOINT")), "/"); envEndpoint != "" {
		return envEndpoint
	}

	consoleEndpoint := getDefaultEndpoint(req)
	basePath := global.Env().SystemConfig.WebAppConfig.BasePath
	if len(basePath) > 0 {
		consoleEndpoint = fmt.Sprintf("%s%s", strings.TrimRight(consoleEndpoint, "/"), basePath)
	}
	return consoleEndpoint
}

func getEndpointHostname(endpoint string) string {
	parsed, err := url.Parse(strings.TrimSpace(endpoint))
	if err != nil {
		return ""
	}
	return parsed.Hostname()
}

func resolveConsoleTLSServerName(consoleEndpoint string) string {
	hostname := getEndpointHostname(consoleEndpoint)
	if hostname != "" && net.ParseIP(hostname) == nil {
		return hostname
	}

	for _, tlsCfg := range getPreferredConsoleTLSConfigs(consoleEndpoint) {
		if serverName := resolveTLSServerNameFromConfig(tlsCfg); serverName != "" {
			return serverName
		}
	}
	return hostname
}

func getPreferredConsoleTLSConfigs(consoleEndpoint string) []*frameworkconfig.TLSConfig {
	webCfg := global.Env().SystemConfig.WebAppConfig
	apiCfg := global.Env().SystemConfig.APIConfig

	configs := make([]*frameworkconfig.TLSConfig, 0, 2)
	if apiCfg.Enabled && endpointMatchesPublishedEndpoint(consoleEndpoint, apiCfg.GetEndpoint()) {
		configs = append(configs, &apiCfg.TLSConfig)
	}
	if webCfg.Enabled && endpointMatchesPublishedEndpoint(consoleEndpoint, webCfg.GetEndpoint()) {
		configs = append(configs, &webCfg.TLSConfig)
	}
	if len(configs) > 0 {
		return configs
	}

	if webCfg.Enabled {
		configs = append(configs, &webCfg.TLSConfig)
	}
	if apiCfg.Enabled {
		configs = append(configs, &apiCfg.TLSConfig)
	}
	return configs
}

func endpointMatchesPublishedEndpoint(endpoint, published string) bool {
	ep, err := url.Parse(strings.TrimSpace(endpoint))
	if err != nil {
		return false
	}
	pub, err := url.Parse(strings.TrimSpace(published))
	if err != nil {
		return false
	}

	return strings.EqualFold(ep.Scheme, pub.Scheme) && ep.Port() == pub.Port()
}

func resolveTLSServerNameFromConfig(tlsCfg *frameworkconfig.TLSConfig) string {
	if tlsCfg == nil {
		return ""
	}
	if serverName := strings.TrimSpace(tlsCfg.DefaultDomain); serverName != "" {
		return serverName
	}
	return readTLSServerNameFromCertFile(strings.TrimSpace(tlsCfg.TLSCertFile))
}

func readTLSServerNameFromCertFile(certFile string) string {
	if certFile == "" || !util.FileExists(certFile) {
		return ""
	}
	rawCert, err := os.ReadFile(certFile)
	if err != nil {
		return ""
	}
	for len(rawCert) > 0 {
		block, rest := pem.Decode(rawCert)
		if block == nil {
			break
		}
		rawCert = rest
		if block.Type != "CERTIFICATE" {
			continue
		}
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			continue
		}
		for _, dnsName := range cert.DNSNames {
			if dnsName = strings.TrimSpace(dnsName); dnsName != "" {
				return dnsName
			}
		}
		commonName := strings.TrimSpace(cert.Subject.CommonName)
		if commonName != "" && net.ParseIP(commonName) == nil {
			return commonName
		}
	}
	return ""
}

func resolveAgentReverseChannelEndpoint(req *http.Request, configuredEndpoint string) string {
	configuredEndpoint = strings.TrimRight(strings.TrimSpace(configuredEndpoint), "/")
	if configuredEndpoint != "" {
		return configuredEndpoint
	}

	if envEndpoint := strings.TrimRight(strings.TrimSpace(os.Getenv("INFINI_AGENT_REVERSE_CHANNEL_ENDPOINT")), "/"); envEndpoint != "" {
		return envEndpoint
	}

	if shouldUseAPIEndpointForReverseMTLS() {
		return strings.TrimRight(global.Env().SystemConfig.APIConfig.GetEndpoint(), "/")
	}

	if canServeAgentReverseOnWeb() {
		return resolveConsoleEndpoint(req, "")
	}

	if global.Env().SystemConfig.APIConfig.Enabled {
		return strings.TrimRight(global.Env().SystemConfig.APIConfig.GetEndpoint(), "/")
	}

	return resolveConsoleEndpoint(req, "")
}

func resolveAgentReverseChannelEndpoints(req *http.Request, configuredEndpoints []string) []string {
	endpoints := make([]string, 0, len(configuredEndpoints))
	for _, endpoint := range configuredEndpoints {
		endpoint = strings.TrimSpace(endpoint)
		if endpoint == "" {
			continue
		}
		endpoints = append(endpoints, endpoint)
	}
	if len(endpoints) > 0 {
		return endpoints
	}
	return []string{resolveAgentReverseChannelEndpoint(req, "")}
}

func shouldUseAPIEndpointForReverseMTLS() bool {
	apiCfg := global.Env().SystemConfig.APIConfig
	return apiCfg.Enabled &&
		apiCfg.WebsocketConfig.Enabled &&
		apiCfg.TLSConfig.TLSEnabled &&
		!apiCfg.TLSConfig.TLSInsecureSkipVerify
}

func canServeAgentReverseOnWeb() bool {
	webCfg := global.Env().SystemConfig.WebAppConfig
	if !webCfg.Enabled {
		return false
	}
	if webCfg.EmbeddingAPI && global.Env().SystemConfig.APIConfig.Enabled && global.Env().SystemConfig.APIConfig.WebsocketConfig.Enabled {
		return true
	}
	return webCfg.WebsocketConfig.Enabled
}

func shouldUseLegacyInstallScriptTemplate(installVersion string) bool {
	installVersion = strings.TrimSpace(strings.TrimPrefix(installVersion, "v"))
	if installVersion == "" {
		return false
	}

	requestedVersion, err := goversion.NewVersion(installVersion)
	if err != nil {
		return false
	}
	legacyVersion, err := goversion.NewVersion(legacyInstallScriptVersion)
	if err != nil {
		return false
	}
	return requestedVersion.LessThan(legacyVersion) || requestedVersion.Equal(legacyVersion)
}

func getDefaultEndpoint(req *http.Request) string {
	scheme := "http"
	if consolecore.RequestUsesSecureTransport(req) {
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s", scheme, getForwardedHost(req))
}

func getForwardedHost(req *http.Request) string {
	if req == nil {
		return ""
	}

	if host := strings.TrimSpace(strings.Split(req.Header.Get("X-Forwarded-Host"), ",")[0]); host != "" {
		return host
	}

	if host := parseForwardedHost(req.Header.Get("Forwarded")); host != "" {
		return host
	}

	return req.Host
}

func parseForwardedHost(value string) string {
	if value == "" {
		return ""
	}

	for _, forwardedValue := range strings.Split(value, ",") {
		for _, token := range strings.Split(forwardedValue, ";") {
			parts := strings.SplitN(strings.TrimSpace(token), "=", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "host") {
				continue
			}
			return strings.Trim(parts[1], "\"")
		}
	}

	return ""
}

func (h *APIHandler) getInstallScript(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	tokenStr := h.GetParameter(req, "token")
	_, err := validateInstallToken(tokenStr, installProductAgent)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	if _, err := refreshManagedLocalTemplatesForInstall(); err != nil {
		log.Errorf("refresh managed local templates failed before generating agent install script: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	agCfg := common.GetAgentConfig()
	if agCfg == nil || agCfg.Setup == nil {
		h.WriteError(w, "agent setup config was not found, please configure in the configuration file first", http.StatusInternalServerError)
		return
	}
	caCert, clientCertPEM, clientKeyPEM, err := common.GenerateClientCert(agCfg.Setup.CACertFile, agCfg.Setup.CAKeyFile)
	if err != nil {
		log.Errorf("generate agent install certs failed: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	installVersion := h.GetParameterOrDefault(req, "version", getDefaultInstallVersion(agCfg.Setup.Version))
	scriptTplFile := installScriptTemplate
	if shouldUseLegacyInstallScriptTemplate(installVersion) {
		scriptTplFile = legacyInstallScriptTemplate
	}

	scriptTplPath := path.Join(global.Env().GetConfigDir(), scriptTplFile)
	buf, err := os.ReadFile(scriptTplPath)
	if err != nil {
		log.Errorf("read agent install script template failed: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tpl := fasttemplate.New(string(buf), "{{", "}}")
	port := agCfg.Setup.Port
	if port == "" {
		port = "8080"
	}

	consoleEndpoint := resolveConsoleEndpoint(req, agCfg.Setup.ConsoleEndpoint)
	consoleDomain := resolveConsoleTLSServerName(consoleEndpoint)
	remoteConfigServers := resolveAgentRemoteConfigServers(consoleEndpoint, req.URL.Query()["gateway_endpoint"])
	reverseChannelEnabled := strings.EqualFold(strings.TrimSpace(req.URL.Query().Get("enable_reverse_channel")), "true")
	reverseChannelEndpoints := renderAgentReverseChannelEndpoints(
		req,
		agCfg.Setup.ReverseChannelEndpoints,
		reverseChannelEnabled,
	)
	downloadURL, err := resolveAgentDownloadURL(consoleEndpoint, agCfg.Setup.DownloadURL)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("resolve agent install script download url failed: %v", err)
		return
	}
	managerTokenRecord, managerTokenValue, err := common.CreatePendingManagerToken(common.AgentPendingTokenSourceVM)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = tpl.Execute(w, map[string]interface{}{
		"base_url":                  downloadURL,
		"console_endpoint":          consoleEndpoint,
		"console_domain":            consoleDomain,
		"remote_config_servers":     string(util.MustToJSONBytes(remoteConfigServers)),
		"reverse_channel_endpoints": reverseChannelEndpoints,
		"embedding_api":             "false",
		"websocket_enabled":         fmt.Sprintf("%t", !reverseChannelEnabled),
		"client_crt":                clientCertPEM,
		"client_key":                clientKeyPEM,
		"ca_crt":                    caCert,
		"port":                      port,
		"token":                     tokenStr,
		"access_token":              managerTokenValue,
		"manager_token":             managerTokenValue,
		"manager_token_key":         common.AgentManagerTokenKey(),
		"manager_token_id":          managerTokenRecord.ID,
		"version":                   installVersion,
	})

	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
	}
}

func (h *APIHandler) getGatewayInstallScript(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	tokenStr := h.GetParameter(req, "token")
	_, err := validateInstallToken(tokenStr, installProductGateway)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	if _, err := refreshManagedLocalTemplatesForInstall(); err != nil {
		log.Errorf("refresh managed local templates failed before generating gateway install script: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	gwCfg := getGatewayConfig()
	if gwCfg == nil || gwCfg.Setup == nil {
		h.WriteError(w, "gateway setup config was not found, please configure in the configuration file first", http.StatusInternalServerError)
		return
	}

	agCfg := common.GetAgentConfig()
	caCert, clientCertPEM, clientKeyPEM, err := common.GenerateClientCert(agCfg.Setup.CACertFile, agCfg.Setup.CAKeyFile)
	if err != nil {
		log.Errorf("generate gateway install certs failed: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	installVersion := h.GetParameterOrDefault(req, "version", getDefaultInstallVersion(gwCfg.Setup.Version))
	scriptTplPath := path.Join(global.Env().GetConfigDir(), gatewayInstallScriptTemplate)
	buf, err := os.ReadFile(scriptTplPath)
	if err != nil {
		log.Errorf("read gateway install script template failed: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tpl := fasttemplate.New(string(buf), "{{", "}}")
	consoleEndpoint := resolveConsoleEndpoint(req, gwCfg.Setup.ConsoleEndpoint)
	consoleDomain := resolveConsoleTLSServerName(consoleEndpoint)
	serviceType := normalizeGatewayType(req.URL.Query().Get("service_type"))
	downloadURL, err := resolveGatewayDownloadURL(consoleEndpoint, gwCfg.Setup.DownloadURL)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Errorf("resolve gateway install script download url failed: %v", err)
		return
	}
	_, managerTokenValue, err := common.CreatePendingManagerToken(common.AgentPendingTokenSourceVM)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	port := strings.TrimSpace(gwCfg.Setup.Port)
	if port == "" {
		port = "2900"
	}
	localAPIPassword := util.GetUUID()
	_, err = tpl.Execute(w, map[string]interface{}{
		"base_url":              downloadURL,
		"console_endpoint":      consoleEndpoint,
		"console_domain":        consoleDomain,
		"client_crt":            clientCertPEM,
		"client_key":            clientKeyPEM,
		"ca_crt":                caCert,
		"port":                  port,
		"access_token":          managerTokenValue,
		"api_security_username": defaultManagedGatewayAPIUsername,
		"api_security_password": localAPIPassword,
		"service_type":          serviceType,
		"version":               installVersion,
	})
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
	}
}

func validateInstallToken(tokenStr, product string) (*Token, error) {
	if strings.TrimSpace(tokenStr) == "" {
		return nil, fmt.Errorf("%s", http.StatusText(http.StatusUnauthorized))
	}

	v := expiredTokenCache.Get(tokenStr)
	if v == nil {
		return nil, fmt.Errorf("token is invalid")
	}

	t, ok := v.(*Token)
	if !ok || t.CreatedAt.Add(ExpiredIn).Before(time.Now()) {
		expiredTokenCache.Delete(tokenStr)
		return nil, fmt.Errorf("token was expired")
	}
	if t.Product != product {
		return nil, fmt.Errorf("token is invalid")
	}
	return t, nil
}

func getGatewayConfig() *gatewayConfig {
	cfg := &gatewayConfig{
		Setup: &gatewaySetupConfig{},
	}
	_, err := env.ParseConfig("gateway", cfg)
	if err != nil {
		log.Errorf("gateway config not found: %v", err)
	}
	return cfg
}
