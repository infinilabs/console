/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package server

import (
	"fmt"
	log "github.com/cihub/seelog"
	"github.com/valyala/fasttemplate"
	"infini.sh/console/core/security"
	"infini.sh/console/modules/agent/common"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
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
const GET_INSTALL_SCRIPT_API = "/instance/_get_install_script"

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
	consoleEndpoint := agCfg.Setup.ConsoleEndpoint
	if consoleEndpoint == "" {
		consoleEndpoint = getDefaultEndpoint(req)
	}

	endpoint, err := url.JoinPath(consoleEndpoint, GET_INSTALL_SCRIPT_API)
	if err != nil {
		panic(err)
	}

	h.WriteJSON(w, util.MapStr{
		"script": fmt.Sprintf(`curl -ksSL %s?token=%s |sudo bash -s -- -u %s -t %v`,
			endpoint, tokenStr, agCfg.Setup.DownloadURL, location),
		"token":      tokenStr,
		"expired_at": t.CreatedAt.Add(ExpiredIn),
	}, http.StatusOK)
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
	caCert, clientCertPEM, clientKeyPEM, err := common.GenerateServerCert(agCfg.Setup.CACertFile, agCfg.Setup.CAKeyFile)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	scriptTplPath := path.Join(global.Env().GetConfigDir(), "install_agent.tpl")
	buf, err := os.ReadFile(scriptTplPath)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tpl := fasttemplate.New(string(buf), "{{", "}}")
	downloadURL := agCfg.Setup.DownloadURL
	if downloadURL == "" {
		downloadURL = "https://release.infinilabs.com/agent/stable/"
	}

	port := agCfg.Setup.Port
	if port == "" {
		port = "8080"
	}

	consoleEndpoint := agCfg.Setup.ConsoleEndpoint
	if consoleEndpoint == "" {
		consoleEndpoint = getDefaultEndpoint(req)
	}

	_, err = tpl.Execute(w, map[string]interface{}{
		"base_url":         agCfg.Setup.DownloadURL,
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
