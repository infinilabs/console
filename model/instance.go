/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package model

import (
	"context"
	"fmt"
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/pipeline"
	"net/http"
	"time"
)


type Instance struct {
	orm.ORMObjectBase

	//InstanceID string `json:"instance_id,omitempty" elastic_mapping:"instance_id: { type: keyword }"`
	Name        string `json:"name,omitempty" elastic_mapping:"name:{type:keyword,fields:{text: {type: text}}}"`
	Endpoint string `json:"endpoint,omitempty" elastic_mapping:"endpoint: { type: keyword }"`
	Version map[string]interface{} `json:"version,omitempty" elastic_mapping:"version: { type: object }"`
	BasicAuth agent.BasicAuth `config:"basic_auth" json:"basic_auth,omitempty" elastic_mapping:"basic_auth:{type:object}"`
	Owner string `json:"owner,omitempty" config:"owner" elastic_mapping:"owner:{type:keyword}"`
	Tags [] string `json:"tags,omitempty"`
	Description string `json:"description,omitempty" config:"description" elastic_mapping:"description:{type:keyword}"`
}

func (inst *Instance) CreatePipeline(body []byte) error {
	req := &util.Request{
		Method: http.MethodPost,
		Body: body,
		Url: inst.Endpoint + "/pipeline/tasks/",
	}
	return inst.doRequest(req, nil)
}

func (inst *Instance) StopPipeline(ctx context.Context, pipelineID string) error {
	req := &util.Request{
		Method: http.MethodPost,
		Url: fmt.Sprintf("%s/pipeline/task/%s/_stop", inst.Endpoint, pipelineID),
		Context: ctx,
	}
	return inst.doRequest(req, nil)
}

func (inst *Instance) StopPipelineWithTimeout(pipelineID string, duration time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), duration)
	defer cancel()
	return inst.StopPipeline(ctx, pipelineID)
}

func (inst *Instance) StartPipeline(pipelineID string) error {
	req := &util.Request{
		Method: http.MethodPost,
		Url: fmt.Sprintf("%s/pipeline/task/%s/_start", inst.Endpoint, pipelineID),
	}
	return inst.doRequest(req, nil)
}


func (inst *Instance) DeletePipeline(pipelineID string) error {
	req := &util.Request{
		Method: http.MethodDelete,
		Url: fmt.Sprintf("%s/pipeline/task/%s", inst.Endpoint, pipelineID),
	}
	return inst.doRequest(req, nil)
}

func (inst *Instance) GetPipelinesByIDs(pipelineIDs []string) (pipeline.GetPipelinesResponse, error) {
	body := util.MustToJSONBytes(util.MapStr{
		"ids": pipelineIDs,
	})
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	req := &util.Request{
		Method: http.MethodPost,
		Url: fmt.Sprintf("%s/pipeline/tasks/_search", inst.Endpoint),
		Body: body,
		Context: ctx,
	}
	res := pipeline.GetPipelinesResponse{}
	err := inst.doRequest(req, &res)
	return res, err
}

func (inst *Instance) DeleteQueueBySelector(selector util.MapStr) error {
	req := &util.Request{
		Method: http.MethodDelete,
		Url: fmt.Sprintf("%s/queue/_search", inst.Endpoint),
		Body: util.MustToJSONBytes(util.MapStr{
			"selector": selector,
		}),
	}
	return inst.doRequest(req, nil)
}

func (inst *Instance) TryConnect(ctx context.Context) error {
	req := &util.Request{
		Method: http.MethodGet,
		Url: fmt.Sprintf("%s/_framework/api/_info", inst.Endpoint),
		Context: ctx,
	}
	return inst.doRequest(req, nil)
}
func (inst *Instance) TryConnectWithTimeout(duration time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), duration)
	defer cancel()
	return inst.TryConnect(ctx)
}

func (inst *Instance) doRequest(req *util.Request, resBody interface{}) error {
	req.SetBasicAuth(inst.BasicAuth.Username, inst.BasicAuth.Password)
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