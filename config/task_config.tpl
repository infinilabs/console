elasticsearch:
  - id: $[[CLUSTER_ID]]
    name: $[[CLUSTER_ID]]
    enabled: true
    endpoint: $[[CLUSTER_ENDPOINT]]
    discovery:
      enabled: false
    basic_auth:
      username: $[[CLUSTER_USERNAME]]
      password: $[[keystore.$[[CLUSTER_ID]]_password]]

pipeline:
#clsuter level metrics
- auto_start: $[[CLUSTER_LEVEL_TASKS_ENABLED]]
  enabled: $[[CLUSTER_LEVEL_TASKS_ENABLED]]
  keep_running: true
  singleton: true
  name: collect_$[[CLUSTER_ID]]_es_cluster_stats
  retry_delay_in_ms: 10000
  processor:
  - es_cluster_stats:
      elasticsearch: $[[CLUSTER_ID]]
      labels:
        cluster_id: $[[CLUSTER_ID]]
      when:
        cluster_available: ["$[[CLUSTER_ID]]"]

- auto_start: $[[CLUSTER_LEVEL_TASKS_ENABLED]]
  enabled: $[[CLUSTER_LEVEL_TASKS_ENABLED]]
  keep_running: true
  singleton: true
  name: collect_$[[CLUSTER_ID]]_es_index_stats
  retry_delay_in_ms: 10000
  processor:
  - es_index_stats:
      elasticsearch: $[[CLUSTER_ID]]
      labels:
        cluster_id: $[[CLUSTER_ID]]
      when:
        cluster_available: ["$[[CLUSTER_ID]]"]

- auto_start: $[[CLUSTER_LEVEL_TASKS_ENABLED]]
  enabled: $[[CLUSTER_LEVEL_TASKS_ENABLED]]
  keep_running: true
  singleton: true
  name: collect_$[[CLUSTER_ID]]_es_cluster_health
  retry_delay_in_ms: 10000
  processor:
  - es_cluster_health:
      elasticsearch: $[[CLUSTER_ID]]
      labels:
        cluster_id: $[[CLUSTER_ID]]
      when:
        cluster_available: ["$[[CLUSTER_ID]]"]

#node level metrics
- auto_start: $[[NODE_LEVEL_TASKS_ENABLED]]
  enabled: $[[NODE_LEVEL_TASKS_ENABLED]]
  keep_running: true
  name: collect_$[[CLUSTER_ID]]_es_node_stats
  retry_delay_in_ms: 10000
  processor:
  - es_node_stats:
      elasticsearch: $[[CLUSTER_ID]]
      labels:
        cluster_id: $[[CLUSTER_ID]]
      when:
        cluster_available: ["$[[CLUSTER_ID]]"]

#node logs
- auto_start: $[[NODE_LEVEL_TASKS_ENABLED]]
  enabled: $[[NODE_LEVEL_TASKS_ENABLED]]
  keep_running: true
  name: collect_$[[CLUSTER_ID]]_es_logs
  retry_delay_in_ms: 10000
  processor:
  - es_logs_processor:
      elasticsearch: $[[CLUSTER_ID]]
      labels:
        cluster_id: $[[CLUSTER_ID]]
      logs_path: $[[NODE_LOGS_PATH]]
      queue_name: logs
      when:
        cluster_available: ["$[[CLUSTER_ID]]"]
