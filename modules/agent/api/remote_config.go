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
	"bytes"
	"fmt"
	log "github.com/cihub/seelog"
	console_common "infini.sh/console/common"
	agent_common "infini.sh/console/modules/agent/common"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/keystore"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	keystore2 "infini.sh/framework/lib/keystore"
	"infini.sh/framework/modules/configs/common"
	common2 "infini.sh/framework/modules/elastic/common"
	metadata2 "infini.sh/framework/modules/elastic/metadata"
	"net"
	"net/url"
	"regexp"
	"strings"
	"time"
)

const systemClusterPassKey = "SYSTEM_CLUSTER_PASS"
const systemClusterIngestPasswordKey = "SYSTEM_CLUSTER_INGEST_PASSWORD"
const relayGatewayIngestPort = "8081"

var systemIngestSchemaLineRegexp = regexp.MustCompile(`(?m)^(\s*schema:\s*).*$`)
var systemIngestHostsLineRegexp = regexp.MustCompile(`(?m)^(\s*hosts:\s*).*$`)
var systemIngestTLSBlockRegexp = regexp.MustCompile(`(?ms)^\s*#\s*tls:\s*#for mTLS connection with config servers\s*\n^\s*#\s*enabled:\s*true\s*\n^\s*#\s*ca_file:\s*/xxx/ca\.crt\s*\n^\s*#\s*cert_file:\s*/xxx/client\.crt\s*\n^\s*#\s*key_file:\s*/xxx/client\.key\s*\n^\s*#\s*skip_insecure_verify:\s*false\s*$`)

type RemoteConfig struct {
	orm.ORMObjectBase
	Metadata model.Metadata    `json:"metadata" elastic_mapping:"metadata: { type: object }"`
	Payload  common.ConfigFile `json:"payload" elastic_mapping:"payload: { type: object}"`
}

func remoteConfigProvider(instance model.Instance) []*common.ConfigFile {

	//fetch configs from remote db
	//fetch configs assigned to (instance=_all OR instance=$instance_id ) AND application.name=$application.name
	q := orm.Query{
		Size: 1000,
		Conds: orm.And(orm.Eq("metadata.category", "app_settings"),
			orm.Eq("metadata.name", instance.Application.Name),
		),
	}

	q.Conds = append(q.Conds, orm.Or(orm.Eq("metadata.labels.instance", "_all"), orm.Eq("metadata.labels.instance", instance.ID))...)
	err, searchResult := orm.Search(RemoteConfig{}, &q)
	if err != nil {
		panic(err)
	}

	result := []*common.ConfigFile{}
	var relayIngestHosts []string
	if strings.EqualFold(strings.TrimSpace(instance.Application.Name), "agent") {
		relayIngestHosts = listRelayGatewayIngestHosts()
	}

	for _, row := range searchResult.Result {
		v, ok := row.(map[string]interface{})
		if ok {
			if shouldSkipGatewayConfigByType(instance, v) {
				continue
			}
			x, ok := v["payload"]
			if ok {
				f, ok := x.(map[string]interface{})
				if ok {
					name, ok := f["name"].(string)
					if ok {
						item := common.ConfigFile{}
						item.Name = util.ToString(name)
						item.Location = util.ToString(f["location"])
						item.Content = util.ToString(f["content"])
						item.Content = rewriteLegacyAgentConfigContent(instance, item.Content)
						item.Content = rewriteAgentRelayIngestContent(instance, item.Location, item.Content, relayIngestHosts)
						item.Version, _ = util.ToInt64(util.ToString(f["version"]))
						item.Size = int64(len(item.Content))
						item.Managed = true
						t, ok := v["updated"]
						if ok {
							layout := "2006-01-02T15:04:05.999999-07:00"
							t1, err := time.Parse(layout, util.ToString(t))
							if err == nil {
								item.Updated = t1.Unix()
							}
						}
						result = append(result, &item)
					}
				}
			}
		}
	}

	return result
}

