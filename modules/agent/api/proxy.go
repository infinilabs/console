package api

import (
	"net/http"
	"strings"

	"infini.sh/console/plugin/managed/server"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
)

func shouldAttemptAgentReverseProxy(instance *model.Instance, req *util.Request, connected bool) bool {
	return instance != nil &&
		req != nil &&
		connected &&
		strings.EqualFold(instance.Application.Name, "agent")
}

func agentInstanceProxyProvider(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, bool, error) {
	if !shouldAttemptAgentReverseProxy(instance, req, IsAgentReverseChannelConnected(instance.ID)) {
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
