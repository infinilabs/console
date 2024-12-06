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

package v1

import (
	"context"
	"fmt"
	log "github.com/cihub/seelog"
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

const (
	IndexStorageMetricKey = "index_storage"
	SegmentCountMetricKey = "segment_count"
	DocCountMetricKey = "doc_count"
	DocsDeletedMetricKey = "docs_deleted"
	QueryTimesMetricKey = "query_times"
	FetchTimesMetricKey = "fetch_times"
	ScrollTimesMetricKey = "scroll_times"
	MergeTimesMetricKey = "merge_times"
	RefreshTimesMetricKey = "refresh_times"
	FlushTimesMetricKey = "flush_times"
	IndexingRateMetricKey = "indexing_rate"
	IndexingBytesMetricKey = "indexing_bytes"
	IndexingLatencyMetricKey = "indexing_latency"
	QueryLatencyMetricKey = "query_latency"
	FetchLatencyMetricKey = "fetch_latency"
	MergeLatencyMetricKey = "merge_latency"
	RefreshLatencyMetricKey = "refresh_latency"
	ScrollLatencyMetricKey = "scroll_latency"
	FlushLatencyMetricKey = "flush_latency"
	QueryCacheMetricKey = "query_cache"
	RequestCacheMetricKey = "request_cache"
	RequestCacheHitMetricKey = "request_cache_hit"
	RequestCacheMissMetricKey = "request_cache_miss"
	QueryCacheCountMetricKey = "query_cache_count"
	QueryCacheHitMetricKey = "query_cache_hit"
	QueryCacheMissMetricKey = "query_cache_miss"
	FielddataCacheMetricKey = "fielddata_cache"
	SegmentMemoryMetricKey = "segment_memory"
	SegmentDocValuesMemoryMetricKey = "segment_doc_values_memory"
	SegmentTermsMemoryMetricKey = "segment_terms_memory"
	SegmentFieldsMemoryMetricKey = "segment_fields_memory"
	SegmentIndexWriterMemoryMetricKey = "segment_index_writer_memory"
	SegmentTermVectorsMemoryMetricKey = "segment_term_vectors_memory"
	DocPercentMetricKey = "doc_percent"
)

func (h *APIHandler) getIndexMetrics(ctx context.Context, req *http.Request, clusterID string, bucketSize int, min, max int64, indexName string, top int, metricKey string) map[string]*common.MetricItem{
	bucketSizeStr:=fmt.Sprintf("%vs",bucketSize)

	var must = []util.MapStr{
		{
			"term":util.MapStr{
				"metadata.labels.cluster_id":util.MapStr{
					"value": clusterID,
				},
			},
		},
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
					"value": "index_stats",
				},
			},
		},
	}
	var (
		indexNames []string
		err error
	)
	if indexName != "" {
		indexNames = strings.Split(indexName, ",")
		allowedIndices, hasAllPrivilege := h.GetAllowedIndices(req, clusterID)
		if !hasAllPrivilege && len(allowedIndices) == 0 {
			return nil
		}
		if !hasAllPrivilege{
			namePattern := radix.Compile(allowedIndices...)
			var filterNames []string
			for _, name := range indexNames {
				if namePattern.Match(name){
					filterNames = append(filterNames, name)
				}
			}
			if len(filterNames) == 0 {
				return nil
			}
			indexNames = filterNames
		}
		top = len(indexNames)

	}else{
		indexNames, err = h.getTopIndexName(req, clusterID, top, 15)
		if err != nil {
			log.Error(err)
		}

	}
	if len(indexNames) > 0 {
		must = append(must, util.MapStr{
			"terms": util.MapStr{
				"metadata.labels.index_name": indexNames,
			},
		})
	}

	query:=map[string]interface{}{}
	query["query"]=util.MapStr{
		"bool": util.MapStr{
			"must": must,
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
	indexMetricItems := []GroupMetricItem{}
	switch metricKey {
	case IndexStorageMetricKey:
		//索引存储大小
		indexStorageMetric := newMetricItem(IndexStorageMetricKey, 1, StorageGroupKey)
		indexStorageMetric.AddAxi("Index storage", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "index_storage",
			Field:        "payload.elasticsearch.index_stats.total.store.size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   indexStorageMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case SegmentCountMetricKey:
		// segment 数量
		segmentCountMetric := newMetricItem(SegmentCountMetricKey, 15, StorageGroupKey)
		segmentCountMetric.AddAxi("segment count", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "segment_count",
			Field:        "payload.elasticsearch.index_stats.total.segments.count",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentCountMetric,
			FormatType:   "num",
			Units:        "",
		})
	case DocCountMetricKey:
		//索引文档个数
		docCountMetric := newMetricItem(DocCountMetricKey, 2, DocumentGroupKey)
		docCountMetric.AddAxi("Doc count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "doc_count",
			Field:        "payload.elasticsearch.index_stats.total.docs.count",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   docCountMetric,
			FormatType:   "num",
			Units:        "",
		})
	case DocsDeletedMetricKey:
		// docs 删除数量
		docsDeletedMetric := newMetricItem(DocsDeletedMetricKey, 17, DocumentGroupKey)
		docsDeletedMetric.AddAxi("docs deleted", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "docs_deleted",
			Field:        "payload.elasticsearch.index_stats.total.docs.deleted",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   docsDeletedMetric,
			FormatType:   "num",
			Units:        "",
		})
	case QueryTimesMetricKey:
		//查询次数
		queryTimesMetric := newMetricItem(QueryTimesMetricKey, 2, OperationGroupKey)
		queryTimesMetric.AddAxi("Query times", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "query_times",
			Field:        "payload.elasticsearch.index_stats.total.search.query_total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   queryTimesMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case FetchTimesMetricKey:
		//Fetch次数
		fetchTimesMetric := newMetricItem(FetchTimesMetricKey, 3, OperationGroupKey)
		fetchTimesMetric.AddAxi("Fetch times", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "fetch_times",
			Field:        "payload.elasticsearch.index_stats.total.search.fetch_total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   fetchTimesMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case ScrollTimesMetricKey:
		//scroll 次数
		scrollTimesMetric := newMetricItem(ScrollTimesMetricKey, 4, OperationGroupKey)
		scrollTimesMetric.AddAxi("scroll times", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "scroll_times",
			Field:        "payload.elasticsearch.index_stats.total.search.scroll_total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   scrollTimesMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case MergeTimesMetricKey:
		//Merge次数
		mergeTimesMetric := newMetricItem(MergeTimesMetricKey, 7, OperationGroupKey)
		mergeTimesMetric.AddAxi("Merge times", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "merge_times",
			Field:        "payload.elasticsearch.index_stats.total.merges.total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   mergeTimesMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case RefreshTimesMetricKey:
		//Refresh次数
		refreshTimesMetric := newMetricItem(RefreshTimesMetricKey, 5, OperationGroupKey)
		refreshTimesMetric.AddAxi("Refresh times", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "refresh_times",
			Field:        "payload.elasticsearch.index_stats.total.refresh.total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   refreshTimesMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case FlushTimesMetricKey:
		//flush 次数
		flushTimesMetric := newMetricItem(FlushTimesMetricKey, 6, OperationGroupKey)
		flushTimesMetric.AddAxi("flush times","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "flush_times",
			Field: "payload.elasticsearch.index_stats.total.flush.total",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: flushTimesMetric,
			FormatType: "num",
			Units: "requests/s",
		})
	case IndexingRateMetricKey:
		//写入速率
		indexingRateMetric := newMetricItem(IndexingRateMetricKey, 1, OperationGroupKey)
		indexingRateMetric.AddAxi("Indexing rate","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "indexing_rate",
			Field: "payload.elasticsearch.index_stats.primaries.indexing.index_total",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: indexingRateMetric,
			FormatType: "num",
			Units: "doc/s",
		})
	case IndexingBytesMetricKey:
		indexingBytesMetric := newMetricItem(IndexingBytesMetricKey, 2, OperationGroupKey)
		indexingBytesMetric.AddAxi("Indexing bytes","group1",common.PositionLeft,"bytes","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key:          "indexing_bytes",
			Field:        "payload.elasticsearch.index_stats.primaries.store.size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   indexingBytesMetric,
			FormatType:   "bytes",
			Units:        "bytes/s",
		})
	case IndexingLatencyMetricKey:
		//写入时延
		indexingLatencyMetric := newMetricItem(IndexingLatencyMetricKey, 1, LatencyGroupKey)
		indexingLatencyMetric.AddAxi("Indexing latency","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "indexing_latency",
			Field: "payload.elasticsearch.index_stats.primaries.indexing.index_time_in_millis",
			Field2: "payload.elasticsearch.index_stats.primaries.indexing.index_total",
			Calc: func(value, value2 float64) float64 {
				return value/value2
			},
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: indexingLatencyMetric,
			FormatType: "num",
			Units: "ms",
		})
	case QueryLatencyMetricKey:
		//查询时延
		queryLatencyMetric := newMetricItem(QueryLatencyMetricKey, 2, LatencyGroupKey)
		queryLatencyMetric.AddAxi("Query latency","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "query_latency",
			Field: "payload.elasticsearch.index_stats.total.search.query_time_in_millis",
			Field2: "payload.elasticsearch.index_stats.total.search.query_total",
			Calc: func(value, value2 float64) float64 {
				return value/value2
			},
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: queryLatencyMetric,
			FormatType: "num",
			Units: "ms",
		})
	case FetchLatencyMetricKey:
		//fetch时延
		fetchLatencyMetric := newMetricItem(FetchLatencyMetricKey, 3, LatencyGroupKey)
		fetchLatencyMetric.AddAxi("Fetch latency","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "fetch_latency",
			Field: "payload.elasticsearch.index_stats.total.search.fetch_time_in_millis",
			Field2: "payload.elasticsearch.index_stats.total.search.fetch_total",
			Calc: func(value, value2 float64) float64 {
				return value/value2
			},
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: fetchLatencyMetric,
			FormatType: "num",
			Units: "ms",
		})
	case MergeLatencyMetricKey:
		//merge时延
		mergeLatencyMetric := newMetricItem(MergeLatencyMetricKey, 7, LatencyGroupKey)
		mergeLatencyMetric.AddAxi("Merge latency","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "merge_latency",
			Field: "payload.elasticsearch.index_stats.total.merges.total_time_in_millis",
			Field2: "payload.elasticsearch.index_stats.total.merges.total",
			Calc: func(value, value2 float64) float64 {
				return value/value2
			},
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: mergeLatencyMetric,
			FormatType: "num",
			Units: "ms",
		})
	case RefreshLatencyMetricKey:

		//refresh时延
		refreshLatencyMetric := newMetricItem(RefreshLatencyMetricKey, 5, LatencyGroupKey)
		refreshLatencyMetric.AddAxi("Refresh latency","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "refresh_latency",
			Field: "payload.elasticsearch.index_stats.total.refresh.total_time_in_millis",
			Field2: "payload.elasticsearch.index_stats.total.refresh.total",
			Calc: func(value, value2 float64) float64 {
				return value/value2
			},
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: refreshLatencyMetric,
			FormatType: "num",
			Units: "ms",
		})
	case ScrollLatencyMetricKey:
		//scroll时延
		scrollLatencyMetric := newMetricItem(ScrollLatencyMetricKey, 4, LatencyGroupKey)
		scrollLatencyMetric.AddAxi("Scroll Latency","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "scroll_latency",
			Field: "payload.elasticsearch.index_stats.total.search.scroll_time_in_millis",
			Field2: "payload.elasticsearch.index_stats.total.search.scroll_total",
			Calc: func(value, value2 float64) float64 {
				return value/value2
			},
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: scrollLatencyMetric,
			FormatType: "num",
			Units: "ms",
		})
	case FlushLatencyMetricKey:
		//flush 时延
		flushLatencyMetric := newMetricItem(FlushLatencyMetricKey, 6, LatencyGroupKey)
		flushLatencyMetric.AddAxi("Flush latency","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "flush_latency",
			Field: "payload.elasticsearch.index_stats.total.flush.total_time_in_millis",
			Field2: "payload.elasticsearch.index_stats.total.flush.total",
			Calc: func(value, value2 float64) float64 {
				return value/value2
			},
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: flushLatencyMetric,
			FormatType: "num",
			Units: "ms",
		})
	case QueryCacheMetricKey:
		//queryCache
		queryCacheMetric := newMetricItem(QueryCacheMetricKey, 1, CacheGroupKey)
		queryCacheMetric.AddAxi("Query cache","group1",common.PositionLeft,"bytes","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "query_cache",
			Field: "payload.elasticsearch.index_stats.total.query_cache.memory_size_in_bytes",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: queryCacheMetric,
			FormatType: "bytes",
			Units: "",
		})
	case RequestCacheMetricKey:
		//requestCache
		requestCacheMetric := newMetricItem(RequestCacheMetricKey, 2, CacheGroupKey)
		requestCacheMetric.AddAxi("request cache","group1",common.PositionLeft,"bytes","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "request_cache",
			Field: "payload.elasticsearch.index_stats.total.request_cache.memory_size_in_bytes",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: requestCacheMetric,
			FormatType: "bytes",
			Units: "",
		})
	case RequestCacheHitMetricKey:
		// Request Cache Hit
		requestCacheHitMetric:=newMetricItem(RequestCacheHitMetricKey, 6, CacheGroupKey)
		requestCacheHitMetric.AddAxi("request cache hit","group1",common.PositionLeft,"num","0,0","0,0.[00]",5,true)
		indexMetricItems=append(indexMetricItems, GroupMetricItem{
			Key: "request_cache_hit",
			Field: "payload.elasticsearch.index_stats.total.request_cache.hit_count",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: requestCacheHitMetric,
			FormatType: "num",
			Units: "hits",
		})
	case RequestCacheMissMetricKey:
		// Request Cache Miss
		requestCacheMissMetric:=newMetricItem(RequestCacheMissMetricKey, 8, CacheGroupKey)
		requestCacheMissMetric.AddAxi("request cache miss","group1",common.PositionLeft,"num","0,0","0,0.[00]",5,true)
		indexMetricItems=append(indexMetricItems, GroupMetricItem{
			Key: "request_cache_miss",
			Field: "payload.elasticsearch.index_stats.total.request_cache.miss_count",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: requestCacheMissMetric,
			FormatType: "num",
			Units: "misses",
		})
	case QueryCacheCountMetricKey:
		// Query Cache Count
		queryCacheCountMetric:=newMetricItem(QueryCacheCountMetricKey, 4, CacheGroupKey)
		queryCacheCountMetric.AddAxi("query cache miss","group1",common.PositionLeft,"num","0,0","0,0.[00]",5,true)
		indexMetricItems=append(indexMetricItems, GroupMetricItem{
			Key: "query_cache_count",
			Field: "payload.elasticsearch.index_stats.total.query_cache.cache_count",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: queryCacheCountMetric,
			FormatType: "num",
			Units: "",
		})
	case QueryCacheHitMetricKey:
		// Query Cache Miss
		queryCacheHitMetric:=newMetricItem(QueryCacheHitMetricKey, 5, CacheGroupKey)
		queryCacheHitMetric.AddAxi("query cache hit","group1",common.PositionLeft,"num","0,0","0,0.[00]",5,true)
		indexMetricItems=append(indexMetricItems, GroupMetricItem{
			Key: "query_cache_hit",
			Field: "payload.elasticsearch.index_stats.total.query_cache.hit_count",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: queryCacheHitMetric,
			FormatType: "num",
			Units: "hits",
		})
	case QueryCacheMissMetricKey:
		// Query Cache Miss
		queryCacheMissMetric:=newMetricItem(QueryCacheMissMetricKey, 7, CacheGroupKey)
		queryCacheMissMetric.AddAxi("query cache miss","group1",common.PositionLeft,"num","0,0","0,0.[00]",5,true)
		indexMetricItems=append(indexMetricItems, GroupMetricItem{
			Key: "query_cache_miss",
			Field: "payload.elasticsearch.index_stats.total.query_cache.miss_count",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: queryCacheMissMetric,
			FormatType: "num",
			Units: "misses",
		})
	case FielddataCacheMetricKey:
		// Fielddata内存占用大小
		fieldDataCacheMetric:=newMetricItem(FielddataCacheMetricKey, 3, CacheGroupKey)
		fieldDataCacheMetric.AddAxi("FieldData Cache","group1",common.PositionLeft,"bytes","0,0","0,0.[00]",5,true)
		indexMetricItems=append(indexMetricItems, GroupMetricItem{
			Key: "fielddata_cache",
			Field: "payload.elasticsearch.index_stats.total.fielddata.memory_size_in_bytes",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: fieldDataCacheMetric,
			FormatType: "bytes",
			Units: "",
		})
	case SegmentMemoryMetricKey:
		//segment memory
		segmentMemoryMetric := newMetricItem(SegmentMemoryMetricKey, 13, MemoryGroupKey)
		segmentMemoryMetric.AddAxi("Segment memory","group1",common.PositionLeft,"bytes","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "segment_memory",
			Field: "payload.elasticsearch.index_stats.total.segments.memory_in_bytes",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: segmentMemoryMetric,
			FormatType: "bytes",
			Units: "",
		})
	case SegmentDocValuesMemoryMetricKey:
		//segment doc values memory
		docValuesMemoryMetric := newMetricItem(SegmentDocValuesMemoryMetricKey, 13, MemoryGroupKey)
		docValuesMemoryMetric.AddAxi("Segment Doc values Memory","group1",common.PositionLeft,"bytes","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "segment_doc_values_memory",
			Field: "payload.elasticsearch.index_stats.total.segments.doc_values_memory_in_bytes",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: docValuesMemoryMetric,
			FormatType: "bytes",
			Units: "",
		})
	case SegmentTermsMemoryMetricKey:
		//segment terms memory
		termsMemoryMetric := newMetricItem(SegmentTermsMemoryMetricKey, 13, MemoryGroupKey)
		termsMemoryMetric.AddAxi("Segment Terms Memory","group1",common.PositionLeft,"bytes","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "segment_terms_memory",
			Field: "payload.elasticsearch.index_stats.total.segments.terms_memory_in_bytes",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: termsMemoryMetric,
			FormatType: "bytes",
			Units: "",
		})
	case SegmentFieldsMemoryMetricKey:
		//segment fields memory
		fieldsMemoryMetric := newMetricItem(SegmentFieldsMemoryMetricKey, 13, MemoryGroupKey)
		fieldsMemoryMetric.AddAxi("Segment Fields Memory","group1",common.PositionLeft,"bytes","0.[0]","0.[0]",5,true)
		indexMetricItems = append(indexMetricItems, GroupMetricItem{
			Key: "segment_fields_memory",
			Field: "payload.elasticsearch.index_stats.total.segments.stored_fields_memory_in_bytes",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: fieldsMemoryMetric,
			FormatType: "bytes",
			Units: "",
		})
	case SegmentIndexWriterMemoryMetricKey:
		// segment index writer memory
		segmentIndexWriterMemoryMetric:=newMetricItem(SegmentIndexWriterMemoryMetricKey, 16, MemoryGroupKey)
		segmentIndexWriterMemoryMetric.AddAxi("segment doc values memory","group1",common.PositionLeft,"bytes","0,0","0,0.[00]",5,true)
		indexMetricItems=append(indexMetricItems, GroupMetricItem{
			Key: "segment_index_writer_memory",
			Field: "payload.elasticsearch.index_stats.total.segments.index_writer_memory_in_bytes",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: segmentIndexWriterMemoryMetric,
			FormatType: "bytes",
			Units: "",
		})
	case SegmentTermVectorsMemoryMetricKey:
		// segment term vectors memory
		segmentTermVectorsMemoryMetric:=newMetricItem(SegmentTermVectorsMemoryMetricKey, 16, MemoryGroupKey)
		segmentTermVectorsMemoryMetric.AddAxi("segment term vectors memory","group1",common.PositionLeft,"bytes","0,0","0,0.[00]",5,true)
		indexMetricItems=append(indexMetricItems, GroupMetricItem{
			Key: "segment_term_vectors_memory",
			Field: "payload.elasticsearch.index_stats.total.segments.term_vectors_memory_in_bytes",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: segmentTermVectorsMemoryMetric,
			FormatType: "bytes",
			Units: "",
		})

	}


	aggs:=map[string]interface{}{}

	for _,metricItem:=range indexMetricItems {
		aggs[metricItem.ID]=util.MapStr{
			"max":util.MapStr{
				"field": metricItem.Field,
			},
		}

		if metricItem.Field2 != ""{
			aggs[metricItem.ID + "_field2"]=util.MapStr{
				"max":util.MapStr{
					"field": metricItem.Field2,
				},
			}
		}

		if metricItem.IsDerivative{
			aggs[metricItem.ID+"_deriv"]=util.MapStr{
				"derivative":util.MapStr{
					"buckets_path": metricItem.ID,
				},
			}
			if metricItem.Field2 != "" {
				aggs[metricItem.ID + "_deriv_field2"]=util.MapStr{
					"derivative":util.MapStr{
						"buckets_path": metricItem.ID + "_field2",
					},
				}
			}
		}
	}
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		log.Error(err)
		panic(err)
	}

	query["size"]=0
	query["aggs"]= util.MapStr{
		"group_by_level": util.MapStr{
			"terms": util.MapStr{
				"field": "metadata.labels.index_name",
				"size":  top,
				"order": util.MapStr{
					"max_store": "desc",
				},
			},
			"aggs": util.MapStr{
				"dates": util.MapStr{
					"date_histogram":util.MapStr{
						"field": "timestamp",
						intervalField: bucketSizeStr,
					},
					"aggs":aggs,
				},
				"max_store": util.MapStr{
					"max": util.MapStr{
						"field": "payload.elasticsearch.index_stats.total.store.size_in_bytes",
					},
				},
			},
		},
	}
	return h.getMetrics(ctx, query, indexMetricItems, bucketSize)

}

