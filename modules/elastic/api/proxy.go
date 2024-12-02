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

package api

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"github.com/segmentio/encoding/json"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"infini.sh/framework/lib/fasthttp"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

var httpPool = fasthttp.NewRequestResponsePool("proxy_search")

func (h *APIHandler) HandleProxyAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	resBody := map[string]interface{}{}
	targetClusterID := ps.ByName("id")
	method := h.GetParameterOrDefault(req, "method", "")
	path := h.GetParameterOrDefault(req, "path", "")
	if method == "" || path == "" {
		resBody["error"] = fmt.Errorf("parameter method and path is required")
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	exists, esClient, err := h.GetClusterClient(targetClusterID)

	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}

	if !exists {
		resBody["error"] = fmt.Sprintf("cluster [%s] not found", targetClusterID)
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}

	authPath, _ := url.PathUnescape(path)
	var realPath = authPath
	newURL, err := url.Parse(realPath)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	if strings.Trim(newURL.Path, "/") == "_sql" {
		distribution := esClient.GetVersion().Distribution
		indexName, err := rewriteTableNamesOfSqlRequest(req, distribution)
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if !h.IsIndexAllowed(req, targetClusterID, indexName) {
			h.WriteError(w, fmt.Sprintf("forbidden to access index %s", indexName), http.StatusForbidden)
			return
		}
		q, _ := url.ParseQuery(newURL.RawQuery)
		hasFormat := q.Has("format")
		switch distribution {
		case elastic.Opensearch:
			path = "_plugins/_sql?format=raw"
		case elastic.Easysearch:
			if !hasFormat {
				q.Add("format", "raw")
			}
			path = "_sql?" + q.Encode()
		default:
			if !hasFormat {
				q.Add("format", "txt")
			}
			path = "_sql?" + q.Encode()
		}
	}
	//ccs search
	if parts := strings.SplitN(authPath, "/", 2); strings.Contains(parts[0], ":") {
		ccsParts := strings.SplitN(parts[0], ":", 2)
		realPath = fmt.Sprintf("%s/%s", ccsParts[1], parts[1])
	}
	newReq := req.Clone(context.Background())
	newReq.URL = newURL
	newReq.Method = method
	isSuperAdmin, permission, err := h.ValidateProxyRequest(newReq, targetClusterID)
	if err != nil {
		log.Error(err)
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusForbidden)
		return
	}
	if permission == "" && api.IsAuthEnable() && !isSuperAdmin {
		resBody["error"] = "unknown request path"
		h.WriteJSON(w, resBody, http.StatusForbidden)
		return
	}
	//if permission != "" {
	//	if permission == "cat.indices" || permission == "cat.shards" {
	//		reqUrl.Path
	//	}
	//}

	var (
		freq = httpPool.AcquireRequest()
		fres = httpPool.AcquireResponse()
	)
	defer func() {
		httpPool.ReleaseRequest(freq)
		httpPool.ReleaseResponse(fres)
	}()
	metadata := elastic.GetMetadata(targetClusterID)
	if metadata == nil {
		resBody["error"] = fmt.Sprintf("cluster [%s] metadata not found", targetClusterID)
		log.Error(resBody["error"])
		h.WriteJSON(w, resBody, http.StatusNotFound)
		return
	}

	if metadata.Config.BasicAuth != nil {
		freq.SetBasicAuth(metadata.Config.BasicAuth.Username, metadata.Config.BasicAuth.Password.Get())
	}

	endpoint := util.JoinPath(metadata.GetActivePreferredSeedEndpoint(), path)

	freq.SetRequestURI(endpoint)
	method = strings.ToUpper(method)
	freq.Header.SetMethod(method)
	freq.Header.SetUserAgent(req.Header.Get("user-agent"))
	freq.Header.SetReferer(endpoint)
	rurl, _ := url.Parse(endpoint)

	if rurl != nil {
		freq.Header.SetHost(rurl.Host)
		freq.Header.SetRequestURI(rurl.RequestURI())
	}

	clonedURI := freq.CloneURI()
	defer fasthttp.ReleaseURI(clonedURI)
	clonedURI.SetScheme(metadata.GetSchema())
	freq.SetURI(clonedURI)

	if permission == "cluster.search" {
		indices, hasAll := h.GetAllowedIndices(req, targetClusterID)
		if !hasAll && len(indices) == 0 {
			h.WriteJSON(w, elastic.SearchResponse{}, http.StatusOK)
			return
		}
		if hasAll {
			freq.SetBodyStream(req.Body, int(req.ContentLength))
		} else {
			body, err := io.ReadAll(req.Body)
			if err != nil {
				log.Error(err)
				h.WriteError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if len(body) == 0 {
				body = []byte("{}")
			}
			v, _, _, _ := jsonparser.Get(body, "query")
			newQ := bytes.NewBuffer([]byte(`{"bool": {"must": [{"terms": {"_index":`))
			indicesBytes := util.MustToJSONBytes(indices)
			newQ.Write(indicesBytes)
			newQ.Write([]byte("}}"))
			if len(v) > 0 {
				newQ.Write([]byte(","))
				newQ.Write(v)
			}
			newQ.Write([]byte(`]}}`))
			body, _ = jsonparser.Set(body, newQ.Bytes(), "query")
			freq.SetBody(body)
		}
	} else {
		freq.SetBodyStream(req.Body, int(req.ContentLength))
	}
	defer req.Body.Close()

	err = getHttpClient().Do(freq, fres)
	if err != nil {
		resBody["error"] = err.Error()
		h.WriteJSON(w, resBody, http.StatusInternalServerError)
		return
	}
	okBody := struct {
		RequestHeader  string `json:"request_header"`
		ResponseHeader string `json:"response_header"`
		ResponseBody   string `json:"response_body"`
	}{
		RequestHeader:  freq.Header.String(),
		ResponseHeader: fres.Header.String(),
		ResponseBody:   string(fres.GetRawBody()),
	}

	w.Header().Set("Content-type", string(fres.Header.ContentType()))
	w.WriteHeader(fres.StatusCode())
	json.NewEncoder(w).Encode(okBody)

}