func listRelayGatewayIngestHosts() []string {
	q := orm.Query{
		Size: 1000,
		Conds: orm.And(
			orm.Eq("application.name", "gateway"),
			orm.Eq("labels.service_type", "relay"),
		),
	}
	instances := []model.Instance{}
	if err, _ := orm.SearchWithJSONMapper(&instances, &q); err != nil {
		log.Errorf("failed to search relay gateways for ingest hosts: %v", err)
		return nil
	}
	endpoints := make([]string, 0, len(instances))
	for _, instance := range instances {
		endpoint := strings.TrimSpace(strings.TrimRight(instance.GetEndpoint(), "/"))
		if endpoint == "" {
			continue
		}
		endpoints = append(endpoints, endpoint)
	}
	return normalizeRelayGatewayIngestHosts(endpoints)
}

func normalizeRelayGatewayIngestHosts(endpoints []string) []string {
	if len(endpoints) == 0 {
		return nil
	}
	result := make([]string, 0, len(endpoints))
	seen := map[string]struct{}{}
	for _, endpoint := range endpoints {
		host := relayGatewayIngestHostFromEndpoint(endpoint)
		if host == "" {
			continue
		}
		if _, exists := seen[host]; exists {
			continue
		}
		seen[host] = struct{}{}
		result = append(result, host)
	}
	return result
}

func relayGatewayIngestHostFromEndpoint(endpoint string) string {
	normalized := strings.TrimSpace(strings.TrimRight(endpoint, "/"))
	if normalized == "" {
		return ""
	}
	parseTarget := normalized
	if !strings.Contains(parseTarget, "://") {
		parseTarget = "http://" + parseTarget
	}
	parsed, err := url.Parse(parseTarget)
	if err != nil || parsed == nil {
		return ""
	}
	host := strings.TrimSpace(parsed.Hostname())
	if host == "" {
		return ""
	}
	return net.JoinHostPort(host, relayGatewayIngestPort)
}

func rewriteAgentRelayIngestContent(instance model.Instance, location, content string, relayIngestHosts []string) string {
	if content == "" || len(relayIngestHosts) == 0 {
		return content
	}
	if !strings.EqualFold(strings.TrimSpace(instance.Application.Name), "agent") {
		return content
	}
	if !strings.EqualFold(strings.TrimSpace(location), "system_ingest_config.yml") {
		return content
	}
	rewritten := systemIngestSchemaLineRegexp.ReplaceAllString(content, `${1}`+util.MustToJSON("https"))
	rewritten = systemIngestHostsLineRegexp.ReplaceAllString(rewritten, `${1}`+string(util.MustToJSONBytes(relayIngestHosts)))
	rewritten = systemIngestTLSBlockRegexp.ReplaceAllString(rewritten, strings.Join([]string{
		"                tls: #for mTLS connection with config servers",
		"                  enabled: true",
		"                  ca_file: config/ca.crt",
		"                  cert_file: config/client.crt",
		"                  key_file: config/client.key",
		"                  skip_domain_verify: true",
		"                  skip_insecure_verify: false",
	}, "\n"))
	return rewritten
}

func shouldSkipGatewayConfigByType(instance model.Instance, configDoc map[string]interface{}) bool {
	if !strings.EqualFold(strings.TrimSpace(instance.Application.Name), "gateway") {
		return false
	}
	instanceType := resolveGatewayServiceType(instance.Labels)
	if instanceType == "" {
		return false
	}
	configType := extractGatewayTypeFromConfigDoc(configDoc)
	if configType == "" {
		configType = inferGatewayTypeFromPayloadLocation(configDoc)
	}
	if configType == "" || configType == "_all" {
		return false
	}
	return configType != instanceType
}

func resolveGatewayServiceType(labels map[string]string) string {
	if labels == nil {
		return ""
	}
	return normalizeGatewayTypeLabel(labels["service_type"])
}

func normalizeGatewayTypeLabel(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "relay":
		return "relay"
	case "migration":
		return "migration"
	default:
		return ""
	}
}

func extractGatewayTypeFromConfigDoc(configDoc map[string]interface{}) string {
	metadata, ok := configDoc["metadata"].(map[string]interface{})
	if !ok {
		return ""
	}
	labels, ok := metadata["labels"].(map[string]interface{})
	if !ok {
		return ""
	}
	return normalizeGatewayTypeLabel(util.ToString(labels["service_type"]))
}

