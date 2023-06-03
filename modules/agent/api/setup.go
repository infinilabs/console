/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"fmt"
	log "github.com/cihub/seelog"
	"github.com/valyala/fasttemplate"
	"infini.sh/console/modules/agent/common"
	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"os"

	"net/http"
	"path"
	"strings"
	"sync"
	"time"
)

var tokens = sync.Map{}
type Token struct {
	CreatedAt time.Time
	UserID string
}

const ExpiredIn = time.Millisecond * 1000 * 60 * 20
func (h *APIHandler) generateInstallCommand(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	claims, ok := req.Context().Value("user").(*rbac.UserClaims)
	if !ok {
		h.WriteError(w, "user not found", http.StatusInternalServerError)
		return
	}
	var (
		t *Token
		tokenStr string
	)
	tokens.Range(func(key, value any) bool {
		if v, ok := value.(*Token); ok && claims.UserId == v.UserID {
			t = v
			tokenStr = key.(string)
			return false
		}
		return true
	})

	if t == nil {
		tokenStr = util.GetUUID()
		t = &Token{
			CreatedAt: time.Now(),
			UserID: claims.UserId,
		}
	}else{
		if t.CreatedAt.Add(ExpiredIn).Before(time.Now()){
			tokens.Delete(tokenStr)
			tokenStr = util.GetUUID()
			t = &Token{
				CreatedAt: time.Now(),
				UserID: claims.UserId,
			}
		}else{
			t.CreatedAt = time.Now()
		}
	}
	tokens.Store(tokenStr, t)
	agCfg := common.GetAgentConfig()
	consoleEndpoint :=  agCfg.Setup.ConsoleEndpoint
	if consoleEndpoint == "" {
		scheme := "http"
		if req.TLS != nil {
			scheme = "https"
		}
		consoleEndpoint = fmt.Sprintf("%s://%s", scheme, req.Host)
	}
	h.WriteJSON(w, util.MapStr{
		"script": fmt.Sprintf(`sudo bash -c "$(curl -L '%s/agent/install.sh?token=%s')"`, consoleEndpoint, tokenStr),
		"token": tokenStr,
		"expired_at": t.CreatedAt.Add(ExpiredIn),
	}, http.StatusOK)
}

func (h *APIHandler) getInstallScript(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	tokenStr := h.GetParameter(req, "token")
	if strings.TrimSpace(tokenStr) == "" {
		h.WriteError(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}
	if v, ok := tokens.Load(tokenStr); !ok {
		h.WriteError(w, "token is invalid", http.StatusUnauthorized)
		return
	}else{
		if t, ok := v.(*Token); !ok || t.CreatedAt.Add(ExpiredIn).Before(time.Now()) {
			tokens.Delete(tokenStr)
			h.WriteError(w, "token was expired", http.StatusUnauthorized)
			return
		}
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
	_, err = tpl.Execute(w, map[string]interface{}{
		"base_url":  agCfg.Setup.DownloadURL,
		"agent_version": agCfg.Setup.Version,
		"console_endpoint": agCfg.Setup.ConsoleEndpoint,
		"client_crt": clientCertPEM,
		"client_key": clientKeyPEM,
		"ca_crt": caCert,
		"port": port,
		"token": tokenStr,
	})
	if err != nil {
		log.Error(err)
	}
}

