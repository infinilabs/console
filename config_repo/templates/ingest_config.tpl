elasticsearch:
  - name: $[[INGEST_CLUSTER_ID]]
    enabled: true
    endpoints: $[[INGEST_CLUSTER_ENDPOINT]]
    discovery:
      enabled: false
    basic_auth:
      username: $[[INGEST_CLUSTER_USERNAME]]
      password: $[[keystore.ingest_cluster_password]]

metrics:
  enabled: true
  queue: metrics
  network:
    enabled: true
    summary: true
    details: true
  memory:
    metrics:
      - swap
      - memory
  disk:
    metrics:
      - iops
      - usage
  cpu:
    metrics:
      - idle
      - system
      - user
      - iowait
      - load
  instance:
    enabled: true

elastic:
  availability_check:
    enabled: false

pipeline:
  - name: merge_logs
    auto_start: true
    keep_running: true
    processor:
      - indexing_merge:
          elasticsearch: "$[[INGEST_CLUSTER_ID]]"
          index_name: ".infini_logs"
          type_name: "_doc"
          input_queue: "logs"
          idle_timeout_in_seconds: 10
          output_queue:
            name: "merged_requests"
          worker_size: 1
          bulk_size_in_mb: 5
  - name: merge_metrics
    auto_start: true
    keep_running: true
    processor:
      - indexing_merge:
          elasticsearch: "$[[INGEST_CLUSTER_ID]]"
          index_name: ".infini_metrics"
          type_name: "_doc"
          input_queue: "metrics"
          output_queue:
            name: "merged_requests"
          worker_size: 1
          bulk_size_in_mb: 5
  - name: ingest_merged_requests
    enabled: true
    auto_start: true
    keep_running: true
    processor:
      - bulk_indexing:
          max_worker_size: 1
          verbose_bulk_result: false
          bulk:
            batch_size_in_mb: 5
            batch_size_in_docs: 5000
            max_retry_times: 0
            invalid_queue: ""
            response_handle:
              include_index_stats: false
              include_action_stats: false
              output_bulk_stats: false
              include_error_details: true
              save_error_results: true
              save_success_results: false
              save_busy_results: false
          consumer:
            fetch_max_messages: 5
          queues:
            type: indexing_merge
          when:
            cluster_available: ["$[[INGEST_CLUSTER_ID]]"]

#MANAGED_CONFIG_VERSION: 16
#MANAGED: true