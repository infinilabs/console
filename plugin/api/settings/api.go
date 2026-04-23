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

package settings

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	log "github.com/cihub/seelog"
	"infini.sh/console/core"
	"infini.sh/console/core/security/enum"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	elasticCommon "infini.sh/framework/modules/elastic/common"
)

type SettingsAPI struct {
	core.Handler
}

type rawRequester interface {
	Request(ctx context.Context, method, url string, body []byte) (*util.Result, error)
}

type rollupSettingsRequest struct {
	Enabled bool `json:"enabled"`
}

type retentionSettingsRequest struct {
	Days    int    `json:"days"`
	MaxSize string `json:"max_size"`
}

const defaultRetentionDays = 30
const defaultRetentionMaxSize = "50gb"

var retentionPolicyPattern = regexp.MustCompile(`-(\d+)days-retention$`)
var retentionSizePattern = regexp.MustCompile(`(?i)^(\d+)([kmgt]b?|b)$`)

func InitAPI() {
	handler := SettingsAPI{}
	api.HandleAPIMethod(api.GET, "/setting/system/retention", handler.RequirePermission(handler.getRetentionSetting, enum.PermissionElasticsearchClusterRead))
	api.HandleAPIMethod(api.PUT, "/setting/system/retention", handler.RequireSecureTransport(handler.RequireReplayProtection(handler.RequirePermission(handler.updateRetentionSetting, enum.PermissionElasticsearchClusterWrite))))
	api.HandleAPIMethod(api.GET, "/setting/system/rollup", handler.RequirePermission(handler.getRollupSetting, enum.PermissionElasticsearchClusterRead))
	api.HandleAPIMethod(api.PUT, "/setting/system/rollup", handler.RequireSecureTransport(handler.RequireReplayProtection(handler.RequirePermission(handler.updateRollupSetting, enum.PermissionElasticsearchClusterWrite))))
}

func resolveSystemIndexPrefix() string {
	ormConfig := elasticCommon.ORMConfig{}
	_, err := env.ParseConfig("elastic.orm", &ormConfig)
	if err != nil {
		log.Warn(err)
	}
	indexPrefix := strings.TrimSpace(ormConfig.IndexPrefix)
	if indexPrefix == "" {
		indexPrefix = ".infini_"
	}
	return indexPrefix
}

func getMetricsRetentionPolicyID(indexPrefix string, days int) string {
	return fmt.Sprintf("ilm_%smetrics-%ddays-retention", indexPrefix, days)
}

func getRollupRetentionPolicyID(indexPrefix string, days int) string {
	return fmt.Sprintf("ilm_%srollup-%ddays-retention", indexPrefix, days)
}

func getManagedRetentionTemplateNames(indexPrefix string) []string {
	return []string{
		indexPrefix + "metrics-rollover",
		indexPrefix + "logs-rollover",
		indexPrefix + "requests_logging-rollover",
		indexPrefix + "async_bulk_results-rollover",
		indexPrefix + "alert-history-rollover",
		indexPrefix + "activities-rollover",
	}
}

func getManagedRetentionIndexPatterns(indexPrefix string) []string {
	return []string{
		indexPrefix + "metrics*",
		indexPrefix + "logs*",
		indexPrefix + "requests_logging*",
		indexPrefix + "async_bulk_results*",
		indexPrefix + "alert-history*",
		indexPrefix + "activities*",
	}
}

func castMap(value interface{}) (map[string]interface{}, bool) {
	switch v := value.(type) {
	case map[string]interface{}:
		return v, true
	case util.MapStr:
		return v, true
	default:
		return nil, false
	}
}

func castSlice(value interface{}) ([]interface{}, bool) {
	items, ok := value.([]interface{})
	return items, ok
}

func parseRetentionDays(value interface{}) (int, error) {
	if value == nil {
		return 0, fmt.Errorf("retention value is empty")
	}
	rawValue := strings.TrimSpace(fmt.Sprint(value))
	if rawValue == "" || rawValue == "<nil>" {
		return 0, fmt.Errorf("retention value is empty")
	}
	rawValue = strings.TrimSuffix(rawValue, "d")
	days, err := strconv.Atoi(rawValue)
	if err != nil || days <= 0 {
		return 0, fmt.Errorf("invalid retention value: %v", value)
	}
	return days, nil
}

