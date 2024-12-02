---
weight: 21
title: How to easily create an Elasticsearch "guest" user
asciinema: true
---

# How to easily create an Elasticsearch "guest" user

## Introduction

In some cases, we want to share some functions or data with customers, but do not want the data to be modified.
At this point we need to create a "guest" user. This article briefly describes how to create a "guest" user using the INFINI Console.

## Prepare

- Download and install the latest version of INFINI Console
- Enable INFINI Console [Security Features](../reference/system/security/)

## Creating a Role

Click System > Security Settings on the left menu of INFINI Console, and select the Role Tab page to enter the role management page.

### New platform role `readonly`

Click the New button, select the platform role, and create a new platform role `readonly`. The operation steps are as follows:

- Input role name `readonly`
- Expand all functional permissions
- `Read` permission is selected for all other functions except the security functions under the system settings.
- Security feature under System Settings is set to `None` permission.
- Click the save button to submit
  > Selecting the `All` permission of a function represents the read and write operation permission of this function,
  > `Read` means only have read permission,
  > `None` means no permission for this function (the function is not available in the menu after the user logs in)

{{% load-img "/img/screenshot/20220720-role_readonly.jpg" "security settings" %}}

### New data role `es-v7171`

Click the New button, select the data role, and create a new data role `es-v7171`. The operation steps are as follows:

- Input role name `es-v7171`
- Cluster permission select cluster `es-v7171`
- Click the save button to submit
  {{% load-img "/img/screenshot/20220719-role-v7171.jpg" "security settings" %}}

## New account `guest`

Click the left menu of INFINI Console System > Security Settings, select the User Tab page to enter the Account Management page.
Click the New button to create a new account `guest` and assign the account role `readonly`, `es-v7171`

{{% load-img "/img/screenshot/20220720-user-new-guest.jpg" "security settings" %}}

Click Save and submit. After the creation is successful, you can use the `guest` account to log in to the INFINI Console and only have read-only permissions.
