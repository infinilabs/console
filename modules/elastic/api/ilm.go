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

/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"context"
	"encoding/json"
	"fmt"
	log "github.com/cihub/seelog"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

type rawRequester interface {
	Request(ctx context.Context, method, url string, body []byte) (*util.Result, error)
}

func rawJSONRequest(clusterID, method, path string, body []byte) (map[string]interface{}, int, error) {
	cfg := elastic.GetConfig(clusterID)
	client := elastic.GetClient(clusterID)
	requester, ok := client.(rawRequester)
	if !ok {
		return nil, 0, fmt.Errorf("cluster client does not support raw requests")
	}
	return rawJSONRequestWithRequester(requester, cfg, method, path, body)
}

func rawJSONRequestWithRequester(requester rawRequester, cfg *elastic.ElasticsearchConfig, method, path string, body []byte) (map[string]interface{}, int, error) {
	requestURL := fmt.Sprintf("%s%s", strings.TrimRight(cfg.GetAnyEndpoint(), "/"), path)
	resp, err := requester.Request(context.Background(), method, requestURL, body)
	if err != nil {
		return nil, 0, err
	}
	if resp.StatusCode == http.StatusNotFound {
		return nil, resp.StatusCode, nil
	}
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, resp.StatusCode, fmt.Errorf("%s", resp.Body)
	}
	if len(resp.Body) == 0 {
		return map[string]interface{}{}, resp.StatusCode, nil
	}
	result := map[string]interface{}{}
	if err := util.FromJSONBytes(resp.Body, &result); err != nil {
		return nil, resp.StatusCode, err
	}
	return result, resp.StatusCode, nil
}

func parseInt64(value interface{}) int64 {
	switch v := value.(type) {
	case json.Number:
		i, _ := v.Int64()
		return i
	case float64:
		return int64(v)
	case int64:
		return v
	case int:
		return int64(v)
	case string:
		i, _ := strconv.ParseInt(v, 10, 64)
		return i
	default:
		return 0
	}
}

func putVersionedILMPolicy(requester rawRequester, cfg *elastic.ElasticsearchConfig, path string, policyConfig []byte) error {
	current, statusCode, err := rawJSONRequestWithRequester(requester, cfg, util.Verb_GET, path, nil)
	if err != nil && statusCode != http.StatusNotFound {
		return err
	}
	if statusCode != http.StatusNotFound {
		seqNo := parseInt64(current["_seq_no"])
		primaryTerm := parseInt64(current["_primary_term"])
		path += fmt.Sprintf("?if_seq_no=%d&if_primary_term=%d", seqNo, primaryTerm)
	}
	_, _, err = rawJSONRequestWithRequester(requester, cfg, util.Verb_PUT, path, policyConfig)
	return err
}

func putEasysearchILMPolicy(clusterID, policy string, policyConfig []byte) error {
	cfg := elastic.GetConfig(clusterID)
	client := elastic.GetClient(clusterID)
	requester, ok := client.(rawRequester)
	if !ok {
		return fmt.Errorf("cluster client does not support raw requests")
	}
	return putVersionedILMPolicy(requester, cfg, "/_ilm/policy/"+url.PathEscape(policy), policyConfig)
}

func putOpensearchILMPolicy(clusterID, policy string, policyConfig []byte) error {
	cfg := elastic.GetConfig(clusterID)
	client := elastic.GetClient(clusterID)
	requester, ok := client.(rawRequester)
	if !ok {
		return fmt.Errorf("cluster client does not support raw requests")
	}
	return putVersionedILMPolicy(requester, cfg, "/_plugins/_ism/policies/"+url.PathEscape(policy), policyConfig)
}

func (h *APIHandler) HandleGetILMPolicyAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	esClient := elastic.GetClient(clusterID)
	policies, err := esClient.GetILMPolicy("")
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, policies, http.StatusOK)
}

func (h *APIHandler) HandleSaveILMPolicyAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	policy := ps.MustGetParameter("policy")
	esClient := elastic.GetClient(clusterID)
	cfg := elastic.GetConfig(clusterID)
	reqBody, err := io.ReadAll(req.Body)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if strings.EqualFold(cfg.Distribution, elastic.Easysearch) {
		err = putEasysearchILMPolicy(clusterID, policy, reqBody)
	} else if strings.EqualFold(cfg.Distribution, elastic.Opensearch) {
		err = putOpensearchILMPolicy(clusterID, policy, reqBody)
	} else {
		err = esClient.PutILMPolicy(policy, reqBody)
	}
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteAckOKJSON(w)
}

func (h *APIHandler) HandleDeleteILMPolicyAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterID := ps.MustGetParameter("id")
	policy := ps.MustGetParameter("policy")
	esClient := elastic.GetClient(clusterID)
	err := esClient.DeleteILMPolicy(policy)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteAckOKJSON(w)
}
