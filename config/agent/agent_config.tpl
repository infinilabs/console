
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
    "content": """

metrics:
  enabled: true
  queue: metrics
  network:
    enabled: true
    summary: true
    sockets: true
    #throughput: true
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
  - name: replicate_message_to_gateway
    enabled: true
    auto_start: true
    keep_running: true
    processor:
      - consumer:
          max_worker_size: 3
          queue_selector:
            keys:
              - metrics
              - logs
          consumer:
            group: replication
          processor:
            - http:
                max_sending_qps: 100
                method: POST
                path: /$[[queue_name]]/_doc/
                headers:
                    Content-Type: application/json
                body: $[[message]]
                basic_auth:
                  username: ingest
                  password: password
#                tls: #for mTLS connection with config servers
#                  enabled: true
#                  ca_file: /Users/medcl/Desktop/ca.crt
#                  cert_file: /Users/medcl/Desktop/client.crt
#                  key_file: /Users/medcl/Desktop/client.key
#                  skip_insecure_verify: false
                schema: "http"
                hosts: # receiver endpoint, fallback in order
                  - "192.168.3.185:8888"
                valid_status_code: [200,201] #panic on other status code

""",
    "version": 3
  }
}
