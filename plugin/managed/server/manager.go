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

/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package server

import (
	"crypto/tls"
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/console/core"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/configs/common"
	"net"
	"net/http"
	"net/url"
	"sync"
	"time"
)

type APIHandler struct {
	core.Handler
}

var serverInit = sync.Once{}
var configRepo common.ConfigRepo
var handler = APIHandler{}

func init() {

	api.HandleAPIMethod(api.POST, common.SYNC_API, handler.syncConfigs)           //client sync configs from config servers
	api.HandleAPIMethod(api.POST, "/configs/_reload", handler.refreshConfigsRepo) //client sync configs from config servers
	//delegate api to instances
	api.HandleAPIFunc("/ws_proxy", func(w http.ResponseWriter, req *http.Request) {
		log.Debug(req.RequestURI)
		endpoint := req.URL.Query().Get("endpoint")
		path := req.URL.Query().Get("path")
		var tlsConfig = &tls.Config{
			InsecureSkipVerify: true,
		}
		target, err := url.Parse(endpoint)
		if err != nil {
			panic(err)
		}
		newURL, err := url.Parse(path)
		if err != nil {
			panic(err)
		}
		req.URL.Path = newURL.Path
		req.URL.RawPath = newURL.RawPath
		req.URL.RawQuery = ""
		req.RequestURI = req.URL.RequestURI()
		req.Header.Set("HOST", target.Host)
		req.Host = target.Host
		wsProxy := NewSingleHostReverseProxy(target)
		wsProxy.Dial = (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).Dial
		wsProxy.TLSClientConfig = tlsConfig
		wsProxy.ServeHTTP(w, req)
	})
}

var mTLSClient *http.Client //TODO get mTLSClient
var initOnce = sync.Once{}

func ProxyAgentRequest(tag, endpoint string, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, error) {
	var err error
	var res *util.Result

	initOnce.Do(func() {
		cfg := global.Env().GetHTTPClientConfig(tag, endpoint)
		if cfg != nil {
			hClient, err := api.NewHTTPClient(cfg)
			if err != nil {
				panic(err)
			}
			mTLSClient = hClient
		}
	})

	req.Url = endpoint + req.Path

	res, err = util.ExecuteRequestWithCatchFlag(mTLSClient, req, true)
	if err != nil || res.StatusCode != 200 {
		body := ""
		if res != nil {
			body = string(res.Body)
		}
		return res, errors.New(fmt.Sprintf("request error: %v, %v", err, body))
	}

	if res != nil {
		if res.Body != nil {
			if responseObjectToUnMarshall != nil {
				return res, util.FromJSONBytes(res.Body, responseObjectToUnMarshall)
			}
		}
	}

	return res, err
}
