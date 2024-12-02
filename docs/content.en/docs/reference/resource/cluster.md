---
weight: 2
title: Cluster Management
---

# Cluster Management

## Introduction

Cluster management can quickly and easily help us manage multiple Elasticsearch clusters across versions.

## Cluster list

The registered Elasticsearch cluster can be queried in the cluster list
{{% load-img "/img/screenshot/20220330-cluster_manage.jpg" "cluster list" %}}

## Cluster registration

The first step is to fill in the cluster address, and enable TLS and authentication as needed (you need to input a user name and password after enabling authentication).

{{% load-img "/img/screenshot/20220330-cluster_register_step1.jpg" "cluster register step one" %}}

The second step is to confirm the information

- Modify the cluster name and cluster description as needed;
- Whether to enable monitoring (enabled by default), after enabling monitoring, you can view various metrics of the Elasticsearch cluster in the console monitoring function
- Whether to enable Discovery (recommended), after enabling, the console will automatically discover all nodes in the cluster. When the configured cluster address is unavailable, the console will try to use the automatically discovered addresses available in other nodes to interact with Elasticsearch

{{% load-img "/img/screenshot/20220330-cluster_register_step2.jpg" "cluster register step two" %}}

## Update cluster configuration

Click the Edit button in the cluster list table to input the update interface

{{% load-img "/img/screenshot/20220705-cluster-update.jpg" "cluster update" %}}

Modify the configuration as needed, then click the save button to submit

## Delete cluster

Click the delete button in the cluster list table to confirm the second time. After confirming the deletion, execute the delete operation.
