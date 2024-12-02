---
weight: 20
title: Installing Agent
asciinema: true
---

# Installing The Agent

## Before You Begin

Install and keep [INFINI Console](../../getting-started/install) running.

## Install by Console generated script

```
curl -sSL http://localhost:9000/agent/install.sh?token=cjctdrms4us1c6fu04ag |sudo bash -s -- -u https://release.infinilabs.com/agent/stable -v 0.6.0-262 -t /opt/agent
```

> The -u and -v parameters indicate that the specified version of the Agent is downloaded from the specified URL, and the -t parameter indicates the installation path. In a networked environment, the -- and subsequent parameters can be ignored, and by default, the latest version of the Agent will be downloaded from the official website for installation. 

## Container Deployment

INFINI Agent also supports Docker container deployment.

{{< button relref="./docker" >}}Learn More{{< /button >}}

## Configuration

Most of the configuration of INFINI Agent can be completed using `agent.yml`. After the configuration is modified, the agent program needs to be restarted to make the configuration take effect.

After unzip the file and open `agent.yml`, you will see this:

```
env:
  LOGGING_ES_ENDPOINT: http://localhost:9200
  LOGGING_ES_USER: admin
  LOGGING_ES_PASS: admin
  API_BINDING: "0.0.0.0:2900"

path.data: data
path.logs: log

api:
  enabled: true
  network:
    binding: $[[env.API_BINDING]]

# omitted ...
agent.manager.endpoint: http://192.168.3.4:9000
```

In most cases, you only need to config the `LOGGING_ES_ENDPOINT`, but if Elasticsearch has security authentication enabled, then configure the `LOGGING_ES_USER` and `LOGGING_ES_PASS`.

The user must have access to the cluster metadata, index metadata, and all indexes with `.infini` prefix.

## Starting the Agent

Run the agent program to start INFINI Agent, as follows:

```
   _      ___   __    __  _____
  /_\    / _ \ /__\/\ \ \/__   \
 //_\\  / /_\//_\ /  \/ /  / /\/
/  _  \/ /_\\//__/ /\  /  / /
\_/ \_/\____/\__/\_\ \/   \/

[AGENT] A light-weight, powerful and high-performance elasticsearch agent.
[AGENT] 0.1.0#14, 2022-08-26 14:09:29, 2025-12-31 10:10:10, 4489a8dff2b68501a0dd9ae15276cf5751d50e19
[08-31 15:52:07] [INF] [app.go:164] initializing agent.
[08-31 15:52:07] [INF] [app.go:165] using config: /Users/INFINI/agent/agent-0.1.0-14-mac-arm64/agent.yml.
[08-31 15:52:07] [INF] [instance.go:72] workspace: /Users/INFINI/agent/agent-0.1.0-14-mac-arm64/data/agent/nodes/cc7h5qitoaj25p2g9t20
[08-31 15:52:07] [INF] [metrics.go:63] ip:192.168.3.22, host:INFINI-MacBook.local, labels:, tags:
[08-31 15:52:07] [INF] [api.go:261] api listen at: http://0.0.0.0:8080
[08-31 15:52:07] [INF] [module.go:116] all modules are started
[08-31 15:52:07] [INF] [manage.go:180] register agent to console
[08-31 15:52:07] [INF] [actions.go:367] elasticsearch [default] is available
[08-31 15:52:07] [INF] [manage.go:203] registering, waiting for review
[08-31 15:52:07] [INF] [app.go:334] agent is up and running now.
```

If the above startup information is displayed, the agent is running successfully and listening on the responding port.

But now agent can't work normally util it's being added to INFINI Console. See [Agent Manage](./manage/manage)

## Shutting Down the Agent

To shut down INFINI Agent, hold down Ctrl+C. The following information will be displayed:

```
^C
[AGENT] got signal: interrupt, start shutting down
[08-31 15:57:13] [INF] [module.go:145] all modules are stopped
[08-31 15:57:13] [INF] [app.go:257] agent now terminated.
[AGENT] 0.1.0, uptime: 5m6.240314s

   __ _  __ ____ __ _  __ __
  / // |/ // __// // |/ // /
 / // || // _/ / // || // /
/_//_/|_//_/  /_//_/|_//_/

©INFINI.LTD, All Rights Reserved.
```

## System Service

To run the INFINI Agent as a system service, run the following commands:

```
➜ ./agent -service install
Success
➜ ./agent -service start
Success
```

Uninstall service:

```
➜ ./agent -service stop
Success
➜ ./agent -service uninstall
Success
```

## Manual Configuration

If you want to manually configure the INFINI Agent to collect Elasticsearch logs and metrics, you can refer to the `agent.yml`. If you want to collect metrics and logs for other Elasticsearch clusters, you need to add the corresponding configuraiton under `elasticsearch` and `pipeline` configuration.

