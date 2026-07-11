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

package common

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/segmentio/encoding/json"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/errors"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/adapter"
)

const ClusterProbePathLabel = "console_probe_path"

func NormalizeProbePath(path string) string {
	path = strings.TrimSpace(path)
	if path == "" || path == "/" {
		return ""
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return path
}

func GetProbePath(config *elastic.ElasticsearchConfig) string {
	if config == nil || config.Labels == nil {
		return ""
	}
	return NormalizeProbePath(util.ToString(config.Labels[ClusterProbePathLabel]))
}

func SetProbePath(config *elastic.ElasticsearchConfig, path string) {
	if config == nil {
		return
	}
	path = NormalizeProbePath(path)
	if config.Labels == nil {
		config.Labels = util.MapStr{}
	}
	if path == "" {
		delete(config.Labels, ClusterProbePathLabel)
		return
	}
	config.Labels[ClusterProbePathLabel] = path
}

func BuildEndpointWithPath(endpoint, path string) string {
	path = NormalizeProbePath(path)
	if path == "" {
		return endpoint
	}

	baseURL, err := url.Parse(endpoint)
	if err != nil {
		return strings.TrimRight(endpoint, "/") + path
	}

	refURL, err := url.Parse(path)
	if err != nil {
		return strings.TrimRight(endpoint, "/") + path
	}

	return baseURL.ResolveReference(refURL).String()
}

func ClusterVersion(metadata *elastic.ElasticsearchMetadata) (*elastic.ClusterInformation, error) {
	if metadata == nil || metadata.Config == nil {
		return nil, errors.New("elasticsearch metadata is nil")
	}

	probePath := GetProbePath(metadata.Config)
	if probePath == "" {
		return adapter.ClusterVersion(metadata)
	}

	if metadata.Config.RequestTimeout <= 0 {
		metadata.Config.RequestTimeout = 5
	}

	endpoint := fmt.Sprintf("%v://%v", metadata.GetSchema(), metadata.GetActiveHost())
	if err := probeClusterEndpoint(metadata.Config, endpoint, probePath); err != nil {
		return nil, err
	}
	return loadClusterInformationWithoutRoot(metadata.Config, endpoint)
}

func ClusterVersionWithConfig(config *elastic.ElasticsearchConfig) (*elastic.ClusterInformation, error) {
	if config == nil {
		return nil, errors.New("elasticsearch config is nil")
	}
	return ClusterVersion(&elastic.ElasticsearchMetadata{Config: config})
}

func probeClusterEndpoint(config *elastic.ElasticsearchConfig, endpoint, probePath string) error {
	res, err := executeRequest(config, BuildEndpointWithPath(endpoint, probePath))
	if err != nil {
		return err
	}
	if res.StatusCode != http.StatusOK {
		return errors.New(string(res.Body))
	}
	return nil
}

func loadClusterInformationWithoutRoot(config *elastic.ElasticsearchConfig, endpoint string) (*elastic.ClusterInformation, error) {
	stats := &elastic.ClusterStats{}
	res, err := executeRequest(config, BuildEndpointWithPath(endpoint, "/_cluster/stats"))
	if err != nil {
		return nil, err
	}
	if res.StatusCode != http.StatusOK {
		return nil, errors.New(string(res.Body))
	}
	if err = json.Unmarshal(res.Body, stats); err != nil {
		return nil, err
	}

	nodes := &elastic.NodesResponse{}
	res, err = executeRequest(config, BuildEndpointWithPath(endpoint, "/_nodes/_all/http"))
	if err != nil {
		return nil, err
	}
	if res.StatusCode != http.StatusOK {
		return nil, errors.New(string(res.Body))
	}
	if err = json.Unmarshal(res.Body, nodes); err != nil {
		return nil, err
	}

	info := &elastic.ClusterInformation{
		ClusterName: stats.ClusterName,
		ClusterUUID: stats.ClusterUUID,
	}
	if info.ClusterName == "" {
		info.ClusterName = nodes.ClusterName
	}
	for _, node := range nodes.Nodes {
		if node.Version != "" {
			info.Version.Number = node.Version
			break
		}
	}
	info.Version.Distribution = config.Distribution
	if info.Version.Distribution == "" {
		info.Version.Distribution = elastic.Elasticsearch
	}
	return info, nil
}

func executeRequest(config *elastic.ElasticsearchConfig, requestURL string) (*util.Result, error) {
	req := util.Request{
		Method: http.MethodGet,
		Url:    requestURL,
	}
	if config.BasicAuth != nil && strings.TrimSpace(config.BasicAuth.Username) != "" {
		req.SetBasicAuth(config.BasicAuth.Username, config.BasicAuth.Password.Get())
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(getRequestTimeout(config))*time.Second)
	req.Context = ctx
	defer cancel()

	return util.ExecuteRequestWithCatchFlag(nil, &req, true)
}

func getRequestTimeout(config *elastic.ElasticsearchConfig) int {
	if config == nil || config.RequestTimeout <= 0 {
		return 5
	}
	return config.RequestTimeout
}
