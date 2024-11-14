---
weight: 50
title: How to Monitor Elasticsearch Cluster Health
asciinema: true
---

# How to Monitor Elasticsearch Cluster Health

## Introduction

In many cases, the cluster health status of the Elasticsearch cluster will turn red for some reason. At this time, at least one primary shard in the Elasticsearch cluster is unallocated or lost. So it is necessary to monitor the health status of the Elasticsearch cluster. This article will introduce how to use the INFINI Console alerting feature to monitor the health of an Elasticsearch cluster.

## Prepare

- Download and install the latest version of INFINI Console
- Register Elasticsearch cluster using INFINI Console

## Create alerting rule

Open INFINI Console in the browser, click on the left menu "Alerting" > Rules to enter the alerting management page, and then click
`New` button to enter the Create Alerting Rule page. Follow these steps to create an alerting rule:

- Select the cluster (here you need to select the Elasticsearch cluster where the INFINI Console stores data, that is, the Elasticsearch cluster configured in the configuration file `console.yml`, if it is not registered to the INFINI Console, please register first)
- Select the alerting object `.infini_metrics` (select the index under the Elasticsearch cluster, or enter the index pattern, because the monitoring data collected by the INFINI Console is stored in the index `.infini_metrics`)
- Input filter condition (Elasticsearch query DSL)
  Here we need to filter the data whose monitoring metrics category is `cluster_health` and the health status is red. The DSL is as follows:

```
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

- Select time field and stat period for `date histogram` aggregation
  {{% load-img "/img/screenshot/20220725-alerting-cluster-health1.jpg" "alerting rule settings" %}}
- Input the rule name
- Group settings (optional, multiple can be configured), set when statistical metrics need to be grouped, because all registered to INFINI Console
  The Elasticsearch cluster monitoring metrics are stored in the index `.infini_metrics`, so they need to be grouped according to the cluster ID,
  Here we choose `metadata.labels.cluster_id`
- Configure the alerting metrics, select the aggregation field `payload.elasticsearch.cluster_health.status`, and the statistical method `count`
- Configure the alerting condition, configure the `continue for one period` and the aggregation result is greater than or equal to 1, that is, the `Critical` alerting is triggered
- Set the execution period, here is configured to execute a check every minute
- Set the event title, the event title is a template, you can use template variables, template syntax and template variable usage reference [here](../reference/alerting/variables/)
- Set the event content, the event content is a template, you can use template variables, template syntax and template variable usage reference [here](../reference/alerting/variables/)
  {{% load-img "/img/screenshot/20220725-alerting-cluster-health2.jpg" "alerting rule settings" %}}
- Turn on the configure alerting channel switch, and select `add` in the upper right corner to quickly select an alerting channel template to fill. For how to create an alerting channel template, please refer to [here]()
- Set the silence period to 1 hour, that is, after the alerting rule is triggered, the notification message will only be sent once within an hour
- Set the receiving period, the default is 00:00-23:59, that is, you can receive notification messages throughout the day

{{% load-img "/img/screenshot/20220725-alerting-cluster-health3.jpg" "alerting rule settings" %}}
{{% load-img "/img/screenshot/20220725-alerting-cluster-health4.jpg" "alerting rule settings" %}}

After the settings are complete, click the Save button to submit.

## Simulate trigger alerting rule

Open the INFINI Console Dev tools (Ctrl+Shift+O) and enter the command as shown below:

{{% load-img "/img/screenshot/20220725-alerting-cluster-health5.jpg" "alerting rule settings" %}}

## Receive alert notification message

After waiting for about a minute, you will receive a DingTalk alerting notification as follows:

{{% load-img "/img/screenshot/20220725-alerting-cluster-health6.jpg" "alerting rule settings" %}}

You can see that the alerting notification message shows the ID of the Elasticsearch cluster whose health status has turned red. Click the link below the message to view the alerting details as follows:

{{% load-img "/img/screenshot/20220725-alerting-cluster-health8.jpg" "alerting rule settings" %}}

## View the alerting message center

In addition to receiving external notification messages, the INFINI Console Alert Message Center also generates an alert message. Click menu Alerting > Alerting Center to enter

{{% load-img "/img/screenshot/20220725-alerting-cluster-health7.jpg" "alerting rule settings" %}}

## Summary

By using the INFINI Console alerting function, you can easily monitor the health status of the Elasticsearch cluster. After configuring alerting rule,As soon as any Elasticsearch cluster status turns red, an alert is triggered and an alert message is sent.
