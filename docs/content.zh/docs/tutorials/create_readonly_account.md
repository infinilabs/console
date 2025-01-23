---
weight: 21
title: 如何轻松创建一个 Elasticsearch “游客” 用户
asciinema: true
---

# 如何轻松创建一个 Elasticsearch “游客” 用户

## 简介

有些情况下，我们想给客户分享一下某些功能或者数据，但是又不希望数据被修改。这个时候我们就需要创建一个“游客” 用户了。本文简单地介绍了如何使用 INFINI Console 创建"游客"用户。

## 准备

- 下载并安装最新版 INFINI Console
- 开启 INFINI Console [安全功能](../reference/system/security/)

## 创建角色

点击 INFINI Console 左侧菜单 `系统管理 > 安全设置`，选择角色 Tab 页进入角色管理页。

### 新建平台角色 `readonly`

点击新建按钮，选择平台角色，新建一个平台角色 `readonly`，操作步骤如下：

- 输入角色名称 `readonly`
- 展开所有的功能权限
- 除了系统设置下面的安全功能，其他所有的功能都选择 `Read` 权限。
- 系统设置下面的安全功能 设置为 `None` 权限。
- 点击保存按钮提交
  > 选择某个功能的 `All` 权限代表拥有这个功能的读和写的操作权限，
  > `Read` 代表只拥有读的权限，
  > `None` 代表没有该功能权限（用户登录之后菜单中没有该功能）

{{% load-img "/img/screenshot/20220720-role_readonly.jpg" "security settings" %}}

### 新建数据角色 `es-v7171`

点击新建按钮，选择数据角色，新建一个数据角色 `es-v7171`，操作步骤如下：

- 输入角色名称 `es-v7171`
- 集群权限选择集群 `es-v7171`
- 点击保存按钮提交
  {{% load-img "/img/screenshot/20220719-role-v7171.jpg" "security settings" %}}

## 新建账户 `guest`

点击 INFINI Console 左侧菜单 `系统管理 > 安全设置`，选择用户 Tab 页进入账户管理页。
点击新建按钮，新建账户 `guest`，并赋予这个账户角色 `readonly`，`es-v7171`

{{% load-img "/img/screenshot/20220720-user-new-guest.jpg" "security settings" %}}

点击保存提交，创建成功之后就可以使用 `guest` 账户登录 INFINI Console，并且只拥有只读权限。
