---
weight: 3
title: 告警渠道
asciinema: true
---

# 告警渠道

## 简介

告警渠道用于当告警规则触发之后，发送通知消息的通道配置，目前支持 `webhook`。

## 渠道列表

在渠道列表中可以查询已经添加的渠道

{{% load-img "/img/screenshot/v1.29/alerting/channels.png" "" %}}

## 新建告警渠道

在渠道列表页面中点击 `新建` 按钮进入新建告警渠道页面

{{% load-img "/img/screenshot/v1.29/alerting/channels-create.png" "" %}}

- 输入渠道名称（必填）
- 选择渠道类型（支持 Email、Slack、钉钉、飞书、企微、自定义 webhook 等多种类型 ）
- 输入 webhook 地址
- 选择 HTTP 请求的方法，默认 POST
- 按需添加 HTTP 请求头
- 配置 webhook 请求体
- 点击保存按钮提交

## 更新渠道配置

在渠道列表中选择需要更新的渠道点击编辑按钮进入更新渠道配置页

{{% load-img "/img/screenshot/v1.29/alerting/channels-edit.png" "" %}}

操作参考新建告警渠道

## 删除告警渠道

点击告警渠道列表表格中的删除按钮，进行二次确认，确认删除后执行删除操作。
