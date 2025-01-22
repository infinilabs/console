---
weight: 2
title: 集群监控
asciinema: true
---

# 集群监控

## 简介

当注册的集群开启了监控之后，`INFINI Console` 会根据相应配置去目标集群定期采集数据，
包括集群、节点、索引层面的一些指标（[指标字段说明介绍](./infini-metrics-fields-description)）。然后在集群监控里面可以观测到这些指标，从而了解目标集群的运行状态。

### 监控所需 Elasticsearch API 权限清单

\_cluster/health，\_cluster/stats，\_cat/shards, /\_nodes/<node_id>/stats
\_cat/indices, \_stats, \_cluster/state, \_nodes, \_alias, \_cluster/settings

## 开启集群监控

在集群注册或者修改集群配置的时候，可以看到如下界面

{{% load-img "/img/screenshot/20220715-monitor-config.jpg" "monitor config" %}}

可以看到有一个 `Monitored` 的开关，当这个开关打开时，代表当前集群是开启监控的。
集群注册的时候，默认是开启监控的。监控配置里面包括集群健康指标、集群指标、节点指标和索引指标，
并且可以分别设置是否开启和采集时间间隔。

> 以上是对单个集群的设置，在配置文件`console.yaml`中可以设置对所有集群的监控启停，默认情况下可以看到配置文件中有如下配置：
>
> ```aidl
> metrics:
>    enabled: true
>    major_ip_pattern: "192.*"
>    queue: metrics
>    elasticsearch:
>       enabled: true
>       cluster_stats: true
>       node_stats: true
>       index_stats: true
> ```
>
> 如果 `metrics>enable` 设置为 false, 那么所有的集群监控都是没有开启的；
> 如果 `metrics>elasticsearch>cluster_stats>enabled` 设置为 `false`，那么所有的
> 集群就不会采集集群层面的相关指标。

## 查看集群指标监控

开启监控之后，在 `INFINI Console` 左侧菜单平台管理下面的监控报表里可以查看集群的监控信息，如下：

{{% load-img "/img/screenshot/20220715-monitor-cluster-overview.jpg" "monitor cluster overview" %}}

点击高级 tab 页查看集群层面更多的指标；
{{% load-img "/img/screenshot/20220715-monitor-cluster-advance.jpg" "monitor cluster advance" %}}

如图所示，可以指定一个集群的多个节点查看节点相关指标，横向对比。
默认显示 top 5 的节点指标（ top 5 节点是根据最近 15 分钟节点的查询 qps 和写入 qps 之和计算）。
这里切换到索引 tab 页也可以指定几个查看索引的相关指标，和节点类似。
切换到线程池 tab 页查看节点线程池的相关指标。

## 查看节点指标监控

点击节点 tab 页查看集群节点列表。
{{% load-img "/img/screenshot/20220715-monitor-node-list.jpg" "monitor node list" %}}

列表中点击节点名称查看指定节点的监控

{{% load-img "/img/screenshot/20220715-monitor-node-shards.jpg" "monitor node list" %}}

这里可以查看单个节点的指标监控信息和相关分片信息

## 查看索引指标监控

点击索引 tab 页查看集群索引列表。
{{% load-img "/img/screenshot/20220715-monitor-indices.jpg" "monitor node list" %}}

列表中点击节点名称查看指定索引的监控

{{% load-img "/img/screenshot/20220715-monitor-index-shards.jpg" "monitor node list" %}}
这里可以查看单个节点的指标监控信息和相关分片信息
