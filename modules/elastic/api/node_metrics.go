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
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
	"sort"
	"strings"
	"time"
)

const (
	NodeOSCPUMetricKey                 = "os_cpu"
	NodeProcessCPUMetricKey            = "cpu"
	OSUsedMemoryMetricKey              = "os_used_mem"
	OSLoadAverage1mMetricKey           = "os_load_average_1m"
	OSUsedSwapMetricKey                = "os_used_swap"
	OpenFileMetricKey                  = "open_file"
	OpenFilePercentMetricKey           = "open_file_percent"
	TotalDiskMetricKey                 = "disk"
	IndexingRateMetricKey              = "indexing_rate"
	IndexingBytesMetricKey             = "indexing_bytes"
	IndexingLatencyMetricKey           = "indexing_latency"
	QueryRateMetricKey                 = "query_rate"
	QueryLatencyMetricKey              = "query_latency"
	FetchRateMetricKey                 = "fetch_rate"
	ScrollRateMetricKey                = "scroll_rate"
	RefreshRateMetricKey               = "refresh_rate"
	FlushRateMetricKey                 = "flush_rate"
	MergesRateMetricKey                = "merges_rate"
	FetchLatencyMetricKey              = "fetch_latency"
	ScrollLatencyMetricKey             = "scroll_latency"
	MergeLatencyMetricKey              = "merge_latency"
	RefreshLatencyMetricKey            = "refresh_latency"
	FlushLatencyMetricKey              = "flush_latency"
	QueryCacheMetricKey                = "query_cache"
	RequestCacheMetricKey              = "request_cache"
	RequestCacheHitMetricKey           = "request_cache_hit"
	RequestCacheMissMetricKey          = "request_cache_miss"
	QueryCacheCountMetricKey           = "query_cache_count"
	QueryCacheMissMetricKey            = "query_cache_miss"
	QueryCacheHitMetricKey             = "query_cache_hit"
	FielddataCacheMetricKey            = "fielddata_cache"
	HttpConnectNumMetricKey            = "http_connect_num"
	HttpRateMetricKey                  = "http_rate"
	SegmentCountMetricKey              = "segment_count"
	SegmentMemoryMetricKey             = "segment_memory"
	SegmentStoredFieldsMemoryMetricKey = "segment_stored_fields_memory"
	SegmentTermsMemoryMetricKey        = "segment_terms_memory"
	SegmentDocValuesMemoryMetricKey    = "segment_doc_values_memory"
	SegmentIndexWriterMemoryMetricKey  = "segment_index_writer_memory"
	SegmentTermVectorsMemoryMetricKey  = "segment_term_vectors_memory"
	DocsCountMetricKey                 = "docs_count"
	DocsDeletedMetricKey               = "docs_deleted"
	IndexStorageMetricKey              = "index_storage"
	JVMHeapUsedPercentMetricKey        = "jvm_heap_used_percent"
	JVMMemYoungUsedMetricKey           = "jvm_mem_young_used"
	JVMMemYoungPeakUsedMetricKey       = "jvm_mem_young_peak_used"
	JVMMemOldUsedMetricKey             = "jvm_mem_old_used"
	JVMMemOldPeakUsedMetricKey         = "jvm_mem_old_peak_used"
	JVMUsedHeapMetricKey               = "jvm_used_heap"
	JVMYoungGCRateMetricKey            = "jvm_young_gc_rate"
	JVMYoungGCLatencyMetricKey         = "jvm_young_gc_latency"
	JVMOldGCRateMetricKey              = "jvm_old_gc_rate"
	JVMOldGCLatencyMetricKey           = "jvm_old_gc_latency"
	TransportTXRateMetricKey           = "transport_tx_rate"
	TransportRXRateMetricKey           = "transport_rx_rate"
	TransportTXBytesMetricKey          = "transport_tx_bytes"
	TransportRXBytesMetricKey          = "transport_rx_bytes"
	TransportTCPOutboundMetricKey      = "transport_outbound_connections"
	TotalIOOperationsMetricKey         = "total_io_operations"
	TotalReadIOOperationsMetricKey     = "total_read_io_operations"
	TotalWriteIOOperationsMetricKey    = "total_write_io_operations"
	ScrollOpenContextsMetricKey        = "scroll_open_contexts"
	ParentBreakerMetricKey             = "parent_breaker"
	AccountingBreakerMetricKey         = "accounting_breaker"
	FielddataBreakerMetricKey          = "fielddata_breaker"
	RequestBreakerMetricKey            = "request_breaker"
	InFlightRequestsBreakerMetricKey   = "in_flight_requests_breaker"
	ModelInferenceBreakerMetricKey     = "model_inference_breaker"
)

