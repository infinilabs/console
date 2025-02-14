---
weight: 2
title: 告警规则
asciinema: true
---

# 告警规则

## 简介

告警规则包括数据源，指标定义，触发条件，消息通知四个部分的配置

## 告警规则列表

在告警规则列表中可以查询已经添加的告警规则
{{% load-img "/img/screenshot/20220715-alerting-rule-list.jpg" "alerting rule list" %}}

## 新建告警规则

在告警规则列表中点击 `新建` 按钮进入新建告警规则页面

### 配置数据源

{{% load-img "/img/screenshot/20220715-alerting-rule-new-data.jpg" "alerting rule new" %}}

- 选择集群（必选）
- 选择索引，支持输入索引 pattern （必填）
- 输入 elasticsearch query DSL 查询过滤条件（可选）
- 选择时间字段（必选）
- 选择统计周期（用于时间字段聚合，默认一分钟）

### 配置告警指标以及触发条件

{{% load-img "/img/screenshot/2025/alerting/rule_condition.png" "alerting rule new" %}}

- 输入规则名称
- 按需添加分组的字段以及分组大小，可以添加多个，用于 terms 聚合
- 选择指标聚合字段以及统计类型，可以配置多个，当配置多个时必须配置公式用于计算最终的指标
- 配置告警触发条件
  - 选择指标数值
  - 选择分桶对比
    - 选择基于文档差异数或者内容差异数
> 文档差异数：相邻两个时间桶内命中文档数量的差值  
> 内容差异数：相邻两个时间桶内某个分组是否有变化，差异值为 1 表示增加，-1 表示减少，0 表示无变化
- 选择执行检查周期
- 输入告警事件标题（模版，被模版变量中的 title 引用，点击这里了解 [模版语法](./variables) ）
- 输入告警事件消息（模版，被模版变量中的 message 引用，点击这里了解 [模版语法](./variables) ）
>分桶对比是 INFINI Console 1.28.2 版本新增的功能，可以用于检测不同时间段数据的差异，比如检测某个时间段内的数据量是否有异常变化
### 配置消息通知

{{% load-img "/img/screenshot/20220715-alerting-rule-new-notification.jpg" "alerting rule new" %}}
{{% load-img "/img/screenshot/20220715-alerting-rule-new-notification1.jpg" "alerting rule new" %}}

- 配置通知渠道，可以重新配置，也可以通过添加按钮选择已经创建好的渠道作为模版快速填充，并支持添加多个
- 按需选择是否开启通知升级
- 选择沉默周期（通知消息发送频率）
- 配置通知发送时间段
- 点击保存按钮提交

## 更新告警规则

在告警规则列表中选择需要更新的告警规则点击编辑按钮进入更新告警规则页

## 删除告警规则

点击告警规则列表表格中的删除按钮，进行二次确认，确认删除后执行删除操作。

## 常见规则模板一键导入

下面列举了一些常见告警规则，并且配置钉钉、企业微信、Slack 等通知渠道，仅需要替换模板中指定的自定义变量，即可通过 Console 的 DevTools 工具快速导入规则。

- [Cluster Health Change to Red](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Cluster-Health-Change-to-Red.md)
- [Index Health Change to Red](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Index-Health-Change-to-Red.md)
- [Disk utilization is Too High](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Disk-Utilization-is-Too-High.md)
- [CPU utilization is Too High](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/CPU-Utilization-is-Too-High.md)
- [JVM utilization is Too High](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/JVM-Utilization-is-Too-High.md)
- [Shard Storage >= 55G](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Shard-Storage-gte-55G.md)
- [Elasticsearch node left cluster](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Elasticsearch-Node-Left-Cluster.md)
- [Search latency is great than 500ms](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Search-Latency-gte-500ms.md)
- [Too Many Deleted Documents](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Too-Many-Deleted-Documents.md)
