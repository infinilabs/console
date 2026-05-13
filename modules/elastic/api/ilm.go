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

const (
	elasticsearchWaitForSnapshotMinVersion       = "8.1.0"
	elasticsearchDeleteSearchableSnapshotVersion = "8.13.0"
)

func sanitizeILMPolicyForTarget(requester rawRequester, cfg *elastic.ElasticsearchConfig, policyConfig []byte) ([]byte, error) {
	if len(policyConfig) == 0 {
		return policyConfig, nil
	}
	payload := map[string]interface{}{}
	if err := util.FromJSONBytes(policyConfig, &payload); err != nil {
		return nil, err
	}
	changed, err := sanitizeILMPolicyPayload(requester, cfg, payload)
	if err != nil {
		return nil, err
	}
	if !changed {
		return policyConfig, nil
	}
	return util.MustToJSONBytes(payload), nil
}

func sanitizeILMPolicyPayload(requester rawRequester, cfg *elastic.ElasticsearchConfig, payload map[string]interface{}) (bool, error) {
	switch {
	case strings.EqualFold(cfg.Distribution, elastic.Opensearch):
		return removeUnsupportedDeleteActionsFromISM(payload), nil
	case strings.EqualFold(cfg.Distribution, elastic.Easysearch):
		return removeUnsupportedDeleteActionsFromPhases(payload, false, false), nil
	default:
		return removeMissingSLMReferences(requester, cfg, payload)
	}
}

func removeMissingSLMReferences(requester rawRequester, cfg *elastic.ElasticsearchConfig, payload map[string]interface{}) (bool, error) {
	waitForSnapshotSupported := supportsElasticsearchDeleteAction(cfg, elasticsearchWaitForSnapshotMinVersion)
	deleteSearchableSnapshotSupported := supportsElasticsearchDeleteAction(cfg, elasticsearchDeleteSearchableSnapshotVersion)
	changed := removeUnsupportedDeleteActionsFromPhases(payload, waitForSnapshotSupported, deleteSearchableSnapshotSupported)
	phases := getILMPhases(payload)
	if len(phases) == 0 {
		return changed, nil
	}
	existsCache := map[string]bool{}
	if !waitForSnapshotSupported {
		return changed, nil
	}
	for _, phaseValue := range phases {
		phase, ok := phaseValue.(map[string]interface{})
		if !ok || phase == nil {
			continue
		}
		actions, ok := phase["actions"].(map[string]interface{})
		if !ok || actions == nil {
			continue
		}
		waitForSnapshot, ok := actions["wait_for_snapshot"].(map[string]interface{})
		if !ok || waitForSnapshot == nil {
			continue
		}
		policyName := strings.TrimSpace(util.ToString(waitForSnapshot["policy"]))
		if policyName == "" {
			delete(actions, "wait_for_snapshot")
			changed = true
			continue
		}
		exists, cached := existsCache[policyName]
		if !cached {
			statusCode := http.StatusOK
			_, statusCode, err := rawJSONRequestWithRequester(requester, cfg, util.Verb_GET, "/_slm/policy/"+url.PathEscape(policyName), nil)
			if err != nil && statusCode != http.StatusNotFound {
				return changed, err
			}
			exists = statusCode != http.StatusNotFound
			existsCache[policyName] = exists
		}
		if !exists {
			delete(actions, "wait_for_snapshot")
			changed = true
		}
	}
	return changed, nil
}

func removeUnsupportedDeleteActionsFromPhases(payload map[string]interface{}, waitForSnapshotSupported bool, deleteSearchableSnapshotSupported bool) bool {
	phases := getILMPhases(payload)
	if len(phases) == 0 {
		return false
	}
	changed := false
	for _, phaseValue := range phases {
		phase, ok := phaseValue.(map[string]interface{})
		if !ok || phase == nil {
			continue
		}
		actions, ok := phase["actions"].(map[string]interface{})
		if !ok || actions == nil {
			continue
		}
		if !waitForSnapshotSupported {
			if _, exists := actions["wait_for_snapshot"]; exists {
				delete(actions, "wait_for_snapshot")
				changed = true
			}
		}
		deleteAction, ok := actions["delete"].(map[string]interface{})
		if !ok || deleteAction == nil {
			continue
		}
		if !deleteSearchableSnapshotSupported {
			if _, exists := deleteAction["delete_searchable_snapshot"]; exists {
				delete(deleteAction, "delete_searchable_snapshot")
				changed = true
			}
		}
	}
	return changed
}

func removeUnsupportedDeleteActionsFromISM(payload map[string]interface{}) bool {
	policy, _ := payload["policy"].(map[string]interface{})
	states, _ := policy["states"].([]interface{})
	if len(states) == 0 {
		return false
	}
	changed := false
	for _, stateValue := range states {
		state, ok := stateValue.(map[string]interface{})
		if !ok || state == nil {
			continue
		}
		actions, _ := state["actions"].([]interface{})
		if len(actions) == 0 {
			continue
		}
		filtered := actions[:0]
		for _, actionValue := range actions {
			action, ok := actionValue.(map[string]interface{})
			if !ok || action == nil {
				filtered = append(filtered, actionValue)
				continue
			}
			if _, exists := action["wait_for_snapshot"]; exists {
				changed = true
				continue
			}
			deleteAction, ok := action["delete"].(map[string]interface{})
			if ok && deleteAction != nil {
				if _, exists := deleteAction["delete_searchable_snapshot"]; exists {
					delete(deleteAction, "delete_searchable_snapshot")
					changed = true
				}
			}
			filtered = append(filtered, actionValue)
		}
		state["actions"] = filtered
	}
	return changed
}

func supportsElasticsearchDeleteAction(cfg *elastic.ElasticsearchConfig, minVersion string) bool {
	if cfg == nil || !strings.EqualFold(cfg.Distribution, elastic.Elasticsearch) {
		return false
	}
	if strings.TrimSpace(cfg.Version) == "" {
		return false
	}
	cr, err := util.VersionCompare(cfg.Version, minVersion)
	if err != nil {
		return false
	}
	return cr >= 0
}

func getILMPhases(payload map[string]interface{}) map[string]interface{} {
	policy, _ := payload["policy"].(map[string]interface{})
	phases, _ := policy["phases"].(map[string]interface{})
	return phases
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
	sanitizedPolicyConfig, err := sanitizeILMPolicyForTarget(requester, cfg, policyConfig)
	if err != nil {
		return err
	}
	return putVersionedILMPolicy(requester, cfg, "/_ilm/policy/"+url.PathEscape(policy), sanitizedPolicyConfig)
}

func putOpensearchILMPolicy(clusterID, policy string, policyConfig []byte) error {
	cfg := elastic.GetConfig(clusterID)
	client := elastic.GetClient(clusterID)
	requester, ok := client.(rawRequester)
	if !ok {
		return fmt.Errorf("cluster client does not support raw requests")
	}
	sanitizedPolicyConfig, err := sanitizeILMPolicyForTarget(requester, cfg, policyConfig)
	if err != nil {
		return err
	}
	return putVersionedILMPolicy(requester, cfg, "/_plugins/_ism/policies/"+url.PathEscape(policy), sanitizedPolicyConfig)
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
	requester, requesterOK := esClient.(rawRequester)
	if requesterOK {
		reqBody, err = sanitizeILMPolicyForTarget(requester, cfg, reqBody)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
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
