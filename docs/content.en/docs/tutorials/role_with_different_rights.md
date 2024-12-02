---
weight: 22
title: How to assign different Elasticsearch cluster access permissions to different INFINI Console accounts
asciinema: true
---

# How to assign different Elasticsearch cluster access permissions to different INFINI Console accounts

## Introduction

This article will introduce the use of INFINI Console to assign two different Elasticsearch cluster management permissions to two different accounts

## Prepare

- Download and install the latest version of INFINI Console
- Enable INFINI Console [Security Features](../reference/system/security/)
- Register at least two Elasticsearch clusters to the INFINI Console

## Creating a Role

Click System > Security Settings on the left menu of INFINI Console, and select the Role Tab page to enter the role management page.

### New platform role `platform_role`

Click the New button, select the platform role, and create a new platform role `platform_role`. The operation steps are as follows:

- Input role name `platform_role`
- Expand all functional permissions
- Except for the security functions under the system settings, select the `All` permission for all other functions.
- Security feature under System Settings is set to `None` permission.
- Click the save button to submit
  > Selecting the `All` permission of a function represents the read and write operation permission of this function,
  > `Read` means only have read permission,
  > `None` means no permission for this function (the function is not available in the menu after the user logs in)

{{% load-img "/img/screenshot/20220719-role-new-platform.jpg" "security settings" %}}

### New data role `es-v7171`

Click the New button, select the data role, and create a new data role `es-v7171`

{{% load-img "/img/screenshot/20220719-role-v7171.jpg" "security settings" %}}

### New data role `es-v630`

Click the New button, select the data role, create a new data role `es-v630`, the configuration is similar to the role `es-v7171`

## Create Account

Click the left menu of INFINI Console System > Security Settings, select the User Tab page to enter the Account Management page.

### New account `zhangsan`

Click the New button to create a new account `zhangsan` and assign the account role `platform_role`, `es-v717`

{{% load-img "/img/screenshot/20220719-user-zhangsan.jpg" "security settings" %}}
Click the save button to submit after the creation is successful, save the account password

{{% load-img "/img/screenshot/20220719-user-new-password.jpg" "security settings" %}}

### New account `wangwu`

Click the New button to create a new account `wangwu`, and assign the account roles `platform_role`, `es-v630`, the configuration is similar to the account `zhangsan`

## Login with administrator account

After logging in with the administrator account, view the platform overview, and you can see all 13 registered clusters

{{% load-img "/img/screenshot/20220719-user-admin-view.jpg" "security settings" %}}

## Login with account `zhangsan`

After logging in with the account `zhangsan` and viewing the platform overview, you can only see the cluster `es-v7171`
{{% load-img "/img/screenshot/20220719-user-zhangsan-view.jpg" "security settings" %}}

## Login with account `wangwu`

After logging in with the account `zhangsan` and viewing the platform overview, you can only see the cluster `es-v630`
{{% load-img "/img/screenshot/20220719-user-wangwu-view.jpg" "security settings" %}}

## Summary

By creating different roles and granting different Elasticsearch cluster permissions, and then assigning roles to users, we can quickly implement
Grant different Elasticsearch cluster permissions to different users.
