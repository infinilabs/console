---
weight: 15
title: 下载安装
asciinema: true
---

# 安装探针

探针支持两种方式安装，一种是手动下载安装配置，还有一种是结合新版本的 Console (>=1.3.0)，生成一键安装脚本。
只要执行一键安装脚本即可在主机上完成探针的安装。我们推荐使用结合 Console 来安装探针，简单和方便管理。

## 一键安装

### 安装前准备

安装并运行 [INFINI Console](../../../getting-started/install)

### 复制一键安装脚本

在 INFINI Console 左侧菜单 `资源管理>探针管理`，进入页面之后点击 `Install Agent` 按钮，即可复制类似如下一键安装脚本：

```
curl -sSL http://localhost:9000/agent/install.sh?token=cjctdrms4us1c6fu04ag |sudo bash -s -- -u https://release.infinilabs.com/agent/stable -v 0.6.0-262 -t /opt/agent
```

> -u和-v参数表示从指定的 URL 下载指定版本的 Agent，-t参数表示安装的路径，在联网的环境中，-- 及后面的参数都可以忽略，默认情况下将从官网下载最新的 Agent 版本进行安装。

将一键安装脚本粘贴到终端执行即可完成安装，安装之后该探针实例会被自动注册到 INFINI Console。具体操作步骤参考 [Agent 快速安装](manage/manage/#快速安装探针)

## 下载安装

根据您所在的操作系统和平台选择下面相应的下载地址：

[https://release.infinilabs.com/agent/](https://release.infinilabs.com/agent/)

## 容器部署

探针(_INFINI Agent_) 也支持 Docker 容器方式部署。

{{< button relref="./docker" >}}了解更多{{< /button >}}

## 配置

下载安装包解压之后，打开 `agent.yml` 配置文件，我们可以看到以下配置：

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
```

通常，我们只需要修改 `LOGGING_ES_ENDPOINT` 环境变量配置，若 Elasticsearch 开启了安全验证，则需要修改 `LOGGING_ES_USER` 和 `LOGGING_ES_PASS` 配置。

这里的用户要求具备集群的元数据、索引的元数据以及 `.infini*` 索引的完全访问权限，以及索引模板的创建权限。

## 启动 INFINI Agent

直接运行程序即可启动 探针(_INFINI Agent_) 了(这里使用的是 Mac 版本的，不同平台的程序文件名称略有不同)，如下：

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

看到上面的启动信息，说明 探针 (_INFINI Agent_) 已经成功运行了!

## 停止 INFINI Agent

如果需要停止 探针(_INFINI Agent_) ，按 `Ctrl+C` 即可停止 探针(_INFINI Agent_)，如下：

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

## 配置服务后台运行

如果希望将 探针(_INFINI Agent_) 以后台任务的方式运行，如下：

```
➜ ./agent -service install
Success
➜ ./agent -service start
Success
```

卸载服务也很简单，如下：

```
➜ ./agent -service stop
Success
➜ ./agent -service uninstall
Success
```

## 手动配置 Agent 采集功能

如果希望手动配置 Elasticsearch 日志和指标采集，可以参考 `agent.yml` 提供的默认参考配置。如果需要添加其他 Elasticsearch 集群的采集，需要在 `elasticsearch` 增加相应的集群配置信息，并配置对应的 `pipeline` 来采集该集群的数据。

如果你需要手动关闭某一项日志采集，把对应的采集 pipeline `enabled` 选项设置为 `false`。

### 采集 Elasticsearch 指标

配置采集节点 stats：

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

配置采集集群索引 stats：

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

配置采集集群 stats：

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

配置采集集群健康信息：

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

### 采集 Elasticsearch 日志

配置采集节点日志，`elasticsearch` 需要配置采集节点的 `endpoint`：

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

如果有多个 Elasticsearch 节点在当前主机运行，每个 Elasticsearch 需要配置的对应的集群信息和 `pipeline`：

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

### 采集本地日志文件

如果 `es_logs_processor` 提供的配置选项不够灵活，或者你想采集主机上其他日志文件，也可以通过 `logs_processor` 来配置任意目录下的日志采集。`agent.yml` 默认提供了一个采集 Elasticsearch 日志的配置来作为参考，你可以修改这个配置或者增加新的配置来适配本地的日志文件，并添加对应的标签和 metadata 信息来方便过滤筛选。

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
