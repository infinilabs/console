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
	"testing"

	"infini.sh/framework/core/elastic"
)

func TestNormalizeProbePath(t *testing.T) {
	tests := map[string]string{
		"":                "",
		"   ":             "",
		"/":               "",
		"_cluster/health": "/_cluster/health",
		" /_cat/nodes ":   "/_cat/nodes",
	}

	for input, expected := range tests {
		if got := NormalizeProbePath(input); got != expected {
			t.Fatalf("NormalizeProbePath(%q) = %q, want %q", input, got, expected)
		}
	}
}

func TestProbePathStoredInLabels(t *testing.T) {
	cfg := &elastic.ElasticsearchConfig{}
	SetProbePath(cfg, "_cluster/health")

	if got := GetProbePath(cfg); got != "/_cluster/health" {
		t.Fatalf("GetProbePath() = %q, want %q", got, "/_cluster/health")
	}

	SetProbePath(cfg, "")
	if got := GetProbePath(cfg); got != "" {
		t.Fatalf("GetProbePath() = %q, want empty", got)
	}
}

func TestBuildEndpointWithPath(t *testing.T) {
	got := BuildEndpointWithPath("https://example.com:9200", "/_cluster/health")
	want := "https://example.com:9200/_cluster/health"
	if got != want {
		t.Fatalf("BuildEndpointWithPath() = %q, want %q", got, want)
	}
}
