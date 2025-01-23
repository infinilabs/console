---
weight: 50
title: 如何监控 Elasticsearch 集群健康状态
asciinema: true
---

# 如何监控 Elasticsearch 集群健康状态

## 简介

很多时候 Elasticsearch 集群会因为某些原因，集群健康状态会变为红色，这个时候 Elasticsearch
集群至少存在一个主分片未分配或者丢失。所以监控 Elasticsearch 集群健康状态是很有必要的。本文将介绍如何使用
INFINI Console 告警功能监控 Elasticsearch 集群健康状态。

## 准备

- 下载并安装最新版 INFINI Console
- 使用 INFINI Console 注册 Elasticsearch 集群

## 创建告警规则

在浏览器中打开 INFINI Console, 点击左侧菜单 `告警管理 > 规则管理` 进入告警管理页，然后点击
`新建` 按钮进入创建告警规则页。按以下步骤创建告警规则：

- 选择集群（这里需要选择 INFINI Console 存储数据的 Elasticsearch 集群，也就是在配置文件 `console.yml`
  配置的 Elasticsearch 集群，如果没有注册到 INFINI Console , 请先注册）
- 选择告警对象 `.infini_metrics`（选择 Elasticsearch 集群下的索引，或者输入索引 pattern, 这里因为
  INFINI Console 采集的监控数据存放在索引 `.infini_metrics` 里面）
- 输入筛选条件（Elasticsearch 查询 DSL）
  这里我们需要过滤监控指标类别为 `cluster_health`，并且健康状态为红色的数据，DSL 如下：

```json
{
  "bool": {
    "must": [
      {
        "match": {
          "payload.elasticsearch.cluster_health.status": "red"
        }
      },
      {
        "term": {
          "metadata.name": {
            "value": "cluster_health"
          }
        }
      }
    ]
  }
}
```

- 选择时间字段和统计周期用于做 `date histogram` 聚合
  {{% load-img "/img/screenshot/20220725-alerting-cluster-health1.jpg" "alerting rule settings" %}}
- 输入规则名称
- 分组设置（可选，可配置多个），当统计指标需要分组的时候设置，由于所有注册到 INFINI Console
  的 Elasticsearch 集群监控指标都存储在索引 `.infini_metrics` 里面，所以需要根据集群 ID
  分组，这里我们选择 `metadata.labels.cluster_id`
- 配置告警指标，选择聚合字段 `payload.elasticsearch.cluster_health.status`，统计方法 `count`
- 配置告警条件，配置 `持续一个周期` 聚合结果 大于等于 1，即触发 `Critical` 告警
- 设置执行周期，这里配置一分钟执行一次检查
- 设置事件标题，事件标题是一个模版，可以使用模版变量，模版语法及模版变量用法参考[这里](../reference/alerting/variables/)
- 设置事件内容，事件内容是一个模版，可以使用模版变量，模版语法及模版变量用法参考[这里](../reference/alerting/variables/)
  {{% load-img "/img/screenshot/20220725-alerting-cluster-health2.jpg" "alerting rule settings" %}}
- 打开配置告警渠道开关，选择右上角 `add` 快速选择一个告警渠道模版填充，关于怎么创建告警渠道模版请参考[这里](../reference/alerting/channel/)
- 设置沉默周期 1 小时，即触发告警规则后，一个小时内只发送通知消息一次
- 设置接收时段，默认 00:00-23:59，即全天都可接收通知消息

{{% load-img "/img/screenshot/20220725-alerting-cluster-health3.jpg" "alerting rule settings" %}}
{{% load-img "/img/screenshot/20220725-alerting-cluster-health4.jpg" "alerting rule settings" %}}

设置完成之后点击保存按钮提交。

## 模拟触发告警规则

打开 INFINI Console 开发工具（Ctrl+Shift+O），输入如下图所示命令：

{{% load-img "/img/screenshot/20220725-alerting-cluster-health5.jpg" "alerting rule settings" %}}

## 收到告警通知消息

等待一分钟左右，收到钉钉告警消息通知如下：

{{% load-img "/img/screenshot/20220725-alerting-cluster-health6.jpg" "alerting rule settings" %}}

可以看到告警通知消息里面显示了健康状态变红的 Elasticsearch 集群 ID，点击消息下方的链接查看告警详细信息如下：

{{% load-img "/img/screenshot/20220725-alerting-cluster-health8.jpg" "alerting rule settings" %}}

## 查看告警消息中心

除了会收到外部通知消息外，INFINI Console 告警消息中心也会生成一条告警消息。点击菜单
`告警管理 > 告警中心` 进入

{{% load-img "/img/screenshot/20220725-alerting-cluster-health7.jpg" "alerting rule settings" %}}

## 小结

通过使用 INFINI Console 告警功能， 可以很方便地监控 Elasticsearch
集群健康状态。配置告警规则之后，一旦有任何 Elasticsearch 集群状态变红，都会触发告警并发送告警消息。
