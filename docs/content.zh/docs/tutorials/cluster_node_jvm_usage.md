---
weight: 53
title: 如何监控 Elasticsearch 集群节点的 JVM 使用率
asciinema: true
---

# 如何监控 Elasticsearch 集群节点的 JVM 使用率

## 简介

本文将介绍如何使用 INFINI Console 监控 Elasticsearch 集群节点 JVM 的使用率，并进行告警。

## 准备

- 下载并安装最新版 INFINI Console
- 使用 INFINI Console 注册 Elasticsearch 集群

## 创建告警规则

在浏览器中打开 INFINI Console，点击左侧菜单 `告警管理 > 规则管理` 进入告警管理页，然后点击
`新建` 按钮进入创建告警规则页。按以下步骤创建告警规则：

- 选择集群（这里需要选择 INFINI Console 存储数据的 Elasticsearch 集群，也就是在配置文件
  `console.yml` 配置的 Elasticsearch 集群，如果没有注册到 INFINI Console，请先注册）
- 输入告警对象 `.infini_metrics*`（选择 Elasticsearch 集群下的索引，或者输入索引
  pattern，这里因为 INFINI Console 采集的监控数据存放在索引 `.infini_metrics` 里面）
- 输入筛选条件（Elasticsearch 查询 DSL）这里我们需要过滤监控指标类别为
  `node_stats` 及元数据分类为 `elasticsearch`，DSL 如下：

```json
{
  "bool": {
    "must": [
      {
        "term": {
          "metadata.name": {
            "value": "node_stats"
          }
        }
      },
      {
        "term": {
          "metadata.category": {
            "value": "elasticsearch"
          }
        }
      }
    ]
  }
}
```

- 选择时间字段 `timestamp` 和统计周期用于做 `date histogram` 聚合
  {{% load-img "/img/screenshot/alerting/Alerting-rules-jvm-1.jpg" "rules" %}}
- 输入规则名称
- 分组设置（可选，可配置多个），当统计指标需要分组的时候设置，由于所有注册到 INFINI Console
  的 Elasticsearch 集群监控指标都存储在索引 `.infini_metrics` 里面，所以需要先根据集群 ID 分组，然后再根据节点 ID
  分组，这里我们选择 `metadata.labels.cluster_id` 和 `metadata.labels.node_id`
- 配置告警指标，选择聚合字段 `payload.elasticsearch.node_stats.jvm.mem.heap_used_percent`，统计方法 `p90`。
- 配置指标公式（当配置了一个以上的告警指标的时候，需要设置一个公式来计算目标指标），这里公式
  fx 配置为 `a`。然后设置变量 `a` 的数值类型为比率 `Ratio`
- 配置告警条件，这里配置三个告警条件，配置 `持续一个周期` JVM 使用率 大于 50 的时候，触发
  `P2(Medium)` 告警；配置 `持续一个周期` JVM 使用率 大于 90 的时候，触发 `P1(High)`
  告警；配置 `持续一个周期` JVM 使用率 大于 95 的时候，触发 `P0(Critical)` 告警；
- 设置执行周期，这里配置一分钟执行一次检查
- 设置事件标题，事件标题是一个模版，可以使用模版变量，模版语法及模版变量用法参考[这里](../reference/alerting/variables/)
- 设置事件内容，事件内容是一个模版，可以使用模版变量，模版语法及模版变量用法参考[这里](../reference/alerting/variables/)

```aidl
Priority:{{.priority}}
Timestamp:{{.timestamp | datetime_in_zone "Asia/Shanghai"}}
RuleID:{{.rule_id}}
EventID:{{.event_id}}
{{range .results}}
ClusterID:{{index .group_values 0}};
NodeID:{{index .group_values 1}};
JVM used percent：{{.result_value | to_fixed 2}}%;
{{end}}
```

{{% load-img "/img/screenshot/alerting/Alerting-rules-jvm-2.jpg" "rules" %}}

- 打开配置告警渠道开关，选择右上角 `add` 快速选择一个告警渠道模版填充，关于怎么创建告警渠道模版请参考[这里](../reference/alerting/channel/)
- 设置沉默周期 1 小时，即触发告警规则后，一个小时内只发送通知消息一次
- 设置接收时段，默认 00:00-23:59，即全天都可接收通知消息

{{% load-img "/img/screenshot/20220725-alerting-cluster-health3.jpg" "security settings" %}}
{{% load-img "/img/screenshot/20220725-alerting-cluster-health4.jpg" "security settings" %}}

设置完成之后点击保存按钮提交。

## 收到告警通知消息

等待一会儿，收到钉钉告警消息通知如下：

{{% load-img "/img/screenshot/alerting/Alerting-rules-jvm-3.jpg" "rules" %}}

可以看到告警通知消息里面显示了当前规则触发的 Elasticsearch 集群 ID，节点 ID，当前 JVM 使用率。

## 查看告警消息中心

除了会收到外部通知消息外，INFINI Console 告警消息中心也会生成一条告警消息。点击菜单 `告警管理 > 告警中心` 进入

{{% load-img "/img/screenshot/alerting/Alerting-rules-jvm-4.jpg" "rules" %}}

## 小结

通过使用 INFINI Console 告警功能， 可以很方便地监控 Elasticsearch 集群节点的 JVM
使用率。配置告警规则之后，一旦有任何 Elasticsearch 节点 JVM 使用率超过设定的阈值就会触发告警并发送告警消息。
