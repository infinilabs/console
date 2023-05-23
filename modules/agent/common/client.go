/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"context"
	"fmt"
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/host"
	"infini.sh/framework/core/util"
	"net/http"
)

type Client struct {
}

func (client *Client) GetHostInfo(ctx context.Context, agentBaseURL string) (*host.HostInfo, error) {
	req := &util.Request{
		Method:  http.MethodGet,
		Url:     fmt.Sprintf("%s/agent/host/_basic", agentBaseURL),
		Context: ctx,
	}
	resBody := struct {
		Success bool `json:"success"`
		Error string `json:"error"`
		HostInfo *host.HostInfo `json:"result"`
	}{}
	err := client.doRequest(req, &resBody)
	if err != nil {
		return nil, err
	}
	if resBody.Success != true {
		return nil, fmt.Errorf("enroll error from client: %v", resBody.Error)
	}
	return resBody.HostInfo, nil
}

func (client *Client) GetElasticProcess(ctx context.Context, agentBaseURL string, agentID string)(interface{}, error) {
	req := &util.Request{
		Method:  http.MethodGet,
		Url:     fmt.Sprintf("%s/elasticsearch/%s/process/_elastic", agentBaseURL, agentID),
		Context: ctx,
	}
	resBody := map[string]interface{}{}
	err := client.doRequest(req, &resBody)
	if err != nil {
		return nil, err
	}
	if resBody["success"] != true {
		return nil, fmt.Errorf("discover host callback error: %v", resBody["error"])
	}
	return resBody["elastic_process"], nil
}

func (client *Client) GetElasticLogFiles(ctx context.Context, agentBaseURL string, logsPath string)(interface{}, error) {
	reqBody := util.MustToJSONBytes(util.MapStr{
		"logs_path": logsPath,
	})
	req := &util.Request{
		Method:  http.MethodPost,
		Url:     fmt.Sprintf("%s/agent/logs/elastic/list", agentBaseURL),
		Context: ctx,
		Body: reqBody,
	}
	resBody := map[string]interface{}{}
	err := client.doRequest(req, &resBody)
	if err != nil {
		return nil, err
	}
	if resBody["success"] != true {
		return nil, fmt.Errorf("get elasticsearch log files error: %v", resBody["error"])
	}
	return resBody["result"], nil
}

func (client *Client) GetElasticLogFileContent(ctx context.Context, agentBaseURL string, body interface{})(interface{}, error) {
	req := &util.Request{
		Method:  http.MethodPost,
		Url:     fmt.Sprintf("%s/agent/logs/elastic/_read", agentBaseURL),
		Context: ctx,
		Body: util.MustToJSONBytes(body),
	}
	resBody := map[string]interface{}{}
	err := client.doRequest(req, &resBody)
	if err != nil {
		return nil, err
	}
	if resBody["success"] != true {
		return nil, fmt.Errorf("get elasticsearch log files error: %v", resBody["error"])
	}
	var hasMore bool
	if v, ok := resBody["EOF"].(bool); ok && !v {
		hasMore = true
	}
	return map[string]interface{}{
		"lines": resBody["result"],
		"has_more": hasMore,
	} , nil
}

func (client *Client) GetInstanceBasicInfo(ctx context.Context, agentBaseURL string) (*agent.Instance, error){
	req := &util.Request{
		Method:  http.MethodGet,
		Url:     fmt.Sprintf("%s/agent/_info", agentBaseURL ),
		Context: ctx,
	}
	resBody := &agent.Instance{}
	err := client.doRequest(req, &resBody)
	return resBody, err
}

func (client *Client) RegisterElasticsearch(ctx context.Context, agentBaseURL string, cfgs []elastic.ElasticsearchConfig) error {
	reqBody, err := util.ToJSONBytes(cfgs)
	if err != nil {
		return err
	}
	req := &util.Request{
		Method:  http.MethodPost,
		Url:     fmt.Sprintf("%s/elasticsearch/_register", agentBaseURL ),
		Context: ctx,
		Body: reqBody,
	}
	resBody := util.MapStr{}
	err = client.doRequest(req, &resBody)
	if err != nil {
		return err
	}
	if resBody["acknowledged"] != true {
		return fmt.Errorf("%v", resBody["error"])
	}
	return nil
}

func (client *Client) GetElasticsearchNodes(ctx context.Context, agentBaseURL string) ([]agent.ESNodeInfo, error) {
	req := &util.Request{
		Method:  http.MethodGet,
		Url:     fmt.Sprintf("%s/elasticsearch/_nodes", agentBaseURL ),
		Context: ctx,
	}
	resBody := []agent.ESNodeInfo{}
	err := client.doRequest(req, &resBody)
	if err != nil {
		return nil, err
	}

	return resBody, nil
}

func (client *Client) AuthESNode(ctx context.Context, agentBaseURL string, cfg elastic.ElasticsearchConfig) (*agent.ESNodeInfo, error) {
	reqBody, err := util.ToJSONBytes(cfg)
	if err != nil {
		return nil, err
	}
	req := &util.Request{
		Method:  http.MethodPost,
		Url:     fmt.Sprintf("%s/elasticsearch/_auth", agentBaseURL ),
		Context: ctx,
		Body: reqBody,
	}
	resBody := &agent.ESNodeInfo{}
	err = client.doRequest(req, resBody)
	if err != nil {
		return nil, err
	}
	return resBody, nil
}

func (client *Client) CreatePipeline(ctx context.Context, agentBaseURL string, body []byte) error{
	req := &util.Request{
		Method: http.MethodPost,
		Url:    agentBaseURL + "/pipeline/tasks/",
		Body: body,
		Context: ctx,
	}
	resBody := util.MapStr{}
	return client.doRequest(req, &resBody)
}

func (client *Client) DeletePipeline(ctx context.Context, agentBaseURL, pipelineID string) error{
	req := &util.Request{
		Method: http.MethodDelete,
		Url:     fmt.Sprintf("%s/pipeline/task/%s", agentBaseURL, pipelineID),
		Context: ctx,
	}
	return client.doRequest(req, nil)
}

func (client *Client) doRequest(req *util.Request, respObj interface{}) error {
	result, err := util.ExecuteRequest(req)
	if err != nil {
		return err
	}
	if result.StatusCode != 200 {
		return fmt.Errorf(string(result.Body))
	}
	return util.FromJSONBytes(result.Body, respObj)
}
