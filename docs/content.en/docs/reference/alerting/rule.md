---
weight: 2
title: Rules
asciinema: true
---

# Rules

## Introduction

The alerting rules include the configuration of four parts: data source, metrics definition, trigger condition, and message notification

## Rule list

In the rule list, you can query the rules that have been added

{{% load-img "/img/screenshot/v1.29/alerting/rules.png" "" %}}

## New rule

Click the `New` button in the rule list to enter the new rule page

### Configure data source

{{% load-img "/img/screenshot/v1.29/alerting/rules-create-1.png" "" %}}

- Select a cluster (required)
- Select index, support input index pattern (required)
- Input elasticsearch query DSL query filter conditions (optional)
- Select time field (required)
- Select the statistical period (for time field aggregation, the default is one minute)

### Configure alerting metrics and trigger conditions

{{% load-img "/img/screenshot/v1.29/alerting/rules-condition.png" "" %}}

- Input the rule name
- Add the grouped fields and group size as needed, you can add more than one for terms aggregation
- Select the metrics aggregation field and statistics type, you can configure more than one, when configuring more than one, you must configure a formula to calculate the final metrics
- Configure alerting trigger conditions
  - Select **Metrics value**
  - Select **Bucket diff** - Select based on **Doc diff** or **Content diff**
    > **Doc diff**: The difference in the number of matching documents between two adjacent time buckets  
    > **Content diff**: Whether there’s a change in a group between two adjacent time buckets. A difference value of 1 indicates an increase, -1 indicates a decrease, and 0 indicates no change
- Select execution check cycle
- Input the title of the alerting event (template, referenced by the title in the template variable, click here to learn about [template syntax](./variables) )
- Input alerting event message (template, referenced by message in template variable, click here for [template syntax](./variables) )
  > **Bucket Diff** is a feature introduced in INFINI Console version 1.28.2. It can be used to detect differences in data across different time periods, such as checking if there’s an abnormal change in data volume during a specific time window.

### Configure message notification

{{% load-img "/img/screenshot/v1.29/alerting/rules-create-2.png" "" %}}

- Configure notification channels, which can be reconfigured, or you can use the add button to select an already created channel as a template to quickly fill in, and support adding multiple
- Choose whether to enable notification upgrades as needed
- Select silence period (how often notification messages are sent)
- Configure notification sending time period
- Click the save button to submit

## Update rules

Select the alerting rule to be updated in the alerting rules list and click the Edit button to enter the update alerting rules page

## Delete rules

Click the delete button in the rule list table to confirm the second time. After confirming the deletion, execute the delete operation.

## Import of common rule templates

Some common Alerting rules are listed below, and notification channels such as DingTalk, Enterprise WeChat, and Slack are configured. You only need to replace the custom variables specified in the template, and you can quickly import the rules through the DevTools tool of the Console.

- [Cluster Health Change to Red](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Cluster-Health-Change-to-Red.md)
- [Index Health Change to Red](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Index-Health-Change-to-Red.md)
- [Disk utilization is Too High](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Disk-Utilization-is-Too-High.md)
- [CPU utilization is Too High](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/CPU-Utilization-is-Too-High.md)
- [JVM utilization is Too High](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/JVM-Utilization-is-Too-High.md)
- [Shard Storage >= 55G](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Shard-Storage-gte-55G.md)
- [Elasticsearch node left cluster](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Elasticsearch-Node-Left-Cluster.md)
- [Search latency is great than 500ms](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Search-Latency-gte-500ms.md)
- [Too Many Deleted Documents](https://github.com/infinilabs/examples/blob/master/Console/Alerting-rules/Too-Many-Deleted-Documents.md)
