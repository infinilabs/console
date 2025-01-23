---
weight: 1
title: 安装向导
---

# 安装向导

## 简介

首次安装后打开系统，会进入初始化向导页面，在这里需要初始化一些配置，如系统集群、初始化默认用户等。

## 配置

配置系统集群，elasticsearch 要求 5.3 或更高版本，用于存储相关数据。

{{% load-img "/img/screenshot/initialization/configuration.png" %}}

- TLS

  默认 http，开启后为 https。

- Auth

  默认不需要连接认证，开启后，需要输入用户名&密码。

  {{% load-img "/img/screenshot/initialization/configuration-auth.png" %}}

- 连接测试

  测试输入的连接配置，成功后即可进行下一步。

  {{% load-img "/img/screenshot/initialization/configuration-test.png" %}}

## 初始化

进入初始化步骤时，会校验集群中是否已存在旧数据，进行相关操作后再进入初始化配置。

### 校验

- 存在旧数据

  {{% load-img "/img/screenshot/initialization/initialization-history.png" %}}

  可以使用提示的脚本删除旧数据后，点击刷新后进入初始化；也可以点击跳过，使用旧数据。

- 不存在旧数据

  将会直接进入初始化

### 配置

- 使用旧数据

  只需配置凭据密钥

  {{% load-img "/img/screenshot/initialization/initialization-create-old.png" %}}

- 不使用旧数据

  需配置默认用户的用户名和密码，还需配置凭据密钥

  {{% load-img "/img/screenshot/initialization/initialization-create.png" %}}

## 完成

当初始化完成后，会显示已配置的信息，请点击下载并妥善保管。

{{% load-img "/img/screenshot/initialization/finish.png" %}}
