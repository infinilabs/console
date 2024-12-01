/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package api

import (
	"fmt"
	"infini.sh/framework/core/elastic"
)

type MonitorState int
const (
	Console MonitorState = iota
	Agent
)
func GetMonitorState(clusterID string) MonitorState {
	conf := elastic.GetConfig(clusterID)
	if conf == nil {
		panic(fmt.Errorf("config of cluster [%s] is not found", clusterID))
	}
	if conf.MonitorConfigs != nil && !conf.MonitorConfigs.NodeStats.Enabled && !conf.MonitorConfigs.IndexStats.Enabled {
		return Agent
	}
	return Console
}
