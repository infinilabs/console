package server

import (
	"sync"

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
	return ProxyAgentRequest("runtime", instance.GetEndpoint(), req, responseObjectToUnMarshall)
}
