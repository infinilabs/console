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
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/adapter"
	"infini.sh/framework/modules/elastic/common"
	"strings"
)

const (
	ThreadPoolGetGroupKey    = "thread_pool_get"
	ThreadPoolSearchGroupKey   = "thread_pool_search"
	ThreadPoolFlushGroupKey   = "thread_pool_flush"
	ThreadPoolRefreshGroupKey     = "thread_pool_refresh"
	ThreadPoolWriteGroupKey      = "thread_pool_write"
	ThreadPoolForceMergeGroupKey = "thread_pool_force_merge"
	ThreadPoolIndexGroupKey = "thread_pool_index"
	ThreadPoolBulkGroupKey  = "thread_pool_bulk"
)

const (
	SearchThreadsMetricKey = "search_threads"
	IndexThreadsMetricKey  = "index_threads"
	BulkThreadsMetricKey  = "bulk_threads"
	FlushThreadsMetricKey = "flush_threads"
	RefreshThreadsMetricKey  = "refresh_threads"
	WriteThreadsMetricKey = "write_threads"
	ForceMergeThreadsMetricKey = "force_merge_threads"
	SearchQueueMetricKey = "search_queue"
	IndexQueueMetricKey  = "index_queue"
	BulkQueueMetricKey  = "bulk_queue"
	FlushQueueMetricKey = "flush_queue"
	RefreshQueueMetricKey  = "refresh_queue"
	WriteQueueMetricKey = "write_queue"
	SearchActiveMetricKey = "search_active"
	IndexActiveMetricKey  = "index_active"
	BulkActiveMetricKey  = "bulk_active"
	FlushActiveMetricKey = "flush_active"
	WriteActiveMetricKey = "write_active"
	ForceMergeActiveMetricKey = "force_merge_active"
	SearchRejectedMetricKey = "search_rejected"
	IndexRejectedMetricKey  = "index_rejected"
	BulkRejectedMetricKey  = "bulk_rejected"
	FlushRejectedMetricKey = "flush_rejected"
	WriteRejectedMetricKey = "write_rejected"
	ForceMergeRejectedMetricKey = "force_merge_rejected"
	GetThreadsMetricKey = "get_threads"
	GetQueueMetricKey = "get_queue"
	GetActiveMetricKey = "get_active"
	GetRejectedMetricKey = "get_rejected"
	RefreshActiveMetricKey = "refresh_active"
	RefreshRejectedMetricKey = "refresh_rejected"
	ForceMergeQueueMetricKey = "force_merge_queue"
)

