/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package elastic

import (
	"fmt"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/pipeline"
	"infini.sh/framework/core/queue"
	"infini.sh/framework/core/rotate"
	"infini.sh/framework/core/util"
	"runtime"

	"sync"
	"time"
)

type MetadataProcessor struct {
	config               *Config
	runningConfigs       map[string]*queue.QueueConfig
	wg                   sync.WaitGroup
	inFlightQueueConfigs sync.Map
	detectorRunning      bool
	id                   string
}

type Config struct {
	NumOfWorkers int `config:"worker_size"`

	IdleTimeoutInSecond  int `config:"idle_timeout_in_seconds"`
	MaxConnectionPerHost int `config:"max_connection_per_node"`

	Queues map[string]interface{} `config:"queues,omitempty"`

	Consumer queue.ConsumerConfig `config:"consumer"`

	MaxWorkers int `config:"max_worker_size"`

	DetectActiveQueue  bool `config:"detect_active_queue"`
	DetectIntervalInMs int  `config:"detect_interval"`

	ValidateRequest   bool `config:"valid_request"`
	SkipEmptyQueue    bool `config:"skip_empty_queue"`
	SkipOnMissingInfo bool `config:"skip_info_missing"`

	RotateConfig rotate.RotateConfig         `config:"rotate"`
	BulkConfig   elastic.BulkProcessorConfig `config:"bulk"`

	Elasticsearch string `config:"elasticsearch,omitempty"`

	WaitingAfter []string `config:"waiting_after"`
}

func init() {
	pipeline.RegisterProcessorPlugin("metadata", New)
}

func New(c *config.Config) (pipeline.Processor, error) {
	cfg := Config{
		NumOfWorkers:         1,
		MaxWorkers:           10,
		MaxConnectionPerHost: 1,
		IdleTimeoutInSecond:  5,
		DetectIntervalInMs:   10000,
		Queues:               map[string]interface{}{},

		Consumer: queue.ConsumerConfig{
			Group:            "metadata-001",
			Name:             "metadata-001",
			FetchMinBytes:    1,
			FetchMaxBytes:    10 * 1024 * 1024,
			FetchMaxMessages: 500,
			EOFRetryDelayInMs: 1000,
			FetchMaxWaitMs:   10000,
		},

		DetectActiveQueue: true,
		ValidateRequest:   false,
		SkipEmptyQueue:    true,
		SkipOnMissingInfo: false,
		RotateConfig:      rotate.DefaultConfig,
		BulkConfig:        elastic.DefaultBulkProcessorConfig,
	}

	if err := c.Unpack(&cfg); err != nil {
		log.Error(err)
		return nil, fmt.Errorf("failed to unpack the configuration of flow_runner processor: %s", err)
	}

	runner := MetadataProcessor{
		id:                   util.GetUUID(),
		config:               &cfg,
		runningConfigs:       map[string]*queue.QueueConfig{},
		inFlightQueueConfigs: sync.Map{},
	}

	runner.wg = sync.WaitGroup{}

	return &runner, nil
}

func (processor *MetadataProcessor) Name() string {
	return "metadata"
}

func (processor *MetadataProcessor) Process(c *pipeline.Context) error {
	defer func() {
		if !global.Env().IsDebug {
			if r := recover(); r != nil {
				var v string
				switch r.(type) {
				case error:
					v = r.(error).Error()
				case runtime.Error:
					v = r.(runtime.Error).Error()
				case string:
					v = r.(string)
				}
				log.Error("error in metadata processor,", v)
			}
		}
		log.Trace("exit metadata processor")
	}()

	//handle updates
	if processor.config.DetectActiveQueue {
		log.Tracef("detector running [%v]", processor.detectorRunning)
		if !processor.detectorRunning {
			processor.detectorRunning = true
			processor.wg.Add(1)
			go func(c *pipeline.Context) {
				log.Tracef("init detector for active queue [%v] ", processor.id)
				defer func() {
					if !global.Env().IsDebug {
						if r := recover(); r != nil {
							var v string
							switch r.(type) {
							case error:
								v = r.(error).Error()
							case runtime.Error:
								v = r.(runtime.Error).Error()
							case string:
								v = r.(string)
							}
							log.Error("error in metadata processor,", v)
						}
					}
					processor.detectorRunning = false
					log.Debug("exit detector for active queue")
					processor.wg.Done()
				}()

				for {
					if c.IsCanceled() {
						return
					}

					if global.Env().IsDebug {
						log.Tracef("inflight queues: %v", util.MapLength(&processor.inFlightQueueConfigs))
						processor.inFlightQueueConfigs.Range(func(key, value interface{}) bool {
							log.Tracef("inflight queue:%v", key)
							return true
						})
					}

					cfgs := queue.GetConfigByLabels(processor.config.Queues)
					for _, v := range cfgs {
						if c.IsCanceled() {
							return
						}
						//if have depth and not in in flight
						if queue.HasLag(v) {
							_, ok := processor.inFlightQueueConfigs.Load(v.Id)
							if !ok {
								log.Tracef("detecting new queue: %v", v.Name)
								processor.HandleQueueConfig(v, c)
							}
						}
					}
					if processor.config.DetectIntervalInMs > 0 {
						time.Sleep(time.Millisecond * time.Duration(processor.config.DetectIntervalInMs))
					}
				}
			}(c)
		}
	} else {
		cfgs := queue.GetConfigByLabels(processor.config.Queues)
		log.Debugf("filter queue by:%v, num of queues:%v", processor.config.Queues, len(cfgs))
		for _, v := range cfgs {
			log.Tracef("checking queue: %v", v)
			processor.HandleQueueConfig(v, c)
		}
	}

	processor.wg.Wait()

	return nil
}

