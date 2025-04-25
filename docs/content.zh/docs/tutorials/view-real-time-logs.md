---
weight: 61
title: 如何使用 Console 查看 INFINI 组件实时日志
asciinema: true
---

# 如何使用 Console 查看 INFINI 组件实时日志

## 简介

如果你安装了几十个 INFINI Gateway 实例，现在有个需求是查看 gateway
的日志，怎么办呢？登录服务器，然后用 `tail -f gateway.log`
去查看日志。这样操作是可以，但是有没有更高端的操作呢？肯定是有的，下面我们就以查看
INFINI Gateway 实时日志为例详细介绍 `如何使用 Console 查看 INFINI 组件实时日志`

## 准备

- 下载并安装最新版 INFINI Console (版本要求 1.1.0 及以上)
- 下载并安装最新版的 INFINI Gateway (版本要求 1.13.0 及以上)

## 配置说明

```aidl
api:
  enabled: true
  network:
    binding: "localhost:2900"
  websocket:
    enabled: true
    #忽略客户端 host 检查
    skip_host_verify: true
    #设置允许连接的客户端 host 列表，skip_host_verify 为 false 时生效
    permitted_hosts: ["localhost:2900"]
```

以 INFINI Gateway v1.13.0 及以上默认配置都是开启 websocket 并且忽略客户端 host 检查的。

## 注册网关实例

在 Console 中查看 Gateway 日志，首先得把 Gateway 实例在 Console 中注册，详细步骤请参考文档
[实例管理](../reference/resource/runtime/)

## 查看 gateway 实时日志

登录 Console 之后点击左侧菜单 `资源管理 > 实例管理`，如下图：

{{% load-img "/img/screenshot/v1.29/inventory/runtime-instance-logging.png" "" %}}

然后选择相应的 Gateway 实例，点击 `Logging` 进入查看日志页面，如下图：

{{% load-img "/img/screenshot/v1.29/inventory/runtime-instance-logging-start.png" "" %}}

到这里，如上图先查看右侧连接状态是否正常，选择推送实时日志级别，然后点击 `Start`
按钮就可以查看实时的推送日志了，如下图：

{{% load-img "/img/screenshot/v1.29/inventory/runtime-instance-logging-stop.png" "" %}}

- 这里默认会自动滚动日志，查看最新日志，也可关闭开关
- 如果需要过滤日志，可以先点击 `Stop` 停止，然后再相应输入框中根据文件名，调用函数名，消息内容过滤，输入完成之后重新
  点击开始，即可接受到服务器端根据条件过滤后的日志了。

## 小结

通过 Console 查看 Gateway 的实时日志可以说非常方便快捷，无需登录服务器，然后找到日志文件查看日志这些
繁琐的操作，在管理多个实例的时候使用此功能优势就更明显了。