func inferGatewayTypeFromPayloadLocation(configDoc map[string]interface{}) string {
	payload, ok := configDoc["payload"].(map[string]interface{})
	if !ok {
		return ""
	}
	location := strings.ToLower(strings.TrimSpace(util.ToString(payload["location"])))
	switch location {
	case "relay.yml":
		return "relay"
	case "migration.yml":
		return "migration"
	default:
		return ""
	}
}

func rewriteLegacyAgentConfigContent(instance model.Instance, content string) string {
	if content == "" {
		return content
	}

	if instance.Application.Name != "agent" && instance.Application.Name != "gateway" {
		return content
	}

	if !strings.Contains(content, "$[[SETUP_AGENT_PASSWORD]]") {
		return content
	}

	return strings.ReplaceAll(
		content,
		"$[[SETUP_AGENT_PASSWORD]]",
		fmt.Sprintf("$[[keystore.%s]]", getSystemClusterIngestSecretKey()),
	)
}

func dynamicAgentConfigProvider(instance model.Instance) []*common.ConfigFile {

	if instance.Application.Name != "agent" {
		return nil
	}

	//get config files from remote db
	//get settings with this agent id

	result := []*common.ConfigFile{}
	ids, err := GetEnrolledNodesByAgent(instance.ID)
	if err != nil {
		panic(err)
	}

	var latestTimestamp int64
	for _, v := range ids {
		if v.Updated > latestTimestamp {
			latestTimestamp = v.Updated
		}
	}

	if len(ids) > 0 {

		cfg := common.ConfigFile{}
		cfg.Name = "generated_metrics_tasks.yml"
		cfg.Location = "generated_metrics_tasks.yml"
		cfg.Content, cfg.Hash = getAgentIngestConfigs(instance.ID, ids)

		hash := cfg.Hash
		if cfg.Hash == "" {
			hash = util.MD5digest(cfg.Content)
		}
		//if local's hash is different from remote's hash, then update local's hash, update version to current timestamp
		v, err := kv.GetValue(LastAgentHash, []byte(global.Env().SystemConfig.NodeConfig.ID+":"+instance.ID))
		if err != nil || v == nil || string(v) != hash {
			err := kv.AddValue(LastAgentHash, []byte(global.Env().SystemConfig.NodeConfig.ID+":"+instance.ID), []byte(hash))
			if err != nil {
				panic(err)
			}
			latestTimestamp = time.Now().Unix()
			log.Tracef("agent config hash changed for [%s]: %s -> %s, version=%v", console_common.MaskLogToken(instance.ID), console_common.MaskLogToken(string(v)), console_common.MaskLogToken(hash), latestTimestamp)
		}

		cfg.Size = int64(len(cfg.Content))
		cfg.Version = latestTimestamp
		cfg.Managed = true
		cfg.Updated = latestTimestamp
		result = append(result, &cfg)
	}

	return result
}

func agentSecretProvider(instance model.Instance) *common.Secrets {
	if instance.Application.Name != "agent" && instance.Application.Name != "gateway" {
		return nil
	}

	secrets := &common.Secrets{Keystore: map[string]common.KeystoreValue{}}
	appendKeystoreSecret(secrets, getSystemClusterIngestSecretKey())
	appendTokenCredentialSecret(secrets, instance.ManagerCredentialID, agent_common.AgentManagerTokenKey())
	if instance.Application.Name == "agent" {
		appendTokenCredentialSecret(secrets, instance.AccessCredentialID, agent_common.AgentAccessTokenKey())
	}

	if instance.Application.Name == "agent" {
		ids, err := GetEnrolledNodesByAgent(instance.ID)
		if err != nil {
			panic(err)
		}

		for _, v := range ids {
			auth, err := getAgentBasicAuth(v.ClusterID)
			if err != nil {
				log.Error(err)
				continue
			}
			if auth == nil {
				continue
			}
			secrets.Keystore[getAgentPasswordKey(v.ClusterID)] = common.KeystoreValue{
				Type:  "plaintext",
				Value: auth.Password.Get(),
			}
		}
	}

	if len(secrets.Keystore) == 0 {
		return nil
	}
	return secrets
}

