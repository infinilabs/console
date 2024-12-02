---
weight: 3
title: Alerting Channels
asciinema: true
---

# Alerting Channels

## Introduction

The alerting channel is used to configure the channel for sending notification messages when an alerting rule is triggered. Currently, `webhook` is supported.

## Channes list

In the channels list, you can query the channels that have been added
{{% load-img "/img/screenshot/20220715-alerting-channel-list.jpg" "alerting channels list" %}}

## New alerting channel

Click the `New` button on the channels list page to enter the new alerting channel page

{{% load-img "/img/screenshot/20220715-alerting-channel-new.jpg" "alerting channel new" %}}

- Input channel name (required)
- Select channel type (currently only webhook is supported)
- Input the webhook address
- Select the method of HTTP request, the default is POST
- Add HTTP request headers as needed
- Configure the webhook request body
- Click the save button to submit

## Update channel configuration

Select the channel to be updated in the channels list and click the Edit button to enter the update channel configuration page
{{% load-img "/img/screenshot/20220715-alerting-channel-update.jpg" "alerting channel update" %}}
For operation reference, create an alerting channel

## delete alerting channel

Click the delete button in the alerting channels list table to confirm the second time, and execute the delete operation after confirming the deletion.
