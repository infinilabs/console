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
	"infini.sh/console/core/security"
	"infini.sh/console/modules/agent/common"
	httprouter "infini.sh/framework/core/api/router"
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
}

const ExpiredIn = time.Millisecond * 1000 * 60 * 60
const getInstallScriptAPI = "/instance/_get_install_script"
const defaultAgentDownloadURL = "https://release.infinilabs.com/agent/stable"
const installScriptTemplate = "install_agent.tpl"
const legacyInstallScriptTemplate = "install_legency_agent.tpl"
const legacyInstallScriptVersion = "1.30.3"

var expiredTokenCache = util.NewCacheWithExpireOnAdd(ExpiredIn, 100)

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

	//TODO: get location from request, validate it
	location := "/opt/agent"

	tokenStr = util.GetUUID()
	t = &Token{
		CreatedAt: time.Now(),
		UserID:    claims.UserId,
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
	downloadURL := normalizeAgentDownloadURL(agCfg.Setup.DownloadURL)

	h.WriteJSON(w, util.MapStr{
		"script":     buildInstallCommand(endpoint, downloadURL, location, installVersion),
		"token":      tokenStr,
		"expired_at": t.CreatedAt.Add(ExpiredIn),
	}, http.StatusOK)
}

func buildInstallCommand(endpoint, downloadURL, location, installVersion string) string {
	command := fmt.Sprintf(`curl -ksSL %q |sudo bash -s -- -t %q`,
		endpoint, location)
	if normalizeAgentDownloadURL(downloadURL) != defaultAgentDownloadURL {
		command = fmt.Sprintf(`%s -u %q`, command, downloadURL)
	}
	if installVersion != "" {
		command = fmt.Sprintf(`%s -v %q`, command, installVersion)
	}
	return command
}

func buildInstallScriptURL(consoleEndpoint, tokenStr, installVersion string) (string, error) {
	parsedURL, err := url.Parse(consoleEndpoint)
	if err != nil {
		return "", err
	}
	parsedURL.Path = path.Join(parsedURL.Path, getInstallScriptAPI)

	query := parsedURL.Query()
	query.Set("token", tokenStr)
	if installVersion != "" {
		query.Set("version", installVersion)
	}
	parsedURL.RawQuery = query.Encode()
	return parsedURL.String(), nil
}

func normalizeAgentDownloadURL(downloadURL string) string {
	normalized := strings.TrimRight(strings.TrimSpace(downloadURL), "/")
	if normalized == "" {
		return defaultAgentDownloadURL
	}
	return normalized
}

func resolveConsoleEndpoint(req *http.Request, configuredEndpoint string) string {
	configuredEndpoint = strings.TrimRight(strings.TrimSpace(configuredEndpoint), "/")
	if configuredEndpoint != "" {
		return configuredEndpoint
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
	if req.TLS != nil {
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s", scheme, req.Host)
}

func (h *APIHandler) getInstallScript(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	tokenStr := h.GetParameter(req, "token")
	if strings.TrimSpace(tokenStr) == "" {
		h.WriteError(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	v := expiredTokenCache.Get(tokenStr)
	if v == nil {
		h.WriteError(w, "token is invalid", http.StatusUnauthorized)
		return
	}

	t, ok := v.(*Token)
	if !ok || t.CreatedAt.Add(ExpiredIn).Before(time.Now()) {
		expiredTokenCache.Delete(tokenStr)
		h.WriteError(w, "token was expired", http.StatusUnauthorized)
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
	downloadURL := normalizeAgentDownloadURL(agCfg.Setup.DownloadURL)

	port := agCfg.Setup.Port
	if port == "" {
		port = "8080"
	}

	consoleEndpoint := resolveConsoleEndpoint(req, agCfg.Setup.ConsoleEndpoint)

	_, err = tpl.Execute(w, map[string]interface{}{
		"base_url":         downloadURL,
		"console_endpoint": consoleEndpoint,
		"client_crt":       clientCertPEM,
		"client_key":       clientKeyPEM,
		"ca_crt":           caCert,
		"port":             port,
		"token":            tokenStr,
	})

	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
	}
}