func (h *APIHandler) getTopIndexName(req *http.Request, clusterID string, top int, lastMinutes int) ([]string, error){
	ver := h.Client().GetVersion()
	cr, _ := util.VersionCompare(ver.Number, "6.1")
	if (ver.Distribution == "" || ver.Distribution == elastic.Elasticsearch) && cr == -1 {
		return nil, nil
	}
	var (
		now = time.Now()
		max = now.UnixNano()/1e6
		min = now.Add(-time.Duration(lastMinutes) * time.Minute).UnixNano()/1e6
	)
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
					"value": "index_stats",
				},
			},
		},
		{
			"term": util.MapStr{
				"metadata.labels.cluster_id": util.MapStr{
					"value": clusterID,
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
				"query": strings.Join(allowedIndices, " "),
				"fields": []string{"metadata.labels.index_name"},
				"default_operator": "OR",
			},
		})
	}
	bucketSizeStr := "60s"
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		return nil, err
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
				"must": must,
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
					"size":  10000,
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
							"field":    "timestamp",
							intervalField: bucketSizeStr,
						},
						"aggs": util.MapStr{
							"search_query_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.index_stats.total.search.query_total",
								},
							},
							"search_qps": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "search_query_total",
								},
							},
						},
					},
				},
			},
			"group_by_index1": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.index_name",
					"size":  10000,
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
							"field":    "timestamp",
							intervalField: bucketSizeStr,
						},
						"aggs": util.MapStr{
							"index_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.index_stats.total.indexing.index_total",
								},
							},
							"index_qps": util.MapStr{
								"derivative": util.MapStr{
									"buckets_path": "index_total",
								},
							},
						},
					},
				},
			},
		},
	}
	response,err:=elastic.GetClient(global.MustLookupString(elastic.GlobalSystemElasticsearchID)).SearchWithRawQueryDSL(getAllMetricsIndex(),util.MustToJSONBytes(query))
	if err!=nil{
		log.Error(err)
		return nil, err
	}
	var maxQpsKVS = map[string] float64{}
	for _, agg := range response.Aggregations {
		for _, bk := range agg.Buckets {
			key := bk["key"].(string)
			if maxQps, ok := bk["max_qps"].(map[string]interface{}); ok {
				val := maxQps["value"].(float64)
				if _, ok = maxQpsKVS[key] ; ok {
					maxQpsKVS[key] = maxQpsKVS[key] + val
				}else{
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
	for i := 0; i <length; i++ {
		indexNames = append(indexNames, qpsValues[i].Key)
	}
	return indexNames, nil
}

type TopTerm struct {
	Key   string
	Value float64
}
type TopTermOrder []TopTerm
func (t TopTermOrder) Len() int{
	return len(t)
}
func (t TopTermOrder) Less(i, j int) bool{
	return t[i].Value > t[j].Value //desc
}
func (t TopTermOrder) Swap(i, j int){
	t[i], t[j] = t[j], t[i]
}
