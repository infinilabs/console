POST .infini_configs/_doc/agent_relay_gateway_config_yml
{
  "id": "agent_relay_gateway_config_yml",
  "updated": "2023-10-19T14:49:56.768754+08:00",
  "metadata": {
    "category": "app_settings",
    "name": "gateway",
    "labels": {
      "instance": "_all"
    }
  },
  "payload": {
    "name": "agent_relay_gateway_config.yml",
    "location": "agent_relay_gateway_config.yml",
    "content": """

path.data: data
path.logs: log

allow_multi_instance: true
configs.auto_reload: false

entry:
  - name: my_es_entry
    enabled: true
    router: my_router
    max_concurrency: 200000
    network:
      binding: 0.0.0.0:8888
#    tls: #for mTLS connection with config servers
#      enabled: true
#      ca_file: /Users/medcl/Desktop/ca.crt
#      cert_file: /Users/medcl/Desktop/server.crt
#      key_file: /Users/medcl/Desktop/server.key
#      skip_insecure_verify: false

flow:
  - name: deny_flow
    filter:
      - set_response:
          body: "request not allowed"
          status: 500
  - name: ingest_flow
    filter:
      - basic_auth:
          valid_users:
            ingest: password
      - rewrite_to_bulk:
          type_removed: false
      - bulk_request_mutate:
          fix_null_id: true
          generate_enhanced_id: true
#          fix_null_type: true
#          default_type: m-type
#          default_index: m-index
          index_rename:
            metrics: ".infini_metrics"
            logs: ".infini_logs"
      - bulk_reshuffle:
          when:
            contains:
              _ctx.request.path: /_bulk
          elasticsearch: prod
          level: node
          partition_size: 1
          fix_null_id: true

router:
  - name: my_router
    default_flow: deny_flow
    rules:
      - method:
          - "POST"
        enabled: true
        pattern:
          - "/{any_index}/_doc/"
        flow:
          - ingest_flow
elasticsearch:
  - name: prod
    enabled: true
    basic_auth:
      username: admin
      password: admin
    endpoints:
     - https://10.0.0.3:9200

pipeline:
  - name: bulk_request_ingest
    auto_start: true
    keep_running: true
    retry_delay_in_ms: 1000
    processor:
      - bulk_indexing:
          max_connection_per_node: 100
          num_of_slices: 3
          max_worker_size: 30
          idle_timeout_in_seconds: 10
          bulk:
            compress: false
            batch_size_in_mb: 10
            batch_size_in_docs: 10000
          consumer:
            fetch_max_messages: 100
          queue_selector:
            labels:
              type: bulk_reshuffle
""",
    "version": 1
  }
}