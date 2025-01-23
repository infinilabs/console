---
weight: 2
title: "安全设置"
bookCollapseSection: true
---

# 安全设置

## 简介

INFINI Console Security 具有以下安全方面的能力和优势:

- 给不同的用户授权访问不同的平台功能
- 给不同的用户授权不同的 Elasticsearch 集群访问权限，权限粒度可以控制到索引级别和 Elasticsearch API 级别

INFINI Console Security 包含两种角色

- 平台角色，用于平台功能层面的权限控制
- 数据角色, 用于控制 Elasticsearch 集群数据的权限控制

INFINI Console Security 默认是开启的，如果需要关闭，可以修改 console.yml 配置文件中的 `web>auth>enabled` 配置,将其改为 `false`,如下所示：

```aidl
web:
  enabled: true
  embedding_api: true
  auth:
    enabled: false
  ui:
    enabled: true
    path: .public
    vfs: true
    local: true
  network:
    binding: 0.0.0.0:9000
    skip_occupied_port: true
  gzip:
    enabled: true
```

> 开启安全功能之后，需要用户密码登录 INFINI Console 。INFINI Console 内置了一个管理员账户，账户名和密码都为 `admin` 。
