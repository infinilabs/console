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

package model

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/pipeline"
)

type TaskWorker struct {
	model.Instance
}

func (inst *TaskWorker) CreatePipeline(body []byte) error {
	req := &util.Request{
		Method: http.MethodPost,
		Body:   body,
		Url:    inst.Endpoint + "/pipeline/tasks/",
	}
	return inst.doRequest(req, nil)
}

func (inst *TaskWorker) StopPipeline(ctx context.Context, pipelineID string) error {
	req := &util.Request{
		Method:  http.MethodPost,
		Url:     fmt.Sprintf("%s/pipeline/task/%s/_stop", inst.Endpoint, pipelineID),
		Context: ctx,
	}
	return inst.doRequest(req, nil)
}

func (inst *TaskWorker) StopPipelineWithTimeout(pipelineID string, duration time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), duration)
	defer cancel()
	return inst.StopPipeline(ctx, pipelineID)
}

func (inst *TaskWorker) StartPipeline(pipelineID string) error {
	req := &util.Request{
		Method: http.MethodPost,
		Url:    fmt.Sprintf("%s/pipeline/task/%s/_start", inst.Endpoint, pipelineID),
	}
	return inst.doRequest(req, nil)
}

func (inst *TaskWorker) DeletePipeline(pipelineID string) error {
	req := &util.Request{
		Method: http.MethodDelete,
		Url:    fmt.Sprintf("%s/pipeline/task/%s", inst.Endpoint, pipelineID),
	}
	return inst.doRequest(req, nil)
}

func (inst *TaskWorker) GetPipeline(pipelineID string) (*pipeline.PipelineStatus, error) {
	if pipelineID == "" {
		return nil, errors.New("invalid pipelineID")
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	req := &util.Request{
		Method:  http.MethodGet,
		Url:     fmt.Sprintf("%s/pipeline/task/%s", inst.Endpoint, pipelineID),
		Context: ctx,
	}
	res := pipeline.PipelineStatus{}
	err := inst.doRequest(req, &res)
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (inst *TaskWorker) GetPipelinesByIDs(pipelineIDs []string) (pipeline.GetPipelinesResponse, error) {
	body := util.MustToJSONBytes(util.MapStr{
		"ids": pipelineIDs,
	})
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	req := &util.Request{
		Method:  http.MethodPost,
		Url:     fmt.Sprintf("%s/pipeline/tasks/_search", inst.Endpoint),
		Body:    body,
		Context: ctx,
	}
	res := pipeline.GetPipelinesResponse{}
	err := inst.doRequest(req, &res)
	return res, err
}

func (inst *TaskWorker) DeleteQueueBySelector(selector util.MapStr) error {
	req := &util.Request{
		Method: http.MethodDelete,
		Url:    fmt.Sprintf("%s/queue/_search", inst.Endpoint),
		Body: util.MustToJSONBytes(util.MapStr{
			"selector": selector,
		}),
	}
	return inst.doRequest(req, nil)
}

func (inst *TaskWorker) DeleteQueueConsumersBySelector(selector util.MapStr) error {
	req := &util.Request{
		Method: http.MethodDelete,
		Url:    fmt.Sprintf("%s/queue/consumer/_search", inst.Endpoint),
		Body: util.MustToJSONBytes(util.MapStr{
			"selector": selector,
		}),
	}
	return inst.doRequest(req, nil)
}

func (inst *TaskWorker) TryConnect(ctx context.Context) error {
	req := &util.Request{
		Method:  http.MethodGet,
		Url:     fmt.Sprintf("%s/_info", inst.Endpoint),
		Context: ctx,
	}
	return inst.doRequest(req, nil)
}

func (inst *TaskWorker) TryConnectWithTimeout(duration time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), duration)
	defer cancel()
	return inst.TryConnect(ctx)
}

func (inst *TaskWorker) doRequest(req *util.Request, resBody interface{}) error {
	if inst.BasicAuth != nil && inst.BasicAuth.Username != "" {
		req.SetBasicAuth(inst.BasicAuth.Username, inst.BasicAuth.Password.Get())
	}
	result, err := util.ExecuteRequest(req)
	if err != nil {
		return err
	}
	if result.StatusCode != http.StatusOK {
		return fmt.Errorf(string(result.Body))
	}
	if resBody != nil {
		return util.FromJSONBytes(result.Body, resBody)
	}
	return nil
}
