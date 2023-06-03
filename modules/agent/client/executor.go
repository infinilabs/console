/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package client

import (
	"bytes"
	"fmt"
	"infini.sh/console/modules/agent/common"
	"infini.sh/framework/core/util"
	"io"
	"net/http"
)

type Executor interface {
	DoRequest(req *util.Request, respObj interface{}) error
}

type HttpExecutor struct {
}

func (executor *HttpExecutor) DoRequest(req *util.Request, respObj interface{}) error {
	result, err := util.ExecuteRequest(req)
	if err != nil {
		return err
	}
	if result.StatusCode != 200 {
		return fmt.Errorf(string(result.Body))
	}
	if respObj == nil {
		return nil
	}
	return util.FromJSONBytes(result.Body, respObj)
}

func NewMTLSExecutor(caCertFile, caKeyFile string) (*MTLSExecutor, error){
	var (
		instanceCrt string
		instanceKey string
	)
	instanceCrt, instanceKey, err := common.GetAgentInstanceCerts(caCertFile, caKeyFile)
	if err != nil {
		return nil, fmt.Errorf("generate tls cert error: %w", err)
	}
	hClient, err := util.NewMTLSClient(caCertFile, instanceCrt, instanceKey)
	if err != nil {
		return nil, err
	}
	return &MTLSExecutor{
		CaCertFile: caCertFile,
		CAKeyFile: caKeyFile,
		client: hClient,
	}, nil
}

type MTLSExecutor struct {
	CaCertFile string
	CAKeyFile string
	client *http.Client
}


func (executor *MTLSExecutor) DoRequest(req *util.Request, respObj interface{}) error {
	var reader io.Reader
	if len(req.Body) > 0 {
		reader = bytes.NewReader(req.Body)
	}
	var (
		hr *http.Request
		err error
	)
	if req.Context == nil {
		hr, err = http.NewRequest(req.Method, req.Url, reader)
	}else{
		hr, err = http.NewRequestWithContext(req.Context, req.Method, req.Url, reader)
	}
	if err != nil {
		return err
	}
	res, err := executor.client.Do(hr)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	buf, err := io.ReadAll(res.Body)
	if err != nil {
		return err
	}
	if res.StatusCode != 200 {
		return fmt.Errorf(string(buf))
	}
	if respObj != nil {
		err = util.FromJSONBytes(buf, respObj)
		if err != nil {
			return err
		}
	}
	return nil
}