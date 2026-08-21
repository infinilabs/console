package index_management

import (
	"testing"

	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

func TestBuildOverviewClusterQueryDSLSkipsEmptyFilter(t *testing.T) {
	queryDSL := buildOverviewClusterQueryDSL(nil)
	if _, ok := queryDSL["query"]; ok {
		t.Fatalf("expected empty filter to skip query clause, got %#v", queryDSL)
	}

	queryDSL = buildOverviewClusterQueryDSL(util.MapStr{})
	if _, ok := queryDSL["query"]; ok {
		t.Fatalf("expected empty map filter to skip query clause, got %#v", queryDSL)
	}
}

func TestBuildOverviewClusterQueryDSLIncludesFilter(t *testing.T) {
	filter := util.MapStr{
		"terms": util.MapStr{
			"id": []string{"cluster-a"},
		},
	}

	queryDSL := buildOverviewClusterQueryDSL(filter)
	if got, ok := queryDSL["query"]; !ok || got == nil {
		t.Fatalf("expected non-empty filter to be preserved, got %#v", queryDSL)
	}
}

func TestGetConfiguredOverviewClusterIDsUsesLoadedConfigs(t *testing.T) {
	for _, id := range []string{"overview-cluster-a", "overview-cluster-b"} {
		elastic.UpdateConfig(elastic.ElasticsearchConfig{ORMObjectBase: orm.ORMObjectBase{ID: id}})
		t.Cleanup(func() {
			elastic.RemoveInstance(id)
		})
	}

	clusterIDs := getConfiguredOverviewClusterIDs(nil)
	clusterIDSet := toClusterIDSet(clusterIDs)
	for _, id := range []string{"overview-cluster-a", "overview-cluster-b"} {
		if _, ok := clusterIDSet[id]; !ok {
			t.Fatalf("expected configured cluster %s in fallback IDs, got %#v", id, clusterIDs)
		}
	}
}

func TestGetConfiguredOverviewClusterIDsRespectsFilter(t *testing.T) {
	for _, id := range []string{"overview-filter-cluster-a", "overview-filter-cluster-b"} {
		elastic.UpdateConfig(elastic.ElasticsearchConfig{ORMObjectBase: orm.ORMObjectBase{ID: id}})
		t.Cleanup(func() {
			elastic.RemoveInstance(id)
		})
	}

	clusterIDs := getConfiguredOverviewClusterIDs(util.MapStr{
		"terms": util.MapStr{
			"id": []string{"overview-filter-cluster-a"},
		},
	})
	clusterIDSet := toClusterIDSet(clusterIDs)
	if len(clusterIDSet) != 1 {
		t.Fatalf("expected one filtered fallback cluster, got %#v", clusterIDs)
	}
	if _, ok := clusterIDSet["overview-filter-cluster-a"]; !ok {
		t.Fatalf("expected filtered cluster in fallback IDs, got %#v", clusterIDs)
	}
	if _, ok := clusterIDSet["overview-filter-cluster-b"]; ok {
		t.Fatalf("did not expect unfiltered cluster in fallback IDs, got %#v", clusterIDs)
	}
}

func toClusterIDSet(clusterIDs []interface{}) map[string]struct{} {
	clusterIDSet := map[string]struct{}{}
	for _, clusterID := range clusterIDs {
		if id, ok := clusterID.(string); ok {
			clusterIDSet[id] = struct{}{}
		}
	}
	return clusterIDSet
}
