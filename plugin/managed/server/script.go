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
	"fmt"
	log "github.com/cihub/seelog"
	goversion "github.com/hashicorp/go-version"
	consoleconfig "infini.sh/console/config"
	consolecore "infini.sh/console/core"
	"infini.sh/console/core/security"
	"infini.sh/console/modules/agent/common"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"infini.sh/framework/lib/fasttemplate"
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
const legacyInstallScriptTemplate = "install_legency_agent.tpl"
const legacyInstallScriptVersion = "1.30.3"
const installProductAgent = "agent"
const installProductGateway = "gateway"
const agentPackageRelativePath = "/agent/stable"
const gatewayPackageRelativePath = "/gateway/stable"
const defaultAgentDownloadURL = "https://release.infinilabs.com/agent/stable"
const defaultGatewayDownloadURL = "https://release.infinilabs.com/gateway/stable"
const defaultAgentInstallDir = "/infini/agent"
const defaultGatewayInstallDir = "/infini/gateway"

var expiredTokenCache = util.NewCacheWithExpireOnAdd(ExpiredIn, 100)

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

func (h *APIHandler) generateInstallCommand(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	claims, ok := req.Context().Value("user").(*security.UserClaims)
	if !ok {
		h.WriteError(w, "user not found", http.StatusInternalServerError)
		return
	}
	agCfg := common.GetAgentConfig()
	if agCfg == nil || agCfg.Setup == nil {
		h.WriteError(w, "agent setup config was not found, please configure in the configuration file first", http.StatusInternalServerError)
		return
	}
	var (
		t        *Token
		tokenStr string
	)

	location := resolveInstallDir(agCfg.Setup.InstallDir, defaultAgentInstallDir)

	tokenStr = util.GetUUID()
	t = &Token{
		CreatedAt: time.Now(),
		UserID:    claims.UserId,
		Product:   installProductAgent,
	}

	expiredTokenCache.Put(tokenStr, t)
	consoleEndpoint := resolveConsoleEndpoint(req, agCfg.Setup.ConsoleEndpoint)
	installVersion := strings.TrimSpace(agCfg.Setup.Version)
	endpoint, err := buildInstallScriptURL(consoleEndpoint, tokenStr, installVersion)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	downloadURL, err := resolveAgentDownloadURL(consoleEndpoint, agCfg.Setup.DownloadURL)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if strings.TrimSpace(agCfg.Setup.DownloadURL) == "" {
		logAutoResolvedDownloadURL("agent", downloadURL, defaultAgentDownloadURL)
	}

	h.WriteJSON(w, util.MapStr{
		"script":     buildInstallCommand(endpoint, downloadURL, location, installVersion),
		"token":      tokenStr,
		"expired_at": t.CreatedAt.Add(ExpiredIn),
	}, http.StatusOK)
}

func (h *APIHandler) generateGatewayInstallCommand(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	claims, ok := req.Context().Value("user").(*security.UserClaims)
	if !ok {
		h.WriteError(w, "user not found", http.StatusInternalServerError)
		return
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
		UserID:    claims.UserId,
		Product:   installProductGateway,
	}
	expiredTokenCache.Put(tokenStr, t)

	consoleEndpoint := resolveConsoleEndpoint(req, gwCfg.Setup.ConsoleEndpoint)
	installVersion := strings.TrimSpace(gwCfg.Setup.Version)
	endpoint, err := buildInstallScriptURLForAPI(consoleEndpoint, getGatewayInstallScriptAPI, tokenStr, installVersion)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	downloadURL, err := resolveGatewayDownloadURL(consoleEndpoint, gwCfg.Setup.DownloadURL)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if strings.TrimSpace(gwCfg.Setup.DownloadURL) == "" {
		logAutoResolvedDownloadURL("gateway", downloadURL, defaultGatewayDownloadURL)
	}
	h.WriteJSON(w, util.MapStr{
		"script":     buildGatewayInstallCommand(endpoint, downloadURL, location, installVersion),
		"token":      tokenStr,
		"expired_at": t.CreatedAt.Add(ExpiredIn),
	}, http.StatusOK)
}

