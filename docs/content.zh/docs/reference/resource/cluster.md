---
weight: 2
title: 集群管理
---

# 集群管理

## 简介

集群管理可以快速方便地帮助我们纳管跨版本的多个 Elasticsearch 集群。

## 集群列表

在集群列表中可以查询注册的 Elasticsearch 集群
{{% load-img "/img/screenshot/20220330-cluster_manage.jpg" "cluster list" %}}

## 集群注册

第一步填写集群地址，按需开启 TLS 和 身份验证（开启身份验证后需要输入用户名和密码）。

{{% load-img "/img/screenshot/20220330-cluster_register_step1.jpg" "cluster register step one" %}}

第二步，信息确认

- 按需修改集群名称，集群描述；
- 是否开启监控（默认开启），启用监控之后可以在 console 监控功能里面查看 Elasticsearch 集群的各种指标
- 是否开启 Discovery（推荐开启） , 启用之后 console 会自动发现集群所有节点，当配置的集群地址不可用时，console 会尝试使用自动发现的其他节点中可用的地址和 Elasticsearch 交互

{{% load-img "/img/screenshot/20220330-cluster_register_step2.jpg" "cluster register step two" %}}

## 更新集群配置

点击集群列表表格中的编辑按钮，进入更新界面

{{% load-img "/img/screenshot/20220705-cluster-update.jpg" "cluster update" %}}

按需修改配置，然后点击保存按钮提交

## 删除集群

点击集群列表表格中的删除按钮，进行二次确认，确认删除后执行删除操作。