func (processor *MetadataProcessor) HandleQueueConfig(v *queue.QueueConfig, c *pipeline.Context) {

	if processor.config.SkipEmptyQueue {
		if !queue.HasLag(v) {
			if global.Env().IsDebug {
				log.Tracef("skip empty queue:[%v]", v.Name)
			}
			return
		}
	}

	elasticsearch := processor.config.Elasticsearch
	if elasticsearch == "" {
		log.Error("elasticsearch config was not found in metadata processor")
		return
	}

	meta := elastic.GetMetadata(util.ToString(elasticsearch))
	if meta == nil {
		log.Debugf("metadata for [%v] is nil", elasticsearch)
		return
	}

	host := meta.GetActiveHost()
	log.Debugf("random choose node [%v] to consume queue [%v]", host, v.Id)
	processor.wg.Add(1)

	//go processor.NewBulkWorker("bulk_indexing_"+host,c, processor.bulkSizeInByte, v, host)
	go processor.HandleMessage(c, v)

}

func (processor *MetadataProcessor) HandleMessage(ctx *pipeline.Context, qConfig *queue.QueueConfig) {
	defer func() {
		if !global.Env().IsDebug {
			if r := recover(); r != nil {
				var v string
				switch r.(type) {
				case error:
					v = r.(error).Error()
				case runtime.Error:
					v = r.(runtime.Error).Error()
				case string:
					v = r.(string)
				}
				log.Errorf("error in %s processor: %v", processor.Name(), v)
			}
		}
		processor.wg.Done()
		log.Tracef("exit %s processor", processor.Name())
	}()

	key := qConfig.Id

	if processor.config.MaxWorkers > 0 && util.MapLength(&processor.inFlightQueueConfigs) > processor.config.MaxWorkers {
		log.Debugf("reached max num of workers, skip init [%v]", qConfig.Name)
		return
	}

	var workerID = util.GetUUID()
	_, exists := processor.inFlightQueueConfigs.Load(key)
	if exists {
		log.Errorf("queue [%v] has more then one consumer", qConfig.Id)
		return
	}

	processor.inFlightQueueConfigs.Store(key, workerID)
	log.Debugf("starting worker:[%v], queue:[%v]", workerID, qConfig.Name)
	var consumer = queue.GetOrInitConsumerConfig(qConfig.Id, processor.config.Consumer.Group, processor.config.Consumer.Name)
	initOffset, _ := queue.GetOffset(qConfig, consumer)
	offset := initOffset
	defer func() {
		log.Debugf("worker:[%v] start consume queue:[%v] offset:%v", workerID, qConfig.Id, offset)
	}()

	for {
		if ctx.IsCanceled() {
			return
		}
		ctx1, messages, isTimeout, err := queue.Consume(qConfig, consumer, offset)

		if len(messages)==0{
			time.Sleep(time.Millisecond * time.Duration(500))
		}

		//if timeout{
		//	log.Tracef("timeout on queue:[%v]",qConfig.Name)
		//	ctx.Failed()
		//	return
		//}

		if err != nil {
			log.Tracef("error on queue:[%v]", qConfig.Name)
			if err.Error() == "EOF" {
				if len(messages) > 0 {
					goto HANDLE_MESSAGE
				}
				return
			}
			//panic(err)
			if isTimeout {
				time.Sleep(time.Millisecond * 1000)
			}
		}

	HANDLE_MESSAGE:

		//update temp offset, not committed, continued reading
		offset = ctx1.NextOffset.String()//TODO

		if len(messages) > 0 {
			for _, pop := range messages {

				typ, err := jsonparser.GetString(pop.Data, "metadata", "name")
				if err != nil {
					panic(err)
				}
				switch typ {
				case "index_health_change":
					//err = processor.HandleIndexHealthChange(&ev)
				case "index_state_change":
					indexState, _, _, err := jsonparser.Get(pop.Data, "payload", "index_state")
					if err != nil {
						panic(err)
					}
					err = processor.HandleIndexStateChange(indexState)
				case "unknown_node_status":
					processor.HandleUnknownNodeStatus(pop.Data)
				}

			}
		}
		if err == nil {
			if offset != "" && initOffset != offset {
				ok, err := queue.CommitOffset(qConfig, consumer, offset)
				if !ok || err != nil {
					panic(err)
				}
				initOffset=offset
			}
		} else {
			if !isTimeout {
				log.Error(err)
			}
		}
	}
}
func (processor *MetadataProcessor) HandleIndexStateChange(indexState []byte) error {
	esClient := elastic.GetClient(processor.config.Elasticsearch)
	// save index metadata
	id, err := jsonparser.GetString(indexState, "id")
	if err != nil {
		return err
	}
	storeIndexName := orm.GetIndexName(elastic.IndexConfig{})

	_, err = esClient.Index(storeIndexName, "", id, indexState, "")
	return err
}

