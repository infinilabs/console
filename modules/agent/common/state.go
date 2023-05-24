/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"context"
	"fmt"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/host"
	"infini.sh/framework/core/kv"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"runtime"
	"runtime/debug"
	"strings"
	"sync"
	"time"
)

const (
	StatusOnline string = "online"
	StatusOffline = "offline"
)

type StateManager struct {
	TTL           time.Duration // kv ttl
	KVKey         string
	stopC         chan struct{}
	stopCompleteC chan struct{}
	agentClient   *Client
	agentIds      map[string]string
	agentMutex    sync.Mutex
	workerChan    chan struct{}
	timestamps map[string]int64
}

func NewStateManager(TTL time.Duration, kvKey string, agentIds map[string]string) *StateManager {
	return &StateManager{
		TTL:           TTL,
		KVKey:         kvKey,
		stopC:         make(chan struct{}),
		stopCompleteC: make(chan struct{}),
		agentClient:   &Client{},
		agentIds:      agentIds,
		workerChan:    make(chan struct{}, runtime.NumCPU()),
		timestamps: map[string]int64{},
	}
}

func (sm *StateManager) checkAgentStatus() {
	onlineAgentIDs, err := GetLatestOnlineAgentIDs(nil, int(sm.TTL.Seconds()))
	if err != nil {
		log.Error(err)
		return
	}
	//add new agent to state
	sm.agentMutex.Lock()
	for agentID := range onlineAgentIDs {
		if _, ok := sm.agentIds[agentID]; !ok {
			log.Infof("status of agent [%s] changed to online", agentID)
			sm.agentIds[agentID] = StatusOnline
		}
	}
	sm.agentMutex.Unlock()
	for agentID, status := range sm.agentIds {
		if _, ok := onlineAgentIDs[agentID]; ok {
			sm.syncSettings(agentID)
			host.UpdateHostAgentStatus(agentID, StatusOnline)
			if status == StatusOnline {
				continue
			}
			// status change to online
			sm.agentIds[agentID] = StatusOnline
			log.Infof("status of agent [%s] changed to online", agentID)
			//set timestamp equals 0 to create pipeline
			sm.timestamps[agentID] = 0
			continue
		}else{
			// already offline
			if status == StatusOffline {
				continue
			}
		}
		// status change to offline
		// todo validate whether agent is offline
		sm.agentIds[agentID] = StatusOffline
		sm.workerChan <- struct{}{}
		go func(agentID string) {
			defer func() {
				if err := recover(); err != nil {
					log.Errorf("check agent [%s] status recover form panic error: %v", agentID, err)
					debug.PrintStack()
				}
				<-sm.workerChan
			}()
			ag, err := sm.GetAgent(agentID)
			if err != nil {
				log.Error(err)
				return
			}
			ag.Status = StatusOffline
			log.Infof("agent [%s] is offline", ag.Endpoint)
			_, err = sm.UpdateAgent(ag, true)
			if err != nil {
				log.Error(err)
				return
			}
			//update host agent status
			host.UpdateHostAgentStatus(ag.ID, StatusOffline)
		}(agentID)

	}
}

func (sm *StateManager) syncSettings(agentID string) {
	newTimestamp := time.Now().UnixMilli()
	settings, err := GetAgentSettings(agentID, sm.timestamps[agentID])
	if err != nil {
		log.Errorf("query agent settings error: %v", err)
		return
	}
	if len(settings) == 0 {
		log.Debugf("got no settings of agent [%s]", agentID)
		return
	}
	parseResult, err := ParseAgentSettings(settings)
	if err != nil {
		log.Errorf("parse agent settings error: %v", err)
		return
	}
	ag, err := sm.GetAgent(agentID)
	if err != nil {
		log.Errorf("get agent error: %v", err)
		return
	}
	agClient := sm.GetAgentClient()
	if len(parseResult.ClusterConfigs) > 0 {
		err = agClient.RegisterElasticsearch(nil, ag.GetEndpoint(), parseResult.ClusterConfigs)
		if err != nil {
			log.Errorf("register elasticsearch config error: %v", err)
			return
		}
	}
	for _, pipelineID := range parseResult.ToDeletePipelineNames {
		err = agClient.DeletePipeline(context.Background(), ag.GetEndpoint(), pipelineID)
		if err != nil {
			if !strings.Contains(err.Error(), "not found") {
				log.Errorf("delete pipeline error: %v", err)
				continue
			}
		}
		//todo update delete pipeline state
	}
	for _, pipeline := range parseResult.Pipelines {
		err = agClient.CreatePipeline(context.Background(), ag.GetEndpoint(), util.MustToJSONBytes(pipeline))
		if err != nil {
			log.Errorf("create pipeline error: %v", err)
			return
		}
	}
	sm.timestamps[agentID] = newTimestamp
}

