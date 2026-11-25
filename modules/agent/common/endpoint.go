package common

import (
	"net/url"
	"strings"

	"infini.sh/framework/core/model"
)

const (
	agentAPIServiceName = "api"
	agentWebServiceName = "web"
)

func ResolveInstanceRequestEndpoint(instance *model.Instance, requestPath string) string {
	if instance == nil {
		return ""
	}

	normalizedPath := normalizeRequestPath(requestPath)
	if strings.EqualFold(instance.Application.Name, "agent") && isAgentDirectAccessPath(normalizedPath) {
		if endpoint := getInstanceServiceEndpoint(instance, agentWebServiceName); endpoint != "" {
			return endpoint
		}
	}

	if endpoint := getInstanceServiceEndpoint(instance, agentAPIServiceName); endpoint != "" && !isAgentDirectAccessPath(normalizedPath) {
		return endpoint
	}

	return instance.GetEndpoint()
}

func getInstanceServiceEndpoint(instance *model.Instance, serviceName string) string {
	if instance == nil || serviceName == "" {
		return ""
	}
	for _, service := range instance.Services {
		if strings.EqualFold(service.Name, serviceName) && strings.TrimSpace(service.Endpoint) != "" {
			return strings.TrimSpace(service.Endpoint)
		}
	}
	return ""
}

func isAgentDirectAccessPath(rawPath string) bool {
	switch normalizeRequestPath(rawPath) {
	case "/agent/_info",
		"/elasticsearch/node/_discovery",
		"/elasticsearch/node/_info",
		"/elasticsearch/logs/_list",
		"/elasticsearch/logs/_read":
		return true
	default:
		return false
	}
}

func normalizeRequestPath(rawPath string) string {
	rawPath = strings.TrimSpace(rawPath)
	if rawPath == "" {
		return ""
	}
	parsed, err := url.Parse(rawPath)
	if err != nil {
		return rawPath
	}
	if parsed.Path != "" {
		return parsed.Path
	}
	return rawPath
}
