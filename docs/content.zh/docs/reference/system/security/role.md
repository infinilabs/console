---
weight: 35
title: 角色管理
asciinema: true
---

# 角色管理

## 简介

角色管理包括对角色的增删改查操作。 INFINI Console 内置了一个管理员角色，角色名为
`Administrator`, 该角色拥有所有的操作权限, 包括所有的平台权限和数据权限。 数据角色用于控制 elasticsearch 集群的访问权限,
包括 elasticsearch API 的访问权限， elasticsearch API 的列表可以在安装目录下的 config/permission.json 文件中配置。

## 创建平台角色

{{% load-img "/img/screenshot/v1.29/settings/security-role-platform-create.png" "" %}}

- 输入唯一的角色名.
- 选择平台权限，不能为空.
- 按需输入角色描述
- 点击保存按钮保存

`All` 权限代表同时拥有读和写的权限, `Read`
代表只读权限, `None` 代表没有权限。

## 创建数据角色

{{% load-img "/img/screenshot/v1.29/settings/security-role-data-create.png" "" %}}

- 输入唯一的角色名.
- 选择一个或者多个集群， `*` 代表选择所有集群.
- 配置集群级别 API 权限, `*` 代表所有集群级别 API 权限.
- 配置索引级别 API 权限, `*` 代表所有索引级别 API 权限.
- 按需输入角色描述
- 点击保存按钮保存

## 查询角色

{{% load-img "/img/screenshot/v1.29/settings/security-role.png" "" %}}

输入关键字点击搜索按钮查询角色。

## 更新平台角色

{{% load-img "/img/screenshot/v1.29/settings/security-role-platform-edit.png" "" %}}

按需修改角色，然后点击保存按钮保存。

## 更新数据角色

{{% load-img "/img/screenshot/v1.29/settings/security-role-data-edit.png" "" %}}

按需修改角色，然后点击保存按钮保存。
