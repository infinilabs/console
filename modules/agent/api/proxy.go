package api

import (
	"net/http"
	"net/url"
	"strings"

	"infini.sh/console/plugin/managed/server"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
)

var agentReverseProxyMatcher = newAgentReverseProxyMatcher()

func newAgentReverseProxyMatcher() *httprouter.Router {
	router := httprouter.New(nil)
	handle := func(http.ResponseWriter, *http.Request, httprouter.Params) {}
	routes := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/stats"},
		{http.MethodGet, "/queue/stats"},
		{http.MethodGet, "/queue/:id/stats"},
		{http.MethodGet, "/queue/:id/_scroll"},
		{http.MethodDelete, "/queue/:id"},
		{http.MethodDelete, "/queue/_search"},
		{http.MethodPut, "/queue/:id/consumer/:consumer_id/offset"},
		{http.MethodGet, "/queue/:id/consumer/:consumer_id/offset"},
		{http.MethodDelete, "/queue/:id/consumer/:consumer_id"},
		{http.MethodDelete, "/queue/consumer/_search"},
		{http.MethodGet, "/pipeline/tasks/"},
		{http.MethodPost, "/pipeline/tasks/_search"},
		{http.MethodPost, "/pipeline/task/:id/_start"},
		{http.MethodPost, "/pipeline/task/:id/_stop"},
		{http.MethodGet, "/pipeline/task/:id"},
		{http.MethodDelete, "/pipeline/task/:id"},
		{http.MethodGet, "/config/"},
		{http.MethodPut, "/config/"},
		{http.MethodGet, "/config/runtime"},
	}
	for _, route := range routes {
		router.Handle(route.method, route.path, handle)
	}
	return router
}

func isAgentReverseProxyPathAllowed(method, rawPath string) bool {
	parsed, err := url.ParseRequestURI(strings.TrimSpace(rawPath))
	if err != nil || parsed.Path == "" {
		return false
	}
	handle, _, _ := agentReverseProxyMatcher.Lookup(strings.ToUpper(method), parsed.Path)
	return handle != nil
}

func agentInstanceProxyProvider(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, bool, error) {
	if instance == nil || !strings.EqualFold(instance.Application.Name, "agent") || req == nil {
		return nil, false, nil
	}
	if !isAgentReverseProxyPathAllowed(req.Method, req.Path) {
		return nil, false, nil
	}
	if !IsAgentReverseChannelConnected(instance.ID) {
		return nil, false, nil
	}

	res, err := ProxyAgentRequestViaChannel(instance.ID, req, responseObjectToUnMarshall)
	if shouldFallbackToDirectAgentProxy(res, err) {
		return nil, false, nil
	}
	return res, true, err
}

func shouldFallbackToDirectAgentProxy(res *util.Result, err error) bool {
	if err == nil {
		return false
	}
	if res != nil && res.StatusCode == http.StatusNotFound {
		return true
	}
	return isAgentReverseChannelRecoverableError(err)
}

func init() {
	server.RegisterInstanceProxyProvider(agentInstanceProxyProvider)
}