func (processor *MetadataProcessor) HandleUnknownNodeStatus(ev []byte) error {
	clusterID, err := jsonparser.GetString(ev, "payload", "cluster_id")
	if err != nil {
		return err
	}
	esClient := elastic.GetClient(processor.config.Elasticsearch)
	queryDslTpl := `{"script": {
    "source": "ctx._source.metadata.labels.status='unavailable'",
    "lang": "painless"
  },
  "query": {
    "bool": {
      "must": [
        {"term": {
          "metadata.cluster_id": {
            "value": "%s"
          }
        }},
		 {"term": {
          "metadata.category": {
            "value": "elasticsearch"
          }
        }}
      ]
    }
  }}`
	queryDsl := fmt.Sprintf(queryDslTpl, clusterID)
	_, err = esClient.UpdateByQuery(orm.GetIndexName(elastic.NodeConfig{}), []byte(queryDsl))
	return err
}

func (processor *MetadataProcessor) HandleIndexHealthChange(ev *event.Event) error {
	// save activity
	activityInfo := &event.Activity{
		ID:        util.GetUUID(),
		Timestamp: ev.Timestamp,
		Metadata: event.ActivityMetadata{
			Category: ev.Metadata.Category,
			Group:    "metadata",
			Name:     "index_health_change",
			Type:     "update",
			Labels:   ev.Metadata.Labels,
		},
	}
	esClient := elastic.GetClient(processor.config.Elasticsearch)
	_, err := esClient.Index(orm.GetIndexName(activityInfo), "", activityInfo.ID, activityInfo, "")
	if err != nil {
		return err
	}
	// update index health status
	queryDslTpl := `{
  "size": 1, 
  "query": {
    "bool": {
      "must": [
        {"term": {
          "metadata.index_id": {
            "value": "%s"
          }
        }},
		 {"term": {
          "metadata.category": {
            "value": "elasticsearch"
          }
        }}
      ],
		"must_not": [
        {"term": {
          "metadata.labels.index_status": {
            "value": "deleted"
          }
        }}
      ]
    }
  }
}`
	queryDsl := fmt.Sprintf(queryDslTpl, ev.Metadata.Labels["index_id"])
	indexName := orm.GetIndexName(elastic.IndexConfig{})
	searchRes, err := esClient.SearchWithRawQueryDSL(indexName, []byte(queryDsl))
	if err != nil {
		return err
	}
	if searchRes.GetTotal() == 0 {
		return nil
	}
	source := util.MapStr(searchRes.Hits.Hits[0].Source)
	source.Put("metadata.labels.health_status", ev.Metadata.Labels["to"])
	_, err = esClient.Index(indexName, "", searchRes.Hits.Hits[0].ID, source, "")
	return err
}
