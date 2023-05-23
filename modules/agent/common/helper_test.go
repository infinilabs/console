/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"fmt"
	"gopkg.in/yaml.v2"
	"infini.sh/framework/core/util"
	"testing"
)

func TestTransformSettingsToConfig(t *testing.T) {
	setting := TaskSetting{
		ClusterHealth: ClusterHealthTask{
			Enabled: true,
		},
		ClusterStats: ClusterStatsTask {
			Enabled: true,
		},
		IndexStats: IndexStatsTask{
			Enabled: true,
		},
		NodeStats: NodeStatsTask{
			Enabled: true,
			NodeIDs: []string{"ddddnnnn"},
		},
	}
	pipelines, err := transformSettingsToConfig(&setting, "testxxx")
	if err !=nil {
		t.Fatal(err)
	}
	buf, err := yaml.Marshal(util.MapStr{
		"pipeline": pipelines,
	})
	if err !=nil {
		t.Fatal(err)
	}
	fmt.Println(string(buf))
}