func (h *APIHandler) getNodeMetrics(ctx context.Context, clusterID string, bucketSize int, min, max int64, nodeName string, top int, metricKey string) (map[string]*common.MetricItem, error) {
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
		{
			"term": util.MapStr{
				"metadata.labels.cluster_uuid": util.MapStr{
					"value": clusterUUID,
				},
			},
		},
	}
	var must = []util.MapStr{
		{
			"bool": util.MapStr{
				"minimum_should_match": 1,
				"should":               should,
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
					"value": "node_stats",
				},
			},
		},
	}
	var (
		nodeNames []string
	)
	if nodeName != "" {
		nodeNames = strings.Split(nodeName, ",")
		top = len(nodeNames)
	} else {
		nodeNames, err = h.getTopNodeName(clusterID, top, 15)
		if err != nil {
			log.Error(err)
		}
	}
	if len(nodeNames) > 0 {
		must = append(must, util.MapStr{
			"bool": util.MapStr{
				"minimum_should_match": 1,
				"should": []util.MapStr{
					{
						"terms": util.MapStr{
							"metadata.labels.transport_address": nodeNames,
						},
					},
					{
						"terms": util.MapStr{
							"metadata.labels.node_id": nodeNames,
						},
					},
				},
			},
		})
	}

	query := map[string]interface{}{}
	query["query"] = util.MapStr{
		"bool": util.MapStr{
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
	}
	nodeMetricItems := []GroupMetricItem{}
	switch metricKey {
	case NodeProcessCPUMetricKey:
		cpuMetric := newMetricItem(NodeProcessCPUMetricKey, 1, SystemGroupKey)
		cpuMetric.AddAxi("cpu", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "cpu",
			Field:        "payload.elasticsearch.node_stats.process.cpu.percent",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   cpuMetric,
			FormatType:   "ratio",
			Units:        "%",
		})
	case NodeOSCPUMetricKey:
		osCpuMetric := newMetricItem(NodeOSCPUMetricKey, 2, SystemGroupKey)
		osCpuMetric.AddAxi("OS CPU Percent", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "os_cpu",
			Field:        "payload.elasticsearch.node_stats.os.cpu.percent",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   osCpuMetric,
			FormatType:   "ratio",
			Units:        "%",
		})
	case OSUsedMemoryMetricKey:
		osMemMetric := newMetricItem(OSUsedMemoryMetricKey, 2, SystemGroupKey)
		osMemMetric.AddAxi("OS Mem Used Percent", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "os_used_mem",
			Field:        "payload.elasticsearch.node_stats.os.mem.used_percent",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   osMemMetric,
			FormatType:   "ratio",
			Units:        "%",
		})
	case OSLoadAverage1mMetricKey:
		osLoadMetric := newMetricItem(OSLoadAverage1mMetricKey, 2, SystemGroupKey)
		osLoadMetric.AddAxi("OS Load 1m Average", "group1", common.PositionLeft, "", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "os_load_average_1m",
			Field:        "payload.elasticsearch.node_stats.os.cpu.load_average.1m",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   osLoadMetric,
			FormatType:   "num",
			Units:        "",
		})
	case OSUsedSwapMetricKey:
		//swap usage
		osSwapMetric := newMetricItem(OSUsedSwapMetricKey, 3, SystemGroupKey)
		osSwapMetric.AddAxi("OS Swap Used Percent", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "os_used_swap",
			Field:        "payload.elasticsearch.node_stats.os.swap.used_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			Field2:       "payload.elasticsearch.node_stats.os.swap.total_in_bytes",
			Calc: func(value, value2 float64) float64 {
				return util.ToFixed((value/value2)*100, 2)
			},
			MetricItem: osSwapMetric,
			FormatType: "ratio",
			Units:      "%",
		})
	case OpenFileMetricKey:
		openFileMetric := newMetricItem(OpenFileMetricKey, 2, SystemGroupKey)
		openFileMetric.AddAxi("Open File Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "open_file",
			Field:        "payload.elasticsearch.node_stats.process.open_file_descriptors",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   openFileMetric,
			FormatType:   "num",
			Units:        "",
		})
	case OpenFilePercentMetricKey:
		openFilePercentMetric := newMetricItem(OpenFilePercentMetricKey, 2, SystemGroupKey)
		openFilePercentMetric.AddAxi("Open File Percent", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "open_file_percent",
			Field:        "payload.elasticsearch.node_stats.process.open_file_descriptors",
			ID:           util.GetUUID(),
			IsDerivative: false,
			Field2:       "payload.elasticsearch.node_stats.process.max_file_descriptors",
			Calc: func(value, value2 float64) float64 {
				if value < 0 {
					return value
				}
				return util.ToFixed((value/value2)*100, 2)
			},
			MetricItem: openFilePercentMetric,
			FormatType: "ratio",
			Units:      "%",
		})
	case TotalDiskMetricKey:
		diskMetric := newMetricItem(TotalDiskMetricKey, 2, SystemGroupKey)
		diskMetric.AddAxi("disk available percent", "group1", common.PositionLeft, "ratio", "0.[0]", "0.[0]", 5, true)

		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "disk",
			Field:        "payload.elasticsearch.node_stats.fs.total.total_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   diskMetric,
			FormatType:   "ratio",
			Units:        "%",
			Field2:       "payload.elasticsearch.node_stats.fs.total.available_in_bytes",
			Calc: func(value, value2 float64) float64 {
				return util.ToFixed((value2/value)*100, 2)
			},
		})
	case IndexingRateMetricKey:
		// 索引速率
		indexMetric := newMetricItem(IndexingRateMetricKey, 1, OperationGroupKey)
		indexMetric.AddAxi("indexing rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "indexing_rate",
			Field:        "payload.elasticsearch.node_stats.indices.indexing.index_total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   indexMetric,
			FormatType:   "num",
			Units:        "doc/s",
		})
	case IndexingBytesMetricKey:
		indexingBytesMetric := newMetricItem(IndexingBytesMetricKey, 2, OperationGroupKey)
		indexingBytesMetric.AddAxi("Indexing bytes", "group1", common.PositionLeft, "bytes", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "indexing_bytes",
			Field:        "payload.elasticsearch.node_stats.indices.store.size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   indexingBytesMetric,
			FormatType:   "bytes",
			Units:        "bytes/s",
		})
	case IndexingLatencyMetricKey:
		// 索引延时
		indexLatencyMetric := newMetricItem(IndexingLatencyMetricKey, 1, LatencyGroupKey)
		indexLatencyMetric.AddAxi("indexing latency", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:    "indexing_latency",
			Field:  "payload.elasticsearch.node_stats.indices.indexing.index_time_in_millis",
			Field2: "payload.elasticsearch.node_stats.indices.indexing.index_total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   indexLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case QueryRateMetricKey:
		queryMetric := newMetricItem(QueryRateMetricKey, 2, OperationGroupKey)
		queryMetric.AddAxi("query rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "query_rate",
			Field:        "payload.elasticsearch.node_stats.indices.search.query_total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   queryMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case QueryLatencyMetricKey:
		// 查询延时
		queryLatencyMetric := newMetricItem(QueryLatencyMetricKey, 2, LatencyGroupKey)
		queryLatencyMetric.AddAxi("query latency", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:    "query_latency",
			Field:  "payload.elasticsearch.node_stats.indices.search.query_time_in_millis",
			Field2: "payload.elasticsearch.node_stats.indices.search.query_total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   queryLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case FetchRateMetricKey:
		fetchMetric := newMetricItem(FetchRateMetricKey, 3, OperationGroupKey)
		fetchMetric.AddAxi("fetch rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "fetch_rate",
			Field:        "payload.elasticsearch.node_stats.indices.search.fetch_total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   fetchMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case ScrollRateMetricKey:
		scrollMetric := newMetricItem(ScrollRateMetricKey, 4, OperationGroupKey)
		scrollMetric.AddAxi("scroll rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "scroll_rate",
			Field:        "payload.elasticsearch.node_stats.indices.search.scroll_total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   scrollMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case RefreshRateMetricKey:
		refreshMetric := newMetricItem(RefreshRateMetricKey, 5, OperationGroupKey)
		refreshMetric.AddAxi("refresh rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "refresh_rate",
			Field:        "payload.elasticsearch.node_stats.indices.refresh.total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   refreshMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case FlushRateMetricKey:
		flushMetric := newMetricItem(FlushRateMetricKey, 6, OperationGroupKey)
		flushMetric.AddAxi("flush rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "flush_rate",
			Field:        "payload.elasticsearch.node_stats.indices.flush.total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   flushMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case MergesRateMetricKey:
		mergeMetric := newMetricItem(MergesRateMetricKey, 7, OperationGroupKey)
		mergeMetric.AddAxi("merges rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "merges_rate",
			Field:        "payload.elasticsearch.node_stats.indices.merges.total",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   mergeMetric,
			FormatType:   "num",
			Units:        "requests/s",
		})
	case FetchLatencyMetricKey:
		// fetch延时
		fetchLatencyMetric := newMetricItem(FetchLatencyMetricKey, 3, LatencyGroupKey)
		fetchLatencyMetric.AddAxi("fetch latency", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:    "fetch_latency",
			Field:  "payload.elasticsearch.node_stats.indices.search.fetch_time_in_millis",
			Field2: "payload.elasticsearch.node_stats.indices.search.fetch_total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   fetchLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case ScrollLatencyMetricKey:
		// scroll 延时
		scrollLatencyMetric := newMetricItem(ScrollLatencyMetricKey, 4, LatencyGroupKey)
		scrollLatencyMetric.AddAxi("scroll latency", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:    "scroll_latency",
			Field:  "payload.elasticsearch.node_stats.indices.search.scroll_time_in_millis",
			Field2: "payload.elasticsearch.node_stats.indices.search.scroll_total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   scrollLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case MergeLatencyMetricKey:
		// merge 延时
		mergeLatencyMetric := newMetricItem(MergeLatencyMetricKey, 7, LatencyGroupKey)
		mergeLatencyMetric.AddAxi("merge latency", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:    "merge_latency",
			Field:  "payload.elasticsearch.node_stats.indices.merges.total_time_in_millis",
			Field2: "payload.elasticsearch.node_stats.indices.merges.total",
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
		// refresh 延时
		refreshLatencyMetric := newMetricItem(RefreshLatencyMetricKey, 5, LatencyGroupKey)
		refreshLatencyMetric.AddAxi("refresh latency", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:    "refresh_latency",
			Field:  "payload.elasticsearch.node_stats.indices.refresh.total_time_in_millis",
			Field2: "payload.elasticsearch.node_stats.indices.refresh.total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   refreshLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case FlushLatencyMetricKey:
		// flush 时延
		flushLatencyMetric := newMetricItem(FlushLatencyMetricKey, 6, LatencyGroupKey)
		flushLatencyMetric.AddAxi("flush latency", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:    "flush_latency",
			Field:  "payload.elasticsearch.node_stats.indices.flush.total_time_in_millis",
			Field2: "payload.elasticsearch.node_stats.indices.flush.total",
			Calc: func(value, value2 float64) float64 {
				return value / value2
			},
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   flushLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case QueryCacheMetricKey:
		// Query Cache 内存占用大小
		queryCacheMetric := newMetricItem(QueryCacheMetricKey, 1, CacheGroupKey)
		queryCacheMetric.AddAxi("query cache", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "query_cache",
			Field:        "payload.elasticsearch.node_stats.indices.query_cache.memory_size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   queryCacheMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case RequestCacheMetricKey:
		// Request Cache 内存占用大小
		requestCacheMetric := newMetricItem(RequestCacheMetricKey, 2, CacheGroupKey)
		requestCacheMetric.AddAxi("request cache", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "request_cache",
			Field:        "payload.elasticsearch.node_stats.indices.request_cache.memory_size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   requestCacheMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case RequestCacheHitMetricKey:
		// Request Cache Hit
		requestCacheHitMetric := newMetricItem(RequestCacheHitMetricKey, 6, CacheGroupKey)
		requestCacheHitMetric.AddAxi("request cache hit", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "request_cache_hit",
			Field:        "payload.elasticsearch.node_stats.indices.request_cache.hit_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   requestCacheHitMetric,
			FormatType:   "num",
			Units:        "hits",
		})
	case RequestCacheMissMetricKey:
		// Request Cache Miss
		requestCacheMissMetric := newMetricItem(RequestCacheMissMetricKey, 8, CacheGroupKey)
		requestCacheMissMetric.AddAxi("request cache miss", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "request_cache_miss",
			Field:        "payload.elasticsearch.node_stats.indices.request_cache.miss_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   requestCacheMissMetric,
			FormatType:   "num",
			Units:        "misses",
		})
	case QueryCacheCountMetricKey:
		// Query Cache Count
		queryCacheCountMetric := newMetricItem(QueryCacheCountMetricKey, 4, CacheGroupKey)
		queryCacheCountMetric.AddAxi("query cache miss", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "query_cache_count",
			Field:        "payload.elasticsearch.node_stats.indices.query_cache.cache_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   queryCacheCountMetric,
			FormatType:   "num",
			Units:        "",
		})
	case QueryCacheHitMetricKey:
		queryCacheHitMetric := newMetricItem(QueryCacheHitMetricKey, 5, CacheGroupKey)
		queryCacheHitMetric.AddAxi("query cache hit", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "query_cache_hit",
			Field:        "payload.elasticsearch.node_stats.indices.query_cache.hit_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   queryCacheHitMetric,
			FormatType:   "num",
			Units:        "hits",
		})
	case QueryCacheMissMetricKey:
		// Query Cache Miss
		queryCacheMissMetric := newMetricItem(QueryCacheMissMetricKey, 7, CacheGroupKey)
		queryCacheMissMetric.AddAxi("query cache miss", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "query_cache_miss",
			Field:        "payload.elasticsearch.node_stats.indices.query_cache.miss_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   queryCacheMissMetric,
			FormatType:   "num",
			Units:        "misses",
		})
	case FielddataCacheMetricKey:
		// Fielddata内存占用大小
		fieldDataCacheMetric := newMetricItem(FielddataCacheMetricKey, 3, CacheGroupKey)
		fieldDataCacheMetric.AddAxi("FieldData Cache", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "fielddata_cache",
			Field:        "payload.elasticsearch.node_stats.indices.fielddata.memory_size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   fieldDataCacheMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case HttpConnectNumMetricKey:
		// http 活跃连接数
		httpActiveMetric := newMetricItem(HttpConnectNumMetricKey, 12, HttpGroupKey)
		httpActiveMetric.AddAxi("http connect number", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "http_connect_num",
			Field:        "payload.elasticsearch.node_stats.http.current_open",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   httpActiveMetric,
			FormatType:   "num",
			Units:        "conns",
		})
	case HttpRateMetricKey:
		// http 活跃连接数速率
		httpRateMetric := newMetricItem(HttpRateMetricKey, 12, HttpGroupKey)
		httpRateMetric.AddAxi("http rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "http_rate",
			Field:        "payload.elasticsearch.node_stats.http.total_opened",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   httpRateMetric,
			FormatType:   "num",
			Units:        "conns/s",
		})
	case SegmentCountMetricKey:
		// segment 数量
		segmentCountMetric := newMetricItem(SegmentCountMetricKey, 15, StorageGroupKey)
		segmentCountMetric.AddAxi("segment count", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "segment_count",
			Field:        "payload.elasticsearch.node_stats.indices.segments.count",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentCountMetric,
			FormatType:   "num",
			Units:        "",
		})
	case SegmentMemoryMetricKey:
		// segment memory
		segmentMemoryMetric := newMetricItem(SegmentMemoryMetricKey, 16, MemoryGroupKey)
		segmentMemoryMetric.AddAxi("segment memory", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "segment_memory",
			Field:        "payload.elasticsearch.node_stats.indices.segments.memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case SegmentStoredFieldsMemoryMetricKey:
		// segment stored fields memory
		segmentStoredFieldsMemoryMetric := newMetricItem(SegmentStoredFieldsMemoryMetricKey, 16, MemoryGroupKey)
		segmentStoredFieldsMemoryMetric.AddAxi("segment stored fields memory", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "segment_stored_fields_memory",
			Field:        "payload.elasticsearch.node_stats.indices.segments.stored_fields_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentStoredFieldsMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case SegmentTermsMemoryMetricKey:
		// segment terms fields memory
		segmentTermsMemoryMetric := newMetricItem(SegmentTermsMemoryMetricKey, 16, MemoryGroupKey)
		segmentTermsMemoryMetric.AddAxi("segment terms memory", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "segment_terms_memory",
			Field:        "payload.elasticsearch.node_stats.indices.segments.terms_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentTermsMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case SegmentDocValuesMemoryMetricKey:
		// segment doc values memory
		segmentDocValuesMemoryMetric := newMetricItem(SegmentDocValuesMemoryMetricKey, 16, MemoryGroupKey)
		segmentDocValuesMemoryMetric.AddAxi("segment doc values memory", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "segment_doc_values_memory",
			Field:        "payload.elasticsearch.node_stats.indices.segments.doc_values_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentDocValuesMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case SegmentIndexWriterMemoryMetricKey:
		// segment index writer memory
		segmentIndexWriterMemoryMetric := newMetricItem(SegmentIndexWriterMemoryMetricKey, 16, MemoryGroupKey)
		segmentIndexWriterMemoryMetric.AddAxi("segment doc values memory", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "segment_index_writer_memory",
			Field:        "payload.elasticsearch.node_stats.indices.segments.index_writer_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentIndexWriterMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case SegmentTermVectorsMemoryMetricKey:
		// segment term vectors memory
		segmentTermVectorsMemoryMetric := newMetricItem(SegmentTermVectorsMemoryMetricKey, 16, MemoryGroupKey)
		segmentTermVectorsMemoryMetric.AddAxi("segment term vectors memory", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "segment_term_vectors_memory",
			Field:        "payload.elasticsearch.node_stats.indices.segments.term_vectors_memory_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   segmentTermVectorsMemoryMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case DocsCountMetricKey:
		// docs 数量
		docsCountMetric := newMetricItem(DocsCountMetricKey, 17, DocumentGroupKey)
		docsCountMetric.AddAxi("docs count", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "docs_count",
			Field:        "payload.elasticsearch.node_stats.indices.docs.count",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   docsCountMetric,
			FormatType:   "num",
			Units:        "",
		})
	case DocsDeletedMetricKey:
		// docs 删除数量
		docsDeletedMetric := newMetricItem(DocsDeletedMetricKey, 17, DocumentGroupKey)
		docsDeletedMetric.AddAxi("docs deleted", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "docs_deleted",
			Field:        "payload.elasticsearch.node_stats.indices.docs.deleted",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   docsDeletedMetric,
			FormatType:   "num",
			Units:        "",
		})
	case IndexStorageMetricKey:
		// index store size
		indexStoreMetric := newMetricItem(IndexStorageMetricKey, 18, StorageGroupKey)
		indexStoreMetric.AddAxi("indices storage", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "index_storage",
			Field:        "payload.elasticsearch.node_stats.indices.store.size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   indexStoreMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case JVMHeapUsedPercentMetricKey:
		// jvm used heap
		jvmUsedPercentMetric := newMetricItem(JVMHeapUsedPercentMetricKey, 1, JVMGroupKey)
		jvmUsedPercentMetric.AddAxi("JVM heap used percent", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "jvm_heap_used_percent",
			Field:        "payload.elasticsearch.node_stats.jvm.mem.heap_used_percent",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   jvmUsedPercentMetric,
			FormatType:   "num",
			Units:        "%",
		})
	case JVMMemYoungUsedMetricKey:
		//JVM mem Young pools used
		youngPoolsUsedMetric := newMetricItem(JVMMemYoungUsedMetricKey, 2, JVMGroupKey)
		youngPoolsUsedMetric.AddAxi("Mem Pools Young Used", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "jvm_mem_young_used",
			Field:        "payload.elasticsearch.node_stats.jvm.mem.pools.young.used_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   youngPoolsUsedMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case JVMMemYoungPeakUsedMetricKey:
		//JVM mem Young pools peak used
		youngPoolsUsedPeakMetric := newMetricItem(JVMMemYoungPeakUsedMetricKey, 2, JVMGroupKey)
		youngPoolsUsedPeakMetric.AddAxi("Mem Pools Young Peak Used", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "jvm_mem_young_peak_used",
			Field:        "payload.elasticsearch.node_stats.jvm.mem.pools.young.peak_used_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   youngPoolsUsedPeakMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case JVMMemOldUsedMetricKey:
		//JVM mem old pools used
		oldPoolsUsedMetric := newMetricItem(JVMMemOldUsedMetricKey, 3, JVMGroupKey)
		oldPoolsUsedMetric.AddAxi("Mem Pools Old Used", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "jvm_mem_old_used",
			Field:        "payload.elasticsearch.node_stats.jvm.mem.pools.old.used_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   oldPoolsUsedMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case JVMMemOldPeakUsedMetricKey:
		//JVM mem old pools peak used
		oldPoolsUsedPeakMetric := newMetricItem(JVMMemOldPeakUsedMetricKey, 3, JVMGroupKey)
		oldPoolsUsedPeakMetric.AddAxi("Mem Pools Old Peak Used", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "jvm_mem_old_peak_used",
			Field:        "payload.elasticsearch.node_stats.jvm.mem.pools.old.peak_used_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   oldPoolsUsedPeakMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case JVMUsedHeapMetricKey:
		//JVM used heap
		heapUsedMetric := newMetricItem(JVMUsedHeapMetricKey, 1, JVMGroupKey)
		heapUsedMetric.AddAxi("JVM Used Heap", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "jvm_used_heap",
			Field:        "payload.elasticsearch.node_stats.jvm.mem.heap_used_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   heapUsedMetric,
			FormatType:   "bytes",
			Units:        "",
		})
	case JVMYoungGCRateMetricKey:
		//JVM Young GC Rate
		gcYoungRateMetric := newMetricItem(JVMYoungGCRateMetricKey, 2, JVMGroupKey)
		gcYoungRateMetric.AddAxi("JVM Young GC Rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "jvm_young_gc_rate",
			Field:        "payload.elasticsearch.node_stats.jvm.gc.collectors.young.collection_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   gcYoungRateMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case JVMYoungGCLatencyMetricKey:
		//JVM Young GC Latency
		gcYoungLatencyMetric := newMetricItem(JVMYoungGCLatencyMetricKey, 2, JVMGroupKey)
		gcYoungLatencyMetric.AddAxi("JVM Young GC Time", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "jvm_young_gc_latency",
			Field:        "payload.elasticsearch.node_stats.jvm.gc.collectors.young.collection_time_in_millis",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   gcYoungLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case JVMOldGCRateMetricKey:
		//JVM old GC Rate
		gcOldRateMetric := newMetricItem(JVMOldGCRateMetricKey, 3, JVMGroupKey)
		gcOldRateMetric.AddAxi("JVM Old GC Rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "jvm_old_gc_rate",
			Field:        "payload.elasticsearch.node_stats.jvm.gc.collectors.old.collection_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   gcOldRateMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case JVMOldGCLatencyMetricKey:
		//JVM old GC Latency
		gcOldLatencyMetric := newMetricItem(JVMOldGCLatencyMetricKey, 3, JVMGroupKey)
		gcOldLatencyMetric.AddAxi("JVM Old GC Time", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "jvm_old_gc_latency",
			Field:        "payload.elasticsearch.node_stats.jvm.gc.collectors.old.collection_time_in_millis",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   gcOldLatencyMetric,
			FormatType:   "num",
			Units:        "ms",
		})
	case TransportTXRateMetricKey:
		//Transport 发送速率
		transTxRateMetric := newMetricItem(TransportTXRateMetricKey, 19, TransportGroupKey)
		transTxRateMetric.AddAxi("Transport Send Rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "transport_tx_rate",
			Field:        "payload.elasticsearch.node_stats.transport.tx_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   transTxRateMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case TransportRXRateMetricKey:
		//Transport 接收速率
		transRxRateMetric := newMetricItem(TransportRXRateMetricKey, 19, TransportGroupKey)
		transRxRateMetric.AddAxi("Transport Receive Rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "transport_rx_rate",
			Field:        "payload.elasticsearch.node_stats.transport.rx_count",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   transRxRateMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case TransportTXBytesMetricKey:
		//Transport 发送流量
		transTxBytesMetric := newMetricItem(TransportTXBytesMetricKey, 19, TransportGroupKey)
		transTxBytesMetric.AddAxi("Transport Send Bytes", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "transport_tx_bytes",
			Field:        "payload.elasticsearch.node_stats.transport.tx_size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   transTxBytesMetric,
			FormatType:   "bytes",
			Units:        "s",
		})
	case TransportRXBytesMetricKey:
		//Transport 接收流量
		transRxBytesMetric := newMetricItem(TransportRXBytesMetricKey, 19, TransportGroupKey)
		transRxBytesMetric.AddAxi("Transport Receive Bytes", "group1", common.PositionLeft, "bytes", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "transport_rx_bytes",
			Field:        "payload.elasticsearch.node_stats.transport.rx_size_in_bytes",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   transRxBytesMetric,
			FormatType:   "bytes",
			Units:        "s",
		})
	case TransportTCPOutboundMetricKey:
		//Transport tcp 连接数
		tcpNumMetric := newMetricItem(TransportTCPOutboundMetricKey, 20, TransportGroupKey)
		tcpNumMetric.AddAxi("Transport Outbound Connections", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "transport_outbound_connections",
			Field:        "payload.elasticsearch.node_stats.transport.total_outbound_connections",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   tcpNumMetric,
			FormatType:   "num",
			Units:        "",
		})
	case TotalIOOperationsMetricKey:
		//IO total
		totalOperationsMetric := newMetricItem(TotalIOOperationsMetricKey, 1, IOGroupKey)
		totalOperationsMetric.AddAxi("Total I/O Operations Rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "total_io_operations",
			Field:        "payload.elasticsearch.node_stats.fs.io_stats.total.operations",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   totalOperationsMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case TotalReadIOOperationsMetricKey:
		readOperationsMetric := newMetricItem(TotalReadIOOperationsMetricKey, 2, IOGroupKey)
		readOperationsMetric.AddAxi("Total Read I/O  Operations Rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "total_read_io_operations",
			Field:        "payload.elasticsearch.node_stats.fs.io_stats.total.read_operations",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   readOperationsMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case TotalWriteIOOperationsMetricKey:
		writeOperationsMetric := newMetricItem(TotalWriteIOOperationsMetricKey, 3, IOGroupKey)
		writeOperationsMetric.AddAxi("Total Write I/O  Operations Rate", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "total_write_io_operations",
			Field:        "payload.elasticsearch.node_stats.fs.io_stats.total.write_operations",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   writeOperationsMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case ScrollOpenContextsMetricKey:
		//scroll context
		openContextMetric := newMetricItem(ScrollOpenContextsMetricKey, 7, OperationGroupKey)
		openContextMetric.AddAxi("Scroll Open Contexts", "group1", common.PositionLeft, "num", "0,0", "0,0.[00]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:        "scroll_open_contexts",
			Field:      "payload.elasticsearch.node_stats.indices.search.open_contexts",
			ID:         util.GetUUID(),
			MetricItem: openContextMetric,
			FormatType: "num",
			Units:      "",
		})
	case ParentBreakerMetricKey:
		// Circuit Breaker
		parentBreakerMetric := newMetricItem(ParentBreakerMetricKey, 1, CircuitBreakerGroupKey)
		parentBreakerMetric.AddAxi("Parent Breaker", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "parent_breaker",
			Field:        "payload.elasticsearch.node_stats.breakers.parent.tripped",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   parentBreakerMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case AccountingBreakerMetricKey:
		accountingBreakerMetric := newMetricItem(AccountingBreakerMetricKey, 2, CircuitBreakerGroupKey)
		accountingBreakerMetric.AddAxi("Accounting Breaker", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "accounting_breaker",
			Field:        "payload.elasticsearch.node_stats.breakers.accounting.tripped",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   accountingBreakerMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case FielddataBreakerMetricKey:
		fielddataBreakerMetric := newMetricItem(FielddataBreakerMetricKey, 3, CircuitBreakerGroupKey)
		fielddataBreakerMetric.AddAxi("Fielddata Breaker", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "fielddata_breaker",
			Field:        "payload.elasticsearch.node_stats.breakers.fielddata.tripped",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   fielddataBreakerMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case RequestBreakerMetricKey:
		requestBreakerMetric := newMetricItem(RequestBreakerMetricKey, 4, CircuitBreakerGroupKey)
		requestBreakerMetric.AddAxi("Request Breaker", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "request_breaker",
			Field:        "payload.elasticsearch.node_stats.breakers.request.tripped",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   requestBreakerMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case InFlightRequestsBreakerMetricKey:
		inFlightRequestBreakerMetric := newMetricItem(InFlightRequestsBreakerMetricKey, 5, CircuitBreakerGroupKey)
		inFlightRequestBreakerMetric.AddAxi("In Flight Requests Breaker", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "in_flight_requests_breaker",
			Field:        "payload.elasticsearch.node_stats.breakers.in_flight_requests.tripped",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   inFlightRequestBreakerMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	case ModelInferenceBreakerMetricKey:
		//Elasticsearch 8.6+ Model Inference Breaker
		modelInferenceBreakerMetric := newMetricItem(ModelInferenceBreakerMetricKey, 6, CircuitBreakerGroupKey)
		modelInferenceBreakerMetric.AddAxi("Model Inference Breaker", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)
		nodeMetricItems = append(nodeMetricItems, GroupMetricItem{
			Key:          "model_inference_breaker",
			Field:        "payload.elasticsearch.node_stats.breakers.model_inference.tripped",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   modelInferenceBreakerMetric,
			FormatType:   "num",
			Units:        "times/s",
		})
	}

	aggs := generateGroupAggs(nodeMetricItems)
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		log.Error(err)
		panic(err)
	}

	query["size"] = 0
	query["aggs"] = util.MapStr{
		"group_by_level": util.MapStr{
			"terms": util.MapStr{
				"field": "metadata.labels.transport_address",
				"size":  top,
			},
			"aggs": util.MapStr{
				"dates": util.MapStr{
					"date_histogram": util.MapStr{
						"field":       "timestamp",
						intervalField: bucketSizeStr,
					},
					"aggs": aggs,
				},
			},
		},
	}
	return h.getMetrics(ctx, query, nodeMetricItems, bucketSize)

}

func (h *APIHandler) getTopNodeName(clusterID string, top int, lastMinutes int) ([]string, error) {
	ver := h.Client().GetVersion()
	cr, _ := util.VersionCompare(ver.Number, "6.1")
	if (ver.Distribution == "" || ver.Distribution == elastic.Elasticsearch) && cr == -1 {
		return nil, nil
	}
	var (
		now           = time.Now()
		max           = now.UnixNano() / 1e6
		min           = now.Add(-time.Duration(lastMinutes)*time.Minute).UnixNano() / 1e6
		bucketSizeStr = "60s"
	)
	intervalField, err := getDateHistogramIntervalField(global.MustLookupString(elastic.GlobalSystemElasticsearchID), bucketSizeStr)
	if err != nil {
		return nil, err
	}

	query := util.MapStr{
		"size": 0,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
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
								"value": "node_stats",
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
		},
		"aggs": util.MapStr{
			"group_by_index": util.MapStr{
				"terms": util.MapStr{
					"field": "metadata.labels.transport_address",
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
							"field":       "timestamp",
							intervalField: bucketSizeStr,
						},
						"aggs": util.MapStr{
							"search_query_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.node_stats.indices.search.query_total",
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
					"field": "metadata.labels.transport_address",
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
							"field":       "timestamp",
							intervalField: bucketSizeStr,
						},
						"aggs": util.MapStr{
							"index_total": util.MapStr{
								"max": util.MapStr{
									"field": "payload.elasticsearch.node_stats.indices.indexing.index_total",
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
	nodeNames := []string{}
	for i := 0; i < length; i++ {
		nodeNames = append(nodeNames, qpsValues[i].Key)
	}
	return nodeNames, nil
}
