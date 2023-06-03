package scheduler

import (
	"errors"
	"fmt"
	"math"
	"strings"
	"sync"
	"time"

	log "github.com/cihub/seelog"

	"infini.sh/console/model"
	migration_model "infini.sh/console/plugin/migration/model"

	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/pipeline"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

const initializeInterval = 10 * time.Second

type scheduler struct {
	Elasticsearch          string
	IndexName              string
	CheckInstanceAvailable bool
	MaxTasksPerInstance    int

	state     map[string]DispatcherState
	stateLock sync.Mutex
}

type DispatcherState struct {
	Total             int
	LastInitializedAt time.Time
}

// NOTE: currently we assume task are scheduled sequentially, so GetInstance/GetPreferenceInstance doesn't need to handle locking
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

	instance, err := p.GetInstance(minID)
	if err != nil {
		return nil, err
	}
	if p.getInstanceState(minID).Total > p.MaxTasksPerInstance {
		return nil, migration_model.ErrHitMax
	}
	return instance, nil
}

func (p *scheduler) GetInstance(instanceID string) (*model.Instance, error) {
	if instanceID == "" {
		return nil, errors.New("invalid instanceID")
	}
	instance := model.Instance{}
	instance.ID = instanceID

	_, err := orm.Get(&instance)
	if err != nil {
		log.Errorf("failed to get instance [%s] from orm, err: %v", instance.ID, err)
		return nil, err
	}
	err = p.initializeInstance(&instance)
	if err != nil {
		log.Warnf("failed to initialized instance [%s], err: %v", instance.ID, err)
	}
	return &instance, nil
}

func (p *scheduler) initializeInstance(instance *model.Instance) error {
	lastInitializedAt := p.getLastInitializedAt(instance.ID)
	if time.Now().Sub(lastInitializedAt) < initializeInterval {
		return nil
	}

	status, err := instance.GetPipeline("pipeline_logging_merge")
	if err != nil {
		if strings.Contains(err.Error(), "pipeline not found") {
			log.Infof("pipeline_logging_merge not found on instance [%s], initializing", instance.ID)
			err := p.createPipelineLoggingMerge(instance)
			if err != nil {
				return err
			}
		}
	} else if status.State == pipeline.STOPPED {
		log.Infof("pipeline_logging_merge stopped on instance [%s], starting", instance.ID)
		err = instance.StartPipeline("pipeline_logging_merge")
		if err != nil {
			return err
		}
	}

	status, err = instance.GetPipeline("ingest_pipeline_logging")
	if err != nil {
		if strings.Contains(err.Error(), "pipeline not found") {
			log.Infof("ingest_pipeline_logging not found on instance [%s], initializing", instance.ID)
			err := p.createIngestPipelineLogging(instance)
			if err != nil {
				return err
			}
		}
	} else if status.State == pipeline.STOPPED {
		log.Infof("ingest_pipeline_logging stopped on instance [%s], starting", instance.ID)
		err = instance.StartPipeline("ingest_pipeline_logging")
		if err != nil {
			return err
		}
	}

	p.setLastInitializedAt(instance.ID, time.Now())
	return nil
}

// TODO: now we're using the same configuraiton as the default gateway.yml
// user could change the following configurations manually:
// - input_queue (metrics.logging_queue)
// - elasticsearch (elasticsearch.name)
func (p *scheduler) createPipelineLoggingMerge(instance *model.Instance) error {
	cfg := &migration_model.PipelineTaskConfig{
		Name:        "pipeline_logging_merge",
		AutoStart:   true,
		KeepRunning: true,
		Processor: []util.MapStr{
			util.MapStr{
				"indexing_merge": util.MapStr{
					"input_queue":             "logging",
					"idle_timeout_in_seconds": 1,
					"elasticsearch":           "logging-server",
					"index_name":              ".infini_logs",
					"output_queue": util.MapStr{
						"name": "gateway-pipeline-logs",
						"label": util.MapStr{
							"tag": "pipeline_logging",
						},
					},
					"worker_size":     1,
					"bulk_size_in_kb": 1,
				},
			},
		},
	}
	err := instance.CreatePipeline(util.MustToJSONBytes(cfg))
	if err != nil {
		log.Errorf("create pipeline_logging_merge [%s] failed, err: %+v", instance.ID, err)
		return err
	}
	return nil
}

func (p *scheduler) createIngestPipelineLogging(instance *model.Instance) error {
	cfg := &migration_model.PipelineTaskConfig{
		Name:        "ingest_pipeline_logging",
		AutoStart:   true,
		KeepRunning: true,
		Processor: []util.MapStr{
			util.MapStr{
				"bulk_indexing": util.MapStr{
					"bulk": util.MapStr{
						"compress":           true,
						"batch_size_in_mb":   1,
						"batch_size_in_docs": 1,
					},
					"consumer": util.MapStr{
						"fetch_max_messages": 100,
					},
					"queues": util.MapStr{
						"type": "indexing_merge",
						"tag":  "pipeline_logging",
					},
				},
			},
		},
	}
	err := instance.CreatePipeline(util.MustToJSONBytes(cfg))
	if err != nil {
		log.Errorf("create ingest_pipeline_logging [%s] failed, err: %+v", instance.ID, err)
		return err
	}
	return nil
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

func (p *scheduler) getLastInitializedAt(instanceID string) time.Time {
	p.stateLock.Lock()
	defer p.stateLock.Unlock()
	if st, ok := p.state[instanceID]; ok {
		return st.LastInitializedAt
	}
	return time.Time{}
}

func (p *scheduler) setLastInitializedAt(instanceID string, t time.Time) {
	p.stateLock.Lock()
	defer p.stateLock.Unlock()
	if st, ok := p.state[instanceID]; ok {
		st.LastInitializedAt = t
		p.state[instanceID] = st
	}
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
