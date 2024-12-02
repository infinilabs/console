---
weight: 2
title: "Security"
bookCollapseSection: true
---

# Security

## Introduction

INFINI Console Security provides the following security benefits and capabilities:

- Grant different platform privileges to different users
- Grant different elasticsearch cluster privileges to users, include indices level and API level

INFINI Console Security has two role type

- Platform Role，used to control platform privileges
- Data Role, used to control data privileges

INFINI Console Security is enabled by default，and we can disable it by configure section `web>auth>enabled` to `false` in config file `cosnole.yml` as follows：

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

> Password is required to login INFINI Console when Security is enabled 。INFINI Console has a builtin account with both username and password are `admin` 。