func rewriteTableNamesOfSqlRequest(req *http.Request, distribution string) (string, error) {
	var buf bytes.Buffer
	if _, err := buf.ReadFrom(req.Body); err != nil {
		return "", err
	}
	if err := req.Body.Close(); err != nil {
		return "", err
	}
	req.Body = io.NopCloser(bytes.NewReader(buf.Bytes()))
	sqlQuery, err := jsonparser.GetString(buf.Bytes(), "query")
	if err != nil {
		return "", fmt.Errorf("parse query from request body error: %w", err)
	}
	q := util.NewSQLQueryString(sqlQuery)
	tableNames, err := q.TableNames()
	if err != nil {
		return "", err
	}
	rewriteBody := false
	switch distribution {
	case elastic.Elasticsearch:
		for _, tname := range tableNames {
			if strings.ContainsAny(tname, "-.") && !strings.HasPrefix(tname, "\"") {
				//append quotes from table name
				sqlQuery = strings.Replace(sqlQuery, tname, fmt.Sprintf(`\"%s\"`, tname), -1)
				rewriteBody = true
			}
		}
	case elastic.Opensearch, elastic.Easysearch:
		for _, tname := range tableNames {
			//remove quotes from table name
			if strings.HasPrefix(tname, "\"") || strings.HasSuffix(tname, "\"") {
				sqlQuery = strings.Replace(sqlQuery, tname, strings.Trim(tname, "\""), -1)
				rewriteBody = true
			}
		}
	}
	if rewriteBody {
		sqlQuery = fmt.Sprintf(`"%s"`, sqlQuery)
		reqBody, _ := jsonparser.Set(buf.Bytes(), []byte(sqlQuery), "query")
		req.Body = io.NopCloser(bytes.NewReader(reqBody))
		req.ContentLength = int64(len(reqBody))
	}
	var unescapedTableNames []string
	for _, tname := range tableNames {
		unescapedTableNames = append(unescapedTableNames, strings.Trim(tname, "\""))
	}
	return strings.Join(unescapedTableNames, ","), nil
}

var (
	client     *fasthttp.Client
	clientOnce sync.Once
)

func getHttpClient() *fasthttp.Client {
	clientOnce.Do(func() {
		clientCfg := global.Env().SystemConfig.HTTPClientConfig
		client = &fasthttp.Client{
			MaxConnsPerHost: clientCfg.MaxConnectionPerHost,
			TLSConfig:       &tls.Config{InsecureSkipVerify: clientCfg.TLSConfig.TLSInsecureSkipVerify},
			ReadTimeout:     util.GetDurationOrDefault(clientCfg.ReadTimeout, 60*time.Second),
			WriteTimeout:    util.GetDurationOrDefault(clientCfg.ReadTimeout, 60*time.Second),
			DialDualStack:   true,
			ReadBufferSize:  clientCfg.ReadBufferSize,
			WriteBufferSize: clientCfg.WriteBufferSize,
			//Dial:            fasthttpproxy.FasthttpProxyHTTPDialerTimeout(time.Second * 2),
		}
	})
	return client
}
