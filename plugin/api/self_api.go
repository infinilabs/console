package api

import (
	"crypto/subtle"
	"net/http"
	"strings"

	log "github.com/cihub/seelog"
	consolesecurity "infini.sh/console/core/security"
	frameworkapi "infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/global"
	configcommon "infini.sh/framework/modules/configs/common"
)

const consoleSelfAccessTokenKeystoreKey = "console_access_token"

var (
	loadConsoleSelfAccessToken = func() (string, error) {
		return configcommon.LoadTokenFromKeystore(consoleSelfAccessTokenKeystoreKey)
	}
	ensureConsoleSelfAccessToken = func() (string, error) {
		return configcommon.EnsureTokenInKeystore(consoleSelfAccessTokenKeystoreKey)
	}
)

var consoleAdditionalProtectedWebAPIRoutes = []frameworkapi.ProtectedAPIRoute{
	{Method: frameworkapi.GET, Path: "/stats/prometheus"},
	{Method: frameworkapi.GET, Path: "/debug/goroutines"},
	{Method: frameworkapi.GET, Path: "/debug/pool/bytes"},
	{Method: frameworkapi.GET, Path: "/_local/files/_list"},
	{Method: frameworkapi.GET, Path: "/_local/files/:file/_list"},
	{Method: frameworkapi.DELETE, Path: "/_local/files/:file"},
}

var consoleAccountProxyUIRoutes = []frameworkapi.ProtectedAPIRoute{
	{Method: frameworkapi.POST, Path: "/account/refresh"},
	{Method: frameworkapi.POST, Path: "/account/logout"},
	{Method: frameworkapi.DELETE, Path: "/account/logout"},
	{Method: frameworkapi.GET, Path: "/account/profile"},
	{Method: frameworkapi.PUT, Path: "/account/password"},
}

type consoleSelfAPIHandler struct {
	frameworkapi.Handler
}

func initConsoleSelfAPI() {
	if _, err := ensureConsoleSelfAccessToken(); err != nil {
		log.Errorf("failed to initialize console self access token: %v", err)
	}

	handler := consoleSelfAPIHandler{}
	registerConsoleProtectedUIRoutes(handler)
	registerConsoleAccountProxyUIRoutes(handler)
	registerMissingConsoleAPIProxyUIRoutes(handler)
}

func registerConsoleProtectedUIRoutes(handler consoleSelfAPIHandler) {
	routes := append([]frameworkapi.ProtectedAPIRoute{}, frameworkapi.DefaultProtectedAPIRoutes...)
	routes = append(routes, consoleAdditionalProtectedWebAPIRoutes...)
	frameworkapi.RegisterProtectedUIRoutes(routes, handler.requireLoginOrAccessToken(handler.proxyLocalAPI), frameworkapi.AllowOPTIONSS(), frameworkapi.Feature(frameworkapi.FeatureCORS))
}

func registerConsoleAccountProxyUIRoutes(handler consoleSelfAPIHandler) {
	frameworkapi.RegisterProtectedUIRoutes(consoleAccountProxyUIRoutes, handler.requireLoginOrAccessToken(handler.proxyLocalAPI), frameworkapi.Override(), frameworkapi.AllowOPTIONSS(), frameworkapi.Feature(frameworkapi.FeatureCORS))
}

func registerMissingConsoleAPIProxyUIRoutes(handler consoleSelfAPIHandler) {
	frameworkapi.RegisterMissingAPIMethodUIRoutes(handler.requireLoginOrAccessToken(handler.proxyLocalAPI))
}

func (h consoleSelfAPIHandler) proxyLocalAPI(w http.ResponseWriter, req *http.Request, _ httprouter.Params) {
	proxyReq := req.Clone(req.Context())
	applyConsoleLocalAPIAuth(proxyReq)
	frameworkapi.ServeRegisteredAPIRequest(w, proxyReq)
}

func (h consoleSelfAPIHandler) requireLoginOrAccessToken(next httprouter.Handle) httprouter.Handle {
	return func(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		if validateConsoleSelfAccessToken(extractConsoleSelfAccessToken(req)) {
			next(w, req, ps)
			return
		}

		if frameworkapi.IsAuthEnable() {
			if _, err := consolesecurity.ValidateLogin(req.Header.Get("Authorization")); err == nil {
				next(w, req, ps)
				return
			}
		}

		h.WriteError(w, "unauthorized", http.StatusUnauthorized)
	}
}

func applyConsoleLocalAPIAuth(req *http.Request) {
	if req == nil {
		return
	}
	apiCfg := global.Env().SystemConfig.APIConfig
	if !apiCfg.Security.Enabled {
		return
	}
	username := strings.TrimSpace(apiCfg.Security.Username)
	if username == "" {
		return
	}
	req.SetBasicAuth(username, apiCfg.Security.Password)
}

func validateConsoleSelfAccessToken(tokenValue string) bool {
	expected, err := loadConsoleSelfAccessToken()
	if err != nil || expected == "" || tokenValue == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(expected), []byte(strings.TrimSpace(tokenValue))) == 1
}

func extractConsoleSelfAccessToken(req *http.Request) string {
	return frameworkapi.ExtractBearerOrAPIToken(req)
}