func parseRetentionDaysFromPolicyID(policyID string) (int, error) {
	matches := retentionPolicyPattern.FindStringSubmatch(strings.TrimSpace(policyID))
	if len(matches) != 2 {
		return 0, fmt.Errorf("retention days not found in policy id: %s", policyID)
	}
	return parseRetentionDays(matches[1])
}

func normalizeRetentionSize(value interface{}) (string, error) {
	rawValue := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(fmt.Sprint(value)), " ", ""))
	if rawValue == "" || rawValue == "<nil>" {
		return "", fmt.Errorf("retention size is empty")
	}
	if _, err := util.ToBytes(rawValue); err != nil {
		return "", err
	}
	matches := retentionSizePattern.FindStringSubmatch(rawValue)
	if len(matches) != 3 {
		return "", fmt.Errorf("invalid retention size: %v", value)
	}
	unit := strings.ToLower(matches[2])
	switch unit {
	case "k":
		unit = "kb"
	case "m":
		unit = "mb"
	case "g":
		unit = "gb"
	case "t":
		unit = "tb"
	}
	return matches[1] + unit, nil
}

func rawJSONRequest(requester rawRequester, cfg *elastic.ElasticsearchConfig, method, path string, payload interface{}) (map[string]interface{}, int, error) {
	var body []byte
	if payload != nil {
		body = util.MustToJSONBytes(payload)
	}
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

func getLegacyTemplate(requester rawRequester, cfg *elastic.ElasticsearchConfig, templateName string) (map[string]interface{}, int, error) {
	response, statusCode, err := rawJSONRequest(requester, cfg, util.Verb_GET, "/_template/"+templateName, nil)
	if err != nil || statusCode == http.StatusNotFound {
		return nil, statusCode, err
	}
	template, ok := castMap(response[templateName])
	if !ok {
		return nil, statusCode, fmt.Errorf("template %s payload not found", templateName)
	}
	return template, statusCode, nil
}

func putLegacyTemplate(requester rawRequester, cfg *elastic.ElasticsearchConfig, templateName string, template map[string]interface{}) error {
	_, _, err := rawJSONRequest(requester, cfg, util.Verb_PUT, "/_template/"+templateName, template)
	return err
}

func readTemplateLifecyclePolicyID(template map[string]interface{}) (string, error) {
	settings, ok := castMap(template["settings"])
	if !ok {
		return "", fmt.Errorf("template settings not found")
	}
	if policyID, ok := settings["index.lifecycle.name"]; ok {
		value := strings.TrimSpace(fmt.Sprint(policyID))
		if value != "" && value != "<nil>" {
			return value, nil
		}
	}
	if indexSettings, ok := castMap(settings["index"]); ok {
		if lifecycle, ok := castMap(indexSettings["lifecycle"]); ok {
			value := strings.TrimSpace(fmt.Sprint(lifecycle["name"]))
			if value != "" && value != "<nil>" {
				return value, nil
			}
		}
	}
	return "", fmt.Errorf("template lifecycle policy not found")
}

func setTemplateLifecyclePolicyID(template map[string]interface{}, policyID string) error {
	settings, ok := castMap(template["settings"])
	if !ok {
		return fmt.Errorf("template settings not found")
	}
	updated := false
	if _, exists := settings["index.lifecycle.name"]; exists {
		settings["index.lifecycle.name"] = policyID
		updated = true
	}
	if indexSettings, ok := castMap(settings["index"]); ok {
		if lifecycle, ok := castMap(indexSettings["lifecycle"]); ok {
			lifecycle["name"] = policyID
			updated = true
		}
	}
	if !updated {
		return fmt.Errorf("template lifecycle policy not found")
	}
	return nil
}

func getILMPolicy(requester rawRequester, cfg *elastic.ElasticsearchConfig, policyID string) (map[string]interface{}, int, error) {
	response, statusCode, err := rawJSONRequest(
		requester,
		cfg,
		util.Verb_GET,
		"/_ilm/policy/"+url.PathEscape(policyID),
		nil,
	)
	if err != nil || statusCode == http.StatusNotFound {
		return nil, statusCode, err
	}
	policy, err := extractILMPolicy(response, policyID)
	if err != nil {
		return nil, statusCode, err
	}
	return policy, statusCode, nil
}

func extractILMPolicy(response map[string]interface{}, policyID string) (map[string]interface{}, error) {
	if policyWrapper, ok := castMap(response[policyID]); ok {
		if policy, ok := castMap(policyWrapper["policy"]); ok {
			return policy, nil
		}
		return nil, fmt.Errorf("ilm policy body not found")
	}

	if policy, ok := castMap(response["policy"]); ok {
		return policy, nil
	}

	if len(response) == 1 {
		for _, value := range response {
			if policyWrapper, ok := castMap(value); ok {
				if policy, ok := castMap(policyWrapper["policy"]); ok {
					return policy, nil
				}
			}
		}
	}

	return nil, fmt.Errorf("ilm policy payload not found")
}

func normalizeILMActionForPut(actionName string, rawConfig interface{}) (string, interface{}, bool) {
	switch actionName {
	case "retry", "timeout":
		return "", nil, false
	}

	config, ok := castMap(rawConfig)
	if !ok {
		if rawConfig == nil {
			return actionName, util.MapStr{}, true
		}
		return actionName, rawConfig, true
	}

	normalized := util.MapStr{}
	for key, value := range config {
		normalized[key] = value
	}

	switch actionName {
	case "rollover":
		if value, exists := normalized["min_index_age"]; exists {
			if _, hasMaxAge := normalized["max_age"]; !hasMaxAge {
				normalized["max_age"] = value
			}
			delete(normalized, "min_index_age")
		}
		if value, exists := normalized["min_size"]; exists {
			if _, hasMaxSize := normalized["max_size"]; !hasMaxSize {
				normalized["max_size"] = value
			}
			delete(normalized, "min_size")
		}
		if value, exists := normalized["min_doc_count"]; exists {
			if _, hasMaxDocs := normalized["max_docs"]; !hasMaxDocs {
				normalized["max_docs"] = value
			}
			delete(normalized, "min_doc_count")
		}
	case "index_priority":
		actionName = "set_priority"
	case "allocation":
		actionName = "allocate"
		delete(normalized, "wait_for")
	case "force_merge":
		actionName = "forcemerge"
	case "read_only":
		actionName = "readonly"
	}

	return actionName, normalized, true
}

func normalizeILMPolicyForPut(policy map[string]interface{}) (map[string]interface{}, error) {
	if phases, ok := castMap(policy["phases"]); ok {
		return util.MapStr{
			"phases": phases,
		}, nil
	}

	states, ok := castSlice(policy["states"])
	if !ok {
		return nil, fmt.Errorf("ilm phases not found")
	}

	phaseMinAge := map[string]interface{}{
		"hot": "0ms",
	}
	phaseBodies := util.MapStr{}

	for _, stateValue := range states {
		state, ok := castMap(stateValue)
		if !ok {
			continue
		}

		stateName := strings.TrimSpace(fmt.Sprint(state["name"]))
		if stateName == "" || stateName == "<nil>" {
			continue
		}

		if transitions, ok := castSlice(state["transitions"]); ok {
			for _, transitionValue := range transitions {
				transition, ok := castMap(transitionValue)
				if !ok {
					continue
				}
				targetState := strings.TrimSpace(fmt.Sprint(transition["state_name"]))
				if targetState == "" || targetState == "<nil>" {
					continue
				}
				if conditions, ok := castMap(transition["conditions"]); ok {
					if minIndexAge, exists := conditions["min_index_age"]; exists {
						phaseMinAge[targetState] = minIndexAge
					}
				}
			}
		}

		phase := util.MapStr{}
		if minAge, exists := phaseMinAge[stateName]; exists {
			phase["min_age"] = minAge
		}

		phaseActions := util.MapStr{}
		if actions, ok := castSlice(state["actions"]); ok {
			for _, actionValue := range actions {
				action, ok := castMap(actionValue)
				if !ok {
					continue
				}
				for actionName, actionConfig := range action {
					normalizedName, normalizedConfig, shouldInclude := normalizeILMActionForPut(actionName, actionConfig)
					if !shouldInclude {
						continue
					}
					phaseActions[normalizedName] = normalizedConfig
				}
			}
		}
		if len(phaseActions) > 0 {
			phase["actions"] = phaseActions
		}

		phaseBodies[stateName] = phase
	}

	if len(phaseBodies) == 0 {
		return nil, fmt.Errorf("ilm phases not found")
	}

	for phaseName, minAge := range phaseMinAge {
		if phase, ok := castMap(phaseBodies[phaseName]); ok {
			if _, exists := phase["min_age"]; !exists {
				phase["min_age"] = minAge
			}
		}
	}

	return util.MapStr{
		"phases": phaseBodies,
	}, nil
}

func putILMPolicy(requester rawRequester, cfg *elastic.ElasticsearchConfig, policyID string, policy map[string]interface{}) error {
	normalizedPolicy, err := normalizeILMPolicyForPut(policy)
	if err != nil {
		return err
	}
	_, _, err = rawJSONRequest(
		requester,
		cfg,
		util.Verb_PUT,
		"/_ilm/policy/"+url.PathEscape(policyID),
		util.MapStr{"policy": normalizedPolicy},
	)
	return err
}

func deleteILMPolicy(requester rawRequester, cfg *elastic.ElasticsearchConfig, policyID string) error {
	_, _, err := rawJSONRequest(
		requester,
		cfg,
		util.Verb_DELETE,
		"/_ilm/policy/"+url.PathEscape(policyID),
		nil,
	)
	return err
}

func getILMRetentionDays(policy map[string]interface{}) (int, error) {
	phases, ok := castMap(policy["phases"])
	if ok {
		if deletePhase, ok := castMap(phases["delete"]); ok {
			if days, err := parseRetentionDays(deletePhase["min_age"]); err == nil {
				return days, nil
			}
		}
		if hotPhase, ok := castMap(phases["hot"]); ok {
			if actions, ok := castMap(hotPhase["actions"]); ok {
				if rollover, ok := castMap(actions["rollover"]); ok {
					return parseRetentionDays(rollover["max_age"])
				}
			}
		}
	}
	if _, ok := castSlice(policy["states"]); ok {
		return getISMRetentionDays(policy)
	}
	return 0, fmt.Errorf("ilm phases not found")
}

func getILMRetentionMaxSize(policy map[string]interface{}) (string, error) {
	phases, ok := castMap(policy["phases"])
	if ok {
		if hotPhase, ok := castMap(phases["hot"]); ok {
			if actions, ok := castMap(hotPhase["actions"]); ok {
				if rollover, ok := castMap(actions["rollover"]); ok {
					return normalizeRetentionSize(rollover["max_size"])
				}
			}
		}
	}
	if _, ok := castSlice(policy["states"]); ok {
		return getISMRetentionMaxSize(policy)
	}
	return "", fmt.Errorf("ilm rollover max_size not found")
}

func setILMRetentionDays(policy map[string]interface{}, days int) error {
	phases, ok := castMap(policy["phases"])
	if ok {
		retention := fmt.Sprintf("%dd", days)
		updated := false
		if hotPhase, ok := castMap(phases["hot"]); ok {
			if actions, ok := castMap(hotPhase["actions"]); ok {
				if rollover, ok := castMap(actions["rollover"]); ok {
					rollover["max_age"] = retention
					updated = true
				}
			}
		}
		if deletePhase, ok := castMap(phases["delete"]); ok {
			deletePhase["min_age"] = retention
			updated = true
		}
		if !updated {
			return fmt.Errorf("ilm retention settings not found")
		}
		return nil
	}
	if _, ok := castSlice(policy["states"]); ok {
		return setISMRetentionDays(policy, days)
	}
	return fmt.Errorf("ilm phases not found")
}

func setILMRetentionMaxSize(policy map[string]interface{}, size string) error {
	normalizedSize, err := normalizeRetentionSize(size)
	if err != nil {
		return err
	}
	phases, ok := castMap(policy["phases"])
	if ok {
		if hotPhase, ok := castMap(phases["hot"]); ok {
			if actions, ok := castMap(hotPhase["actions"]); ok {
				if rollover, ok := castMap(actions["rollover"]); ok {
					rollover["max_size"] = normalizedSize
					return nil
				}
			}
		}
		return fmt.Errorf("ilm rollover settings not found")
	}
	if _, ok := castSlice(policy["states"]); ok {
		return setISMRetentionMaxSize(policy, normalizedSize)
	}
	return fmt.Errorf("ilm phases not found")
}

func setRollupILMRetentionDays(policy map[string]interface{}, days int) error {
	phases, ok := castMap(policy["phases"])
	if ok {
		deletePhase, ok := castMap(phases["delete"])
		if !ok {
			return fmt.Errorf("ilm delete phase not found")
		}
		retention := fmt.Sprintf("%dd", days)
		deletePhase["min_age"] = retention
		if actions, ok := castMap(deletePhase["actions"]); ok {
			if deleteAction, ok := castMap(actions["delete"]); ok {
				if _, exists := deleteAction["min_data_age"]; exists {
					deleteAction["min_data_age"] = retention
				}
			}
		}
		return nil
	}
	states, ok := castSlice(policy["states"])
	if !ok {
		return fmt.Errorf("ilm phases not found")
	}
	retention := fmt.Sprintf("%dd", days)
	updated := false
	for _, stateValue := range states {
		state, ok := castMap(stateValue)
		if !ok {
			continue
		}
		if transitions, ok := castSlice(state["transitions"]); ok {
			for _, transitionValue := range transitions {
				transition, ok := castMap(transitionValue)
				if !ok {
					continue
				}
				if conditions, ok := castMap(transition["conditions"]); ok {
					if _, exists := conditions["min_index_age"]; exists {
						conditions["min_index_age"] = retention
						updated = true
					}
				}
			}
		}
		if actions, ok := castSlice(state["actions"]); ok {
			for _, actionValue := range actions {
				action, ok := castMap(actionValue)
				if !ok {
					continue
				}
				if deleteAction, ok := castMap(action["delete"]); ok {
					if _, exists := deleteAction["min_data_age"]; exists {
						deleteAction["min_data_age"] = retention
						updated = true
					}
				}
			}
		}
	}
	if !updated {
		return fmt.Errorf("ilm retention settings not found")
	}
	return nil
}

func getISMRetentionDays(policy map[string]interface{}) (int, error) {
	states, ok := castSlice(policy["states"])
	if !ok {
		return 0, fmt.Errorf("ism states not found")
	}
	for _, stateValue := range states {
		state, ok := castMap(stateValue)
		if !ok {
			continue
		}
		if transitions, ok := castSlice(state["transitions"]); ok {
			for _, transitionValue := range transitions {
				transition, ok := castMap(transitionValue)
				if !ok {
					continue
				}
				if conditions, ok := castMap(transition["conditions"]); ok {
					if days, err := parseRetentionDays(conditions["min_index_age"]); err == nil {
						return days, nil
					}
				}
			}
		}
		if actions, ok := castSlice(state["actions"]); ok {
			for _, actionValue := range actions {
				action, ok := castMap(actionValue)
				if !ok {
					continue
				}
				if rollover, ok := castMap(action["rollover"]); ok {
					if days, err := parseRetentionDays(rollover["min_index_age"]); err == nil {
						return days, nil
					}
				}
			}
		}
	}
	return 0, fmt.Errorf("ism retention days not found")
}

func getISMRetentionMaxSize(policy map[string]interface{}) (string, error) {
	states, ok := castSlice(policy["states"])
	if !ok {
		return "", fmt.Errorf("ism states not found")
	}
	for _, stateValue := range states {
		state, ok := castMap(stateValue)
		if !ok {
			continue
		}
		if actions, ok := castSlice(state["actions"]); ok {
			for _, actionValue := range actions {
				action, ok := castMap(actionValue)
				if !ok {
					continue
				}
				if rollover, ok := castMap(action["rollover"]); ok {
					if size, err := normalizeRetentionSize(rollover["min_size"]); err == nil {
						return size, nil
					}
				}
			}
		}
	}
	return "", fmt.Errorf("ism retention max size not found")
}

func setISMRetentionDays(policy map[string]interface{}, days int) error {
	states, ok := castSlice(policy["states"])
	if !ok {
		return fmt.Errorf("ism states not found")
	}
	retention := fmt.Sprintf("%dd", days)
	updated := false
	for _, stateValue := range states {
		state, ok := castMap(stateValue)
		if !ok {
			continue
		}
		if actions, ok := castSlice(state["actions"]); ok {
			for _, actionValue := range actions {
				action, ok := castMap(actionValue)
				if !ok {
					continue
				}
				if rollover, ok := castMap(action["rollover"]); ok {
					rollover["min_index_age"] = retention
					updated = true
				}
			}
		}
		if transitions, ok := castSlice(state["transitions"]); ok {
			for _, transitionValue := range transitions {
				transition, ok := castMap(transitionValue)
				if !ok {
					continue
				}
				if conditions, ok := castMap(transition["conditions"]); ok {
					if _, exists := conditions["min_index_age"]; exists {
						conditions["min_index_age"] = retention
						updated = true
					}
				}
			}
		}
	}
	if !updated {
		return fmt.Errorf("ism retention settings not found")
	}
	return nil
}

func setISMRetentionMaxSize(policy map[string]interface{}, size string) error {
	normalizedSize, err := normalizeRetentionSize(size)
	if err != nil {
		return err
	}
	states, ok := castSlice(policy["states"])
	if !ok {
		return fmt.Errorf("ism states not found")
	}
	updated := false
	for _, stateValue := range states {
		state, ok := castMap(stateValue)
		if !ok {
			continue
		}
		if actions, ok := castSlice(state["actions"]); ok {
			for _, actionValue := range actions {
				action, ok := castMap(actionValue)
				if !ok {
					continue
				}
				if rollover, ok := castMap(action["rollover"]); ok {
					rollover["min_size"] = normalizedSize
					updated = true
				}
			}
		}
	}
	if !updated {
		return fmt.Errorf("ism rollover settings not found")
	}
	return nil
}

func getRetentionSettings(client elastic.API, cfg *elastic.ElasticsearchConfig) (int, string, error) {
	requester, ok := client.(rawRequester)
	if !ok {
		return 0, "", fmt.Errorf("cluster client does not support raw requests")
	}
	indexPrefix := resolveSystemIndexPrefix()
	if strings.EqualFold(cfg.Distribution, elastic.Opensearch) {
		policyID := getMetricsRetentionPolicyID(indexPrefix, defaultRetentionDays)
		response, statusCode, err := rawJSONRequest(
			requester,
			cfg,
			util.Verb_GET,
			"/_plugins/_ism/policies/"+url.PathEscape(policyID),
			nil,
		)
		if err != nil {
			return 0, "", err
		}
		if statusCode == http.StatusNotFound {
			return defaultRetentionDays, defaultRetentionMaxSize, nil
		}
		policy, ok := castMap(response["policy"])
		if !ok {
			return 0, "", fmt.Errorf("ism policy payload not found")
		}
		days, err := getISMRetentionDays(policy)
		if err != nil {
			return 0, "", err
		}
		maxSize, err := getISMRetentionMaxSize(policy)
		if err != nil {
			maxSize = defaultRetentionMaxSize
		}
		return days, maxSize, nil
	}

	currentMetricsPolicyID := getMetricsRetentionPolicyID(indexPrefix, defaultRetentionDays)
	template, statusCode, err := getLegacyTemplate(requester, cfg, indexPrefix+"metrics-rollover")
	if err != nil {
		return 0, "", err
	}
	currentDays := defaultRetentionDays
	if statusCode == http.StatusNotFound {
		return currentDays, defaultRetentionMaxSize, nil
	}
	if policyID, err := readTemplateLifecyclePolicyID(template); err == nil {
		currentMetricsPolicyID = policyID
		if days, parseErr := parseRetentionDaysFromPolicyID(policyID); parseErr == nil {
			currentDays = days
		}
	}

	policy, statusCode, err := getILMPolicy(requester, cfg, currentMetricsPolicyID)
	if err != nil {
		return 0, "", err
	}
	if statusCode == http.StatusNotFound {
		return currentDays, defaultRetentionMaxSize, nil
	}
	days, err := getILMRetentionDays(policy)
	if err != nil {
		return 0, "", err
	}
	maxSize, err := getILMRetentionMaxSize(policy)
	if err != nil {
		maxSize = defaultRetentionMaxSize
	}
	return days, maxSize, nil
}

func updateRetentionSettings(client elastic.API, cfg *elastic.ElasticsearchConfig, days int, maxSize string) error {
	requester, ok := client.(rawRequester)
	if !ok {
		return fmt.Errorf("cluster client does not support raw requests")
	}
	normalizedMaxSize, err := normalizeRetentionSize(maxSize)
	if err != nil {
		return err
	}
	indexPrefix := resolveSystemIndexPrefix()
	if strings.EqualFold(cfg.Distribution, elastic.Opensearch) {
		policyID := getMetricsRetentionPolicyID(indexPrefix, defaultRetentionDays)
		response, statusCode, err := rawJSONRequest(
			requester,
			cfg,
			util.Verb_GET,
			"/_plugins/_ism/policies/"+url.PathEscape(policyID),
			nil,
		)
		if err != nil {
			return err
		}
		if statusCode == http.StatusNotFound {
			return fmt.Errorf("ism policy %s not found", policyID)
		}
		policy, ok := castMap(response["policy"])
		if !ok {
			return fmt.Errorf("ism policy payload not found")
		}
		if err := setISMRetentionDays(policy, days); err != nil {
			return err
		}
		if err := setISMRetentionMaxSize(policy, normalizedMaxSize); err != nil {
			return err
		}
		_, _, err = rawJSONRequest(
			requester,
			cfg,
			util.Verb_PUT,
			"/_plugins/_ism/policies/"+url.PathEscape(policyID),
			util.MapStr{"policy": policy},
		)
		return err
	}

	currentMetricsPolicyID := getMetricsRetentionPolicyID(indexPrefix, defaultRetentionDays)
	if template, statusCode, err := getLegacyTemplate(requester, cfg, indexPrefix+"metrics-rollover"); err != nil {
		return err
	} else if statusCode != http.StatusNotFound {
		if policyID, err := readTemplateLifecyclePolicyID(template); err == nil {
			currentMetricsPolicyID = policyID
		}
	}
	newMetricsPolicyID := getMetricsRetentionPolicyID(indexPrefix, days)
	metricsPolicy, statusCode, err := getILMPolicy(requester, cfg, currentMetricsPolicyID)
	if err != nil {
		return err
	}
	if statusCode == http.StatusNotFound {
		return fmt.Errorf("ilm policy %s not found", currentMetricsPolicyID)
	}
	if err := setILMRetentionDays(metricsPolicy, days); err != nil {
		return err
	}
	if err := setILMRetentionMaxSize(metricsPolicy, normalizedMaxSize); err != nil {
		return err
	}
	if currentMetricsPolicyID != newMetricsPolicyID {
		if err := deleteILMPolicy(requester, cfg, newMetricsPolicyID); err != nil {
			return err
		}
	}
	if err := putILMPolicy(requester, cfg, newMetricsPolicyID, metricsPolicy); err != nil {
		return err
	}

	for _, templateName := range getManagedRetentionTemplateNames(indexPrefix) {
		template, statusCode, err := getLegacyTemplate(requester, cfg, templateName)
		if err != nil {
			return err
		}
		if statusCode == http.StatusNotFound {
			continue
		}
		if err := setTemplateLifecyclePolicyID(template, newMetricsPolicyID); err != nil {
			return err
		}
		if err := putLegacyTemplate(requester, cfg, templateName, template); err != nil {
			return err
		}
	}

	_, _, err = rawJSONRequest(
		requester,
		cfg,
		util.Verb_PUT,
		"/"+strings.Join(getManagedRetentionIndexPatterns(indexPrefix), ",")+"/_settings?allow_no_indices=true&ignore_unavailable=true",
		util.MapStr{
			"index": util.MapStr{
				"lifecycle": util.MapStr{
					"name": newMetricsPolicyID,
				},
			},
		},
	)
	if err != nil {
		return err
	}

	rollupTemplate, statusCode, err := getLegacyTemplate(requester, cfg, "rollup_policy_template")
	if err != nil {
		return err
	}
	if statusCode == http.StatusNotFound {
		return nil
	}
	currentRollupPolicyID, err := readTemplateLifecyclePolicyID(rollupTemplate)
	if err != nil {
		return err
	}
	newRollupPolicyID := getRollupRetentionPolicyID(indexPrefix, days)
	rollupPolicy, statusCode, err := getILMPolicy(requester, cfg, currentRollupPolicyID)
	if err != nil {
		return err
	}
	if statusCode == http.StatusNotFound {
		return fmt.Errorf("ilm policy %s not found", currentRollupPolicyID)
	}
	if err := setRollupILMRetentionDays(rollupPolicy, days); err != nil {
		return err
	}
	if currentRollupPolicyID != newRollupPolicyID {
		if err := deleteILMPolicy(requester, cfg, newRollupPolicyID); err != nil {
			return err
		}
	}
	if err := putILMPolicy(requester, cfg, newRollupPolicyID, rollupPolicy); err != nil {
		return err
	}
	if err := setTemplateLifecyclePolicyID(rollupTemplate, newRollupPolicyID); err != nil {
		return err
	}
	if err := putLegacyTemplate(requester, cfg, "rollup_policy_template", rollupTemplate); err != nil {
		return err
	}
	_, _, err = rawJSONRequest(
		requester,
		cfg,
		util.Verb_PUT,
		"/rollup*/_settings?allow_no_indices=true&ignore_unavailable=true",
		util.MapStr{
			"index.lifecycle.name": newRollupPolicyID,
		},
	)
	return err
}

func getRollupEnabled(client elastic.API) (bool, error) {
	settings, err := client.GetClusterSettings(nil)
	if err != nil {
		return false, err
	}
	rollupEnabled, _ := util.GetMapValueByKeys([]string{"persistent", "rollup", "search", "enabled"}, settings)
	switch value := rollupEnabled.(type) {
	case string:
		return strings.EqualFold(value, "true"), nil
	case bool:
		return value, nil
	default:
		return false, nil
	}
}

func getSystemClusterClient() (elastic.API, *elastic.ElasticsearchConfig, error) {
	systemClusterID := global.MustLookupString(elastic.GlobalSystemElasticsearchID)
	cfg := elastic.GetConfigNoPanic(systemClusterID)
	if cfg == nil {
		return nil, nil, fmt.Errorf("system cluster config not found")
	}
	client := elastic.GetClient(systemClusterID)
	if client == nil {
		return nil, nil, fmt.Errorf("system cluster client not found")
	}
	return client, cfg, nil
}

func (h *SettingsAPI) getRetentionSetting(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	client, cfg, err := getSystemClusterClient()
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	days, maxSize, err := getRetentionSettings(client, cfg)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, util.MapStr{
		"days":     days,
		"max_size": maxSize,
	}, http.StatusOK)
}

