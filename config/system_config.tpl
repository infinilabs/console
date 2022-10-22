
elasticsearch:
  - id: $[[CLUSTER_ID]]
    name: $[[CLUSTER_ID]]
    enabled: true
    monitored: false
    reserved: true
    endpoint: $[[CLUSTER_ENDPINT]]
    basic_auth:
      username: $[[CLUSTER_USER]]
      password: $[[CLUSTER_PASS]]

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
          when:
            cluster_available: ["$[[CLUSTER_ID]]"]
  - name: metadata_ingest
    auto_start: true
    keep_running: true
    processor:
      - metadata:
          bulk_size_in_mb: 5
          bulk_max_docs_count: 5000
          fetch_max_messages: 100
          elasticsearch: "$[[CLUSTER_ID]]"
          queues:
            type: metadata
            category: elasticsearch
          consumer:
            group: metadata
          when:
            cluster_available: ["$[[CLUSTER_ID]]"]
  - name: activity_ingest
    auto_start: true
    keep_running: true
    processor:
      - activity:
          bulk_size_in_mb: 5
          bulk_max_docs_count: 5000
          fetch_max_messages: 100
          elasticsearch: "$[[CLUSTER_ID]]"
          queues:
            category: elasticsearch
            activity: true
          consumer:
            group: activity
          when:
            cluster_available: ["$[[CLUSTER_ID]]"]
