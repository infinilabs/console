import { Tabs } from "antd";
import { formatMessage } from "umi/locale";
import { useMemo, useState } from "react";
import NodeMetric from "../../components/node_metric";
import IndexMetric from "../../components/index_metric";
import ClusterMetric from "../../components/cluster_metric";
import QueueMetric from "../../components/queue_metric";
import { ESPrefix } from "@/services/common";
import { SearchEngines } from "@/lib/search_engines";

export const shouldHaveModelInferenceBreaker = (cluster) => {
  if ([SearchEngines.Easysearch, SearchEngines.Opensearch].includes(cluster?.distribution)) return false;
  const versions = cluster?.version?.split('.') || []
  if (parseInt(versions[0]) > 8 || (parseInt(versions[0]) === 8 && parseInt(versions[1]) >= 6 )) {
    return true
  }
  return false
}

export const isVersionGTE6 = (cluster) => {
  if ([SearchEngines.Easysearch, SearchEngines.Opensearch].includes(cluster?.distribution)) return true;
  const main = cluster?.version?.split('.')[0]
  if (main && parseInt(main) >= 6) {
    return true
  }
  return false
}

export default ({
  selectedCluster,
  clusterID,
  timeRange,
  handleTimeChange,
  timezone,
  bucketSize,
  timeout,
  refresh,
}) => {

  const tabProps = {
    clusterID,
    timeRange,
    handleTimeChange,
    timezone,
    bucketSize,
    timeout,
    refresh
  }

  const isVersionGTE8_6 = useMemo(() => {
    return shouldHaveModelInferenceBreaker(selectedCluster)
  }, [selectedCluster])

  const versionGTE6 = useMemo(() => {
    return isVersionGTE6(selectedCluster)
  }, [selectedCluster]) 

  const [param, setParam] = useState({
    tab: "cluster",
  });
  return (
    <Tabs
      type="card"
      tabBarGutter={10}
      tabPosition="right"
      destroyInactiveTabPane
      animated={false}
      activeKey={
        ["cluster", "node", "index", "queue"].includes(param?.tab)
          ? param?.tab
          : "cluster"
      }
      onChange={(key) => {
        setParam({
          tab: key,
        });
      }}
    >
      <Tabs.TabPane
        key="cluster"
        tab={formatMessage({
          id: "cluster.monitor.cluster.title",
        })}
      >
        <ClusterMetric
          {...tabProps}
          fetchUrl={`${ESPrefix}/${clusterID}/cluster_metrics`}
          metrics={[
            'cluster_health',
            'index_throughput', 
            'search_throughput', 
            'index_latency', 
            'search_latency',
            'cluster_documents',
            'node_count',
            'cluster_indices',
            'circuit_breaker',
            'shard_count',
            'cluster_storage'
          ]}
        />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="node"
        tab={formatMessage({
          id: "cluster.monitor.node.title",
        })}
      >
        <NodeMetric
          {...tabProps}
          param={param}
          setParam={setParam}
          metrics={[
              [
                  "operations",
                  [
                      "indexing_rate",
                      "indexing_bytes",
                      "query_rate",
                      "fetch_rate",
                      "scroll_rate",
                      "refresh_rate",
                      "flush_rate",
                      "merges_rate",
                      "scroll_open_contexts"
                  ]
              ],
              [
                  "latency",
                  [
                      "indexing_latency",
                      "query_latency",
                      "fetch_latency",
                      "scroll_latency",
                      "refresh_latency",
                      "flush_latency",
                      "merge_latency"
                  ]
              ],
              [
                  "system",
                  [
                      "cpu",
                      "disk",
                      "open_file",
                      "open_file_percent",
                      "os_cpu",
                      "os_load_average_1m",
                      "os_used_mem",
                      "os_used_swap"
                  ]
              ],
              [
                  "circuit_breaker",
                  [
                      "parent_breaker",
                      "accounting_breaker",
                      "fielddata_breaker",
                      "request_breaker",
                      "in_flight_requests_breaker",
                      isVersionGTE8_6 ? "model_inference_breaker" : undefined
                  ].filter((item) => !!item)
              ],
              [
                  "io",
                  [
                      "total_io_operations",
                      "total_read_io_operations",
                      "total_write_io_operations"
                  ]
              ],
              [
                  "transport",
                  [
                      "transport_rx_bytes",
                      "transport_rx_rate",
                      "transport_tx_bytes",
                      "transport_tx_rate",
                      "transport_outbound_connections"
                  ]
              ],
              [
                  "storage",
                  [
                      "segment_count",
                      "index_storage"
                  ]
              ],
              [
                  "document",
                  [
                      "docs_count",
                      "docs_deleted"
                  ]
              ],
              [
                  "http",
                  [
                      "http_connect_num",
                      "http_rate"
                  ]
              ],
              [
                  "JVM",
                  [
                      "jvm_heap_used_percent",
                      "jvm_used_heap",
                      "jvm_mem_young_peak_used",
                      "jvm_mem_young_used",
                      "jvm_young_gc_latency",
                      "jvm_young_gc_rate",
                      "jvm_mem_old_peak_used",
                      "jvm_mem_old_used",
                      "jvm_old_gc_latency",
                      "jvm_old_gc_rate"
                  ]
              ],
              [
                  "memory",
                  [
                      "segment_doc_values_memory",
                      "segment_index_writer_memory",
                      "segment_memory",
                      "segment_stored_fields_memory",
                      "segment_term_vectors_memory",
                      "segment_terms_memory"
                  ]
              ],
              [
                  "cache",
                  [
                      "query_cache",
                      "request_cache",
                      "fielddata_cache",
                      "query_cache_count",
                      "query_cache_hit",
                      "request_cache_hit",
                      "query_cache_miss",
                      "request_cache_miss"
                  ]
              ]
          ].filter((item) => !!item && !!item[1])}
        />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="index"
        tab={formatMessage({
          id: "cluster.monitor.index.title",
        })}
      >
        <IndexMetric
          {...tabProps}
          param={param}
          setParam={setParam}
          metrics={[
            [
                "operations",
                [
                    "indexing_rate",
                    "indexing_bytes",
                    "query_times",
                    "fetch_times",
                    "scroll_times",
                    "refresh_times",
                    "flush_times",
                    "merge_times"
                ]
            ],
            [
                "latency",
                [
                    "indexing_latency",
                    "query_latency",
                    "fetch_latency",
                    "scroll_latency",
                    "refresh_latency",
                    "flush_latency",
                    "merge_latency"
                ]
            ],
            [
                "storage",
                [
                    "index_storage",
                    "segment_count"
                ]
            ],
            [
                "document",
                [
                    "doc_count",
                    "docs_deleted",
                    "doc_percent"
                ]
            ],
            [
                "memory",
                [
                    "segment_doc_values_memory",
                    "segment_fields_memory",
                    "segment_memory",
                    "segment_terms_memory",
                    "segment_index_writer_memory",
                    "segment_term_vectors_memory"
                ]
            ],
            [
                "cache",
                [
                    "query_cache",
                    "request_cache",
                    "fielddata_cache",
                    "query_cache_count",
                    "query_cache_hit",
                    "request_cache_hit",
                    "query_cache_miss",
                    "request_cache_miss"
                ]
            ]
          ]}
        />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="queue"
        tab={formatMessage({
          id: "cluster.monitor.queue.title",
        })}
      >
        <QueueMetric
          {...tabProps}
          param={param}
          setParam={setParam}
          metrics={[
            versionGTE6 ? [
                "thread_pool_write",
                [
                    "write_active",
                    "write_queue",
                    "write_rejected",
                    "write_threads"
                ]
            ] : [
                "thread_pool_index",
                [
                  "index_active",
                  "index_queue",
                  "index_rejected",
                  "index_threads",
                ]
            ], 
            [
                "thread_pool_search",
                [
                    "search_active",
                    "search_queue",
                    "search_rejected",
                    "search_threads"
                ]
            ],
            !versionGTE6 ? [
                "thread_pool_bulk",
                [
                  "bulk_active",
                  "bulk_queue",
                  "bulk_rejected",
                  "bulk_threads",
                ]
            ] : undefined,
            [
                "thread_pool_get",
                [
                    "get_active",
                    "get_queue",
                    "get_rejected",
                    "get_threads"
                ]
            ],
            [
                "thread_pool_flush",
                [
                    "flush_active",
                    "flush_queue",
                    "flush_rejected",
                    "flush_threads"
                ]
            ],
            [
                "thread_pool_refresh",
                [
                    "refresh_active",
                    "refresh_queue",
                    "refresh_rejected",
                    "refresh_threads"
                ]
            ],
            [
                "thread_pool_force_merge",
                [
                    "force_merge_active",
                    "force_merge_queue",
                    "force_merge_rejected",
                    "force_merge_threads"
                ]
            ]
        ].filter((item) => !!item && !!item[1])}
        />
      </Tabs.TabPane>
    </Tabs>
  );
}