func (h *SettingsAPI) updateRetentionSetting(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	payload := retentionSettingsRequest{}
	body, err := h.GetRawBody(req)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := util.FromJSONBytes(body, &payload); err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}
	if payload.Days <= 0 {
		h.WriteError(w, "retention days must be greater than 0", http.StatusBadRequest)
		return
	}

	client, cfg, err := getSystemClusterClient()
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	currentMaxSize := defaultRetentionMaxSize
	if payload.MaxSize == "" {
		_, currentSize, err := getRetentionSettings(client, cfg)
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		currentMaxSize = currentSize
	} else {
		currentMaxSize = payload.MaxSize
	}
	normalizedMaxSize, err := normalizeRetentionSize(currentMaxSize)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := updateRetentionSettings(client, cfg, payload.Days, normalizedMaxSize); err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, util.MapStr{
		"days":     payload.Days,
		"max_size": normalizedMaxSize,
	}, http.StatusOK)
}

func updateRollupJobs(client elastic.API, cfg *elastic.ElasticsearchConfig, action string) error {
	requester, ok := client.(rawRequester)
	if !ok {
		return fmt.Errorf("cluster client does not support raw requests")
	}
	url := fmt.Sprintf("%s/_rollup/jobs/rollup*/_%s", cfg.GetAnyEndpoint(), action)
	resp, err := requester.Request(context.Background(), util.Verb_POST, url, nil)
	if err != nil {
		return err
	}
	if resp.StatusCode == http.StatusNotFound {
		return nil
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s", resp.Body)
	}
	return nil
}

func (h *SettingsAPI) getRollupSetting(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	client, _, err := getSystemClusterClient()
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	enabled, err := getRollupEnabled(client)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, util.MapStr{
		"enabled": enabled,
	}, http.StatusOK)
}

func (h *SettingsAPI) updateRollupSetting(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	payload := rollupSettingsRequest{}
	body, err := h.GetRawBody(req)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := util.FromJSONBytes(body, &payload); err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	client, cfg, err := getSystemClusterClient()
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !payload.Enabled {
		err = updateRollupJobs(client, cfg, "stop")
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	err = client.UpdateClusterSettings(util.MustToJSONBytes(util.MapStr{
		"persistent": util.MapStr{
			"rollup": util.MapStr{
				"search": util.MapStr{
					"enabled": fmt.Sprintf("%t", payload.Enabled),
				},
			},
		},
	}))
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if payload.Enabled {
		err = updateRollupJobs(client, cfg, "start")
		if err != nil {
			log.Error(err)
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	h.WriteJSON(w, util.MapStr{
		"enabled": payload.Enabled,
	}, http.StatusOK)
}
