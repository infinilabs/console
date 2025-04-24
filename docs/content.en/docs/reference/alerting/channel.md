---
weight: 3
title: Channels
asciinema: true
---

# Channels

## Introduction

The channel is used to configure the channel for sending notification messages when an alerting rule is triggered. Currently, `webhook` is supported.

## Channe list

In the channel list, you can query the channels that have been added

{{% load-img "/img/screenshot/v1.29/alerting/channels.png" "" %}}

## New channel

Click the `New` button on the channels list page to enter the new alerting channel page

{{% load-img "/img/screenshot/v1.29/alerting/channels-create.png" "" %}}

- Input channel name (required)
- Select a channel type (supports various types such as Email, Slack, Discord,DingTalk, Feishu, WeChat, and custom webhooks)
- Input the webhook address
- Select the method of HTTP request, the default is POST
- Add HTTP request headers as needed
- Configure the webhook request body
- Click the save button to submit

## Update channel configuration

Select the channel to be updated in the channels list and click the Edit button to enter the update channel configuration page

{{% load-img "/img/screenshot/v1.29/alerting/channels-edit.png" "" %}}

## Delete channel

Click the delete button in the channels list table to confirm the second time, and execute the delete operation after confirming the deletion.