func buildInstallCommand(endpoint, downloadURL, location, installVersion string) string {
	command := fmt.Sprintf(`curl -ksSL %q |sudo bash -s -- -t %q`,
		endpoint, location)
	command = fmt.Sprintf(`%s -u %q`, command, downloadURL)
	if installVersion != "" {
		command = fmt.Sprintf(`%s -v %q`, command, installVersion)
	}
	return command
}

func buildGatewayInstallCommand(endpoint, downloadURL, location, installVersion string) string {
	command := fmt.Sprintf(`curl -ksSL %q |sudo bash -s -- -d %q`,
		endpoint, location)
	command = fmt.Sprintf(`%s -u %q`, command, downloadURL)
	if installVersion != "" {
		command = fmt.Sprintf(`%s -v %q`, command, installVersion)
	}
	return command
}

func buildInstallScriptURL(consoleEndpoint, tokenStr, installVersion string) (string, error) {
	return buildInstallScriptURLForAPI(consoleEndpoint, getInstallScriptAPI, tokenStr, installVersion)
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
		log.Warnf("%s.setup.download_url is empty, defaulting to public release mirror: %s", product, downloadURL)
		return
	}
	log.Infof("%s.setup.download_url is empty, using Console self-hosted package path: %s", product, downloadURL)
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

	agCfg := common.GetAgentConfig()
	if agCfg == nil || agCfg.Setup == nil {
		h.WriteError(w, "agent setup config was not found, please configure in the configuration file first", http.StatusInternalServerError)
		return
	}
	caCert, clientCertPEM, clientKeyPEM, err := common.GenerateServerCert(agCfg.Setup.CACertFile, agCfg.Setup.CAKeyFile)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	installVersion := h.GetParameterOrDefault(req, "version", strings.TrimSpace(agCfg.Setup.Version))
	scriptTplFile := installScriptTemplate
	if shouldUseLegacyInstallScriptTemplate(installVersion) {
		scriptTplFile = legacyInstallScriptTemplate
	}

	scriptTplPath := path.Join(global.Env().GetConfigDir(), scriptTplFile)
	buf, err := os.ReadFile(scriptTplPath)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tpl := fasttemplate.New(string(buf), "{{", "}}")
	port := agCfg.Setup.Port
	if port == "" {
		port = "8080"
	}

	consoleEndpoint := resolveConsoleEndpoint(req, agCfg.Setup.ConsoleEndpoint)
	downloadURL, err := resolveAgentDownloadURL(consoleEndpoint, agCfg.Setup.DownloadURL)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	_, err = tpl.Execute(w, map[string]interface{}{
		"base_url":         downloadURL,
		"console_endpoint": consoleEndpoint,
		"client_crt":       clientCertPEM,
		"client_key":       clientKeyPEM,
		"ca_crt":           caCert,
		"port":             port,
		"token":            tokenStr,
		"version":          installVersion,
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

	gwCfg := getGatewayConfig()
	if gwCfg == nil || gwCfg.Setup == nil {
		h.WriteError(w, "gateway setup config was not found, please configure in the configuration file first", http.StatusInternalServerError)
		return
	}

	agCfg := common.GetAgentConfig()
	caCert, clientCertPEM, clientKeyPEM, err := common.GenerateServerCert(agCfg.Setup.CACertFile, agCfg.Setup.CAKeyFile)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	installVersion := h.GetParameterOrDefault(req, "version", strings.TrimSpace(gwCfg.Setup.Version))
	scriptTplPath := path.Join(global.Env().GetConfigDir(), gatewayInstallScriptTemplate)
	buf, err := os.ReadFile(scriptTplPath)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tpl := fasttemplate.New(string(buf), "{{", "}}")
	consoleEndpoint := resolveConsoleEndpoint(req, gwCfg.Setup.ConsoleEndpoint)
	downloadURL, err := resolveGatewayDownloadURL(consoleEndpoint, gwCfg.Setup.DownloadURL)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	port := strings.TrimSpace(gwCfg.Setup.Port)
	if port == "" {
		port = "2900"
	}
	_, err = tpl.Execute(w, map[string]interface{}{
		"base_url":         downloadURL,
		"console_endpoint": consoleEndpoint,
		"client_crt":       clientCertPEM,
		"client_key":       clientKeyPEM,
		"ca_crt":           caCert,
		"port":             port,
		"version":          installVersion,
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