func (sm *StateManager) getAvailableAgent(clusterID string) (*agent.Instance, error) {
	agents, err := LoadAgentsFromES(clusterID)
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

func (sm *StateManager) GetAgent(ID string) (*agent.Instance, error) {
	buf, err := kv.GetValue(sm.KVKey, []byte(ID))
	if err != nil {
		return nil, err
	}
	strTime, _ := jsonparser.GetString(buf, "timestamp")
	timestamp, _ := time.Parse(time.RFC3339, strTime)
	inst := &agent.Instance{}
	inst.ID = ID
	if time.Since(timestamp) > sm.TTL {
		exists, err := orm.Get(inst)
		if err != nil {
			return nil, fmt.Errorf("get agent [%s] error: %w", ID, err)
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

func (sm *StateManager) UpdateAgent(inst *agent.Instance, syncToES bool) (*agent.Instance, error) {
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

func (sm *StateManager) GetTaskAgent(clusterID string) (*agent.Instance, error) {
	return nil, nil
}


func (sm *StateManager) DeleteAgent(agentID string) error {
	sm.agentMutex.Lock()
	delete(sm.agentIds, agentID)
	sm.agentMutex.Unlock()
	log.Infof("delete agent [%s] from state", agentID)

	return kv.DeleteKey(sm.KVKey, []byte(agentID))
}

func (sm *StateManager) GetAgentClient() ClientAPI {
	return sm.agentClient
}

func LoadAgentsFromES(clusterID string) ([]agent.Instance, error) {
	q := orm.Query{
		Size: 1000,
	}
	if clusterID != "" {
		q.Conds = orm.And(orm.Eq("id", clusterID))
	}
	err, result := orm.Search(agent.Instance{}, &q)
	if err != nil {
		return nil, fmt.Errorf("query agent error: %w", err)
	}

	if len(result.Result) > 0 {
		var agents = make([]agent.Instance, 0, len(result.Result))
		for _, row := range result.Result {
			ag := agent.Instance{}
			bytes := util.MustToJSONBytes(row)
			err = util.FromJSONBytes(bytes, &ag)
			if err != nil {
				log.Errorf("got unexpected agent: %s, error: %v", string(bytes), err)
				continue
			}
			agents = append(agents, ag)
		}
		return agents, nil
	}
	return nil, nil
}

func GetLatestOnlineAgentIDs(agentIds []string, lastSeconds int) (map[string]struct{}, error) {
	q := orm.Query{
		WildcardIndex: true,
	}
	mustQ := []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.name": util.MapStr{
					"value": "agent",
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.category": util.MapStr{
					"value": "instance",
				},
			},
		},
	}
	if len(agentIds) > 0 {
		mustQ = append(mustQ, util.MapStr{
			"terms": util.MapStr{
				"agent.id": agentIds,
			},
		})
	}
	queryDSL := util.MapStr{
		"_source": "agent.id",
		"sort": []util.MapStr{
			{
				"timestamp": util.MapStr{
					"order": "desc",
				},
			},
		},
		"collapse": util.MapStr{
			"field": "agent.id",
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"filter": []util.MapStr{
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"gte": fmt.Sprintf("now-%ds", lastSeconds),
							},
						},
					},
				},
				"must": mustQ,
			},
		},
	}
	q.RawQuery = util.MustToJSONBytes(queryDSL)
	err, result := orm.Search(event.Event{}, &q)
	if err != nil {
		return nil, fmt.Errorf("query agent instance metric error: %w", err)
	}
	agentIDs := map[string]struct{}{}
	if len(result.Result) > 0 {
		searchRes := elastic.SearchResponse{}
		err = util.FromJSONBytes(result.Raw, &searchRes)
		if err != nil {
			return nil, err
		}
		agentIDKeyPath := []string{"agent", "id"}
		for _, hit := range searchRes.Hits.Hits {
			agentID, _ := util.GetMapValueByKeys(agentIDKeyPath, hit.Source)
			if v, ok := agentID.(string); ok {
				agentIDs[v] = struct{}{}
			}
		}
	}
	return agentIDs, nil
}