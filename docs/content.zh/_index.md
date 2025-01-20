---
title: INFINI Console
type: docs
bookCollapseSection: true
weight: 2
---

# INFINI Console

## 介绍

**INFINI Console** 一款非常轻量级、功能强大的多集群、跨版本的 Elasticsearch 统一管控平台。
通过对 Elasticsearch 跨版本多集群的集中纳管，我们可以快速方便的对企业内部的所有 Elasticsearch 集群进行统一管理。

## 架构

{{% load-img "/img/architecture.png" "Architecture Overview" %}}

## 特性

> INFINI Console 功能强大、轻量级、使用起来也非常简单。

- 支持多集群管理，可以在一个平台内同时纳管任意多套集群；
- 多版本 Elasticsearch 支持，支持 1.x、2.x、5.x、6.x、7.x、8.x；
- 支持以项目为单位来分组管理集群的元数据信息、支持标签；
- 支持动态注册添加集群，目标集群无需任何变动即可被接入管理；
- 支持统一的多集群层面、索引和 API 接口粒度的权限控制；
- 支持统一的跨集群的告警引擎，灵活配置基于阈值的告警规则；
- 支持查看集群元数据的历史变更信息，用于审计、追踪集群变化；
- 开发者工具支持多个工作区快速切换，支持智能提示，支持常用命令保存和快捷加载；
- 支持任意版本的集群监控，包括集群、节点、索引等详细维度的指标查看和分析；
- 支持索引的管理操作，支持索引的快速查看浏览，支持索引内文档的更新、删除；
- 支持创建索引数据视图，可以修改字段的展示格式，支持时序索引数据的快速查看；
- 支持跨平台部署环境，支持 MacOS(Intel 和 M1)、Windows(32 位和 64 位)、Linux(32 位和 64 位);
- 支持 x86、arm5、arm6、arm7、mips、mipsle、mips64 等 CPU 架构:
- 支持 Docker 容器和 K8s 云原生环境；
- 支持极限网关的集中管理；

INFINI Console 使用 Golang 编写，安装包很小，只有 11MB 左右，没有任何外部环境依赖，部署安装也都非常简单，只需要下载对应平台的二进制可执行文件，启动程序文件执行即可。

{{< button relref="./docs/getting-started/install" >}}即刻开始{{< /button >}}

## 系统截图

{{% load-img "/img/screenshot/screenshot2023/overview.png" "overview" %}}
{{% load-img "/img/screenshot/20220330-devtool_tab.jpg" "多个工作区并存" %}}
{{% load-img "/img/screenshot/20220330-cluster_manage.jpg" "Elasticsearch 集群管理" %}}

{{< button relref="./docs/screenshot" >}}更多截图{{< /button >}}

## 社区

[加入我们的 Discord](https://discord.gg/4tKTMkkvVX)


## 谁在用?

如果您正在使用 INFINI Console，并且您觉得它还不错的话，请[告诉我们](https://discord.gg/4tKTMkkvVX)，所有的用户案例我们会集中放在[这里](./docs/user-cases/)，感谢您的支持。

