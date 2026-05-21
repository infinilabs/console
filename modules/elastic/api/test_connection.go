// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"context"
	"fmt"
	"github.com/segmentio/encoding/json"
	console_common "infini.sh/console/common"
	"infini.sh/console/core"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
	"net/http"
	"strings"
	"time"
)

type TestAPI struct {
	core.Handler
}

const (
	tryConnectErrorKeyHealthRed           = "cluster.connect.error.health_red"
	tryConnectErrorKeyNonESEndpoint       = "cluster.connect.error.non_es_endpoint"
	tryConnectErrorKeyTLSMismatch         = "cluster.connect.error.tls_mismatch"
	tryConnectErrorKeyAuthRequired        = "cluster.connect.error.auth_required"
	tryConnectErrorKeyEndpointUnreachable = "cluster.connect.error.endpoint_unreachable"
	tryConnectErrorKeyUnexpectedStatus    = "cluster.connect.error.unexpected_status"
	tryConnectErrorKeyDefault             = "cluster.regist.try_connect.failed"
)

type elasticConfigPayload struct {
	elastic.ElasticsearchConfig
	ProbePath string `json:"probe_path,omitempty"`
}

var testAPI = TestAPI{}

var testInited bool

func InitTestAPI() {
	if !testInited {
		api.HandleAPIMethod(api.POST, "/elasticsearch/try_connect", testAPI.RequireSecureTransport(testAPI.RequireReplayProtection(testAPI.HandleTestConnectionAction)))
		testInited = true
	}
}

func (h TestAPI) HandleTestConnectionAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var resBody = map[string]interface{}{}
	payload := &elasticConfigPayload{}
	err := h.DecodeJSON(req, payload)
	if err != nil {
		panic(err)
	}
	defer req.Body.Close()
	config := &payload.ElasticsearchConfig
	console_common.SetProbePath(config, payload.ProbePath)
	var url string
	if config.Endpoint != "" {
		url = config.Endpoint
	} else if config.Host != "" && config.Schema != "" {
		url = fmt.Sprintf("%s://%s", config.Schema, config.Host)
		config.Endpoint = url
	}
	if url != "" && !util.StringInArray(config.Endpoints, url) {
		config.Endpoints = append(config.Endpoints, url)
	}
	if config.Schema != "" && len(config.Hosts) > 0 {
		for _, host := range config.Hosts {
			host = strings.TrimSpace(host)
			if host == "" {
				continue
			}
			url = fmt.Sprintf("%s://%s", config.Schema, host)
			if !util.StringInArray(config.Endpoints, url) {
				config.Endpoints = append(config.Endpoints, url)
			}
		}
	}
	if len(config.Endpoints) == 0 {
		panic(errors.Error(fmt.Sprintf("invalid config: %v", util.MustToJSON(config))))
	}
	// limit the number of endpoints to a maximum of 10 to prevent excessive processing
	if len(config.Endpoints) > 10 {
		config.Endpoints = config.Endpoints[0:10]
	}
	if (config.BasicAuth == nil || (config.BasicAuth != nil && config.BasicAuth.Username == "")) &&
		config.CredentialID != "" && config.CredentialID != "manual" {
		credential, err := common.GetCredential(config.CredentialID)
		if err != nil {
			panic(err)
		}
		var dv interface{}
		dv, err = credential.Decode()
		if err != nil {
			panic(err)
		}
		if auth, ok := dv.(model.BasicAuth); ok {
			config.BasicAuth = &auth
		}
	}
	var (
		i           int
		clusterUUID string
	)
	for i, url = range config.Endpoints {
		clusterInfo, err := console_common.ClusterVersionWithConfig(&elastic.ElasticsearchConfig{
			Schema:         config.Schema,
			Endpoint:       url,
			Endpoints:      []string{url},
			Distribution:   config.Distribution,
			BasicAuth:      config.BasicAuth,
			RequestTimeout: 10,
			Labels:         config.Labels,
		})
		if err != nil {
			writeTryConnectError(h, w, err)
			return
		}

		resBody["version"] = clusterInfo.Version.Number
		resBody["cluster_uuid"] = clusterInfo.ClusterUUID
		resBody["cluster_name"] = clusterInfo.ClusterName
		resBody["distribution"] = clusterInfo.Version.Distribution

		if i == 0 {
			clusterUUID = clusterInfo.ClusterUUID
		} else {
			//validate whether two endpoints point to the same cluster
			if clusterUUID != clusterInfo.ClusterUUID {
				resBody["error"] = fmt.Sprintf("invalid multiple cluster endpoints: %v", config.Endpoints)
				h.WriteJSON(w, resBody, http.StatusInternalServerError)
				return
			}
			//skip fetch cluster health info if it's not the first endpoint
			break
		}
		//fetch cluster health info
		healthInfo, err := fetchClusterHealth(url, config)
		if err != nil {
			resBody["error"] = buildTryConnectErrorPayload(err)
			h.WriteJSON(w, resBody, http.StatusInternalServerError)
			return
		}
		resBody["status"] = healthInfo.Status
		resBody["number_of_nodes"] = healthInfo.NumberOfNodes
		resBody["number_of_data_nodes"] = healthInfo.NumberOf_data_nodes
		resBody["active_shards"] = healthInfo.ActiveShards

		if healthInfo.Status == "red" {
			resBody["error"] = buildTryConnectErrorPayload(errors.New("cluster health status is red, please fix the cluster before connecting"))
			h.WriteJSON(w, resBody, http.StatusInternalServerError)
			return
		}
	}

	h.WriteJSON(w, resBody, http.StatusOK)

}

