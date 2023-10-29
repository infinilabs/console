
elasticsearch:
  - id: $[[CLUSTER_ID]]
    name: $[[CLUSTER_ID]]
    version: $[[CLUSTER_VER]]
    distribution: $[[CLUSTER_DISTRIBUTION]]
    enabled: true
    monitored: true
    reserved: true
    endpoint: $[[CLUSTER_ENDPOINT]]
    discovery:
      enabled: false
    basic_auth:
      username: $[[CLUSTER_USER]]
      password: $[[keystore.SYSTEM_CLUSTER_PASS]]

elastic.elasticsearch: $[[CLUSTER_ID]]

pipeline:
  - name: merge_metrics
    auto_start: true
    keep_running: true
    processor:
      - indexing_merge:
          input_queue: "metrics"
          elasticsearch: "$[[CLUSTER_ID]]"
          index_name: "$[[INDEX_PREFIX]]metrics"
          output_queue:
            name: "metrics_requests"
            label:
              tag: "metrics"
          worker_size: 1
          bulk_size_in_mb: 5

  - name: metadata_ingest
    auto_start: true
    keep_running: true
    processor:
      - consumer:
          queues:
            type: metadata
            category: elasticsearch
          consumer:
            group: metadata
          when:
            cluster_available: ["$[[CLUSTER_ID]]"]
          processor:
          - metadata:
              elasticsearch: "$[[CLUSTER_ID]]"

  - name: activity_ingest
    auto_start: true
    keep_running: true
    processor:
      - consumer:
          queues:
            category: elasticsearch
            activity: true
          consumer:
            group: activity
          when:
            cluster_available: ["$[[CLUSTER_ID]]"]
          processor:
          - activity:
              elasticsearch: "$[[CLUSTER_ID]]"
  - name: migration_task_dispatcher
    auto_start: true
    keep_running: true
    retry_delay_in_ms: 1000
    processor:
      - migration_dispatcher:
          elasticsearch: "$[[CLUSTER_ID]]"
          check_instance_available: true
          max_tasks_per_instance: 10
          task_batch_size: 50
          when:
            cluster_available: ["$[[CLUSTER_ID]]"]

  - name: merge_logging
    auto_start: true
    keep_running: true
    processor:
      - indexing_merge:
          input_queue: "logging"
          idle_timeout_in_seconds: 1
          elasticsearch: "$[[CLUSTER_ID]]"
          index_name: "$[[INDEX_PREFIX]]logs"
          output_queue:
            name: "pipeline-logs"
            label:
              tag: "request_logging"
          worker_size: 1
          bulk_size_in_kb: 1

  - name: ingest_merged_requests
    auto_start: true
    keep_running: true
    retry_delay_in_ms: 5000
    max_running_in_ms: 30000
    processor:
      - bulk_indexing:
          idle_timeout_in_seconds: 5
          bulk:
            compress: true
            batch_size_in_mb: 10
            batch_size_in_docs: 1000
          consumer:
            fetch_max_messages: 100
          queues:
            type: indexing_merge
          when:
            cluster_available: ["$[[CLUSTER_ID]]"]