package api

import (
	"testing"

	agentservice "infini.sh/console/service/agent"
	"infini.sh/framework/core/model"
)

func TestNormalizeClusterInfo(t *testing.T) {
	info := normalizeClusterInfo(ClusterInfo{
		ClusterIDs: []string{"cluster-a", "cluster-a", "cluster-b"},
		Clusters: []ClusterBinding{
			{ClusterID: "cluster-a", LogsPaths: []string{" /var/log/es ", "/var/log/es"}},
			{ClusterID: "cluster-c", LogsPaths: []string{"/srv/logs"}},
		},
	})

	if len(info.ClusterIDs) != 3 {
		t.Fatalf("expected 3 unique cluster ids, got %d", len(info.ClusterIDs))
	}
	if info.ClusterIDs[0] != "cluster-a" || info.ClusterIDs[1] != "cluster-b" || info.ClusterIDs[2] != "cluster-c" {
		t.Fatalf("unexpected cluster id order: %#v", info.ClusterIDs)
	}
	if got := info.GetLogsPaths("cluster-a"); len(got) != 1 || got[0] != "/var/log/es" {
		t.Fatalf("expected normalized logs path for cluster-a, got %#v", got)
	}
	if got := info.GetLogsPaths("cluster-b"); len(got) != 0 {
		t.Fatalf("expected no logs paths for cluster-b, got %#v", got)
	}
}

func TestNewClusterAgentSettings(t *testing.T) {
	settings := agentservice.NewClusterAgentSettings("cluster-a", []string{" /var/log/es ", "/srv/logs"})
	if settings.Metadata.Name != "agent" {
		t.Fatalf("expected agent metadata name, got %q", settings.Metadata.Name)
	}
	if got := settings.Payload["path_logs"]; got != "/var/log/es" {
		t.Fatalf("expected first logs path to be saved as path_logs, got %#v", got)
	}
	logsPaths, ok := settings.Payload["logs_paths"].([]string)
	if !ok {
		t.Fatalf("expected logs_paths slice, got %#v", settings.Payload["logs_paths"])
	}
	if len(logsPaths) != 2 || logsPaths[1] != "/srv/logs" {
		t.Fatalf("unexpected logs_paths payload: %#v", logsPaths)
	}
}

func TestHydrateAutoEnrollClusterInfoReturnsEmptyWithoutClusterIDs(t *testing.T) {
	info, err := hydrateAutoEnrollClusterInfo(ClusterInfo{})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if len(info.ClusterIDs) != 0 {
		t.Fatalf("expected no cluster ids, got %#v", info.ClusterIDs)
	}
	if len(info.Clusters) != 0 {
		t.Fatalf("expected no clusters, got %#v", info.Clusters)
	}
}

func TestDeriveLogsPathsFromCmdlineSinglePathWhenGCMatchesCurrent(t *testing.T) {
	cmdline := `/usr/share/elasticsearch/jdk/bin/java -Xlog:gc*,gc+age=trace:file=logs/gc.log:utctime,pid,tags:filecount=32,filesize=64m -Des.path.home=/usr/share/elasticsearch`
	got := deriveLogsPathsFromCmdline(cmdline, "")
	if len(got) != 1 || got[0] != "/usr/share/elasticsearch/logs" {
		t.Fatalf("unexpected logs paths: %#v", got)
	}
}

func TestDeriveLogsPathsFromCmdlineTwoPathsWhenGCDiffers(t *testing.T) {
	cmdline := `/usr/share/elasticsearch/jdk/bin/java -Xlog:gc*,gc+age=trace:file=/var/log/elasticsearch/gc.log:utctime,pid,tags:filecount=32,filesize=64m -Des.path.home=/usr/share/elasticsearch`
	got := deriveLogsPathsFromCmdline(cmdline, "")
	if len(got) != 2 {
		t.Fatalf("expected 2 logs paths, got %#v", got)
	}
	if got[0] != "/usr/share/elasticsearch/logs" || got[1] != "/var/log/elasticsearch" {
		t.Fatalf("unexpected logs paths: %#v", got)
	}
}

func TestShouldFallbackToDirectAgentDiscovery(t *testing.T) {
	if !shouldFallbackToDirectAgentDiscovery(errAgentReverseChannelDisconnected) {
		t.Fatal("expected disconnected reverse channel to fall back to direct discovery")
	}
	if !shouldFallbackToDirectAgentDiscovery(errAgentReverseChannelNotConnected) {
		t.Fatal("expected not connected reverse channel to fall back to direct discovery")
	}
	if shouldFallbackToDirectAgentDiscovery(assertDiscoveryError("boom")) {
		t.Fatal("did not expect non-recoverable errors to fall back to direct discovery")
	}
}

func TestPrioritizeListenAddressesPrefersHTTPPorts(t *testing.T) {
	got := prioritizeListenAddresses([]model.ListenAddr{
		{IP: "::", Port: 9300},
		{IP: "::", Port: 9200},
		{IP: "::", Port: 443},
		{IP: "::", Port: 8080},
	})

	if len(got) != 4 {
		t.Fatalf("unexpected listen address count: %#v", got)
	}

	expectedPorts := []int{9200, 443, 8080, 9300}
	for idx, port := range expectedPorts {
		if got[idx].Port != port {
			t.Fatalf("unexpected listen address order: %#v", got)
		}
	}
}

type assertDiscoveryError string

func (e assertDiscoveryError) Error() string {
	return string(e)
}
