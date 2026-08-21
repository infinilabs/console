package common

import (
	"testing"

	"infini.sh/framework/core/model"
)

func TestResolveInstanceRequestEndpointUsesWebForAgentDirectAccess(t *testing.T) {
	instance := &model.Instance{
		Endpoint: "http://agent-api.local:2900",
		Services: []model.ServiceInfo{
			{Name: "api", Endpoint: "http://agent-api.local:2900"},
			{Name: "web", Endpoint: "http://agent-web.local:9000"},
		},
	}
	instance.Application.Name = "agent"

	endpoint := ResolveInstanceRequestEndpoint(instance, "/agent/_info")
	if endpoint != "http://agent-web.local:9000" {
		t.Fatalf("unexpected endpoint: %s", endpoint)
	}
}

func TestResolveInstanceRequestEndpointUsesAPIForStats(t *testing.T) {
	instance := &model.Instance{
		Endpoint: "http://agent-api.local:2900",
		Services: []model.ServiceInfo{
			{Name: "api", Endpoint: "http://agent-api.local:2900"},
			{Name: "web", Endpoint: "http://agent-web.local:9000"},
		},
	}
	instance.Application.Name = "agent"

	endpoint := ResolveInstanceRequestEndpoint(instance, "/stats")
	if endpoint != "http://agent-api.local:2900" {
		t.Fatalf("unexpected endpoint: %s", endpoint)
	}
}
