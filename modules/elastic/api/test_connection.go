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

package api

import (
	"fmt"
	"github.com/segmentio/encoding/json"
	"infini.sh/console/core"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
	"net/http"
	"strings"
	"time"
)

type TestAPI struct {
	core.Handler
}

var testAPI = TestAPI{}

var testInited bool

func InitTestAPI() {
	if !testInited {
		api.HandleAPIMethod(api.POST, "/elasticsearch/try_connect", testAPI.HandleTestConnectionAction)
		testInited = true
	}
}

func (h TestAPI) HandleTestConnectionAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		freq    = httpPool.AcquireRequest()
		fres    = httpPool.AcquireResponse()
		resBody = map[string]interface{}{}
	)
	defer func() {
		httpPool.ReleaseRequest(freq)
		httpPool.ReleaseResponse(fres)
	}()
	var config = &elastic.ElasticsearchConfig{}
	err := h.DecodeJSON(req, &config)
	if err != nil {
		panic(err)
	}
	defer req.Body.Close()
	var url string
	if config.Endpoint != "" {
		url = config.Endpoint
	} else if config.Host != "" && config.Schema != "" {
		url = fmt.Sprintf("%s://%s", config.Schema, config.Host)
		config.Endpoint = url
	}
	if url != "" && !util.StringInArray(config.Endpoints, url) {
		config.Endpoints = append(config.Endpoints, url)
	}
	if config.Schema != "" && len(config.Hosts) > 0 {
		for _, host := range config.Hosts {
			host = strings.TrimSpace(host)
			if host == "" {
				continue
			}
			url = fmt.Sprintf("%s://%s", config.Schema, host)
			if !util.StringInArray(config.Endpoints, url) {
				config.Endpoints = append(config.Endpoints, url)
			}
		}
	}
	if len(config.Endpoints) == 0 {
		panic(errors.Error(fmt.Sprintf("invalid config: %v", util.MustToJSON(config))))
	}
	// limit the number of endpoints to a maximum of 10 to prevent excessive processing
	if len(config.Endpoints) > 10 {
		config.Endpoints = config.Endpoints[0:10]
	}
	if (config.BasicAuth == nil || (config.BasicAuth != nil && config.BasicAuth.Username == "")) &&
		config.CredentialID != "" && config.CredentialID != "manual" {
		credential, err := common.GetCredential(config.CredentialID)
		if err != nil {
			panic(err)
		}
		var dv interface{}
		dv, err = credential.Decode()
		if err != nil {
			panic(err)
		}
		if auth, ok := dv.(model.BasicAuth); ok {
			config.BasicAuth = &auth
		}
	}
	var (
		i           int
		clusterUUID string
	)
	for i, url = range config.Endpoints {
		if !util.SuffixStr(url, "/") {
			url = fmt.Sprintf("%s/", url)
		}

		freq.SetRequestURI(url)
		freq.Header.SetMethod("GET")

		if config.BasicAuth != nil && strings.TrimSpace(config.BasicAuth.Username) != "" {
			freq.SetBasicAuth(config.BasicAuth.Username, config.BasicAuth.Password.Get())
		}

		const testClientName = "elasticsearch_test_connection"
		err = api.GetFastHttpClient(testClientName).DoTimeout(freq, fres, 10*time.Second)

		if err != nil {
			panic(err)
		}

		var statusCode = fres.StatusCode()
		if statusCode > 300 || statusCode == 0 {
			resBody["error"] = fmt.Sprintf("invalid status code: %d", statusCode)
			h.WriteJSON(w, resBody, 500)
			return
		}

		b := fres.Body()
		clusterInfo := &elastic.ClusterInformation{}
		err = json.Unmarshal(b, clusterInfo)
		if err != nil {
			panic(err)
		}

		resBody["version"] = clusterInfo.Version.Number
		resBody["cluster_uuid"] = clusterInfo.ClusterUUID
		resBody["cluster_name"] = clusterInfo.ClusterName
		resBody["distribution"] = clusterInfo.Version.Distribution

		if i == 0 {
			clusterUUID = clusterInfo.ClusterUUID
		} else {
			//validate whether two endpoints point to the same cluster
			if clusterUUID != clusterInfo.ClusterUUID {
				resBody["error"] = fmt.Sprintf("invalid multiple cluster endpoints: %v", config.Endpoints)
				h.WriteJSON(w, resBody, http.StatusInternalServerError)
				return
			}
			//skip fetch cluster health info if it's not the first endpoint
			break
		}
		//fetch cluster health info
		freq.SetRequestURI(fmt.Sprintf("%s/_cluster/health", url))
		fres.Reset()
		err = api.GetFastHttpClient(testClientName).Do(freq, fres)
		if err != nil {
			resBody["error"] = fmt.Sprintf("error on get cluster health: %v", err)
			h.WriteJSON(w, resBody, http.StatusInternalServerError)
			return
		}

		healthInfo := &elastic.ClusterHealth{}
		err = json.Unmarshal(fres.Body(), &healthInfo)
		if err != nil {
			resBody["error"] = fmt.Sprintf("error on decode cluster health info : %v", err)
			h.WriteJSON(w, resBody, http.StatusInternalServerError)
			return
		}
		resBody["status"] = healthInfo.Status
		resBody["number_of_nodes"] = healthInfo.NumberOfNodes
		resBody["number_of_data_nodes"] = healthInfo.NumberOf_data_nodes
		resBody["active_shards"] = healthInfo.ActiveShards

		freq.Reset()
		fres.Reset()
	}

	h.WriteJSON(w, resBody, http.StatusOK)

}