func getSystemClusterIngestSecretKey() string {
	systemClusterID := global.MustLookupString(elastic.GlobalSystemElasticsearchID)

	if metadata := elastic.GetMetadata(systemClusterID); metadata != nil && metadata.Config != nil {
		if metadata.Config.Distribution == elastic.Easysearch {
			return systemClusterIngestPasswordKey
		}
		return systemClusterPassKey
	}

	if cfg := elastic.GetConfigNoPanic(systemClusterID); cfg != nil {
		if cfg.Distribution == elastic.Easysearch {
			return systemClusterIngestPasswordKey
		}
		return systemClusterPassKey
	}

	return systemClusterPassKey
}

func appendKeystoreSecret(secrets *common.Secrets, key string) {
	if secrets == nil || key == "" {
		return
	}
	value, err := keystore.GetValue(key)
	if err == keystore2.ErrKeyDoesntExists {
		return
	}
	if err != nil {
		log.Error(err)
		return
	}
	secrets.Keystore[key] = common.KeystoreValue{
		Type:  "plaintext",
		Value: string(value),
	}
}

func appendTokenCredentialSecret(secrets *common.Secrets, credentialID, keystoreKey string) {
	if secrets == nil || credentialID == "" || keystoreKey == "" {
		return
	}
	value, err := agent_common.GetTokenCredentialValue(credentialID)
	if err != nil {
		log.Error(err)
		return
	}
	if value == "" {
		return
	}
	secrets.Keystore[keystoreKey] = common.KeystoreValue{
		Type:  "plaintext",
		Value: value,
	}
}

func getAgentPasswordKey(clusterID string) string {
	// One agent can bind multiple clusters, so the synced keystore entry must stay cluster-scoped.
	return fmt.Sprintf("%s_password", clusterID)
}

func getAgentBasicAuth(clusterID string) (*model.BasicAuth, error) {
	metadata := elastic.GetMetadata(clusterID)
	if metadata == nil || metadata.Config == nil || metadata.Config.AgentCredentialID == "" {
		return nil, nil
	}

	credential, err := common2.GetCredential(metadata.Config.AgentCredentialID)
	if err != nil {
		return nil, err
	}

	return credential.DecodeBasicAuth()
}

func getAgentIngestConfigs(instance string, items map[string]BindingItem) (string, string) {

	if instance == "" {
		panic("instance id is empty")
	}

	elasticBuffer := bytes.NewBufferString("elasticsearch:")
	pipelineBuffer := bytes.NewBufferString("\npipeline:")

	//sort items
	newItems := []util.KeyValue{}

	for k, v := range items {
		newItems = append(newItems, util.KeyValue{Key: k, Value: v.Updated, Payload: v})
	}

	newItems = util.SortKeyValueArray(newItems, false)

	var latestVersion int64
	for _, x := range newItems {

		v, ok := x.Payload.(BindingItem)
		if !ok {
			continue
		}

		if v.ClusterID == "" {
			log.Error("cluster id is empty")
			continue
		}

		metadata := elastic.GetMetadata(v.ClusterID)
		if metadata == nil || metadata.Config == nil {
			if global.Env().IsDebug {
				log.Errorf("cluster metadata is nil: %v, %s", v.ClusterID, instance)
			}
			continue
		}
		var clusterLevelEnabled = false
		var nodeLevelEnabled = true

		var username = ""
		var password = ""
		var version = ""
		var distribution = ""
		var clusterName = ""

		if metadata.Config != nil {

			version = metadata.Config.Version
			distribution = metadata.Config.Distribution
			clusterName = metadata.Config.Name

			if auth, err := getAgentBasicAuth(v.ClusterID); err != nil {
				log.Error(err)
				continue
			} else if auth != nil {
				username = auth.Username
				password = fmt.Sprintf("$[[keystore.%s]]", getAgentPasswordKey(v.ClusterID))
			}
		}

		nodeInfo, err := metadata2.GetNodeConfig(v.ClusterID, v.NodeUUID)
		if err != nil {
			log.Error(err)
			continue
		}

		publishAddress := nodeInfo.Payload.NodeInfo.GetHttpPublishHost()

		if publishAddress == "" {
			log.Errorf("publish address is empty: %v", v.NodeUUID)
			continue
		}

		nodeEndPoint := metadata.PrepareEndpoint(publishAddress)

		logsPaths := normalizeLogsPaths(v.LogsPaths, v.PathLogs)
		if len(logsPaths) == 0 {
			logsPaths = normalizeLogsPaths(nil, nodeInfo.Payload.NodeInfo.GetPathLogs())
		}

		if v.Updated > latestVersion {
			latestVersion = v.Updated
		}

		taskID := v.ClusterID + "_" + v.NodeUUID
		elasticBuffer.WriteString(renderAgentTaskElasticsearchConfig(
			taskID,
			v.ClusterUUID,
			version,
			distribution,
			nodeEndPoint,
			username,
			password,
		))
		pipelineBuffer.WriteString(renderAgentTaskPipelineConfig(
			taskID,
			v.ClusterID,
			clusterName,
			v.ClusterUUID,
			clusterLevelEnabled,
			nodeLevelEnabled,
			logsPaths,
		))
	}

	buffer := bytes.NewBufferString(elasticBuffer.String())
	buffer.WriteString(pipelineBuffer.String())

	hash := util.MD5digest(buffer.String())

	buffer.WriteString("\n")
	buffer.WriteString(fmt.Sprintf("#MANAGED_CONFIG_VERSION: %v\n#MANAGED: true\n", latestVersion))

	return buffer.String(), hash
}

