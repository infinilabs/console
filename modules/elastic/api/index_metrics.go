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
	"context"
	"fmt"
	log "github.com/cihub/seelog"
	v1 "infini.sh/console/modules/elastic/api/v1"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/radix"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
	"net/http"
	"sort"
	"strings"
	"time"
)

// getClusterUUID reads the cluster uuid from metadata
func (h *APIHandler) getClusterUUID(clusterID string) (string, error) {
	meta := elastic.GetMetadata(clusterID)
	if meta == nil {
		return "", fmt.Errorf("metadata of cluster [%s] was not found", clusterID)
	}
	return meta.Config.ClusterUUID, nil
}

func (h *APIHandler) getIndexMetrics(ctx context.Context, req *http.Request, clusterID string, bucketSize int, min, max int64, indexName string, top int, shardID string, metricKey string) (map[string]*common.MetricItem, error) {
	bucketSizeStr := fmt.Sprintf("%vs", bucketSize)
	clusterUUID, err := h.getClusterUUID(clusterID)
	if err != nil {
		return nil, err
	}
	should := []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.labels.cluster_id": util.MapStr{
					"value": clusterID,
				},
			},
		},
	}
	if clusterUUID != "" {
		should = append(should, util.MapStr{
			"term": util.MapStr{
				"metadata.labels.cluster_uuid": util.MapStr{
					"value": clusterUUID,
				},
			},
		})
	}

	var must = []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.category": util.MapStr{
					"value": "elasticsearch",
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.name": util.MapStr{
					"value": "shard_stats",
				},
			},
		},
	}
	if v := strings.TrimSpace(shardID); v != "" {
		must = append(must, util.MapStr{
			"term": util.MapStr{
				"metadata.labels.shard_id": util.MapStr{
					"value": shardID,
				},
			},
		})
	}
	var (
		indexNames []string
	)
	if indexName != "" {
		indexNames = strings.Split(indexName, ",")
		allowedIndices, hasAllPrivilege := h.GetAllowedIndices(req, clusterID)
		if !hasAllPrivilege && len(allowedIndices) == 0 {
			return nil, nil
		}
		if !hasAllPrivilege {
			namePattern := radix.Compile(allowedIndices...)
			var filterNames []string
			for _, name := range indexNames {
				if namePattern.Match(name) {
					filterNames = append(filterNames, name)
				}
			}
			if len(filterNames) == 0 {
				return nil, nil
			}
			indexNames = filterNames
		}
		top = len(indexNames)

	} else {
		indexNames, err = h.getTopIndexName(req, clusterID, top, 15)
		if err != nil {
			return nil, err
		}

	}
	if len(indexNames) > 0 {
		must = append(must, util.MapStr{
			"terms": util.MapStr{
				"metadata.labels.index_name": indexNames,
			},
		})
	}

	query := map[string]interface{}{}
	indexMetricItems := []GroupMetricItem{}
	switch metricKey {
	case v1.IndexStorageMetricKey:
		//索引存储大小
		indexStorageMetric := newMetricItem(v1.IndexStorageMetricKey, 1, StorageGroupKey)
		indexStorageMetric.AddAxi("Index storage", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "index_storage",
			Field:        "payload.elasticsearch.shard_stats.store.size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   indexStorageMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.SegmentCountMetricKey:
		// segment 数量
		segmentCountMetric := newMetricItem(v1.SegmentCountMetricKey, 15, StorageGroupKey)
		segmentCountMetric.AddAxi("segment count", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "segment_count",
			Field:        "payload.elasticsearch.shard_stats.segments.count",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentCountMetric,
			FormatType:   "num",
			Units:        "",
		})
	case v1.DocCountMetricKey:
		//索引文档个数
		docCountMetric := newMetricItem(v1.DocCountMetricKey, 2, DocumentGroupKey)
		docCountMetric.AddAxi("Doc count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "doc_count",
			Field:        "payload.elasticsearch.shard_stats.docs.count",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   docCountMetric,
			FormatType:   "num",
			Units:        "",
		})
	case v1.DocsDeletedMetricKey:
		// docs 删除数量
		docsDeletedMetric := newMetricItem(v1.DocsDeletedMetricKey, 17, DocumentGroupKey)
		docsDeletedMetric.AddAxi("docs deleted", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "docs_deleted",
			Field:        "payload.elasticsearch.shard_stats.docs.deleted",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   docsDeletedMetric,
			FormatType:   "num",
			Units:        "",
		})
	case v1.QueryTimesMetricKey:
		//查询次数
		queryTimesMetric := newMetricItem("query_times", 2, OperationGroupKey)
		queryTimesMetric.AddAxi("Query times", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "query_times",
			Field:        "payload.elasticsearch.shard_stats.search.query_total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   queryTimesMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case v1.FetchTimesMetricKey:
		//Fetch次数
		fetchTimesMetric := newMetricItem(v1.FetchTimesMetricKey, 3, OperationGroupKey)
		fetchTimesMetric.AddAxi("Fetch times", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "fetch_times",
			Field:        "payload.elasticsearch.shard_stats.search.fetch_total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   fetchTimesMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case v1.ScrollTimesMetricKey:
		//scroll 次数
		scrollTimesMetric := newMetricItem(v1.ScrollTimesMetricKey, 4, OperationGroupKey)
		scrollTimesMetric.AddAxi("scroll times", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "scroll_times",
			Field:        "payload.elasticsearch.shard_stats.search.scroll_total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   scrollTimesMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case v1.MergeTimesMetricKey:
		//Merge次数
		mergeTimesMetric := newMetricItem(v1.MergeTimesMetricKey, 7, OperationGroupKey)
		mergeTimesMetric.AddAxi("Merge times", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "merge_times",
			Field:        "payload.elasticsearch.shard_stats.merges.total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   mergeTimesMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case v1.RefreshTimesMetricKey:
		//Refresh次数
		refreshTimesMetric := newMetricItem(v1.RefreshTimesMetricKey, 5, OperationGroupKey)
		refreshTimesMetric.AddAxi("Refresh times", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "refresh_times",
			Field:        "payload.elasticsearch.shard_stats.refresh.total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   refreshTimesMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case v1.FlushTimesMetricKey:
		//flush 次数
		flushTimesMetric := newMetricItem(v1.FlushTimesMetricKey, 6, OperationGroupKey)
		flushTimesMetric.AddAxi("flush times", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "flush_times",
			Field:        "payload.elasticsearch.shard_stats.flush.total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   flushTimesMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case v1.IndexingRateMetricKey:
		//写入速率
		indexingRateMetric := newMetricItem(v1.IndexingRateMetricKey, 1, OperationGroupKey)
		if shardID == "" {
			indexingRateMetric.OnlyPrimary = true
		}
		indexingRateMetric.AddAxi("Indexing rate", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "indexing_rate",
			Field:        "payload.elasticsearch.shard_stats.indexing.index_total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   indexingRateMetric,
			FormatType:   "num",
			Units:        "doc/s",
		})
	case v1.IndexingBytesMetricKey:
		indexingBytesMetric := newMetricItem(v1.IndexingBytesMetricKey, 2, OperationGroupKey)
		if shardID == "" {
			indexingBytesMetric.OnlyPrimary = true
		}
		indexingBytesMetric.AddAxi("Indexing bytes", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "indexing_bytes",
			Field:        "payload.elasticsearch.shard_stats.store.size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   indexingBytesMetric,
			FormatType:   "bytes",
			Units:        "bytes/s",
		})
	case v1.IndexingLatencyMetricKey:
		//写入时延
		indexingLatencyMetric := newMetricItem(v1.IndexingLatencyMetricKey, 1, LatencyGroupKey)
		if shardID == "" {
			indexingLatencyMetric.OnlyPrimary = true
		}
		indexingLatencyMetric.AddAxi("Indexing latency", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:    "indexing_latency",
			Field:  "payload.elasticsearch.shard_stats.indexing.index_time_in_millis",
			Field2: "payload.elasticsearch.shard_stats.indexing.index_total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   indexingLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case v1.QueryLatencyMetricKey:
		//查询时延
		queryLatencyMetric := newMetricItem(v1.QueryLatencyMetricKey, 2, LatencyGroupKey)
		queryLatencyMetric.AddAxi("Query latency", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:    "query_latency",
			Field:  "payload.elasticsearch.shard_stats.search.query_time_in_millis",
			Field2: "payload.elasticsearch.shard_stats.search.query_total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   queryLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case FetchLatencyMetricKey:
		//fetch时延
		fetchLatencyMetric := newMetricItem(v1.FetchLatencyMetricKey, 3, LatencyGroupKey)
		fetchLatencyMetric.AddAxi("Fetch latency", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:    "fetch_latency",
			Field:  "payload.elasticsearch.shard_stats.search.fetch_time_in_millis",
			Field2: "payload.elasticsearch.shard_stats.search.fetch_total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   fetchLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case v1.MergeLatencyMetricKey:
		//merge时延
		mergeLatencyMetric := newMetricItem(v1.MergeLatencyMetricKey, 7, LatencyGroupKey)
		mergeLatencyMetric.AddAxi("Merge latency", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:    "merge_latency",
			Field:  "payload.elasticsearch.shard_stats.merges.total_time_in_millis",
			Field2: "payload.elasticsearch.shard_stats.merges.total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   mergeLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case RefreshLatencyMetricKey:
		//refresh时延
		refreshLatencyMetric := newMetricItem(v1.RefreshLatencyMetricKey, 5, LatencyGroupKey)
		refreshLatencyMetric.AddAxi("Refresh latency", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:    "refresh_latency",
			Field:  "payload.elasticsearch.shard_stats.refresh.total_time_in_millis",
			Field2: "payload.elasticsearch.shard_stats.refresh.total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   refreshLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case v1.ScrollLatencyMetricKey:
		//scroll时延
		scrollLatencyMetric := newMetricItem(v1.ScrollLatencyMetricKey, 4, LatencyGroupKey)
		scrollLatencyMetric.AddAxi("Scroll Latency", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:    "scroll_latency",
			Field:  "payload.elasticsearch.shard_stats.search.scroll_time_in_millis",
			Field2: "payload.elasticsearch.shard_stats.search.scroll_total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   scrollLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case v1.FlushLatencyMetricKey:
		//flush 时延
		flushLatencyMetric := newMetricItem(v1.FlushLatencyMetricKey, 6, LatencyGroupKey)
		flushLatencyMetric.AddAxi("Flush latency", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:    "flush_latency",
			Field:  "payload.elasticsearch.shard_stats.flush.total_time_in_millis",
			Field2: "payload.elasticsearch.shard_stats.flush.total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   flushLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case v1.QueryCacheMetricKey:
		//queryCache
		queryCacheMetric := newMetricItem(v1.QueryCacheMetricKey, 1, CacheGroupKey)
		queryCacheMetric.AddAxi("Query cache", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "query_cache",
			Field:        "payload.elasticsearch.shard_stats.query_cache.memory_size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   queryCacheMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.RequestCacheMetricKey:
		//requestCache
		requestCacheMetric := newMetricItem(v1.RequestCacheMetricKey, 2, CacheGroupKey)
		requestCacheMetric.AddAxi("request cache", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "request_cache",
			Field:        "payload.elasticsearch.shard_stats.request_cache.memory_size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   requestCacheMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.RequestCacheHitMetricKey:
		// Request Cache Hit
		requestCacheHitMetric := newMetricItem(v1.RequestCacheHitMetricKey, 6, CacheGroupKey)
		requestCacheHitMetric.AddAxi("request cache hit", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "request_cache_hit",
			Field:        "payload.elasticsearch.shard_stats.request_cache.hit_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   requestCacheHitMetric,
			FormatType:   "num",
			Units:        "hits",
		})
	case v1.RequestCacheMissMetricKey:
		// Request Cache Miss
		requestCacheMissMetric := newMetricItem(v1.RequestCacheMissMetricKey, 8, CacheGroupKey)
		requestCacheMissMetric.AddAxi("request cache miss", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "request_cache_miss",
			Field:        "payload.elasticsearch.shard_stats.request_cache.miss_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   requestCacheMissMetric,
			FormatType:   "num",
			Units:        "misses",
		})
	case v1.QueryCacheCountMetricKey:
		// Query Cache Count
		queryCacheCountMetric := newMetricItem(v1.QueryCacheCountMetricKey, 4, CacheGroupKey)
		queryCacheCountMetric.AddAxi("query cache miss", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "query_cache_count",
			Field:        "payload.elasticsearch.shard_stats.query_cache.cache_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   queryCacheCountMetric,
			FormatType:   "num",
			Units:        "",
		})
	case v1.QueryCacheHitMetricKey:
		// Query Cache Miss
		queryCacheHitMetric := newMetricItem(v1.QueryCacheHitMetricKey, 5, CacheGroupKey)
		queryCacheHitMetric.AddAxi("query cache hit", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "query_cache_hit",
			Field:        "payload.elasticsearch.shard_stats.query_cache.hit_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   queryCacheHitMetric,
			FormatType:   "num",
			Units:        "hits",
		})
	case v1.QueryCacheMissMetricKey:
		// Query Cache Miss
		queryCacheMissMetric := newMetricItem(v1.QueryCacheMissMetricKey, 7, CacheGroupKey)
		queryCacheMissMetric.AddAxi("query cache miss", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "query_cache_miss",
			Field:        "payload.elasticsearch.shard_stats.query_cache.miss_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   queryCacheMissMetric,
			FormatType:   "num",
			Units:        "misses",
		})
	case v1.FielddataCacheMetricKey:
		// Fielddata内存占用大小
		fieldDataCacheMetric := newMetricItem(v1.FielddataCacheMetricKey, 3, CacheGroupKey)
		fieldDataCacheMetric.AddAxi("FieldData Cache", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "fielddata_cache",
			Field:        "payload.elasticsearch.shard_stats.fielddata.memory_size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   fieldDataCacheMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.SegmentMemoryMetricKey:
		//segment memory
		segmentMemoryMetric := newMetricItem(v1.SegmentMemoryMetricKey, 13, MemoryGroupKey)
		segmentMemoryMetric.AddAxi("Segment memory", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "segment_memory",
			Field:        "payload.elasticsearch.shard_stats.segments.memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.SegmentDocValuesMemoryMetricKey:
		//segment doc values memory
		docValuesMemoryMetric := newMetricItem(v1.SegmentDocValuesMemoryMetricKey, 13, MemoryGroupKey)
		docValuesMemoryMetric.AddAxi("Segment Doc values Memory", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "segment_doc_values_memory",
			Field:        "payload.elasticsearch.shard_stats.segments.doc_values_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   docValuesMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.SegmentTermsMemoryMetricKey:
		//segment terms memory
		termsMemoryMetric := newMetricItem(v1.SegmentTermsMemoryMetricKey, 13, MemoryGroupKey)
		termsMemoryMetric.AddAxi("Segment Terms Memory", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "segment_terms_memory",
			Field:        "payload.elasticsearch.shard_stats.segments.terms_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   termsMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.SegmentFieldsMemoryMetricKey:
		//segment fields memory
		fieldsMemoryMetric := newMetricItem(v1.SegmentFieldsMemoryMetricKey, 13, MemoryGroupKey)
		fieldsMemoryMetric.AddAxi("Segment Fields Memory", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "segment_fields_memory",
			Field:        "payload.elasticsearch.index_stats.total.segments.stored_fields_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   fieldsMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.SegmentIndexWriterMemoryMetricKey:
		// segment index writer memory
		segmentIndexWriterMemoryMetric := newMetricItem(v1.SegmentIndexWriterMemoryMetricKey, 16, MemoryGroupKey)
		segmentIndexWriterMemoryMetric.AddAxi("segment doc values memory", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "segment_index_writer_memory",
			Field:        "payload.elasticsearch.shard_stats.segments.index_writer_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentIndexWriterMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.SegmentTermVectorsMemoryMetricKey:
		// segment term vectors memory
		segmentTermVectorsMemoryMetric := newMetricItem(v1.SegmentTermVectorsMemoryMetricKey, 16, MemoryGroupKey)
		segmentTermVectorsMemoryMetric.AddAxi("segment term vectors memory", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "segment_term_vectors_memory",
			Field:        "payload.elasticsearch.shard_stats.segments.term_vectors_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentTermVectorsMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.SegmentNormsMetricKey:
		segmentNormsMetric := newMetricItem(v1.SegmentNormsMetricKey, 17, MemoryGroupKey)
		segmentNormsMetric.AddAxi("Segment norms memory", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          v1.SegmentNormsMetricKey,
			Field:        "payload.elasticsearch.shard_stats.segments.norms_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentNormsMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.SegmentPointsMetricKey:
		segmentPointsMetric := newMetricItem(v1.SegmentPointsMetricKey, 18, MemoryGroupKey)
		segmentPointsMetric.AddAxi("Segment points memory", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          v1.SegmentPointsMetricKey,
			Field:        "payload.elasticsearch.shard_stats.segments.points_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentPointsMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.VersionMapMetricKey:
		segmentVersionMapMetric := newMetricItem(v1.VersionMapMetricKey, 18, MemoryGroupKey)
		segmentVersionMapMetric.AddAxi("Segment version map memory", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          v1.VersionMapMetricKey,
			Field:        "payload.elasticsearch.shard_stats.segments.version_map_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentVersionMapMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case v1.FixedBitSetMetricKey:
		segmentFixedBitSetMetric := newMetricItem(v1.FixedBitSetMetricKey, 18, MemoryGroupKey)
		segmentFixedBitSetMetric.AddAxi("Segment fixed bit set memory", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          v1.FixedBitSetMetricKey,
			Field:        "payload.elasticsearch.shard_stats.segments.fixed_bit_set_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentFixedBitSetMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	}

	aggs := map[string]interface{}{}
	sumAggs := util.MapStr{}
	term_level := "term_shard"

	for _, metricItem := range indexMetricItems {
		leafAgg := util.MapStr{
			"max": util.MapStr{
				"field": metricItem.Field,
			},
		}
		var sumBucketPath = term_level + ">" + metricItem.ID
		aggs[metricItem.ID] = leafAgg

		sumAggs[metricItem.ID] = util.MapStr{
			"sum_bucket": util.MapStr{
				"buckets_path": sumBucketPath,
			},
		}

		if metricItem.Field2 != "" {
			leafAgg2 := util.MapStr{
				"max": util.MapStr{
					"field": metricItem.Field2,
				},
			}
			aggs[metricItem.ID+"_field2"] = leafAgg2
			sumAggs[metricItem.ID+"_field2"] = util.MapStr{
				"sum_bucket": util.MapStr{
					"buckets_path": sumBucketPath + "_field2",
				},
			}
		}

		if metricItem.IsDerivative {
			sumAggs[metricItem.ID+"_deriv"] = util.MapStr{
				"derivative": util.MapStr{
					"buckets_path": metricItem.ID,
				},
			}
			if metricItem.Field2 != "" {
				sumAggs[metricItem.ID+"_deriv_field2"] = util.MapStr{
					"derivative": util.MapStr{
						"buckets_path": metricItem.ID + "_field2",
					},
				}
			}
		}
	}
	sumAggs[term_level] = util.MapStr{
		"terms": util.MapStr{
			"field": "metadata.labels.shard_id",
			"size":  10000,
		},
		"aggs": aggs,
	}
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		log.Error(err)
		panic(err)
	}

	//we can do this because we are querying one metric once time
	if indexMetricItems[0].MetricItem.OnlyPrimary {
		must = append(must, util.MapStr{
			"term": util.MapStr{
				"payload.elasticsearch.shard_stats.routing.primary": util.MapStr{
					"value": true,
				},
			},
		})
	}
	query["query"] = util.MapStr{
		"bool": util.MapStr{
			"must":                 must,
			"minimum_should_match": 1,
			"should":               should,
			"must_not": []util.MapStr{
				{
					"term": util.MapStr{
						"metadata.labels.index_name": util.MapStr{
							"value": "_all",
						},
					},
				},
			},
			"filter": []util.MapStr{
				{
					"range": util.MapStr{
						"timestamp": util.MapStr{
							"gte": min,
							"lte": max,
						},
					},
				},
			},
		},
	}
	query["size"] = 0
	query["aggs"] = util.MapStr{
		"group_by_level": util.MapStr{
			"terms": util.MapStr{
				"field": "metadata.labels.index_name",
				"size":  top,
				// max_store is a pipeline agg, sort not support
				//"order": util.MapStr{
				//	"max_store": "desc",
				//},
			},
			"aggs": util.MapStr{
				"dates": util.MapStr{
					"date_histogram": util.MapStr{
						"field":       "timestamp",
						intervalField: bucketSizeStr,
					},
					"aggs": sumAggs,
				},
				"max_store_bucket_sort": util.MapStr{
					"bucket_sort": util.MapStr{
						"sort": []util.MapStr{
							{"max_store": util.MapStr{"order": "desc"}}},
						"size": top,
					},
				},
				term_level: util.MapStr{
					"terms": util.MapStr{
						"field": "metadata.labels.shard_id",
						"size":  10000,
					},
					"aggs": util.MapStr{
						"max_store": util.MapStr{
							"max": util.MapStr{
								"field": "payload.elasticsearch.shard_stats.store.size_in_bytes",
							},
						},
					},
				},
				"max_store": util.MapStr{
					"sum_bucket": util.MapStr{
						"buckets_path": term_level + ">max_store",
					},
				},
			},
		},
	}
	return h.getMetrics(ctx, term_level, query, indexMetricItems, bucketSize)

}

func (h *APIHandler) getTopIndexName(req *http.Request, clusterID string, top int, lastMinutes int) ([]string, error) {
	ver := h.Client().GetVersion()
	cr, _ := util.VersionCompare(ver.Number, "6.1")
	if (ver.Distribution == "" || ver.Distribution == elastic.Elasticsearch) && cr == -1 {
		return nil, nil
	}
	var (
		now = time.Now()
		max = now.UnixNano() / 1e6
		min = now.Add(-time.Duration(lastMinutes)*time.Minute).UnixNano() / 1e6
	)
	clusterUUID, err := h.getClusterUUID(clusterID)
	if err != nil {
		return nil, err
	}
	var must = []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.category": util.MapStr{
					"value": "elasticsearch",
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.name": util.MapStr{
					"value": "shard_stats",
				},
			},
		},
	}
	should := []util.MapStr{
		{
			"term": util.MapStr{
				"metadata.labels.cluster_uuid": util.MapStr{
					"value": clusterID,
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.labels.cluster_uuid": util.MapStr{
					"value": clusterUUID,
				},
			},
		},
	}
	allowedIndices, hasAllPrivilege := h.GetAllowedIndices(req, clusterID)
	if !hasAllPrivilege && len(allowedIndices) == 0 {
		return nil, fmt.Errorf("no index permission")
	}
	if !hasAllPrivilege {
		must = append(must, util.MapStr{
			"query_string": util.MapStr{
				"query":            strings.Join(allowedIndices, " "),
				"fields":           []string{"metadata.labels.index_name"},
				"default_operator": "OR",
			},
		})
	}
	bucketSizeStr := "60s"
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		return nil, err
	}
	partition_num := 10
	if v1.GetIndicesCount(clusterID) < 200 {
		partition_num = 1
	}
	query := util.MapStr{
		"size": 0,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must_not": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.index_name": util.MapStr{
								"value": "_all",
							},
						},
					},
				},
				"must":                 must,
				"should":               should,
				"minimum_should_match": 1,
				"filter": []util.MapStr{
					{
						"range": util.MapStr{
							"timestamp": util.MapStr{
								"gte": min,
								"lte": max,
							},
						},
					},
				},
			},
		},
		"aggs": util.MapStr{
			"group_by_index": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.index_name",
					"include": util.MapStr{
						"partition":      0,
						"num_partitions": partition_num,
					},
					"size": 10000,
				},
				"aggs": util.MapStr{
					"max_qps": util.MapStr{
						"max_bucket": util.MapStr{
							"buckets_path": "dates>search_qps",
						},
					},
					"max_qps_bucket_sort": util.MapStr{
						"bucket_sort": util.MapStr{
							"sort": []util.MapStr{
								{"max_qps": util.MapStr{"order": "desc"}}},
							"size": top,
						},
					},
					"dates": util.MapStr{
						"date_histogram": util.MapStr{
							"field":       "timestamp",
							intervalField: bucketSizeStr,
						},
						"aggs": util.MapStr{
							"term_shard": util.MapStr{
								"terms": util.MapStr{
									"field": "metadata.labels.shard_id",
									"size":  10000,
								},
								"aggs": util.MapStr{
									"search_query_total": util.MapStr{
										"max": util.MapStr{
											"field": "payload.elasticsearch.shard_stats.search.query_total",
										},
									},
								},
							},
							"sum_search_query_total": util.MapStr{
								"sum_bucket": util.MapStr{
									"buckets_path": "term_shard>search_query_total",
								},
							},
							"search_qps": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "sum_search_query_total",
								},
							},
						},
					},
				},
			},
			"group_by_index1": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.index_name",
					"include": util.MapStr{
						"partition":      0,
						"num_partitions": partition_num,
					},
					"size": 10000,
				},
				"aggs": util.MapStr{
					"max_qps": util.MapStr{
						"max_bucket": util.MapStr{
							"buckets_path": "dates>index_qps",
						},
					},
					"max_qps_bucket_sort": util.MapStr{
						"bucket_sort": util.MapStr{
							"sort": []util.MapStr{
								{"max_qps": util.MapStr{"order": "desc"}},
							},
							"size": top,
						},
					},
					"dates": util.MapStr{
						"date_histogram": util.MapStr{
							"field":       "timestamp",
							intervalField: bucketSizeStr,
						},
						"aggs": util.MapStr{
							"term_shard": util.MapStr{
								"terms": util.MapStr{
									"field": "metadata.labels.shard_id",
									"size":  10000,
								},
								"aggs": util.MapStr{
									"index_total": util.MapStr{
										"max": util.MapStr{
											"field": "payload.elasticsearch.shard_stats.indexing.index_total",
										},
									},
								},
							},
							"sum_index_total": util.MapStr{
								"sum_bucket": util.MapStr{
									"buckets_path": "term_shard>index_total",
								},
							},
							"index_qps": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "sum_index_total",
								},
							},
						},
					},
				},
			},
		},
	}
	response, err := elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).SearchWithRawQueryDSL(getAllMetricsIndex(), util.MustToJSONBytes(query))
	if err != nil {
		log.Error(err)
		return nil, err
	}
	var maxQpsKVS = map[string]float64{}
	for _, agg := range response.Aggregations {
		for _, bk := range agg.Buckets {
			key := bk["key"].(string)
			if maxQps, ok := bk["max_qps"].(map[string]interface{}); ok {
				val := maxQps["value"].(float64)
				if _, ok = maxQpsKVS[key]; ok {
					maxQpsKVS[key] = maxQpsKVS[key] + val
				} else {
					maxQpsKVS[key] = val
				}
			}
		}
	}
	var (
		qpsValues TopTermOrder
	)
	for k, v := range maxQpsKVS {
		qpsValues = append(qpsValues, TopTerm{
			Key:   k,
			Value: v,
		})
	}
	sort.Sort(qpsValues)
	var length = top
	if top > len(qpsValues) {
		length = len(qpsValues)
	}
	indexNames := []string{}
	for i := 0; i < length; i++ {
		indexNames = append(indexNames, qpsValues[i].Key)
	}
	return indexNames, nil
}

type TopTerm struct {
	Key   string
	Value float64
}
type TopTermOrder []TopTerm

func (t TopTermOrder) Len() int {
	return len(t)
}
func (t TopTermOrder) Less(i, j int) bool {
	return t[i].Value > t[j].Value //desc
}
func (t TopTermOrder) Swap(i, j int) {
	t[i], t[j] = t[j], t[i]
}
