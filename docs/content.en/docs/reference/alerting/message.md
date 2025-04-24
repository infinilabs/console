---
weight: 1
title: Messages
asciinema: true
---

# Messages

## Introduction

By default, the message center displays the alerting events that are currently occurring in the system, which is convenient for administrators to quickly preview the execution status of the system.

## Message list

The message list aggregates all triggered alerting events. If each alerting rule repeatedly triggers multiple alerting messages, only one will be aggregated and displayed here. Click the details to see more information.

{{% load-img "/img/screenshot/v1.29/alerting/message.png" "" %}}

## Message details

Click the Details button in the message list row and column to view the detailed content of the current alerting event message, including the basic information of the event message, the timing curve within the event trigger period, and the history of rule execution detection, etc., as shown in the following figure:

{{% load-img "/img/screenshot/v1.29/alerting/message-side.png" "" %}}

## Ignore warning messages

If you think that the alerting event does not need to be processed or is not important, you can ignore it. After ignoring, the alerting message will not be displayed in the message list by default, but it can be queried by status filtering.

Operation steps: Click the ignore button in the message list form to confirm the second time, fill in the ignore reason, and execute the ignore operation after submitting.

{{% load-img "/img/screenshot/v1.29/alerting/message-ignore.png" "" %}}