func writeTryConnectError(h TestAPI, w http.ResponseWriter, err error) {
	h.WriteJSON(w, map[string]interface{}{
		"error": buildTryConnectErrorPayload(err),
	}, http.StatusInternalServerError)
}

func buildTryConnectErrorPayload(err error) map[string]interface{} {
	reason, key := resolveTryConnectError(err)
	return map[string]interface{}{
		"reason": reason,
		"key":    key,
	}
}

func sanitizeTryConnectError(err error) string {
	reason, _ := resolveTryConnectError(err)
	return reason
}

func sanitizeTryConnectErrorKey(err error) string {
	_, key := resolveTryConnectError(err)
	return key
}

func resolveTryConnectError(err error) (string, string) {
	raw := extractTryConnectReason(err)
	lowerRaw := strings.ToLower(raw)

	switch {
	case strings.Contains(lowerRaw, "cluster health status is red"):
		return "cluster health status is red, please fix the cluster before connecting", tryConnectErrorKeyHealthRed
	case strings.Contains(lowerRaw, "invalid character '<' looking for beginning of value"),
		strings.Contains(lowerRaw, "<!doctype html>"),
		strings.Contains(lowerRaw, "<html"):
		return "the endpoint did not return an Elasticsearch-compatible API response, please check the address and port", tryConnectErrorKeyNonESEndpoint
	case strings.Contains(lowerRaw, "client sent an http request to an https server"),
		strings.Contains(lowerRaw, "server gave http response to https client"),
		strings.Contains(lowerRaw, "first record does not look like a tls handshake"):
		return "TLS setting does not match the cluster endpoint, please check whether HTTPS is enabled", tryConnectErrorKeyTLSMismatch
	case strings.Contains(lowerRaw, "missing authentication information"),
		strings.Contains(lowerRaw, "security_exception"),
		strings.Contains(lowerRaw, "unauthorized"),
		strings.Contains(lowerRaw, "invalid status code: 401"):
		return "authentication is required or invalid, please check the credential", tryConnectErrorKeyAuthRequired
	case strings.Contains(lowerRaw, "connection refused"),
		strings.Contains(lowerRaw, "no such host"),
		strings.Contains(lowerRaw, "context deadline exceeded"),
		strings.Contains(lowerRaw, "i/o timeout"),
		strings.Contains(lowerRaw, "timeout"),
		strings.Contains(lowerRaw, ": eof"),
		strings.HasSuffix(lowerRaw, " eof"):
		return "unable to connect to the cluster endpoint, please check the address, network accessibility, and TLS setting", tryConnectErrorKeyEndpointUnreachable
	case strings.Contains(lowerRaw, "invalid status code"):
		return "the cluster endpoint returned an unexpected status, please check the address, TLS setting, and credential", tryConnectErrorKeyUnexpectedStatus
	default:
		if raw == "" {
			return "cluster connection failed, please check the address, TLS setting, and credential", tryConnectErrorKeyDefault
		}
		return raw, tryConnectErrorKeyDefault
	}
}

func extractTryConnectReason(err error) string {
	if err == nil {
		return ""
	}

	raw := strings.TrimSpace(err.Error())
	if raw == "" {
		return raw
	}

	raw = strings.TrimPrefix(raw, "error on get cluster health: ")
	if !strings.HasPrefix(raw, "{") {
		return raw
	}

	payload := map[string]interface{}{}
	if json.Unmarshal([]byte(raw), &payload) != nil {
		return raw
	}

	if errorObj, ok := payload["error"].(map[string]interface{}); ok {
		if reason, ok := errorObj["reason"].(string); ok && reason != "" {
			return reason
		}
		if causes, ok := errorObj["root_cause"].([]interface{}); ok {
			for _, cause := range causes {
				if m, ok := cause.(map[string]interface{}); ok {
					if reason, ok := m["reason"].(string); ok && reason != "" {
						return reason
					}
				}
			}
		}
	}

	return raw
}

func fetchClusterHealth(endpoint string, config *elastic.ElasticsearchConfig) (*elastic.ClusterHealth, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req := util.Request{
		Method:  http.MethodGet,
		Url:     console_common.BuildEndpointWithPath(endpoint, "/_cluster/health"),
		Context: ctx,
	}
	if config.BasicAuth != nil && strings.TrimSpace(config.BasicAuth.Username) != "" {
		req.SetBasicAuth(config.BasicAuth.Username, config.BasicAuth.Password.Get())
	}

	res, err := util.ExecuteRequestWithCatchFlag(nil, &req, true)
	if err != nil {
		return nil, err
	}
	if res.StatusCode > 300 || res.StatusCode == 0 {
		return nil, errors.New(fmt.Sprintf("invalid status code: %d", res.StatusCode))
	}

	healthInfo := &elastic.ClusterHealth{}
	err = json.Unmarshal(res.Body, healthInfo)
	if err != nil {
		return nil, err
	}
	return healthInfo, nil
}
