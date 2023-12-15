#agent_config.tpl
#TODO, need to replace cleartext password to keystore, and ingest endpoint
POST $[[SETUP_INDEX_PREFIX]]configs/$[[SETUP_DOC_TYPE]]/system_ingest_config_yml
{
  "payload": {
    "content": "\n\nmetrics:\n  enabled: true\n  queue: metrics\n  network:\n    enabled: true\n    summary: true\n    sockets: true\n    #throughput: true\n    details: true\n  memory:\n    metrics:\n      - swap\n      - memory\n  disk:\n    metrics:\n      - iops\n      - usage\n  cpu:\n    metrics:\n      - idle\n      - system\n      - user\n      - iowait\n      - load\n  instance:\n    enabled: true\n\nelastic:\n  availability_check:\n    enabled: false\n\npipeline:\n  - name: replicate_message_to_gateway\n    enabled: true\n    auto_start: true\n    keep_running: true\n    processor:\n      - consumer:\n          max_worker_size: 3\n          queue_selector:\n            keys:\n              - metrics\n              - logs\n          consumer:\n            group: replication\n          processor:\n            - http:\n                max_sending_qps: 100\n                method: POST\n                path: /$[[queue_name]]/_doc/\n                headers:\n                    Content-Type: application/json\n                body: $[[message]]\n                basic_auth:\n                  username: ingest\n                  password: password\n#                tls: #for mTLS connection with config servers\n#                  enabled: true\n#                  ca_file: /xxx/ca.crt\n#                  cert_file: /xxx/client.crt\n#                  key_file: /xxx/client.key\n#                  skip_insecure_verify: false\n                schema: \"http\"\n                hosts: # receiver endpoint, fallback in order\n                  - \"10.0.0.3:8081\"\n                valid_status_code: [200,201] #panic on other status code\n\n",
    "version": 1,
    "location": "system_ingest_config.yml",
    "name": "system_ingest_config.yml"
  },
  "updated": "2023-10-18T14:49:56.768754+08:00",
  "metadata": {
    "labels": {
      "instance": "_all"
    },
    "category": "app_settings",
    "name": "agent"
  },
  "id": "system_ingest_config_yml"
}

#init_agent_config.tpl
POST $[[SETUP_INDEX_PREFIX]]configs/$[[SETUP_DOC_TYPE]]/task_config_tpl
{
  "payload": {
    "content": "\n\nenv:\n   CLUSTER_PASSWORD: $[[keystore.$[[CLUSTER_ID]]_password]]\n\nelasticsearch:\n  - id: $[[TASK_ID]]\n    name: $[[TASK_ID]]\n    cluster_uuid: $[[CLUSTER_UUID]]\n    enabled: true\n    endpoints: $[[CLUSTER_ENDPOINT]]\n    discovery:\n      enabled: false\n    basic_auth:\n      username: $[[CLUSTER_USERNAME]]\n      password: $[[CLUSTER_PASSWORD]]\n    traffic_control:\n      enabled: true\n      max_qps_per_node: 100\n      max_bytes_per_node: 10485760\n      max_connection_per_node: 5\n\npipeline:\n\n#node level metrics\n- auto_start: $[[NODE_LEVEL_TASKS_ENABLED]]\n  enabled: $[[NODE_LEVEL_TASKS_ENABLED]]\n  keep_running: true\n  name: collect_$[[TASK_ID]]_es_node_stats\n  retry_delay_in_ms: 10000\n  processor:\n  - es_node_stats:\n      elasticsearch: $[[TASK_ID]]\n      labels:\n        cluster_id: $[[CLUSTER_ID]]\n      when:\n        cluster_available: [\"$[[TASK_ID]]\"]\n\n#node logs\n- auto_start: $[[NODE_LEVEL_TASKS_ENABLED]]\n  enabled: $[[NODE_LEVEL_TASKS_ENABLED]]\n  keep_running: true\n  name: collect_$[[TASK_ID]]_es_logs\n  retry_delay_in_ms: 10000\n  processor:\n  - es_logs_processor:\n      elasticsearch: $[[TASK_ID]]\n      labels:\n        cluster_id: $[[CLUSTER_ID]]\n      logs_path: $[[NODE_LOGS_PATH]]\n      queue_name: logs\n      when:\n        cluster_available: [\"$[[TASK_ID]]\"]\n",
    "version": 1,
    "location": "task_config.tpl",
    "name": "task_config.tpl"
  },
  "updated": "2023-10-19T14:49:56.768754+08:00",
  "metadata": {
    "labels": {
      "instance": "_all"
    },
    "category": "app_settings",
    "name": "agent"
  },
  "id": "task_config_tpl"
}

#init_gateway_config.tpl
POST $[[SETUP_INDEX_PREFIX]]configs/$[[SETUP_DOC_TYPE]]/agent_relay_gateway_config_yml
{
 "payload": {
    "content": "\n\npath.data: data\npath.logs: log\n\nallow_multi_instance: true\nconfigs.auto_reload: false\n\nentry:\n  - name: my_es_entry\n    enabled: true\n    router: my_router\n    max_concurrency: 200000\n    network:\n      binding: 0.0.0.0:8081\n#    tls: #for mTLS connection with config servers\n#      enabled: true\n#      ca_file: /xxx/ca.crt\n#      cert_file: /xxx/server.crt\n#      key_file: /xxx/server.key\n#      skip_insecure_verify: false\n\nflow:\n  - name: deny_flow\n    filter:\n      - set_response:\n          body: \"request not allowed\"\n          status: 500\n  - name: ingest_flow\n    filter:\n      - basic_auth:\n          valid_users:\n            ingest: n\n      - rewrite_to_bulk:\n          type_removed: false\n      - bulk_request_mutate:\n          fix_null_id: true\n          generate_enhanced_id: true\n#          fix_null_type: true\n#          default_type: m-type\n#          default_index: m-index\n          index_rename:\n            metrics: \".infini_metrics\"\n            logs: \".infini_logs\"\n      - bulk_reshuffle:\n          when:\n            contains:\n              _ctx.request.path: /_bulk\n          elasticsearch: prod\n          level: node\n          partition_size: 1\n          fix_null_id: true\n\nrouter:\n  - name: my_router\n    default_flow: deny_flow\n    rules:\n      - method:\n          - \"POST\"\n        enabled: true\n        pattern:\n          - \"/{any_index}/_doc/\"\n        flow:\n          - ingest_flow\nelasticsearch:\n  - name: prod\n    enabled: true\n    basic_auth:\n      username: ingest\n      password: password\n    endpoints:\n     - http://10.0.0.3:9020\n\npipeline:\n  - name: bulk_request_ingest\n    auto_start: true\n    keep_running: true\n    retry_delay_in_ms: 1000\n    processor:\n      - bulk_indexing:\n          max_connection_per_node: 100\n          num_of_slices: 3\n          max_worker_size: 30\n          idle_timeout_in_seconds: 10\n          bulk:\n            compress: false\n            batch_size_in_mb: 10\n            batch_size_in_docs: 10000\n          consumer:\n            fetch_max_messages: 100\n          queue_selector:\n            labels:\n              type: bulk_reshuffle\n",
    "version": 1,
    "location": "agent_relay_gateway_config.yml",
    "name": "agent_relay_gateway_config.yml"
  },
  "updated": "2023-10-19T14:49:56.768754+08:00",
  "metadata": {
    "labels": {
      "instance": "_all"
    },
    "category": "app_settings",
    "name": "gateway"
  },
  "id": "agent_relay_gateway_config_yml"
}