func (h *APIHandler) getThreadPoolMetrics(clusterID string, bucketSize int, min, max int64, nodeName string, top int, metricKey string) (map[string]*common.MetricItem, error){
	clusterUUID, err := adapter.GetClusterUUID(clusterID)
	if err != nil {
		return nil, err
	}
	bucketSizeStr:=fmt.Sprintf("%vs",bucketSize)
	var must = []util.MapStr{
		{
			"term":util.MapStr{
				"metadata.labels.cluster_uuid":util.MapStr{
					"value": clusterUUID,
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
	}else{
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

	query:=map[string]interface{}{}
	query["query"]=util.MapStr{
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
	queueMetricItems := []GroupMetricItem{}
	switch metricKey {
	case SearchThreadsMetricKey:
		searchThreadsMetric := newMetricItem(SearchThreadsMetricKey, 1, ThreadPoolSearchGroupKey)
		searchThreadsMetric.AddAxi("Search Threads Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)
		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "search_threads",
			Field: "payload.elasticsearch.node_stats.thread_pool.search.threads",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: searchThreadsMetric,
			FormatType: "num",
			Units: "",
		})
	case SearchQueueMetricKey:
		searchQueueMetric := newMetricItem(SearchQueueMetricKey, 1, ThreadPoolSearchGroupKey)
		searchQueueMetric.AddAxi("Search Queue Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "search_queue",
			Field: "payload.elasticsearch.node_stats.thread_pool.search.queue",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: searchQueueMetric,
			FormatType: "num",
			Units: "",
		})
	case SearchActiveMetricKey:
		searchActiveMetric := newMetricItem(SearchActiveMetricKey, 1, ThreadPoolSearchGroupKey)
		searchActiveMetric.AddAxi("Search Active Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "search_active",
			Field: "payload.elasticsearch.node_stats.thread_pool.search.active",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: searchActiveMetric,
			FormatType: "num",
			Units: "",
		})
	case SearchRejectedMetricKey:
		searchRejectedMetric := newMetricItem(SearchRejectedMetricKey, 1, ThreadPoolSearchGroupKey)
		searchRejectedMetric.AddAxi("Search Rejected Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "search_rejected",
			Field: "payload.elasticsearch.node_stats.thread_pool.search.rejected",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: searchRejectedMetric,
			FormatType: "num",
			Units: "rejected/s",
		})
	case GetThreadsMetricKey:
		getThreadsMetric := newMetricItem(GetThreadsMetricKey, 1, ThreadPoolGetGroupKey)
		getThreadsMetric.AddAxi("Get Threads Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "get_threads",
			Field: "payload.elasticsearch.node_stats.thread_pool.get.threads",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: getThreadsMetric,
			FormatType: "num",
			Units: "",
		})
	case GetQueueMetricKey:
		getQueueMetric := newMetricItem(GetQueueMetricKey, 1, ThreadPoolGetGroupKey)
		getQueueMetric.AddAxi("Get Queue Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "get_queue",
			Field: "payload.elasticsearch.node_stats.thread_pool.get.queue",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: getQueueMetric,
			FormatType: "num",
			Units: "",
		})
	case GetActiveMetricKey:
		getActiveMetric := newMetricItem(GetActiveMetricKey, 1, ThreadPoolGetGroupKey)
		getActiveMetric.AddAxi("Get Active Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "get_active",
			Field: "payload.elasticsearch.node_stats.thread_pool.get.active",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: getActiveMetric,
			FormatType: "num",
			Units: "",
		})
	case GetRejectedMetricKey:
		getRejectedMetric := newMetricItem(GetRejectedMetricKey, 1, ThreadPoolGetGroupKey)
		getRejectedMetric.AddAxi("Get Rejected Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "get_rejected",
			Field: "payload.elasticsearch.node_stats.thread_pool.get.rejected",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: getRejectedMetric,
			FormatType: "num",
			Units: "rejected/s",
		})
	case FlushThreadsMetricKey:
		flushThreadsMetric := newMetricItem(FlushThreadsMetricKey, 1, ThreadPoolFlushGroupKey)
		flushThreadsMetric.AddAxi("Flush Threads Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "flush_threads",
			Field: "payload.elasticsearch.node_stats.thread_pool.flush.threads",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: flushThreadsMetric,
			FormatType: "num",
			Units: "",
		})
	case FlushQueueMetricKey:
		flushQueueMetric := newMetricItem(FlushQueueMetricKey, 1, ThreadPoolFlushGroupKey)
		flushQueueMetric.AddAxi("Get Queue Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "flush_queue",
			Field: "payload.elasticsearch.node_stats.thread_pool.flush.queue",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: flushQueueMetric,
			FormatType: "num",
			Units: "",
		})
	case FlushActiveMetricKey:
		flushActiveMetric := newMetricItem(FlushActiveMetricKey, 1, ThreadPoolFlushGroupKey)
		flushActiveMetric.AddAxi("Flush Active Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "flush_active",
			Field: "payload.elasticsearch.node_stats.thread_pool.flush.active",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: flushActiveMetric,
			FormatType: "num",
			Units: "",
		})

	case FlushRejectedMetricKey:
		flushRejectedMetric := newMetricItem(FlushRejectedMetricKey, 1, ThreadPoolFlushGroupKey)
		flushRejectedMetric.AddAxi("Flush Rejected Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "flush_rejected",
			Field: "payload.elasticsearch.node_stats.thread_pool.flush.rejected",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: flushRejectedMetric,
			FormatType: "num",
			Units: "rejected/s",
		})
	case IndexThreadsMetricKey:
		indexThreadsMetric := newMetricItem(IndexThreadsMetricKey, 1, ThreadPoolIndexGroupKey)
		indexThreadsMetric.AddAxi("Index Threads Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "index_threads",
			Field:        "payload.elasticsearch.node_stats.thread_pool.index.threads",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   indexThreadsMetric,
			FormatType:   "num",
			Units:        "",
		})
	case IndexQueueMetricKey:
		indexQueueMetric := newMetricItem(IndexQueueMetricKey, 1, ThreadPoolIndexGroupKey)
		indexQueueMetric.AddAxi("Index Queue Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "index_queue",
			Field:        "payload.elasticsearch.node_stats.thread_pool.index.queue",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   indexQueueMetric,
			FormatType:   "num",
			Units:        "",
		})
	case IndexActiveMetricKey:
		indexActiveMetric := newMetricItem(IndexActiveMetricKey, 1, ThreadPoolIndexGroupKey)
		indexActiveMetric.AddAxi("Index Active Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "index_active",
			Field:        "payload.elasticsearch.node_stats.thread_pool.index.active",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   indexActiveMetric,
			FormatType:   "num",
			Units:        "",
		})
	case IndexRejectedMetricKey:
		indexRejectedMetric := newMetricItem(IndexRejectedMetricKey, 1, ThreadPoolIndexGroupKey)
		indexRejectedMetric.AddAxi("Index Rejected Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "index_rejected",
			Field:        "payload.elasticsearch.node_stats.thread_pool.index.rejected",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   indexRejectedMetric,
			FormatType:   "num",
			Units:        "rejected/s",
		})
	case BulkThreadsMetricKey:
		bulkThreadsMetric := newMetricItem(BulkThreadsMetricKey, 1, ThreadPoolBulkGroupKey)
		bulkThreadsMetric.AddAxi("Bulk Threads Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "bulk_threads",
			Field:        "payload.elasticsearch.node_stats.thread_pool.bulk.threads",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   bulkThreadsMetric,
			FormatType:   "num",
			Units:        "",
		})
	case BulkQueueMetricKey:
		bulkQueueMetric := newMetricItem(BulkQueueMetricKey, 1, ThreadPoolBulkGroupKey)
		bulkQueueMetric.AddAxi("Bulk Queue Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "bulk_queue",
			Field:        "payload.elasticsearch.node_stats.thread_pool.bulk.queue",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   bulkQueueMetric,
			FormatType:   "num",
			Units:        "",
		})
	case BulkActiveMetricKey:
		bulkActiveMetric := newMetricItem(BulkActiveMetricKey, 1, ThreadPoolBulkGroupKey)
		bulkActiveMetric.AddAxi("Bulk Active Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "bulk_active",
			Field:        "payload.elasticsearch.node_stats.thread_pool.bulk.active",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   bulkActiveMetric,
			FormatType:   "num",
			Units:        "",
		})
	case BulkRejectedMetricKey:
		bulkRejectedMetric := newMetricItem(BulkRejectedMetricKey, 1, ThreadPoolBulkGroupKey)
		bulkRejectedMetric.AddAxi("Bulk Rejected Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "bulk_rejected",
			Field:        "payload.elasticsearch.node_stats.thread_pool.bulk.rejected",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   bulkRejectedMetric,
			FormatType:   "num",
			Units:        "rejected/s",
		})
	case WriteThreadsMetricKey:
		writeThreadsMetric := newMetricItem(WriteThreadsMetricKey, 1, ThreadPoolWriteGroupKey)
		writeThreadsMetric.AddAxi("Write Threads Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "write_threads",
			Field:        "payload.elasticsearch.node_stats.thread_pool.write.threads",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   writeThreadsMetric,
			FormatType:   "num",
			Units:        "",
		})
	case WriteQueueMetricKey:
		writeQueueMetric := newMetricItem(WriteQueueMetricKey, 1, ThreadPoolWriteGroupKey)
		writeQueueMetric.AddAxi("Write Queue Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "write_queue",
			Field:        "payload.elasticsearch.node_stats.thread_pool.write.queue",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   writeQueueMetric,
			FormatType:   "num",
			Units:        "",
		})
	case WriteActiveMetricKey:
		writeActiveMetric := newMetricItem(WriteActiveMetricKey, 1, ThreadPoolWriteGroupKey)
		writeActiveMetric.AddAxi("Write Active Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "write_active",
			Field:        "payload.elasticsearch.node_stats.thread_pool.write.active",
			ID:           util.GetUUID(),
			IsDerivative: false,
			MetricItem:   writeActiveMetric,
			FormatType:   "num",
			Units:        "",
		})
	case WriteRejectedMetricKey:
		writeRejectedMetric := newMetricItem(WriteRejectedMetricKey, 1, ThreadPoolWriteGroupKey)
		writeRejectedMetric.AddAxi("Write Rejected Count", "group1", common.PositionLeft, "num", "0.[0]", "0.[0]", 5, true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key:          "write_rejected",
			Field:        "payload.elasticsearch.node_stats.thread_pool.write.rejected",
			ID:           util.GetUUID(),
			IsDerivative: true,
			MetricItem:   writeRejectedMetric,
			FormatType:   "num",
			Units:        "rejected/s",
		})
	case RefreshThreadsMetricKey:
		refreshThreadsMetric := newMetricItem(RefreshThreadsMetricKey, 1, ThreadPoolRefreshGroupKey)
		refreshThreadsMetric.AddAxi("Refresh Threads Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "refresh_threads",
			Field: "payload.elasticsearch.node_stats.thread_pool.refresh.threads",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: refreshThreadsMetric,
			FormatType: "num",
			Units: "",
		})
	case RefreshQueueMetricKey:
		refreshQueueMetric := newMetricItem(RefreshQueueMetricKey, 1, ThreadPoolRefreshGroupKey)
		refreshQueueMetric.AddAxi("Refresh Queue Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "refresh_queue",
			Field: "payload.elasticsearch.node_stats.thread_pool.refresh.queue",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: refreshQueueMetric,
			FormatType: "num",
			Units: "",
		})
	case RefreshActiveMetricKey:
		refreshActiveMetric := newMetricItem(RefreshActiveMetricKey, 1, ThreadPoolRefreshGroupKey)
		refreshActiveMetric.AddAxi("Refresh Active Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "refresh_active",
			Field: "payload.elasticsearch.node_stats.thread_pool.refresh.active",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: refreshActiveMetric,
			FormatType: "num",
			Units: "",
		})
	case RefreshRejectedMetricKey:
		refreshRejectedMetric := newMetricItem(RefreshRejectedMetricKey, 1, ThreadPoolRefreshGroupKey)
		refreshRejectedMetric.AddAxi("Refresh Rejected Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "refresh_rejected",
			Field: "payload.elasticsearch.node_stats.thread_pool.refresh.rejected",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: refreshRejectedMetric,
			FormatType: "num",
			Units: "rejected/s",
		})
	case ForceMergeThreadsMetricKey:
		forceMergeThreadsMetric := newMetricItem(ForceMergeThreadsMetricKey, 1, ThreadPoolForceMergeGroupKey)
		forceMergeThreadsMetric.AddAxi("Force Merge Threads Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "force_merge_threads",
			Field: "payload.elasticsearch.node_stats.thread_pool.force_merge.threads",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: forceMergeThreadsMetric,
			FormatType: "num",
			Units: "",
		})
	case ForceMergeQueueMetricKey:
		forceMergeQueueMetric := newMetricItem(ForceMergeQueueMetricKey, 1, ThreadPoolForceMergeGroupKey)
		forceMergeQueueMetric.AddAxi("Force Merge Queue Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "force_merge_queue",
			Field: "payload.elasticsearch.node_stats.thread_pool.force_merge.queue",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: forceMergeQueueMetric,
			FormatType: "num",
			Units: "",
		})
	case ForceMergeActiveMetricKey:
		forceMergeActiveMetric := newMetricItem(ForceMergeActiveMetricKey, 1, ThreadPoolForceMergeGroupKey)
		forceMergeActiveMetric.AddAxi("Force Merge Active Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "force_merge_active",
			Field: "payload.elasticsearch.node_stats.thread_pool.force_merge.active",
			ID: util.GetUUID(),
			IsDerivative: false,
			MetricItem: forceMergeActiveMetric,
			FormatType: "num",
			Units: "",
		})
	case ForceMergeRejectedMetricKey:
		forceMergeRejectedMetric := newMetricItem(ForceMergeRejectedMetricKey, 1, ThreadPoolForceMergeGroupKey)
		forceMergeRejectedMetric.AddAxi("Force Merge Rejected Count","group1",common.PositionLeft,"num","0.[0]","0.[0]",5,true)

		queueMetricItems = append(queueMetricItems, GroupMetricItem{
			Key: "force_merge_rejected",
			Field: "payload.elasticsearch.node_stats.thread_pool.force_merge.rejected",
			ID: util.GetUUID(),
			IsDerivative: true,
			MetricItem: forceMergeRejectedMetric,
			FormatType: "num",
			Units: "rejected/s",
		})
	}


	//Get Thread Pool queue
	aggs:=map[string]interface{}{}

	for _,metricItem:=range queueMetricItems{
		aggs[metricItem.ID]=util.MapStr{
			"max":util.MapStr{
				"field": metricItem.Field,
			},
		}
		if metricItem.Field2 != "" {
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
				aggs[metricItem.ID + "_field2_deriv"]=util.MapStr{
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
				"field": "metadata.labels.transport_address",
				"size":  top,
			},
			"aggs": util.MapStr{
				"dates": util.MapStr{
					"date_histogram":util.MapStr{
						"field": "timestamp",
						intervalField: bucketSizeStr,
					},
					"aggs":aggs,
				},
			},
		},
	}
	return h.getMetrics(query, queueMetricItems, bucketSize), nil
}
