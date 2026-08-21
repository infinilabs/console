package api

import (
	"fmt"
	"net/http"
	"testing"

	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
)

func TestFetchAgentInstanceStatsFallsBackToAgentInfo(t *testing.T) {
	originalChannelProxy := proxyAgentRequestViaChannelFn
	originalDirectProxy := proxyAgentRequestDirectFn
	t.Cleanup(func() {
		proxyAgentRequestViaChannelFn = originalChannelProxy
		proxyAgentRequestDirectFn = originalDirectProxy
	})

	proxyAgentRequestViaChannelFn = func(instanceID string, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, error) {
		return nil, fmt.Errorf("reverse unavailable")
	}
	proxyAgentRequestDirectFn = func(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, error) {
		switch req.Path {
		case "/stats":
			return &util.Result{StatusCode: http.StatusNotFound}, fmt.Errorf("stats not exposed on web listener")
		case "/agent/_info":
			obj, ok := responseObjectToUnMarshall.(*model.Instance)
			if !ok {
				t.Fatalf("expected model.Instance response object, got %T", responseObjectToUnMarshall)
			}
			obj.Application.Name = "agent"
			return &util.Result{StatusCode: http.StatusOK}, nil
		default:
			return nil, fmt.Errorf("unexpected path %s", req.Path)
		}
	}

	stats := util.MapStr{}
	instance := model.Instance{}
	instance.ID = "agent-1"
	instance.Application.Name = "agent"
	ok := fetchAgentInstanceStats(instance, &stats)
	if !ok {
		t.Fatal("expected agent info fallback to mark instance available")
	}
	if _, exists := stats["system"]; !exists {
		t.Fatal("expected system marker when agent info fallback succeeds")
	}
}

func TestShouldFallbackAgentInfoPath(t *testing.T) {
	if !shouldFallbackAgentInfoPath("/agent/_info", &util.Result{StatusCode: http.StatusNotFound}, fmt.Errorf("not found")) {
		t.Fatal("expected 404 on /agent/_info to trigger fallback")
	}
	if shouldFallbackAgentInfoPath("/_info", &util.Result{StatusCode: http.StatusNotFound}, fmt.Errorf("not found")) {
		t.Fatal("did not expect /_info fallback")
	}
	if shouldFallbackAgentInfoPath("/agent/_info", &util.Result{StatusCode: http.StatusUnauthorized}, fmt.Errorf("unauthorized")) {
		t.Fatal("did not expect non-404 response to trigger fallback")
	}
}
