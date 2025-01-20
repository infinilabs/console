---
weight: 1
title: 开发工具
---

# 开发工具

## 简介

使用开发工具可以快速地编写和执行 Elasticsearch 查询以及其他的 elasticsearch API。
当开启安装验证后，所有的请求都会经过 API 级别权限校验

## 打开开发工具

使用 Ctrl+Shift+O 快捷键打开或者在 console 右上角图标打开。

{{% load-img "/img/screenshot/20220330-devtool.jpg" "dev tool" %}}

## 执行请求快捷键

Command+Enter 或者 Ctrl+Enter

## 多集群多 Tab 页支持

开发工具支持使用 Tab 页同时打开多个集群，即使是同一个集群，也可以打开多个，Tab 页之间状态是独立的。
Tab 页默认使用集群名称作为标题，双击 Tab 页标题可以修改。
开发工具下方是一个状态栏，左侧是当前集群的健康状态、http 地址、版本信息，
右侧是 elasticsearch 接口请求的响应状态以及时长。

{{% load-img "/img/screenshot/20220330-devtool_tab.jpg" "dev tool tab" %}}

## 查看请求头信息

当使用开发工具执行 elasticsearch 请求之后，可以在右侧点击 headers Tab 页查看请求头信息。
{{% load-img "/img/screenshot/20220706-devtool-headers.jpg" "dev tool headers" %}}
