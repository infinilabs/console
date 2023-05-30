/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"bytes"
	"context"
	"fmt"
	"infini.sh/framework/core/agent"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/host"
	"infini.sh/framework/core/util"
	"io"
	"net/http"
	"os"
	"path"
	"sync"
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

//func (client *Client) doRequest(req *util.Request, respObj interface{}) error {
//	result, err := util.ExecuteRequest(req)
//	if err != nil {
//		return err
//	}
//	if result.StatusCode != 200 {
//		return fmt.Errorf(string(result.Body))
//	}
//	if respObj == nil {
//		return nil
//	}
//	return util.FromJSONBytes(result.Body, respObj)
//}

var(
	hClient *http.Client
	hClientOnce = sync.Once{}
)
func (client *Client) doRequest(req *util.Request, respObj interface{}) error {
	agCfg := GetAgentConfig()
	var err error
	hClientOnce.Do(func() {
		var (
			instanceCrt string
			instanceKey string
		)
		instanceCrt, instanceKey, err = getAgentInstanceCerts(agCfg.Setup.CACertFile, agCfg.Setup.CAKeyFile)
		hClient, err = util.NewMTLSClient(agCfg.Setup.CACertFile, instanceCrt, instanceKey)
	})
	if err != nil {
		return err
	}
	var reader io.Reader
	if len(req.Body) > 0 {
		reader = bytes.NewReader(req.Body)
	}

	var hr *http.Request
	if req.Context == nil {
		hr, err = http.NewRequest(req.Method, req.Url, reader)
	}else{
		hr, err = http.NewRequestWithContext(req.Context, req.Method, req.Url, reader)
	}
	if err != nil {
		return err
	}
	res, err := hClient.Do(hr)
	if err != nil {
		return err
	}
	if respObj != nil {
		defer res.Body.Close()
		buf, err := io.ReadAll(res.Body)
		if err != nil {
			return err
		}
		err = util.FromJSONBytes(buf, respObj)
		if err != nil {
			return err
		}
	}
	return nil
}

func getAgentInstanceCerts(caFile, caKey string) (string, string, error) {
	dataDir := global.Env().GetDataDir()
	instanceCrt := path.Join(dataDir, "certs/agent/instance.crt")
	instanceKey := path.Join(dataDir, "certs/agent/instance.key")
	var (
		err error
		clientCertPEM []byte
		clientKeyPEM []byte
	)
	if util.FileExists(instanceCrt) && util.FileExists(instanceKey) {
		return instanceCrt, instanceKey, nil
	}
	_, clientCertPEM, clientKeyPEM, err = GenerateClientCert(caFile, caKey)
	if err != nil {
		return "", "", err
	}
	baseDir := path.Join(dataDir, "certs/agent")
	if !util.IsExist(baseDir){
		err = os.MkdirAll(baseDir, 0775)
		if err != nil {
			return "", "", err
		}
	}
	_, err = util.FilePutContentWithByte(instanceCrt, clientCertPEM)
	if err != nil {
		return "", "", err
	}
	_, err = util.FilePutContentWithByte(instanceKey, clientKeyPEM)
	if err != nil {
		return "", "", err
	}
	return instanceCrt, instanceKey, nil
}