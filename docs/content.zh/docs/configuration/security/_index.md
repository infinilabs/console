---
weight: 3
title: LDAP 集成
---

# LDAP 配置

## 描述

在某些情况下，在用户通过一个域（realm）进行身份验证后，我们可能希望将用户的查找和角色分配委托给另一个域。任何支持用户查找（无需用户凭证）的领域都可以用作认证域。

例如，通过 Kerberos 域进行身份验证的用户可以在 LDAP 域中进行查找。LDAP 域负责在 LDAP 中搜索用户并确定其角色。在这种情况下，LDAP 域充当认证域。

## 配置示例

一个参考配置示例如下：

```
security:
  enabled: true
  authc:
    realms:
      ldap:
        myprovider1:
          enabled: true
          host: "localhost"
          port: 3893
          bind_dn: "cn=serviceuser,ou=svcaccts,dc=glauth,dc=com"
          bind_password: "mysecret"
          base_dn: "dc=glauth,dc=com"
          user_filter: "(cn=%s)"
          group_attribute: "ou"
          bypass_api_key: true
          cache_ttl: "10s"
          role_mapping:
            group:
              superheros: [ "Administrator" ]
            uid:
              hackers: [ "Administrator" ]
        myprovider2:
          enabled: true
          host: "ldap.forumsys.com"
          port: 389
          bind_dn: "cn=read-only-admin,dc=example,dc=com"
          bind_password: "password"
          base_dn: "dc=example,dc=com"
          user_filter: "(uid=%s)"
          cache_ttl: "10s"
          role_mapping:
            uid:
              tesla: [ "readonly","data" ]
```

上面的配置使用了两个名为 `myprovider1` 和 `myprovider2` 的外部 LDAP 服务器作为认证渠道，任何一个 LDAP 都可以提供认证服务，通过 `role_mapping` 设置关联 LDAP 返回的 UID 和 Group 到 Console 里面的角色信息。

## 参数说明

| 名称               | 类型   | 说明                                             |
| ------------------ | ------ | ------------------------------------------------ |
| host               | string | LDAP 服务器地址                                  |
| port               | int    | LDAP 服务器端口，默认 `389`                      |
| tls                | bool   | LDAP 服务器是否为 TLS 安全传输协议，默认 `false` |
| bind_dn            | string | 执行 LDAP 查询的用户信息                         |
| bind_password      | string | 执行 LDAP 查询的密码信息                         |
| base_dn            | string | 过滤 LDAP 用户的根域                             |
| user_filter        | string | 过滤 LDAP 用户的查询条件，默认 `(uid=%s)`        |
| uid_attribute      | string | 用于用户 ID 的属性，默认 `uid`                   |
| group_attribute    | string | 用于用户组的属性，默认 `cn`                      |
| role_mapping.uid   | map    | 用于基于用户 UID 的权限映射                      |
| role_mapping.group | map    | 用于基于用户 Group 的权限映射                    |

## 其他资源
* [INFINI Console LDAP 配置教程](https://www.bilibili.com/video/BV1kj411S74B/) 视频介绍
* [常见问题](https://www.infinilabs.cn/blog/2023/console-ldap-setting/)