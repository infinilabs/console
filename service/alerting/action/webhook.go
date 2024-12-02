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

