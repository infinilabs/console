/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package state

import (
	"context"
	"fmt"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"gopkg.in/yaml.v2"
	"infini.sh/console/modules/agent/client"
	"infini.sh/console/modules/agent/common"
	model2 "infini.sh/console/modules/agent/model"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/host"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic"
	"runtime"
	"runtime/debug"
	"strconv"
	"sync"
	"time"
)

var stateManager IStateManager

func GetStateManager() IStateManager {
	if stateManager == nil {
		panic("agent state manager not init")
	}
	return stateManager
}

func RegisterStateManager(sm IStateManager) {
	stateManager = sm
}

func IsEnabled() bool {
	return stateManager != nil
}

type IStateManager interface {
	GetAgent(ID string) (*model.Instance, error)
	UpdateAgent(inst *model.Instance, syncToES bool) (*model.Instance, error)
	GetTaskAgent(clusterID string) (*model.Instance, error)
	DeleteAgent(agentID string) error
	LoopState()
	Stop()
	GetAgentClient() client.ClientAPI
}

type StateManager struct {
	TTL           time.Duration // kv ttl
	KVKey         string
	stopC         chan struct{}
	stopCompleteC chan struct{}
	agentClient   *client.Client
	agentIds      map[string]string
	agentMutex    sync.Mutex
	workerChan    chan struct{}
}

func NewStateManager(TTL time.Duration, kvKey string, agentIds map[string]string, agentClient *client.Client) *StateManager {
	return &StateManager{
		TTL:           TTL,
		KVKey:         kvKey,
		stopC:         make(chan struct{}),
		stopCompleteC: make(chan struct{}),
		agentClient:  agentClient,
		agentIds:      agentIds,
		workerChan:    make(chan struct{}, runtime.NumCPU()),
	}
}

func (sm *StateManager) checkAgentStatus() {
	onlineAgentIDs, err := common.GetLatestOnlineAgentIDs(nil, int(sm.TTL.Seconds()))
	if err != nil {
		log.Error(err)
		return
	}
	//add new agent to state
	sm.agentMutex.Lock()
	for agentID := range onlineAgentIDs {
		if _, ok := sm.agentIds[agentID]; !ok {
			log.Infof("status of agent [%s] changed to online", agentID)
			sm.agentIds[agentID] = model2.StatusOnline
		}
	}
	sm.agentMutex.Unlock()
	for agentID, status := range sm.agentIds {
		sm.workerChan <- struct{}{}
		go func(agentID string) {
			defer func() {
				if err := recover(); err != nil {
					log.Errorf("check agent [%s] status recover form panic error: %v", agentID, err)
					debug.PrintStack()
				}
				<-sm.workerChan
			}()
			sm.syncSettings(agentID)
			sm.syncIngestSettings(agentID)
			if _, ok := onlineAgentIDs[agentID]; ok {
				host.UpdateHostAgentStatus(agentID, model2.StatusOnline)
				if status == model2.StatusOnline {
					return
				}
				// status change to online
				sm.agentMutex.Lock()
				sm.agentIds[agentID] = model2.StatusOnline
				sm.agentMutex.Unlock()
				log.Infof("status of agent [%s] changed to online", agentID)
				return
			}else{
				// already offline
				if status == model2.StatusOffline {
					return
				}
			}
			// status change to offline
			sm.agentMutex.Lock()
			sm.agentIds[agentID] = model2.StatusOffline
			sm.agentMutex.Unlock()
			ag, err := sm.GetAgent(agentID)
			if err != nil {
				if err != elastic.ErrNotFound {
					log.Error(err)
				}
				return
			}
			ag.Status = model2.StatusOffline
			log.Infof("agent [%s] is offline", ag.Endpoint)
			_, err = sm.UpdateAgent(ag, true)
			if err != nil {
				log.Error(err)
				return
			}
			//update host agent status
			host.UpdateHostAgentStatus(ag.ID, model2.StatusOffline)
		}(agentID)

	}
}
func (sm *StateManager) getLastSyncSettingsTimestamp(agentID string) int64{
	vbytes, err := kv.GetValue(model2.KVSyncDynamicTaskSettings, []byte(agentID))
	if err != nil {
		log.Error(err)
	}
	if vbytes == nil {
		return 0
	}
	t, err := strconv.ParseInt(string(vbytes), 10, 64)
	if err != nil {
		log.Error(err)
	}

	return t
}

