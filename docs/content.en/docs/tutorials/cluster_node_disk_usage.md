---
weight: 50
title: How to monitor Elasticsearch cluster node disk usage
asciinema: true
---

# How to monitor Elasticsearch cluster node disk usage

## Introduction

When the system disk usage is too high, data cannot be written into the Elasticsearch cluster, which is likely to result in data loss. Therefore, monitor the Elasticsearch cluster.
Node disk usage is necessary. This article will show you how to monitor your Elasticsearch cluster using INFINI Console alerts
Node disk usage.

## Prepare

- Download and install the latest version of INFINI Console
- Register Elasticsearch cluster using INFINI Console

## Create alerting rule

Open INFINI Console in the browser, click on the left menu "Alerting" > Rules to enter the alerting management page, and then click
`New` button to enter the Create Alerting Rule page. Follow these steps to create an alerting rule:

- Select the cluster (here you need to select the Elasticsearch cluster where the INFINI Console stores data, that is, the Elasticsearch cluster configured in the configuration file `console.yml`, if it is not registered to the INFINI Console, please register first)
- Input the alerting object `.infini_metrics*` (select the index under the Elasticsearch cluster, or enter the index pattern, because the monitoring data collected by the INFINI Console is stored in the index .infini_metrics)
- Input filter criteria (Elasticsearch query DSL)
  Here we need to filter the monitoring metrics category to `node_stats`, the DSL is as follows:

```
{
    "bool": {
      "must": [
        {
          "term": {
            "metadata.name": {
              "value": "node_stats"
            }
          }
        }
      ]
    }
  }
```

- Select time field `timestamp` and statistical period for `date histogram` aggregation
  {{% load-img "/img/screenshot/20220726-alerting-disk-usage1.jpg" "alerting rule settings" %}}
- Input the rule name
- Group settings (optional, multiple can be configured), set when statistical metrics need to be grouped, because all registered to INFINI Console
  The Elasticsearch cluster monitoring metrics are stored in the index `.infini_metrics`, so you need to group according to the cluster ID first, and then group according to the node ID,
  Here we choose `metadata.labels.cluster_id` and `metadata.labels.node_id`
- Configure the alerting metrics, select the aggregation field `payload.elasticsearch.node_stats.fs.total.free_in_bytes`, and the statistics method `avg`. Then add another alerting metrics, select the aggregation field `payload.elasticsearch.node_stats.fs.total.total_in_bytes`, and the statistical method `avg`.
- Configure the metrics formula (when more than one alerting metrics is configured, you need to set a formula to calculate the target metrics), where the formula fx is configured as `((b-a)/b)*100`, which means to use the `total Disk space `subtract `remaining disk space` to get `disk used space`,
  Then divide `disk used space` by `total disk space` and multiply by 100 to get `disk usage`
- Configure the alerting conditions, here configure three alerting conditions, configure the `P2(Medium)` alerting when the disk usage is greater than 80 for `persisting for one period`;
  Configure the `continue for one period` when the disk usage is greater than 90, trigger the `P1(High)` alerting;
  Configure `persisting for a period` when the disk usage rate is greater than 95, trigger the `P0(Critical)` alerting;
- Set the execution period, here is configured to execute a check every minute
- Set the event title, the event title is a template, you can use template variables, template syntax and template variable usage reference [here](../reference/alerting/variables/)
- Set the event content, the event content is a template, you can use template variables, template syntax and template variable usage reference [here](../reference/alerting/variables/)

```aidl
Priority:{{.priority}}
Timestamp:{{.timestamp | datetime}}
RuleID:{{.rule_id}}
EventID:{{.event_id}}
{{range.results}}
ClusterID: {{index.group_values ​​0}};
NodeID: {{index.group_values ​​1}};
Disk Usage:{{.result_value | to_fixed 2}}%;
Free Storage: {{.relation_values.a | format_bytes 2}};
{{end}}
```

{{% load-img "/img/screenshot/20220726-alerting-disk-usage2.jpg" "alerting rule settings" %}}
{{% load-img "/img/screenshot/20220726-alerting-disk-usage3.jpg" "alerting rule settings" %}}

- Turn on the configure alerting channel switch, and select `add` in the upper right corner to quickly select an alerting channel template to fill. For how to create an alerting channel template, please refer to [here]()
- Set the silence period to 1 hour, that is, after the alerting rule is triggered, the notification message will only be sent once within an hour
- Set the receiving period, the default is 00:00-23:59, that is, you can receive notification messages throughout the day

{{% load-img "/img/screenshot/20220725-alerting-cluster-health3.jpg" "alerting rule settings" %}}
{{% load-img "/img/screenshot/20220725-alerting-cluster-health4.jpg" "alerting rule settings" %}}

After the settings are complete, click the Save button to submit.

## Receive alert notification message

Wait for a while, and receive the DingTalk alerting message notification as follows:

{{% load-img "/img/screenshot/20220725-alerting-disk-usage1.jpg" "alerting rule settings" %}}

You can see that the alert notification message displays the Elasticsearch cluster ID, node ID, and remaining disk space with high disk usage.

## View the alerting message center

In addition to receiving external notification messages, the INFINI Console Alert Message Center also generates an alert message. Click menu Alerting > Alerting Center to enter

{{% load-img "/img/screenshot/20220726-alerting-disk-usage5.jpg" "alerting rule settings" %}}

## Summary

By using the INFINI Console alerting function, you can easily monitor the disk usage of Elasticsearch cluster nodes. After configuring alerting rule,
Once the disk usage of any Elasticsearch node exceeds the set threshold, an alert will be triggered and an alert message will be sent.
