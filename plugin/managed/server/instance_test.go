package server

import (
	"net/http"
	"testing"

	"infini.sh/framework/core/env"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
)

func TestShouldFallbackInstanceInfoPath(t *testing.T) {
	testCases := []struct {
		name   string
		path   string
		res    *util.Result
		err    error
		expect bool
	}{
		{
			name:   "fallback on agent 404",
			path:   "/agent/_info",
			res:    &util.Result{StatusCode: http.StatusNotFound},
			err:    assertiveError("request error"),
			expect: true,
		},
		{
			name:   "no fallback on agent 401",
			path:   "/agent/_info",
			res:    &util.Result{StatusCode: http.StatusUnauthorized},
			err:    assertiveError("request error"),
			expect: false,
		},
		{
			name:   "fallback on transport error",
			path:   "/agent/_info",
			err:    assertiveError("dial tcp"),
			expect: true,
		},
		{
			name:   "no fallback on non agent path",
			path:   "/_info",
			res:    &util.Result{StatusCode: http.StatusNotFound},
			err:    assertiveError("request error"),
			expect: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if actual := shouldFallbackInstanceInfoPath(tc.path, tc.res, tc.err); actual != tc.expect {
				t.Fatalf("unexpected fallback result: got %v want %v", actual, tc.expect)
			}
		})
	}
}

func TestProxyInstanceRequestUsesRegisteredProvider(t *testing.T) {
	originalProviders := instanceProxyProviders
	instanceProxyProviders = nil
	defer func() {
		instanceProxyProviders = originalProviders
	}()

	called := false
	RegisterInstanceProxyProvider(func(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, bool, error) {
		called = true
		if instance == nil || instance.ID != "agent-1" {
			t.Fatalf("unexpected instance: %#v", instance)
		}
		if req == nil || req.Path != "/stats" {
			t.Fatalf("unexpected request: %#v", req)
		}
		if out, ok := responseObjectToUnMarshall.(*util.MapStr); ok {
			(*out)["system"] = util.MapStr{"cpu": 12}
		} else {
			t.Fatalf("unexpected response object type: %T", responseObjectToUnMarshall)
		}
		return &util.Result{StatusCode: http.StatusOK}, true, nil
	})

	stats := util.MapStr{}
	instance := &model.Instance{}
	instance.ID = "agent-1"

	ok := fetchManagedInstanceStats(instance, &stats)
	if !ok {
		t.Fatal("expected stats fetch to succeed")
	}
	if !called {
		t.Fatal("expected registered proxy provider to be called")
	}
	if _, exists := stats["system"]; !exists {
		t.Fatalf("expected stats to be populated, got %#v", stats)
	}
}

func TestFetchManagedInstanceStatsReturnsFalseOnProxyError(t *testing.T) {
	originalProviders := instanceProxyProviders
	instanceProxyProviders = nil
	defer func() {
		instanceProxyProviders = originalProviders
	}()

	RegisterInstanceProxyProvider(func(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, bool, error) {
		return nil, true, assertiveError("boom")
	})

	instance := &model.Instance{}
	instance.ID = "agent-1"

	if fetchManagedInstanceStats(instance, &util.MapStr{}) {
		t.Fatal("expected stats fetch to fail")
	}
}

func TestGetRuntimeInstanceInfoUsesAgentInfoPathForAgentInstance(t *testing.T) {
	originalProviders := instanceProxyProviders
	instanceProxyProviders = nil
	defer func() {
		instanceProxyProviders = originalProviders
	}()

	RegisterInstanceProxyProvider(func(instance *model.Instance, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, bool, error) {
		if req == nil || req.Path != "/agent/_info" {
			t.Fatalf("unexpected request path: %#v", req)
		}
		if out, ok := responseObjectToUnMarshall.(*model.Instance); ok {
			out.Name = "agent-a"
		} else {
			t.Fatalf("unexpected response object type: %T", responseObjectToUnMarshall)
		}
		return &util.Result{StatusCode: http.StatusOK}, true, nil
	})

	instance := &model.Instance{
		Application: env.Application{Name: "agent"},
	}
	instance.ID = "agent-1"

	info, err := (&APIHandler{}).getRuntimeInstanceInfo(instance)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if info == nil || info.Name != "agent-a" {
		t.Fatalf("unexpected runtime instance info: %#v", info)
	}
}

type assertiveError string

func (e assertiveError) Error() string {
	return string(e)
}
