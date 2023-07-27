
elasticsearch:
  - id: $[[CLUSTER_ID]]
    name: $[[CLUSTER_ID]]
    version: $[[CLUSTER_VER]]
    distribution: $[[CLUSTER_DISTRIBUTION]]
    enabled: true
    monitored: true
    reserved: true
    endpoint: $[[CLUSTER_ENDPINT]]
    discovery:
      enabled: false
    basic_auth:
      username: $[[CLUSTER_USER]]
      password: $[[keystore.SYSTEM_CLUSTER_PASS]]

elastic.elasticsearch: $[[CLUSTER_ID]]

pipeline:
  - name: indexing_merge
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
  - name: consume-metrics_requests
    auto_start: true
    keep_running: true
    processor:
      - bulk_indexing:
          bulk:
            compress: true
            batch_size_in_mb: 5
            batch_size_in_docs: 5000
          consumer:
            fetch_max_messages: 100
          queues:
            type: indexing_merge
            tag: "metrics"
          when:
            cluster_available: ["$[[CLUSTER_ID]]"]
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

  - name: logging_indexing_merge
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
  - name: consume-logging_requests
    auto_start: true
    keep_running: true
    processor:
      - bulk_indexing:
          bulk:
            compress: true
            batch_size_in_mb: 1
            batch_size_in_docs: 1
          consumer:
            fetch_max_messages: 100
          queues:
            type: indexing_merge
            tag: "request_logging"
          when:
            cluster_available: ["$[[CLUSTER_ID]]"]