func renderAgentTaskElasticsearchConfig(taskID, clusterUUID, version, distribution, nodeEndpoint, username, password string) string {
	return fmt.Sprintf(
		"\n  - id: %s\n    name: %s\n    cluster_uuid: %s\n    enabled: true\n    monitored: true\n    distribution: %s\n    version: %s\n    endpoints: [%s]\n    discovery:\n      enabled: false\n    basic_auth:\n      username: %s\n      password: %s\n    traffic_control:\n      enabled: true\n      max_qps_per_node: 100\n      max_bytes_per_node: 10485760\n      max_connection_per_node: 5\n",
		util.MustToJSON(taskID),
		util.MustToJSON(taskID),
		util.MustToJSON(clusterUUID),
		util.MustToJSON(distribution),
		util.MustToJSON(version),
		util.MustToJSON(nodeEndpoint),
		util.MustToJSON(username),
		util.MustToJSON(password),
	)
}

func renderAgentTaskPipelineConfig(taskID, clusterID, clusterName, clusterUUID string, clusterLevelEnabled, nodeLevelEnabled bool, logsPaths []string) string {
	logsPathValue := `""`
	switch len(logsPaths) {
	case 0:
	case 1:
		logsPathValue = util.MustToJSON(logsPaths[0])
	default:
		logsPathValue = util.MustToJSON(logsPaths)
	}
	return fmt.Sprintf(
		"\n  - auto_start: %t\n    enabled: %t\n    keep_running: true\n    name: collect_%s_es_node_stats\n    retry_delay_in_ms: 10000\n    processor:\n      - es_node_stats:\n          elasticsearch: %s\n          labels:\n            cluster_id: %s\n            cluster_uuid: %s\n            cluster_name: %s\n          when:\n            cluster_available:\n              - %s\n\n  - auto_start: %t\n    enabled: %t\n    keep_running: true\n    name: collect_%s_es_logs\n    retry_delay_in_ms: 10000\n    processor:\n      - es_logs_processor:\n          elasticsearch: %s\n          labels:\n            cluster_id: %s\n            cluster_uuid: %s\n            cluster_name: %s\n          logs_path: %s\n          queue_name: logs\n          when:\n            cluster_available:\n              - %s\n",
		nodeLevelEnabled,
		nodeLevelEnabled,
		taskID,
		util.MustToJSON(taskID),
		util.MustToJSON(clusterID),
		util.MustToJSON(clusterUUID),
		util.MustToJSON(clusterName),
		util.MustToJSON(taskID),
		nodeLevelEnabled,
		nodeLevelEnabled,
		taskID,
		util.MustToJSON(taskID),
		util.MustToJSON(clusterID),
		util.MustToJSON(clusterUUID),
		util.MustToJSON(clusterName),
		logsPathValue,
		util.MustToJSON(taskID),
	)
}

const LastAgentHash = "last_agent_hash"