If you want to toggle off some metrics/logs collecting, set the corresponding `pipeline.enabled` to `false.

### Collect Elasticsearch Metrics

Collect node stats:

```
  - name: collect_default_node_stats
    enabled: false
    auto_start: true
    keep_running: true
    retry_delay_in_ms: 10000
    processor:
      - es_node_stats:
          elasticsearch: default
```

Collect index stats:

```
  - name: collect_default_index_stats
    enabled: false
    auto_start: true
    keep_running: true
    retry_delay_in_ms: 10000
    processor:
      - es_index_stats:
          elasticsearch: default
```

Collect cluster stats:

```
  - name: collect_default_cluster_stats
    enabled: false
    auto_start: true
    keep_running: true
    retry_delay_in_ms: 10000
    processor:
      - es_cluster_stats:
          elasticsearch: default
```

Collect cluster health info:

```
  - name: collect_default_cluster_health
    enabled: false
    auto_start: true
    keep_running: true
    retry_delay_in_ms: 10000
    processor:
      - es_cluster_health:
          elasticsearch: default
```

### Collect Elasticsearch Logs

Collect the logs from the specified nodes, set the `endpoint` to the specified node in the `elasticsearch` configuration:

```
  - name: collect_default_es_logs
    enabled: false
    auto_start: true
    keep_running: true
    retry_delay_in_ms: 3000
    processor:
      - es_logs_processor:
          queue_name: "logs"
          elasticsearch: default
```

If you have multiple nodes running on the local host, add more `elasticsearch` and `pipeline` configurations:

```
elasticsearch:
  # omitted ...
  - name: cluster-a-node-1
    enabled: true
    endpoint: http://localhost:9202
    monitored: false
    discovery:
      enabled: true

# omitted ...

  - name: collect_node_1_es_logs
    enabled: false
    auto_start: true
    keep_running: true
    retry_delay_in_ms: 3000
    processor:
      - es_logs_processor:
          queue_name: "logs"
          elasticsearch: cluster-a-node-1
```

### Collect Other Logs

If `es_logs_processor` can't provide the flexibility you need, or you want to collect other services' logs on the local host, you can use `logs_processor` to collect them. There's a sample configuration to collect Elasticsearch logs in the `agent.yml`, you can modify it or add new configurations, and update the `metadata` and `labels` for better investigations later.

```
  - name: log_collect
    enabled: false
    auto_start: true
    keep_running: true
    retry_delay_in_ms: 3000
    processor:
      - logs_processor:
          queue_name: "logs"
          logs_path: "/opt/es/elasticsearch-7.7.1/logs"
          # metadata for all log items
          metadata:
            category: elasticsearch
          # patterns are matched in order
          patterns:
            - pattern: ".*_server.json$" # file name pattern to match
              # log type, json/text/multiline
              type: json
              # metadata for matched files
              metadata:
                name: server
              # (json) timestamp fields in json message, match the first one
              timestamp_fields: ["timestamp", "@timestamp"]
              # (json) remove fields with specified key path
              remove_fields:
                [
                  "type",
                  "cluster.name",
                  "cluster.uuid",
                  "node.name",
                  "node.id",
                  "timestamp",
                  "@timestamp",
                ]
            - pattern: "gc.log$" # file name pattern to match
              # log type, json/text/multiline
              type: json
              # metadata for matched files
              metadata:
                name: gc
              # (text) regex to match timestamp in the log entries
              timestamp_patterns:
                - "\\d{4}-\\d{1,2}-\\d{1,2}T\\d{1,2}:\\d{1,2}:\\d{1,2}.\\d{3}\\+\\d{4}"
                - "\\d{4}-\\d{1,2}-\\d{1,2} \\d{1,2}:\\d{1,2}:\\d{1,2},\\d{3}"
                - "\\d{4}-\\d{1,2}-\\d{1,2}T\\d{1,2}:\\d{1,2}:\\d{1,2},\\d{3}"
            - pattern: ".*.log$" # file name pattern to match
              # log type, json/text/multiline
              type: multiline
              # (multiline) the pattern to match a new line
              line_pattern: '^\['
              # metadata for matched files
              metadata:
                name: server
              # (text) regex to match timestamp in the log entries
              timestamp_patterns:
                - "\\d{4}-\\d{1,2}-\\d{1,2}T\\d{1,2}:\\d{1,2}:\\d{1,2}.\\d{3}\\+\\d{4}"
                - "\\d{4}-\\d{1,2}-\\d{1,2} \\d{1,2}:\\d{1,2}:\\d{1,2},\\d{3}"
                - "\\d{4}-\\d{1,2}-\\d{1,2}T\\d{1,2}:\\d{1,2}:\\d{1,2},\\d{3}"
```
