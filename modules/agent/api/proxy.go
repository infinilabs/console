package api

import (
	"fmt"
	"net/http"
	"strings"

	agent_common "infini.sh/console/modules/agent/common"
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

func proxyAgentRequestDirect(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, error) {
	if instance == nil {
		return nil, fmt.Errorf("instance is nil")
	}
	if req == nil {
		return nil, fmt.Errorf("request is nil")
	}
	if err := agent_common.ApplyInstanceRequestAuth(req, instance); err != nil {
		return nil, err
	}
	endpoint := agent_common.ResolveInstanceRequestEndpoint(instance, req.Path)
	return server.ProxyAgentRequest("runtime", endpoint, req, responseObjectToUnMarshall)
}

func proxyAgentRequest(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, error) {
	if instance == nil {
		return nil, fmt.Errorf("instance is nil")
	}
	if req == nil {
		return nil, fmt.Errorf("request is nil")
	}

	if shouldAttemptAgentReverseProxy(instance, req, IsAgentReverseChannelConnected(instance.ID)) {
		res, err := ProxyAgentRequestViaChannel(instance.ID, req, responseObjectToUnMarshall)
		if !shouldFallbackToDirectAgentProxy(res, err) {
			return res, err
		}
	}

	return proxyAgentRequestDirect(instance, req, responseObjectToUnMarshall)
}

func init() {
	server.RegisterInstanceProxyProvider(agentInstanceProxyProvider)
}
