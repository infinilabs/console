---
title: "常见问题"
weight: 50
---

# 常见问题及故障处理

这里主要收集 INFINI Console 使用过程中遇到的常见问题及处理办法，欢迎反馈提交到[这里](https://github.com/infinilabs/console/issues/new/choose)。

## 常见问题

### Elasticsearch 前面加上 Nginx，平台提示 400 错误

类似错误日志如下：

```
[11-25 18:26:58] [TRC] [v0.go:390] search response: {"query":{"match":{"status": "RUNNING"}}},<!DOCTYPE html>
  <title>Error 400 (Bad Request)!!1</title>
  <p><b>400.</b> <ins>That’s an error.</ins>
  <p>Your client has issued a malformed or illegal request.  <ins>That’s all we know.</ins>
[11-25 18:26:58] [ERR] [init.go:87] json: invalid character '<' looking for beginning of value: <!DOCTYPE html>
<html lang=en>
```

#### 问题描述

Nginx 对于 GET 请求类型，不支持传递请求体

#### 解决方案

将 INFINI Console 升级最新版本。

### 注册集群后监控数据不显示

如下如所示：
{{% load-img "/img/troubleshooting/monitor_no_data.png" "集群监控不显示数据" %}}

#### 问题描述

INFINI Console 需要用到 Elasticsearch 7.0 以上版本的一些特性

#### 解决方案

将 INFINI Console 存储数据的 ES 集群版本升级到 v7.0+

### 启动报错

```
[03-23 08:38:20] [ERR] [metadata.go:529] {"error":{"root_cause":[{"type":"illegal_argument_exception","reason":"Can't merge a non object mapping [payload.node_state.settings.http.type] with an object mapping [payload.node_state.settings.http.type]"}],"type":"illegal_argument_exception","reason":"Can't merge a non object mapping [payload.node_state.settings.http.type] with an object mapping [payload.node_state.settings.http.type]"},"status":400}
```

或者出现错误

```
[04-16 09:45:06] [ERR] [schema.go:144] error on update mapping: {"root_cause":[{"type":"mapper_parsing_exception","reason":"Failed to parse mapping [_doc]: analyzer [suggest_text_search] has not been configured in mappings"}],"type":"mapper_parsing_exception","reason":"Failed to parse mapping [_doc]: analyzer [suggest_text_search] has not been configured in mappings","caused_by":{"type":"illegal_argument_exception","reason":"analyzer [suggest_text_search] has not been configured in mappings"}}
```

#### 问题描述

版本 v0.3 修改了模板和 Mapping，如果升级之前未手动更新模板，旧索引已经存在且 Mapping 不是期望的 object 类型，会提示字段冲突或者分析器找不到。

关于升级，请参考 [升级说明](../upgrade/)

#### 解决方案

- 停止 INFINI Console
- 删除索引模板 `.infini`

```
DELETE _template/.infini
```

- 删除索引 `.infini_node` 和 `.infini_index`

```
DELETE .infini_node
DELETE .infini_index
```

- 启动 INFINI Console
