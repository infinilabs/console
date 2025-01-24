---
weight: 3
title: LDAP Integration
---

# LDAP Configuration

## Description

In certain scenarios, after a user is authenticated through a realm, we may want to delegate user lookup and role assignment to another realm. Any realm that supports user lookup (without requiring user credentials) can be used as an authentication realm.

For example, a user authenticated through a Kerberos realm can be looked up in an LDAP realm. The LDAP realm is responsible for searching for the user in LDAP and determining their roles. In this case, the LDAP realm acts as an authentication realm.

## Configuration Example

A reference configuration example is as follows:

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

The above configuration uses two external LDAP servers named `myprovider1` and `myprovider2` as authentication sources. Either LDAP server can provide authentication services. The `role_mapping` settings associate the UID and Group returned by LDAP with roles in the INFINI Console.
## Parameter Description

| Name               | Type   | Description                                            |
|--------------------|--------| ----------------------------------------------- |
| host               | string | LDAP server address                               |
| port               | int    | LDAP server port, default is `389`                     |
| tls                | bool   | Whether the LDAP server uses TLS, default is `false` |
| bind_dn            | string | User information for executing LDAP queries                        |
| bind_password      | string | Password for executing LDAP queries                        |
| base_dn            | string | Root domain for filtering LDAP users                            |
| user_filter        | string | Query condition for filtering LDAP users, default is `(uid=%s)`       |
| uid_attribute      | string | Attribute used for user ID, default is `uid`                  |
| group_attribute    | string | Attribute used for user groups, default is `cn`                     |
| role_mapping.uid   | map    | Permission mapping based on user UID                     |
| role_mapping.group | map    | Permission mapping based on user Group                   |

> Note: If the `uid` or `group` values in `role_mapping` contain ., please upgrade INFINI Console to version `1.28.1` or later.

## Additional Resources
* [INFINI Console LDAP Configuration Tutorial](https://www.bilibili.com/video/BV1kj411S74B/) Video Introduction
* [FAQ](https://www.infinilabs.cn/blog/2023/console-ldap-setting/)