---
weight: 23
title: How to assign Elasticsearch index-level permissions to INFINI Console accounts
asciinema: true
---

# How to assign Elasticsearch index-level permissions to INFINI Console accounts

## Introduction

This article will introduce the use of INFINI Console to limit an account to only have the management permissions of certain indexes in the Elasticsearch cluster

## Prepare

- Download and install the latest version of INFINI Console
- Enable INFINI Console [Security Features](../reference/system/security/)
- Register at least two Elasticsearch clusters to the INFINI Console

## Creating a Role

Click System > Security Settings on the left menu of INFINI Console, and select the Role Tab page to enter the role management page.

### New platform role `platform_role`

Click the New button, select the platform role, and create a new platform role `platform_role`
{{% load-img "/img/screenshot/20220719-role-new-platform.jpg" "security settings" %}}

### New data role `test_index_only`

Click the New button, select the data role, create a new data role `test_index_only`, and then configure the following:

- Select only `es-v7140` for the cluster (restrict access to this role only to the Elasticsearch cluster `es-v7140`)
- Set index permissions to index only enter the index pattern `test*` (restrict the role to only index access permissions whose index name matches `test*`)
  {{% load-img "/img/screenshot/20220720-user-index-limit.jpg" "security settings" %}}

After the configuration is complete, click the Save button to submit.

## Create Account

Click the left menu of INFINI Console System > Security Settings, select the User Tab page to enter the Account Management page.

### New account `liming`

Click the New button to create a new account `liming` and assign the account roles `platform_role`, `test_index_only`

{{% load-img "/img/screenshot/20220720-user-new-liming.jpg" "security settings" %}}
Click the save button to submit after the creation is successful, save the account password

## Login with administrator account

After logging in with the administrator account, click the menu Data > Index Management, select the cluster `es-v7140`, and you can see:

{{% load-img "/img/screenshot/20220720-user-index-all.jpg" "security settings" %}}

## Login with account `liming`

After logging in with the account `liming`, click the menu Data > Index Management, select the cluster `es-v7140`, and then you can see:
{{% load-img "/img/screenshot/20220720-user-liming-index.jpg" "security settings" %}}

## Summary

By specifying the role's Elasticsearch cluster permissions and indexing permissions, it is easy to precisely control user permissions down to the indexing level.
