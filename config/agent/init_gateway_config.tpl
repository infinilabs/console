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
env:
  CLUSTER_ENDPOINTS: ["http://10.0.0.3:7102"]
  CLUSTER_USERNAME: admin
  CLUSTER_PASSWORD: admin

path.data: data
path.logs: log

entry:
  - name: my_es_entry
    enabled: true
    router: my_router
    max_concurrency: 200000
    network:
      binding: 0.0.0.0:8000

flow:
  - name: async_bulk
    filter:
      - basic_auth:
          valid_users:
            ingest: password
      - bulk_reshuffle:
          when:
            contains:
              _ctx.request.path: /_bulk
          elasticsearch: prod
          level: cluster
          partition_size: 3
          fix_null_id: true
      - elasticsearch:
          elasticsearch: prod  #elasticsearch configure reference name
          max_connection_per_node: 1000 #max tcp connection to upstream, default for all nodes
          max_response_size: -1 #default for all nodes
          balancer: weight
          refresh: # refresh upstream nodes list, need to enable this feature to use elasticsearch nodes auto discovery
            enabled: true
            interval: 60s
          filter:
            roles:
              exclude:
                - master

router:
  - name: my_router
    default_flow: async_bulk

elasticsearch:
  - name: prod
    enabled: true
    endpoints: $[[env.CLUSTER_ENDPOINTS]]
    discovery:
      enabled: false
    basic_auth:
      username: $[[env.CLUSTER_USERNAME]]
      password: $[[env.CLUSTER_PASSWORD]]
    traffic_control:
      enabled: true
      max_qps_per_node: 100
      max_bytes_per_node: 10485760
      max_connection_per_node: 5

elastic:
  enabled: true
  remote_configs: false
  elasticsearch: prod
  metadata_refresh:
    enabled: true
    interval: 30s
  discovery:
    enabled: true
    refresh:
      enabled: true
      interval: 30s

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