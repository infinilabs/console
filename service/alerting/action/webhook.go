/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package action

import (
	"crypto/tls"
	"infini.sh/console/model/alerting"
	"io/ioutil"
	"net/http"
	"strings"
)

type Action interface {
	Execute() ([]byte, error)
}

type WebhookAction struct {
	Data *alerting.CustomWebhook
	Message string
}

var actionClient = http.Client{
	Transport: &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	},
}

func (act *WebhookAction) Execute()([]byte, error){
	var reqURL = act.Data.URL
	reqBody := strings.NewReader(act.Message)
	req, err := http.NewRequest(http.MethodPost, reqURL, reqBody)
	if err != nil {
		return nil, err
	}
	for key, value := range act.Data.HeaderParams {
		req.Header.Add(key, value)
	}
	res, err := actionClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	return ioutil.ReadAll(res.Body)
}

