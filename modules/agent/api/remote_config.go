/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"bytes"
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	common2 "infini.sh/framework/modules/elastic/common"
	"infini.sh/framework/plugins/managed/common"
	"time"
)

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
			orm.Eq("metadata.labels.instance", "_all"),
		),
	}

	err, searchResult := orm.Search(RemoteConfig{}, &q)
	if err != nil {
		panic(err)
	}

	result := []*common.ConfigFile{}

	for _, row := range searchResult.Result {
		v, ok := row.(map[string]interface{})
		if ok {
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

func dynamicAgentConfigProvider(instance model.Instance) []*common.ConfigFile {

	//get config files from remote db
	//get settings with this agent id

	result := []*common.ConfigFile{}
	ids, err := GetEnrolledNodesByAgent(&instance)
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
			log.Infof("hash: %v vs %v, update version to current timestamp: %v", string(v), hash, latestTimestamp)
		}

		cfg.Size = int64(len(cfg.Content))
		cfg.Version = latestTimestamp
		cfg.Managed = true
		cfg.Updated = latestTimestamp
		result = append(result, &cfg)
	}

	return result
}

func getAgentIngestConfigs(instance string, items map[string]BindingItem) (string, string) {

	if instance == "" {
		panic("instance id is empty")
	}

	buffer := bytes.NewBuffer([]byte("configs.template:  "))

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
			panic("cluster id is empty")
		}

		metadata := elastic.GetMetadata(v.ClusterID)
		if metadata == nil || metadata.Config == nil{
			log.Errorf("metadata is nil: %v",v.ClusterID)
			continue
		}
		var clusterLevelEnabled = false
		var nodeLevelEnabled = true
		var clusterEndPoint = metadata.Config.GetAnyEndpoint()

		var username = ""
		var password = ""

		if metadata.Config.AgentCredentialID != "" {
			credential, err := common2.GetCredential(metadata.Config.AgentCredentialID)
			if err != nil {
				panic(err)
			}
			var dv interface{}
			dv, err = credential.Decode()
			if err != nil {
				panic(err)
			}
			if auth, ok := dv.(model.BasicAuth); ok {
				username = auth.Username
				password = auth.Password
			}
		}

		if v.Updated > latestVersion {
			latestVersion = v.Updated
		}

		buffer.Write([]byte(fmt.Sprintf("\n  - name: \"%v\"\n    path: ./config/task_config.tpl\n    "+
			"variable:\n      "+
			"CLUSTER_ID: %v\n      "+
			"CLUSTER_ENDPOINT: [\"%v\"]\n      "+
			"CLUSTER_USERNAME: \"%v\"\n      "+
			"CLUSTER_PASSWORD: \"%v\"\n      "+
			"CLUSTER_LEVEL_TASKS_ENABLED: %v\n      "+
			"NODE_LEVEL_TASKS_ENABLED: %v\n      "+
			"NODE_LOGS_PATH: \"%v\"\n\n\n", v.NodeUUID, v.ClusterID, clusterEndPoint, username, password, clusterLevelEnabled, nodeLevelEnabled, v.PathLogs)))
	}

	hash := util.MD5digest(buffer.String())

	//password: $[[keystore.$[[CLUSTER_ID]]_password]]
	buffer.WriteString("\n")
	buffer.WriteString(fmt.Sprintf("#MANAGED_CONFIG_VERSION: %v\n#MANAGED: true\n", latestVersion))

	return buffer.String(), hash
}

const LastAgentHash = "last_agent_hash"
