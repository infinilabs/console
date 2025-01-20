---
weight: 15
title: 容器部署
asciinema: true
---

# 容器部署

探针 (_INFINI Agent_) 支持容器方式部署。

## 下载镜像

探针(_INFINI Agent_) 的镜像发布在 Docker 的官方仓库，地址如下：

[https://hub.docker.com/r/infinilabs/agent](https://hub.docker.com/r/infinilabs/agent)

使用下面的命令即可获取最新的容器镜像：

```
docker pull infinilabs/agent:{{< globaldata "agent" "version" >}}
```

## 验证镜像

将镜像下载到本地之后，可以看到 探针 (_INFINI Agent_) 的容器镜像非常小，只有不到 20MB，所以下载是非常快的。

```
✗ docker images |grep "agent" |grep "{{< globaldata "agent" "version" >}}"
REPOSITORY         TAG               IMAGE ID       CREATED        SIZE
infinilabs/agent   latest            {{< globaldata "agent" "version" >}}   4 days ago     13.8MB
```

## 创建配置

现在需要创建一个配置文件 `agent.yml`，来进行基本的配置，如下：

```
api:
  enabled: true
  network:
    binding: 0.0.0.0:8080

metrics:
  enabled: true
  queue: metrics
  network:
    enabled: true
    summary: true
    details: true
  memory:
    metrics:
      - swap
      - memory
  disk:
    metrics:
      - ioqs
      - usage
  cpu:
    metrics:
      - idle
      - system
      - user
      - iowait
      - load
  elasticsearch:
    enabled: true
    agent_mode: true
    node_stats: true
    index_stats: true
    cluster_stats: true

elasticsearch:
  - name: default
    enabled: true
    endpoint: http://192.168.3.4:9200
    monitored: false
    discovery:
      enabled: true

pipeline:
  - name: metrics_ingest
    auto_start: true
    keep_running: true
    processor:
      - json_indexing:
          index_name: ".infini_metrics"
          elasticsearch: "default"
          input_queue: "metrics"
          output_queue:
            name: "metrics_requests"
            label:
              tag: "metrics"
          worker_size: 1
          bulk_size_in_mb: 10
  - name: consume-metrics_requests
    auto_start: true
    keep_running: true
    processor:
      - bulk_indexing:
          bulk:
            compress: true
            batch_size_in_mb: 10
            batch_size_in_docs: 5000
          consumer:
            fetch_max_messages: 100
          queues:
            type: indexing_merge
          when:
            cluster_available: [ "default" ]

agent:
  major_ip_pattern: "192.*"
  labels:
    env: dev
  tags:
    - linux
    - x86
    - es7
    - v7.5

path.data: data
path.logs: log

agent.manager.endpoint: http://192.168.3.4:9000
```

Note: 上面配置里面的 Elasticsearch 的相关配置，请改成实际的服务器连接地址和认证信息，需要版本 v7.3 及以上。

## 启动 Agent

使用如下命令启动 Agent 容器：

```
docker run -p 8080:8080  -v=`pwd`/agent.yml:/agent.yml  infinilabs/agent:{{< globaldata "agent" "version" >}}
```

## Docker Compose

还可以使用 docker compose 来管理容器实例，新建一个 `docker-compose.yml` 文件如下：

```
version: "3.5"

services:
  infini-agent:
    image: infinilabs/agent:latest
    ports:
      - 8080:8080
    container_name: "infini-agent"
    volumes:
      - ./agent.yml:/agent.yml

volumes:
  dist:
```

在配置文件所在目录，执行如下命令即可启动，如下：

```
➜  docker-compose up
Recreating infini-agent ... done
Attaching to infini-agent
infini-agent    |    _      ___   __    __  _____
infini-agent    |   /_\    / _ \ /__\/\ \ \/__   \
infini-agent    |  //_\\  / /_\//_\ /  \/ /  / /\/
infini-agent    | /  _  \/ /_\\//__/ /\  /  / /
infini-agent    | \_/ \_/\____/\__/\_\ \/   \/
infini-agent    |
infini-agent    | [AGENT] A light-weight, powerful and high-performance elasticsearch agent.
infini-agent    | [AGENT] 0.1.0_SNAPSHOT#15, 2022-08-26 15:05:43, 2025-12-31 10:10:10, 164bd8a0d74cfd0ba5607352e125d72b46a1079e
infini-agent    | [08-31 09:11:45] [INF] [app.go:164] initializing agent.
infini-agent    | [08-31 09:11:45] [INF] [app.go:165] using config: /agent.yml.
infini-agent    | [08-31 09:11:45] [INF] [instance.go:72] workspace: /data/agent/nodes/cc7ibke5epac7314bf9g
infini-agent    | [08-31 09:11:45] [INF] [metrics.go:63] ip:172.18.0.2, host:bd9f43490911, labels:, tags:
infini-agent    | [08-31 09:11:45] [INF] [api.go:261] api listen at: http://0.0.0.0:8080
infini-agent    | [08-31 09:11:45] [INF] [actions.go:367] elasticsearch [default] is available
infini-agent    | [08-31 09:11:45] [INF] [module.go:116] all modules are started
infini-agent    | [08-31 09:11:45] [INF] [manage.go:180] register agent to console
infini-agent    | [08-31 09:11:45] [INF] [app.go:334] agent is up and running now.
```
