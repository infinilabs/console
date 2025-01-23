---
weight: 22
title: 如何给不同 INFINI Console 账户分配不同 Elasticsearch 集群访问权限
asciinema: true
---

# 如何给不同 INFINI Console 账户分配不同 Elasticsearch 集群访问权限

## 简介

本文将介绍使用 INFINI Console 给两个不同账户分配两个不同的 Elasticsearch 集群管理权限

## 准备

- 下载并安装最新版 INFINI Console
- 开启 INFINI Console [安全功能](../reference/system/security/)
- 注册至少两个 Elasticsearch 集群到 INFINI Console

## 创建角色

点击 INFINI Console 左侧菜单 `系统管理 > 安全设置`，选择角色 Tab 页进入角色管理页。

### 新建平台角色 `platform_role`

点击新建按钮，选择平台角色，新建一个平台角色 `platform_role`，操作步骤如下：

- 输入角色名称 `platform_role`
- 展开所有的功能权限
- 除了系统设置下面的安全功能，其他所有的功能都选择 `All` 权限。
- 系统设置下面的安全功能 设置为 `None` 权限。
- 点击保存按钮提交
  > 选择某个功能的 `All` 权限代表拥有这个功能的读和写的操作权限，
  > `Read` 代表只拥有读的权限，
  > `None` 代表没有该功能权限（用户登录之后菜单中没有该功能）

{{% load-img "/img/screenshot/20220719-role-new-platform.jpg" "security settings" %}}

### 新建数据角色 `es-v7171`

点击新建按钮，选择数据角色，新建一个数据角色 `es-v7171`

{{% load-img "/img/screenshot/20220719-role-v7171.jpg" "security settings" %}}

### 新建数据角色 `es-v630`

点击新建按钮，选择数据角色，新建一个数据角色 `es-v630`，配置同角色 `es-v7171` 类似

## 创建账户

点击 INFINI Console 左侧菜单 `系统管理 > 安全设置`，选择用户 Tab 页进入账户管理页。

### 新建账户 `zhangsan`

点击新建按钮，新建账户 `zhangsan`，并赋予这个账户角色 `platform_role`，`es-v717`

{{% load-img "/img/screenshot/20220719-user-zhangsan.jpg" "security settings" %}}
点击保存按钮提交创建成功之后，保存一下账户密码

{{% load-img "/img/screenshot/20220719-user-new-password.jpg" "security settings" %}}

### 新建账户 `wangwu`

点击新建按钮，新建账户 `wangwu`，并赋予这个账户角色 `platform_role`，`es-v630` ,配置同账户 `zhangsan` 类似

## 使用管理员账号登录

使用管理员账号登录之后，查看平台概览，注册的 13 个集群都可以看到

{{% load-img "/img/screenshot/20220719-user-admin-view.jpg" "security settings" %}}

## 使用账号 `zhangsan` 登录

使用账号 `zhangsan` 登录之后，查看平台概览，只能看到集群 `es-v7171`
{{% load-img "/img/screenshot/20220719-user-zhangsan-view.jpg" "security settings" %}}

## 使用账号 `wangwu` 登录

使用账号 `zhangsan` 登录之后，查看平台概览，只能看到集群 `es-v630`
{{% load-img "/img/screenshot/20220719-user-wangwu-view.jpg" "security settings" %}}

## 小结

通过创建不同的角色并且赋予不同的 Elasticsearch 集群权限，然后将角色赋予用户，我们可以快速的实现
对不同用户赋予不同的 Elasticsearch 集群权限。
