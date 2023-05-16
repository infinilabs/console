package scheduler

import (
	"fmt"
	"math"
	"sync"
	"time"

	log "github.com/cihub/seelog"

	"infini.sh/console/model"
	migration_model "infini.sh/console/plugin/migration/model"

	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

type scheduler struct {
	Elasticsearch          string
	IndexName              string
	CheckInstanceAvailable bool
	MaxTasksPerInstance    int

	state     map[string]DispatcherState
	stateLock sync.Mutex
}

type DispatcherState struct {
	Total int
}

func NewScheduler(elasticsearch, indexName string, checkInstanceAvailable bool, maxTasksPerInstance int) (migration_model.Scheduler, error) {
	scheduler := &scheduler{
		Elasticsearch:          elasticsearch,
		IndexName:              indexName,
		CheckInstanceAvailable: checkInstanceAvailable,
		MaxTasksPerInstance:    maxTasksPerInstance,
		state:                  map[string]DispatcherState{},
	}
	err := scheduler.RefreshInstanceJobsFromES()
	if err != nil {
		return nil, err
	}
	return scheduler, nil
}

func (p *scheduler) GetPreferenceInstance(config migration_model.ExecutionConfig) (*model.Instance, error) {
	var (
		err      error
		minID    string
		minTotal = math.MaxInt
	)

	for _, node := range config.Nodes.Permit {
		instanceTotal := p.getInstanceState(node.ID).Total
		if instanceTotal < minTotal {
			if p.CheckInstanceAvailable {
				tempInst := model.Instance{}
				tempInst.ID = node.ID
				_, err = orm.Get(&tempInst)
				if err != nil {
					log.Errorf("failed to get instance, err: %v", err)
					continue
				}
				err = tempInst.TryConnectWithTimeout(time.Second)
				if err != nil {
					log.Debugf("instance [%s] is not available, caused by: %v", tempInst.ID, err)
					continue
				}
			}
			minID = node.ID
			minTotal = instanceTotal
		}
	}
	if minID == "" {
		return nil, fmt.Errorf("no available instance")
	}

	instance := model.Instance{}
	instance.ID = minID

	_, err = orm.Get(&instance)
	if err != nil {
		return nil, err
	}
	if p.getInstanceState(minID).Total > p.MaxTasksPerInstance {
		return nil, migration_model.ErrHitMax
	}
	return &instance, nil
}

func (p *scheduler) RefreshInstanceJobsFromES() error {
	log.Debug("refreshing instance state from ES")
	p.stateLock.Lock()
	defer p.stateLock.Unlock()

	state, err := p.getInstanceTaskState()
	if err != nil {
		log.Errorf("failed to get instance task state, err: %v", err)
		return err
	}
	p.state = state

	return nil
}

func (p *scheduler) DecrInstanceJobs(instanceID string) {
	p.stateLock.Lock()
	defer p.stateLock.Unlock()
	if st, ok := p.state[instanceID]; ok {
		st.Total -= 1
		p.state[instanceID] = st
	}
}

func (p *scheduler) IncrInstanceJobs(instanceID string) {
	p.stateLock.Lock()
	defer p.stateLock.Unlock()
	instanceState := p.state[instanceID]
	instanceState.Total = instanceState.Total + 1
	p.state[instanceID] = instanceState
}

func (p *scheduler) getInstanceState(instanceID string) DispatcherState {
	p.stateLock.Lock()
	defer p.stateLock.Unlock()

	return p.state[instanceID]
}

func (p *scheduler) getInstanceTaskState() (map[string]DispatcherState, error) {
	query := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"grp": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.execution_instance_id",
					"size":  1000,
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.type": util.MapStr{
								"value": "index_migration",
							},
						},
					},
					{
						"term": util.MapStr{
							"status": util.MapStr{
								"value": task.StatusRunning,
							},
						},
					},
				},
			},
		},
	}
	esClient := elastic.GetClient(p.Elasticsearch)
	res, err := esClient.SearchWithRawQueryDSL(p.IndexName, util.MustToJSONBytes(query))
	if err != nil {
		log.Errorf("search es failed, err: %v", err)
		return nil, err
	}
	state := map[string]DispatcherState{}
	for _, bk := range res.Aggregations["grp"].Buckets {
		if key, ok := bk["key"].(string); ok {
			if v, ok := bk["doc_count"].(float64); ok {
				state[key] = DispatcherState{
					Total: int(v),
				}
			}
		}
	}
	return state, nil
}
