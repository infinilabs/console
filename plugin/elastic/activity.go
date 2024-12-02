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
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package elastic

import (
	"fmt"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"github.com/segmentio/encoding/json"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/event"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/pipeline"
	"infini.sh/framework/core/queue"
	"infini.sh/framework/core/util"
)

type ActivityProcessor struct {
	config *Config
	id     string
}

func init() {
	pipeline.RegisterProcessorPlugin("activity", NewActivityProcessor)
}

func NewActivityProcessor(c *config.Config) (pipeline.Processor, error) {
	cfg := Config{
		MessageField: "messages",
	}

	if err := c.Unpack(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unpack the configuration of flow_runner processor: %s", err)
	}

	if cfg.Elasticsearch == "" {
		return nil, errors.New("elasticsearch config was not found in metadata processor")
	}

	runner := ActivityProcessor{
		id:     util.GetUUID(),
		config: &cfg,
	}

	return &runner, nil
}

func (processor *ActivityProcessor) Name() string {
	return "activity"
}

func (processor *ActivityProcessor) Process(ctx *pipeline.Context) error {
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
			case "activity":
				activity, _, _, err := jsonparser.Get(pop.Data, "payload", "activity")
				if err != nil {
					panic(err)
				}

				err = processor.HandleActivity(activity)
			}
		}
	}
	return nil
}

func (processor *ActivityProcessor) HandleActivity(activityByte []byte) error {
	// save activity
	activityInfo := &event.Activity{}
	json.Unmarshal(activityByte, activityInfo)
	esClient := elastic.GetClient(processor.config.Elasticsearch)
	_, err := esClient.Index(orm.GetIndexName(activityInfo), "", activityInfo.ID, activityInfo, "")
	return err
}
