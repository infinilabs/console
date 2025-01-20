---
weight: 23
title: 如何给 INFINI Console 账户分配 Elasticsearch 索引级别权限
asciinema: true
---

# 如何给 INFINI Console 账户分配 Elasticsearch 索引级别权限

## 简介

本文将介绍使用 INFINI Console 限定某个账户只有 Elasticsearch 集群里面某些索引的管理权限

## 准备

- 下载并安装最新版 INFINI Console
- 开启 INFINI Console [安全功能](../reference/system/security/)
- 注册至少两个 Elasticsearch 集群到 INFINI Console

## 创建角色

点击 INFINI Console 左侧菜单 `系统管理 > 安全设置`，选择角色 Tab 页进入角色管理页。

### 新建平台角色 `platform_role`

点击新建按钮，选择平台角色，新建一个平台角色 `platform_role`
{{% load-img "/img/screenshot/20220719-role-new-platform.jpg" "security settings" %}}

### 新建数据角色 `test_index_only`

点击新建按钮，选择数据角色，新建一个数据角色 `test_index_only`，然后做如下配置：

- 将集群只选择 `es-v7140` （限制该角色只有 Elasticsearch 集群 `es-v7140` 的访问权限）
- 设置索引权限 索引只输入索引 pattern `test*` （限制该角色只有索引名称匹配 `test*` 的索引访问权限）
  {{% load-img "/img/screenshot/20220720-user-index-limit.jpg" "security settings" %}}

配置完成之后点击保存按钮提交。

## 创建账户

点击 INFINI Console 左侧菜单 `系统管理 > 安全设置`，选择用户 Tab 页进入账户管理页。

### 新建账户 `liming`

点击新建按钮，新建账户 `liming`，并赋予这个账户角色 `platform_role`，`test_index_only`

{{% load-img "/img/screenshot/20220720-user-new-liming.jpg" "security settings" %}}
点击保存按钮提交创建成功之后，保存一下账户密码

## 使用管理员账号登录

使用管理员账号登录之后，点击菜单数据管理里面的索引管理，选择集群 `es-v7140`， 然后可以看到：

{{% load-img "/img/screenshot/20220720-user-index-all.jpg" "security settings" %}}

## 使用账号 `liming` 登录

使用账号 `liming` 登录之后，点击菜单数据管理里面的索引管理，选择集群 `es-v7140`， 然后可以看到：
{{% load-img "/img/screenshot/20220720-user-liming-index.jpg" "security settings" %}}

## 小结

通过指定角色的 Elasticsearch 集群权限以及索引权限，可以轻松地将用户的权限分配精准控制到索引级别。
