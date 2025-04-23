---
weight: 10
title: 功能介绍
bookCollapseSection: false
---

## 功能介绍

## 简介

**INFINI Agent** 是 INFINI Console 的一个可选组件，负责采集和上传 Elasticsearch, Easysearch, Opensearch 集群的日志和指标信息，通过 INFINI Console 管理。**INFINI Agent** 支持主流操作系统和平台，安装包轻量且无任何外部依赖，可以快速方便地安装。

Agent 功能特性：

- 采集上传 Elasticsearch 等集群健康信息/集群 stats/索引 stats/节点 stats 信息
- 采集上传 Elasticsearch 等实例节点日志
- 采集主机指标信息

## 快速安装探针

进入菜单 `资源管理` > `探针管理` 点击按钮 `Install Agent`。 可以看到 Console 会自动生成一段安装脚本，然后只需要点击脚本右上方的复制 Icon，
就可以复制安装脚本了。

{{% load-img "/img/screenshot/v1.29/agent/agent-install.jpg" %}}

将在 Console 中复制的安装脚本粘贴到目标主机上就可以实现一键快速安装了，生成的配置文件内容类似如下：

```aidl
path.configs: config
configs.auto_reload: true
env:
  API_BINDING: 0.0.0.0:8080

path.data: data
path.logs: log

api:
  enabled: true
  tls:
    enabled: true
    cert_file: config/client.crt
    key_file: config/client.key
    ca_file: config/ca.crt
    skip_insecure_verify: false
  network:
    binding: $[[env.API_BINDING]]

badger:
  value_log_max_entries: 1000000
  value_log_file_size: 104857600
  value_threshold: 1024

agent:
  major_ip_pattern: .*
```

这里的证书在安装的时候由 console 自动生成的，安装成功之后探针实例会被自动注册到 Console，
Console 后续和 agent 通过 mtls 的方式通信。安装过成中使用的 token 仅供快速安装 agent 时使用，不能
用于其他 API, token 有效期为 `一个小时`。

> 这里要求 Console 所在主机和安装 Agent 主机网络是互通的

## 探针实例注册

第一步填写探针地址，按需开启 TLS 和 身份验证（开启身份验证后需要输入用户名和密码）。

{{% load-img "/img/screenshot/v1.29/agent/agent-register-step1.jpg" %}}

第二步，信息确认，按需修改探针名称，标签，描述信息。

{{% load-img "/img/screenshot/v1.29/agent/agent-register-step2.jpg" %}}
输入完成之后，点击下一步完成注册

> 通过 INFINI Console 一键安装脚本安装 Agent 会自动注册 Console，无需手动注册

## 探针实例列表

在探针实例列表可以查询注册的探针实例，如下：
{{% load-img "/img/screenshot/v1.29/agent/agent-list.jpg" %}}

表格行展开可以看到探针上所有的 Elasticsearch, Easysearch, Opensearch 节点实例进程列表，展开后点击右上角刷新按钮可以刷新进程列表信息

## 节点进程关联到 Console 已注册集群

将探针自动发现的 Elasticsearch, Easysearch, Opensearch 节点实例进程关联到 Console 中已注册的集群，即可使用 Agent 采集集群指标以及节点日志。
采集的集群指标数据直接可以在 Console 监控功能中使用，关联具体操作流程如下。

在节点实例进程列表中点击 `关联` 会出现如下界面：
{{% load-img "/img/screenshot/v1.29/agent/agent-node-associate.jpg" %}}

- 如果该节点进程实例集群已经注册到 Console， 那么只需要在弹出窗口点击 `关联` 即可完成操作。关联成功之后，Agent 会自动采集集群指标以及
  节点日志。
- 如果该节点进程需要身份验证信息，关联弹出窗口如下图所示：
  {{% load-img "/img/screenshot/v1.29/agent/agent-node-associate-auth.jpg" %}}
  这里需要输入节点地址，和身份验证信息之后尝试连接，获取节点所在集群信息
- 如果该节点所在集群还没有在 Console 中注册，关联弹出窗口如下图所示：
  {{% load-img "/img/screenshot/v1.29/agent/agent-node-associate-unregistration.jpg" %}}
  这里只需要按照提示，点击 `go to register` 去注册集群，注册集群成功之后，再进行关联操作即可。

## 编辑探针信息

点击探针列表表格中的编辑按钮，进入更新界面

{{% load-img "/img/screenshot/v1.29/agent/agent-edit.jpg" %}}

按需修改配置，然后点击保存按钮提交

## 删除探针实例

进入菜单 `资源管理` > `探针管理`，在列表中点击对应列的 `删除`，确认之后，探针即被删除。
{{% load-img "/img/screenshot/v1.29/agent/agent-delete-instance.jpg" %}}