func (sm *StateManager) syncSettings(agentID string) {
	ag, err := sm.GetAgent(agentID)
	if err != nil {
		if err != elastic.ErrNotFound {
			log.Errorf("get agent error: %v", err)
		}
		return
	}
	newTimestamp := time.Now().UnixMilli()
	lastSyncTimestamp := sm.getLastSyncSettingsTimestamp(agentID)
	settings, err := common.GetAgentSettings(agentID, lastSyncTimestamp)
	if err != nil {
		log.Errorf("query agent settings error: %v", err)
		return
	}
	if len(settings) == 0 {
		log.Debugf("got no settings of agent [%s]", agentID)
		return
	}
	parseResult, err := common.ParseAgentSettings(settings)
	if err != nil {
		log.Errorf("parse agent settings error: %v", err)
		return
	}
	agClient := sm.GetAgentClient()
	var clusterCfgs []util.MapStr
	if len(parseResult.ClusterConfigs) > 0 {
		for _, cfg := range parseResult.ClusterConfigs {
			clusterCfg := util.MapStr{
				"name": cfg.ID,
				"enabled": true,
				"endpoint": cfg.GetAnyEndpoint(),
			}
			if cfg.BasicAuth != nil && cfg.BasicAuth.Password != ""{
				cid := cfg.ID
				if cfg.ClusterUUID != "" {
					cid = cfg.ClusterUUID
				}
				err = agClient.SetKeystoreValue(context.Background(), ag.GetEndpoint(), fmt.Sprintf("%s_password", cid), cfg.BasicAuth.Password)
				if err != nil {
					log.Errorf("set keystore value error: %v", err)
					continue
				}
				clusterCfg["basic_auth"] = util.MapStr{
					"username": cfg.BasicAuth.Username,
					"password": fmt.Sprintf("$[[keystore.%s_password]]", cid),
				}
			}
			clusterCfgs = append(clusterCfgs, clusterCfg)
		}
	}
	var dynamicCfg = util.MapStr{}
	if len(clusterCfgs) > 0 {
		dynamicCfg["elasticsearch"] = clusterCfgs
	}
	if len(parseResult.Pipelines) > 0 {
		dynamicCfg["pipeline"] = parseResult.Pipelines
	}
	cfgBytes, err := yaml.Marshal(dynamicCfg)
	if err != nil {
		log.Error("serialize config to yaml error: ", err)
		return
	}
	//TODO
	err = agClient.SaveDynamicConfig(context.Background(), ag.GetEndpoint(), "dynamic_task.yml", string(cfgBytes))

	newTimestampStr := strconv.FormatInt(newTimestamp, 10)
	err = kv.AddValue(model2.KVSyncDynamicTaskSettings, []byte(agentID), []byte(newTimestampStr))
	if err != nil {
		log.Error(err)
	}
}
func (sm *StateManager) syncIngestSettings(agentID string) {
	v, err := kv.GetValue(model2.KVAgentIngestConfigChanged, []byte(agentID))
	if err != nil {
		log.Error(err)
	}
	if string(v) != "1" {
		return
	}
	ag, err := sm.GetAgent(agentID)
	if err != nil {
		if err != elastic.ErrNotFound {
			log.Errorf("get agent error: %v", err)
		}
		return
	}
	err = sm.agentClient.SaveIngestConfig(context.Background(), ag.GetEndpoint())
	if err == nil {
		kv.AddValue(model2.KVAgentIngestConfigChanged,[]byte(agentID), []byte("0"))
	}
}

func (sm *StateManager) getAvailableAgent(clusterID string) (*model.Instance, error) {
	agents, err := common.LoadAgentsFromES(clusterID)
	if err != nil {
		return nil, err
	}
	if len(agents) == 0 {
		return nil, nil
	}
	for _, ag := range agents {
		if ag.Status == "offline" {
			continue
		}
	}
	return nil, nil
}

func (sm *StateManager) LoopState() {
	t := time.NewTicker(30 * time.Second)
	defer t.Stop()
MAINLOOP:
	for {
		select {
		case <-sm.stopC:
			sm.stopCompleteC <- struct{}{}
			close(sm.workerChan)
			break MAINLOOP
		case <-t.C:
			sm.checkAgentStatus()
		}
	}
}

func (sm *StateManager) Stop() {
	sm.stopC <- struct{}{}
	<-sm.stopCompleteC
}

func (sm *StateManager) GetAgent(ID string) (*model.Instance, error) {
	buf, err := kv.GetValue(sm.KVKey, []byte(ID))
	if err != nil {
		return nil, err
	}
	strTime, _ := jsonparser.GetString(buf, "timestamp")
	timestamp, _ := time.Parse(time.RFC3339, strTime)
	inst := &model.Instance{}
	inst.ID = ID
	if time.Since(timestamp) > sm.TTL {
		exists, err := orm.Get(inst)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, fmt.Errorf("can not found agent [%s]", ID)
		}
		//inst.Timestamp = time.Now()
		err = kv.AddValue(sm.KVKey, []byte(ID), util.MustToJSONBytes(inst))
		if err != nil {
			log.Errorf("save agent [%s] to kv error: %v", ID, err)
		}
		return inst, nil
	}
	err = util.FromJSONBytes(buf, inst)
	return inst, err
}

func (sm *StateManager) UpdateAgent(inst *model.Instance, syncToES bool) (*model.Instance, error) {
	//inst.Timestamp = time.Now()
	err := kv.AddValue(sm.KVKey, []byte(inst.ID), util.MustToJSONBytes(inst))
	if syncToES {
		ctx := orm.Context{
			Refresh: "wait_for",
		}
		err = orm.Update(&ctx, inst)
		if err != nil {
			return nil, err
		}
	}
	return inst, err
}

func (sm *StateManager) GetTaskAgent(clusterID string) (*model.Instance, error) {
	return nil, nil
}


func (sm *StateManager) DeleteAgent(agentID string) error {
	sm.agentMutex.Lock()
	delete(sm.agentIds, agentID)
	sm.agentMutex.Unlock()
	log.Infof("delete agent [%s] from state", agentID)

	return kv.DeleteKey(sm.KVKey, []byte(agentID))
}

func (sm *StateManager) GetAgentClient() client.ClientAPI {
	return sm.agentClient
}
