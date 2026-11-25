package api

import (
	"testing"

	"infini.sh/framework/core/host"
	"infini.sh/framework/core/util"
)

func TestResolveHostOverviewAgentSummaryPrefersAgentID(t *testing.T) {
	hostInfo := &host.HostInfo{
		AgentID: "agent-1",
	}
	hostInfo.ID = "host-1"

	summary := resolveHostOverviewAgentSummary(hostInfo, map[string]util.MapStr{
		"agent-1": {"cpu": util.MapStr{"used_percent": 42}},
		"host-1":  {"cpu": util.MapStr{"used_percent": 1}},
	})

	if summary == nil {
		t.Fatal("expected agent summary")
	}
	cpu, _ := summary.GetValue("cpu.used_percent")
	if cpu != 42 {
		t.Fatalf("unexpected summary selected: %#v", summary)
	}
}
