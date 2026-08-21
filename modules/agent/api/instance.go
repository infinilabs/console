package api

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

var proxyAgentRequestViaChannelFn = ProxyAgentRequestViaChannel
var proxyAgentRequestDirectFn = proxyAgentRequestDirect

func (h *APIHandler) getAgentInstanceStatus(w http.ResponseWriter, req *http.Request, _ httprouter.Params) {
	var instanceIDs []string
	if err := h.DecodeJSON(req, &instanceIDs); err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(instanceIDs) == 0 {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}

	result := util.MapStr{}
	for _, instanceID := range instanceIDs {
		result[instanceID] = util.MapStr{}
	}

	q := orm.Query{}
	q.RawQuery = util.MustToJSONBytes(util.MapStr{
		"size": len(instanceIDs),
		"query": util.MapStr{
			"terms": util.MapStr{
				"_id": instanceIDs,
			},
		},
	})

	instances := []model.Instance{}
	if err, _ := orm.SearchWithJSONMapper(&instances, &q); err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var (
		wg sync.WaitGroup
		mu sync.Mutex
	)

	for i := range instances {
		instance := instances[i]
		wg.Add(1)
		go func(inst model.Instance) {
			defer wg.Done()
			stats := util.MapStr{}
			if fetchAgentInstanceStats(inst, &stats) {
				mu.Lock()
				result[inst.ID] = stats
				mu.Unlock()
			}
		}(instance)
	}

	wg.Wait()
	h.WriteJSON(w, result, http.StatusOK)
}

func fetchAgentInstanceStats(instance model.Instance, stats *util.MapStr) bool {
	if IsAgentReverseChannelConnected(instance.ID) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		req := &util.Request{
			Method:  http.MethodGet,
			Path:    "/stats",
			Context: ctx,
		}
		if _, err := proxyAgentRequestViaChannelFn(instance.ID, req, stats); err == nil {
			return true
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req := &util.Request{
		Method:  http.MethodGet,
		Path:    "/stats",
		Context: ctx,
	}
	if _, err := proxyAgentRequestDirectFn(&instance, req, stats); err == nil {
		return true
	}

	info, err := fetchAgentInstanceInfoDirect(&instance)
	if err != nil {
		return false
	}
	if stats != nil {
		(*stats)["system"] = util.MapStr{}
		if info != nil {
			(*stats)["application"] = info.Application
		}
	}
	return true
}

func fetchAgentInstanceInfoDirect(instance *model.Instance) (*model.Instance, error) {
	if instance == nil {
		return nil, fmt.Errorf("instance is nil")
	}

	for _, infoPath := range []string{"/agent/_info", "/_info"} {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		req := &util.Request{
			Method:  http.MethodGet,
			Path:    infoPath,
			Context: ctx,
		}
		obj := &model.Instance{}
		res, err := proxyAgentRequestDirectFn(instance, req, obj)
		cancel()
		if err == nil {
			return obj, nil
		}
		if !shouldFallbackAgentInfoPath(infoPath, res, err) {
			return nil, err
		}
	}

	return nil, fmt.Errorf("agent info unavailable")
}

func shouldFallbackAgentInfoPath(path string, res *util.Result, err error) bool {
	if path != "/agent/_info" || err == nil {
		return false
	}
	if res != nil {
		return res.StatusCode == http.StatusNotFound
	}
	return true
}
