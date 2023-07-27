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
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/param"
	"infini.sh/framework/core/pipeline"
	"infini.sh/framework/core/queue"
	"infini.sh/framework/core/util"
)

type MetadataProcessor struct {
	config *Config
	id     string
}

type Config struct {
	MessageField  param.ParaKey `config:"message_field"`
	Elasticsearch string        `config:"elasticsearch,omitempty"`
}

func init() {
	pipeline.RegisterProcessorPlugin("metadata", New)
}

func New(c *config.Config) (pipeline.Processor, error) {
	cfg := Config{
		MessageField: "messages",
	}

	if err := c.Unpack(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unpack the configuration of flow_runner processor: %s", err)
	}

	if cfg.Elasticsearch == "" {
		return nil, errors.New("elasticsearch config was not found in metadata processor")
	}

	runner := MetadataProcessor{
		id:     util.GetUUID(),
		config: &cfg,
	}
	return &runner, nil
}

func (processor *MetadataProcessor) Name() string {
	return "metadata"
}

func (processor *MetadataProcessor) Process(ctx *pipeline.Context) error {

	//get message from queue
	obj := ctx.Get(processor.config.MessageField)
	if obj != nil {
		messages := obj.([]queue.Message)
		log.Tracef("get %v messages from context", len(messages))
		if len(messages) == 0 {
			return nil
		}
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
	return nil
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
