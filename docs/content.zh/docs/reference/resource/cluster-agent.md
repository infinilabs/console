---
weight: 3
title: Agent 指标采集模式配置
---

# Agent 指标采集模式配置

## 简介

默认情况下，新集群注册到 Console 会开启监控功能，监控功能会自动采集集群的指标数据。如果被监控集群的节点数量较多（ >= 10 个 ），或者集群的指标数据量较大，可以通过修改为 Agent 采集模式来优化性能。

## 切换 Agent 指标采集监控模式

{{% load-img "/img/screenshot/v1.29/inventory/cluster-agent.png" "" %}}

## 配置 Agent 关联集群节点

通常情况下，Agent 安装后会自动注册到 Console，并发现其所在节点的 Easysearch 及 Elasticsearch 或 OpenSearch 进程。默认会采集节点上的 CPU 、内存、磁盘等指标，但需要手工关联才能采集集群节点的分片指标。
在 Agent 列表中，点击 Agent 列表行中的展开按钮，进入进程关联操作界面。如果关联节点过多，可点击“自动关联”进行操作

{{% load-img "/img/screenshot/v1.29/agent/agent-node-associate2.png" "" %}}
{{% load-img "/img/screenshot/v1.29/agent/agent-node-associate3.png" "" %}}

## 验证 Agent 采集指标

在监控页面中，右上角可以查看 Agent 采集状态及各指标数据延迟
{{% load-img "/img/screenshot/v1.29/monitor/agent-status.png" "" %}}

在索引监控页面中，可以发现分片号可以点击查看分片的详细监控
{{% load-img "/img/screenshot/v1.29/monitor/agent-index.png" "" %}}
{{% load-img "/img/screenshot/v1.29/monitor/agent-shard.png" "" %}}

