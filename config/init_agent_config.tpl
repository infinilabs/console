#agent

POST .infini_configs/_doc/task_config_tpl
{
  "id": "task_config_tpl",
  "updated": "2023-10-19T14:49:56.768754+08:00",
  "metadata": {
    "category": "app_settings",
    "name": "agent",
    "labels": {
      "instance": "_all"
    }
  },
  "payload": {
    "name": "task_config.tpl",
    "location": "task_config.tpl",
    "content": """env:
   CLUSTER_PASSWORD: $[[keystore.$[[CLUSTER_ID]]_password]]

elasticsearch:
  - id: $[[TASK_ID]]
    name: $[[TASK_ID]]
    cluster_uuid: $[[CLUSTER_UUID]]
    enabled: true
    endpoints: $[[CLUSTER_ENDPOINT]]
    discovery:
      enabled: false
    basic_auth:
      username: $[[CLUSTER_USERNAME]]
      password: $[[CLUSTER_PASSWORD]]
    traffic_control:
      enabled: true
      max_qps_per_node: 100
      max_bytes_per_node: 10485760
      max_connection_per_node: 5

pipeline:

#node level metrics
- auto_start: $[[NODE_LEVEL_TASKS_ENABLED]]
  enabled: $[[NODE_LEVEL_TASKS_ENABLED]]
  keep_running: true
  name: collect_$[[TASK_ID]]_es_node_stats
  retry_delay_in_ms: 10000
  processor:
  - es_node_stats:
      elasticsearch: $[[TASK_ID]]
      labels:
        cluster_id: $[[CLUSTER_ID]]
      when:
        cluster_available: ["$[[TASK_ID]]"]

#node logs
- auto_start: $[[NODE_LEVEL_TASKS_ENABLED]]
  enabled: $[[NODE_LEVEL_TASKS_ENABLED]]
  keep_running: true
  name: collect_$[[TASK_ID]]_es_logs
  retry_delay_in_ms: 10000
  processor:
  - es_logs_processor:
      elasticsearch: $[[TASK_ID]]
      labels:
        cluster_id: $[[CLUSTER_ID]]
      logs_path: $[[NODE_LOGS_PATH]]
      queue_name: logs
      when:
        cluster_available: ["$[[TASK_ID]]"]
""",
    "version": 1
  }
}

#system ingest template
POST .infini_configs/_doc/ingest_config_tpl
{
  "id": "ingest_config_tpl",
  "updated": "2023-10-19T14:49:56.768754+08:00",
  "metadata": {
    "category": "app_settings",
    "name": "agent",
    "labels": {
      "instance": "_all"
    }
  },
  "payload": {
    "name": "ingest_config.tpl",
    "location": "ingest_config.tpl",
    "content": """elasticsearch:
  - name: $[[INGEST_CLUSTER_ID]]
    enabled: true
    endpoints: $[[INGEST_CLUSTER_ENDPOINT]]
    discovery:
      enabled: false
    basic_auth:
      username: $[[INGEST_CLUSTER_USERNAME]]
      password: $[[INGEST_CLUSTER_PASSWORD]]
    traffic_control:
      enabled: true
      max_qps_per_node: 1000
      max_bytes_per_node: 10485760
      max_connection_per_node: 10

metrics:
  enabled: true
  queue: metrics
  network:
    enabled: true
    summary: true
    sockets: true
    throughput: true
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
""",
    "version": 1
  }
}


#TODO, need to replace cleartext password to keystore, and ingest endpoint
POST .infini_configs/_doc/system_ingest_config_yml
{
  "id": "system_ingest_config_yml",
  "updated": "2023-10-18T14:49:56.768754+08:00",
  "metadata": {
    "category": "app_settings",
    "name": "agent",
    "labels": {
      "instance": "_all"
    }
  },
  "payload": {
    "name": "system_ingest_config.yml",
    "location": "system_ingest_config.yml",
    "content": """configs.template:
  - name: "default_ingest_config"
    path: ./config/ingest_config.tpl
    variable:
      INGEST_CLUSTER_ID: infini_default_ingest_cluster
      INGEST_CLUSTER_ENDPOINT: [ "http://10.0.0.3:7102" ]
      INGEST_CLUSTER_USERNAME: "admin"
      INGEST_CLUSTER_PASSWORD: "admin"
      CLUSTER_VER: "1.6.0"
      CLUSTER_DISTRIBUTION: "easysearch"
      INDEX_PREFIX: ".infini_"

""",
    "version": 3
  }
}

