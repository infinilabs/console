package server

import (
	"sync"

	agent_common "infini.sh/console/modules/agent/common"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
)

type InstanceProxyProvider func(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, bool, error)

var (
	instanceProxyProviders   []InstanceProxyProvider
	instanceProxyProvidersMu sync.RWMutex
)

func RegisterInstanceProxyProvider(provider InstanceProxyProvider) {
	if provider == nil {
		return
	}
	instanceProxyProvidersMu.Lock()
	defer instanceProxyProvidersMu.Unlock()
	instanceProxyProviders = append(instanceProxyProviders, provider)
}

func proxyInstanceRequest(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, error) {
	instanceProxyProvidersMu.RLock()
	providers := append([]InstanceProxyProvider(nil), instanceProxyProviders...)
	instanceProxyProvidersMu.RUnlock()

	for _, provider := range providers {
		res, handled, err := provider(instance, req, responseObjectToUnMarshall)
		if handled {
			return res, err
		}
	}
	endpoint := agent_common.ResolveInstanceRequestEndpoint(instance, req.Path)
	return ProxyAgentRequest("runtime", endpoint, req, responseObjectToUnMarshall)
}
