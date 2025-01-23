---
weight: 2
title: Keystore
---

# Keystore

## 简介

在配置里面直接明文配置用户密码是非常不安全的操作，通过使用 Keystore 可以很方便的帮助您以键值对的方式管理敏感数据，如用于密码，TOKEN 等身份验证信息管理。
Keystore 管理功能以 keystore 子命令的方式 支持，查看 KEY 列表，添加和删除 SECRET。

## 获取 Keystore 命令帮助

命令行进入 console 安装目录，然后执行 `./console-xxx-xxx keystore -h`
输出如下：

```
usage : keystore <command> [<args>]
These are common keystore commands used in various situations:
add	Add keystore secret
list	List keystore keys
remove	remove keystore secret
```

## 查看 Keystore Key 列表

命令行输入 `./console-xxx-xxx keystore list`,然后会输出 Keystore 存储的所有 Key 如下：

```
test
test1
testx
```

## 添加 Keystore Secret

命令行输入 `./console-xxx-xxx keystore add -h` 获取帮助如下：

```
Usage of add secret:
  -force
    	Override the existing key
  -stdin
    	Use the stdin as the source of the secret
```

可以看到添加 keystore secret `add` 子命令有两个选项

- -force 带上这个选项，如果添加 secret 的 Key 值是存在的会自动覆盖旧值，否则直接退出
- -stdin 标准输入上回显 secret，不带这个选项默认隐藏输入 secret

添加一个 Key 为 `hello` 的 Secret `./console-xxx-xxx keystore add hello`
然后输入 secret 值就可以了

## 删除 Keystore Secret

以删除 Key 为 `hello` 的 Secret 为例，命令行输入 `./console-xxx-xxx keystore remove hello` 就可以了

## keystore 应用

INFINI Console, INFINI Gateway, INFINI Agent 都是支持上述功能的。

### 配置文件中使用 keystore

首先使用 Keystore 命令 创建 Key 为 `default_cluster_password` 的 Secret；
然后在 INFINI Gateway 配置文件中 gateway.yml 使用

```
elasticsearch:
  - name: default
    enabled: true
    endpoint: http://192.168.3.8:9200
    basic_auth:
      username: elastic
      password: $[[keystore.default_cluster_password]]
```

[comment]: <> (### 告警模版中使用 keystore)

[comment]: <> (使用函数 `get_keystore_secret`，传递 Secret Key 作为参数就可以拿到)

[comment]: <> (Keystore secret 的值了。示例：在告警模版中获取 key 为 `weixin_access_token`的 Secret 值，如下：)

[comment]: <> (```)

[comment]: <> ({{get_keystore_secret "weixin_access_token"}})

[comment]: <> (```)
