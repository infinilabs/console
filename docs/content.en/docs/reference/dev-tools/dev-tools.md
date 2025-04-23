---
weight: 1
title: Dev Tools
---

# Dev Tools

## Introduction

Use Dev Tools to quickly write and execute Elasticsearch queries and other elasticsearch APIs.
When installation verification is enabled, all requests will go through API level permission verification

## Open Dev Tools

Use the Ctrl+Shift+O shortcut to open or click the icon in the upper right corner of the console.

{{% load-img "/img/screenshot/v1.29/devtools/devtools.png" "" %}}

## Execute request shortcuts

Command+Enter or Ctrl+Enter

## Multi-cluster multi-tab page support

The Dev Tools supports the use of tab pages to open multiple clusters at the same time. Even if it is the same cluster, multiple clusters can be opened, and the status of the tab pages is independent.
The tab page uses the cluster name as the title by default, and can be modified by double-clicking the tab page title.
Below the Dev Tools is a status bar, and on the left is the health status, http address, and version information of the current cluster.
On the right is the response status and duration of the elasticsearch interface request.

{{% load-img "/img/screenshot/v1.29/devtools/devtools-tab.png" "" %}}

## View request header information

After using the Dev Tools to execute the elasticsearch request, you can click the headers Tab page on the right to view the request header information.

{{% load-img "/img/screenshot/v1.29/devtools/devtools-header.png" "" %}}
