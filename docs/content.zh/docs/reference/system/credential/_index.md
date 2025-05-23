---
weight: 1
title: "凭据管理"
---

# 凭据管理

## 简介

凭据敏感信息使用加密存储。 凭据管理可以帮助我们将身份验证信息集中管理，需要用的地方直接引用，提高了身份验证信息的存储安全性。

> 凭据敏感信息加密密钥在 INFINI Console 安装初始化是自动生成或用户自定义设置。该密钥需要用户妥善保存，如果密钥丢失，当升级 INFINI Console 并且重新初始化系统后，先前保存的凭据信息将无法解密。

## 凭据列表

在凭据列表中可以查询已创建的凭据信息，支持关键词搜索

{{% load-img "/img/screenshot/v1.29/settings/credential.png" "" %}}

## 添加凭据

点击凭据列表右上角"添加"按钮，右侧弹出添加凭据窗口如下：

{{% load-img "/img/screenshot/v1.29/settings/credential-create.png" "" %}}

- 选择凭据类型（当前仅支持 basic auth）
- 输入凭据名称（必填）
- 输入用户名和密码（必填）
- 给凭据设置标签（可选）
- 点击添加完成

## 更新凭据

点击凭据列表表格中的编辑按钮，右侧弹出更新凭据窗口如下：

{{% load-img "/img/screenshot/v1.29/settings/credential-edit.png" "" %}}

按需修改配置，然后点击保存按钮提交

## 删除凭据

点击凭据列表表格中的删除按钮，进行二次确认，确认删除后执行删除操作（如果系统检测到该凭据有被引用，则无法删除）。
