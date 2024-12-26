import { useState,useEffect, useMemo } from "react";
import { Tabs } from "antd";
import NodeMetric from "../../components/node_metric";
import QueueMetric from "../../components/queue_metric";
import { formatMessage } from "umi/locale";
import { SearchEngines } from "@/lib/search_engines";
import { checkMetric } from "../../Cluster/Monitor/advanced";

export default (props) => {

  const {
    selectedCluster,
    clusterID,
    nodeID,
  } = props

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
          {...props}
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
                    checkMetric("model_inference_breaker", selectedCluster) ? "model_inference_breaker" : undefined
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
                    checkMetric("transport_outbound_connections", selectedCluster) ? "transport_outbound_connections" : undefined
                ].filter((item) => !!item)
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
        key="queue"
        tab={formatMessage({
          id: "cluster.monitor.queue.title",
        })}
      >
        <QueueMetric
          {...props}
          param={param}
          setParam={setParam}
          metrics={[
            checkMetric("thread_pool_write", selectedCluster) ? [
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
            checkMetric("thread_pool_bulk", selectedCluster) ? [
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