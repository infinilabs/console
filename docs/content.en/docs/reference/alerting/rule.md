---
weight: 2
title: Alerting Rules
asciinema: true
---

# Alerting Rules

## Introduction

The alerting rules include the configuration of four parts: data source, metrics definition, trigger condition, and message notification

## Alerting rules list

In the alerting rules list, you can query the alerting rules that have been added
{{% load-img "/img/screenshot/20220715-alerting-rule-list.jpg" "alerting rule list" %}}

## New alerting rule

Click the `New` button in the alerting rule list to enter the new alerting rule page

### Configure data source

{{% load-img "/img/screenshot/20220715-alerting-rule-new-data.jpg" "alerting rule new" %}}

- Select a cluster (required)
- Select index, support input index pattern (required)
- Input elasticsearch query DSL query filter conditions (optional)
- Select time field (required)
- Select the statistical period (for time field aggregation, the default is one minute)

### Configure alerting metrics and trigger conditions

{{% load-img "/img/screenshot/20220715-alerting-rule-new-metric.jpg" "alerting rule new" %}}

- Input the rule name
- Add the grouped fields and group size as needed, you can add more than one for terms aggregation
- Select the metrics aggregation field and statistics type, you can configure more than one, when configuring more than one, you must configure a formula to calculate the final metrics
- Configure alerting trigger conditions
- Select execution check cycle
- Input the title of the alerting event (template, referenced by the title in the template variable, click here to learn about [template syntax](./variables) )
- Input alerting event message (template, referenced by message in template variable, click here for [template syntax](./variables) )

### Configure message notification

{{% load-img "/img/screenshot/20220715-alerting-rule-new-notification.jpg" "alerting rule new" %}}
{{% load-img "/img/screenshot/20220715-alerting-rule-new-notification1.jpg" "alerting rule new" %}}

- Configure notification channels, which can be reconfigured, or you can use the add button to select an already created channel as a template to quickly fill in, and support adding multiple
- Choose whether to enable notification upgrades as needed
- Select silence period (how often notification messages are sent)
- Configure notification sending time period
- Click the save button to submit

## Update alerting rules

Select the alerting rule to be updated in the alerting rules list and click the Edit button to enter the update alerting rules page

## Delete alerting rules

Click the delete button in the alerting rule list table to confirm the second time. After confirming the deletion, execute the delete operation.

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
