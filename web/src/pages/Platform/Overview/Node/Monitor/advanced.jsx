import { useState,useEffect, useMemo } from "react";
import { Tabs } from "antd";
import NodeMetric from "../../components/node_metric";
import QueueMetric from "../../components/queue_metric";
import { formatMessage } from "umi/locale";
import { SearchEngines } from "@/lib/search_engines";

const timezone = "local";

export default ({
  selectedCluster,
  clusterID,
  nodeID,
  timeRange,
  handleTimeChange,
  bucketSize,
  timeout,
}) => {

  const isVersionGTE6 = useMemo(() => {
    if ([SearchEngines.Easysearch, SearchEngines.Opensearch].includes(selectedCluster?.distribution)) return true;
    const main = selectedCluster?.version?.split('.')[0]
    if (main && parseInt(main) >= 6) {
      return true
    }
    return false
  }, [selectedCluster])

  const [param, setParam] = useState({
    show_top: false,
    node_name: nodeID,
    tab: "node",
  });
  return (
    <Tabs
      type="card"
      tabBarGutter={10}
      tabPosition="right"
      destroyInactiveTabPane
      animated={false}
      activeKey={
        ["node", "queue"].includes(param?.tab)
          ? param?.tab
          : "node"
      }
      onChange={(key) => {
        setParam((st)=>{
          return {
            ...st,
            tab: key,
          }
        });
      }}
    >
      <Tabs.TabPane
        key="node"
        tab={formatMessage({
          id: "cluster.monitor.node.title",
        })}
      >
        <NodeMetric
          clusterID={clusterID}
          timezone={timezone}
          timeRange={timeRange}
          handleTimeChange={handleTimeChange}
          param={param}
          setParam={setParam}
          bucketSize={bucketSize}
          timeout={timeout}
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
                    "model_inference_breaker"
                ]
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
          clusterID={clusterID}
          timezone={timezone}
          timeRange={timeRange}
          handleTimeChange={handleTimeChange}
          param={param}
          setParam={setParam}
          bucketSize={bucketSize}
          timeout={timeout}
          metrics={[
            isVersionGTE6 ? [
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
            !isVersionGTE6 ? [
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
        ].filter((item) => !!item)}
        />
      </Tabs.TabPane>
    </Tabs>
  );
}