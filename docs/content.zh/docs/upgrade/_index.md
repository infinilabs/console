---
weight: 80
title: "升级说明"
---

# 版本更新

这里是 INFINI Console 版本升级的相关说明。

如果您在升级过程中遇到问题，欢迎前往 INFINI Labs Github（<https://github.com/infinilabs/console/issues>）Console 项目中提交 Issue。也可以通过 Discord 聊天室（<https://discord.gg/4tKTMkkvVX>）或添加微信小助手（INFINI-Labs）跟我们取得联系与反馈。

## 从 v1.27.x 升级至 v1.28.0

Console v1.28.0 版本新增了 TopN 功能，用于快速识别排名前 N 的关键指标数据点。它通过强大的多维度指标分析能力，帮助用户更高效地进行性能优化与决策分析。

如果您不是通过全新安装的 **INFINI Console**， 而是通过旧版本升级的，那么您需要如下额外操作才能正常使用：

1. 复制如下指标脚本 DSL 到 **INFINI Console** 开发工具里面。
2. 将指标脚本 DSL 中字符串 `$[[SETUP_INDEX_PREFIX]]` 批量替换成实际的索引前缀，如果您未修改该配置，默认为 `.infini_`
3. 执行指标脚本 DSL

{{< details "指标脚本 DSL" "..." >}}

```dsl
#shard level
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/bD2jH5QB7KvGccywNCH9
{
  "id": "bD2jH5QB7KvGccywNCH9",
  "name": "Indexing Rate",
  "key": "indexing_rate",
  "level": "shard",
  "formula": "bD2jH5QB7KvGccywNCH9/{{.bucket_size_in_second}}",
  "items": [
    {
      "name": "bD2jH5QB7KvGccywNCH9",
      "field": "payload.elasticsearch.shard_stats.indexing.index_total",
      "statistic": "rate"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "doc/s",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/bD2jH5QB7KvGccywNCH1
{
  "id": "bD2jH5QB7KvGccywNCH1",
  "name": "Shard Storage",
  "key": "shard_storage",
  "level": "shard",
  "formula": "bD2jH5QB7KvGccywNCH1",
  "items": [
    {
      "name": "bD2jH5QB7KvGccywNCH1",
      "field": "payload.elasticsearch.shard_stats.store.size_in_bytes",
      "statistic": "max"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "bytes",
  "unit": "",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/bD2jH5QB7KvGccywNCH5
{
  "id": "bD2jH5QB7KvGccywNCH5",
  "name": "Document Count",
  "key": "doc_count",
  "level": "shard",
  "formula": "bD2jH5QB7KvGccywNCH5",
  "items": [
    {
      "name": "bD2jH5QB7KvGccywNCH5",
      "field": "payload.elasticsearch.shard_stats.docs.count",
      "statistic": "max"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "number",
  "unit": "",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/bD2jH5QB7KvGccywNCH2
{
  "id": "bD2jH5QB7KvGccywNCH2",
  "name": "Search Rate",
  "key": "search_rate",
  "level": "shard",
  "formula": "bD2jH5QB7KvGccywNCH2/{{.bucket_size_in_second}}",
  "items": [
    {
      "name": "bD2jH5QB7KvGccywNCH2",
      "field": "payload.elasticsearch.shard_stats.search.query_total",
      "statistic": "rate"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "doc/s",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/bD2jH5QB7KvGccywNCH3
{
  "id": "bD2jH5QB7KvGccywNCH3",
  "name": "Indexing Latency",
  "key": "indexing_latency",
  "level": "shard",
  "formula": "bD2jH5QB7KvGccywNCx3/bD2jH5QB7KvGccywNCH3",
  "items": [
    {
      "name": "bD2jH5QB7KvGccywNCx3",
      "field": "payload.elasticsearch.shard_stats.indexing.index_total",
      "statistic": "rate"
    },
     {
      "name": "bD2jH5QB7KvGccywNCH3",
      "field": "payload.elasticsearch.shard_stats.indexing.index_time_in_millis",
      "statistic": "rate"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "ms",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/bD2jH5QB7KvGccywNCH4
{
  "id": "bD2jH5QB7KvGccywNCH4",
  "name": "Search Latency",
  "key": "search_latency",
  "level": "shard",
  "formula": "bD2jH5QB7KvGccywNCx4/bD2jH5QB7KvGccywNCH4",
  "items": [
    {
      "name": "bD2jH5QB7KvGccywNCH4",
      "field": "payload.elasticsearch.shard_stats.search.query_total",
      "statistic": "rate"
    },
     {
      "name": "bD2jH5QB7KvGccywNCx4",
      "field": "payload.elasticsearch.shard_stats.search.query_time_in_millis",
      "statistic": "rate"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "ms",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/bD2jH5QB7KvGccywNCH6
{
  "id": "bD2jH5QB7KvGccywNCH6",
  "name": "Segment Count",
  "key": "segment_count",
  "level": "shard",
  "formula": "bD2jH5QB7KvGccywNCH6",
  "items": [
    {
      "name": "bD2jH5QB7KvGccywNCH6",
      "field": "payload.elasticsearch.shard_stats.segments.count",
      "statistic": "max"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "number",
  "unit": "",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/bD2jH5QB7KvGccywNCH7
{
  "id": "bD2jH5QB7KvGccywNCH7",
  "name": "Segment memory",
  "key": "segment_memory",
  "level": "shard",
  "formula": "bD2jH5QB7KvGccywNCH7",
  "items": [
    {
      "name": "bD2jH5QB7KvGccywNCH7",
      "field": "payload.elasticsearch.shard_stats.segments.memory_in_bytes",
      "statistic": "max"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "number",
  "unit": "",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

#indices level
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/aD2jH5QB7KvGccywNCH9
{
  "id": "aD2jH5QB7KvGccywNCH9",
  "name": "Indexing Rate",
  "key": "indexing_rate",
  "level": "indices",
  "formula": "aD2jH5QB7KvGccywNCH9/{{.bucket_size_in_second}}",
  "items": [
    {
      "name": "aD2jH5QB7KvGccywNCH9",
      "field": "payload.elasticsearch.index_stats.primaries.indexing.index_total",
      "statistic": "rate"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "doc/s",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/aD2jH5QB7KvGccywNCH1
{
  "id": "aD2jH5QB7KvGccywNCH1",
  "name": "Index Storage",
  "key": "index_storage",
  "level": "indices",
  "formula": "aD2jH5QB7KvGccywNCH1",
  "items": [
    {
      "name": "aD2jH5QB7KvGccywNCH1",
      "field": "payload.elasticsearch.index_stats.total.store.size_in_bytes",
      "statistic": "max"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "bytes",
  "unit": "",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/aD2jH5QB7KvGccywNCH5
{
  "id": "aD2jH5QB7KvGccywNCH5",
  "name": "Document Count",
  "key": "doc_count",
  "level": "indices",
  "formula": "aD2jH5QB7KvGccywNCH5",
  "items": [
    {
      "name": "aD2jH5QB7KvGccywNCH5",
      "field": "payload.elasticsearch.index_stats.total.docs.count",
      "statistic": "max"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "number",
  "unit": "",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/aD2jH5QB7KvGccywNCH2
{
  "id": "aD2jH5QB7KvGccywNCH2",
  "name": "Search Rate",
  "key": "search_rate",
  "level": "indices",
  "formula": "aD2jH5QB7KvGccywNCH2/{{.bucket_size_in_second}}",
  "items": [
    {
      "name": "aD2jH5QB7KvGccywNCH2",
      "field": "payload.elasticsearch.index_stats.total.search.query_total",
      "statistic": "rate"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "doc/s",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/aD2jH5QB7KvGccywNCH3
{
  "id": "aD2jH5QB7KvGccywNCH3",
  "name": "Indexing Latency",
  "key": "indexing_latency",
  "level": "indices",
  "formula": "aD2jH5QB7KvGccywNCx3/aD2jH5QB7KvGccywNCH3",
  "items": [
    {
      "name": "aD2jH5QB7KvGccywNCH3",
      "field": "payload.elasticsearch.index_stats.primaries.indexing.index_total",
      "statistic": "rate"
    },
     {
      "name": "aD2jH5QB7KvGccywNCx3",
      "field": "payload.elasticsearch.index_stats.primaries.indexing.index_time_in_millis",
      "statistic": "rate"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "ms",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/aD2jH5QB7KvGccywNCH4
{
  "id": "aD2jH5QB7KvGccywNCH4",
  "name": "Search Latency",
  "key": "search_latency",
  "level": "indices",
  "formula": "aD2jH5QB7KvGccywNCx4/aD2jH5QB7KvGccywNCH4",
  "items": [
    {
      "name": "aD2jH5QB7KvGccywNCH4",
      "field": "payload.elasticsearch.index_stats.total.search.query_total",
      "statistic": "rate"
    },
     {
      "name": "aD2jH5QB7KvGccywNCx4",
      "field": "payload.elasticsearch.index_stats.total.search.query_time_in_millis",
      "statistic": "rate"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "ms",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/aD2jH5QB7KvGccywNCH6
{
  "id": "aD2jH5QB7KvGccywNCH6",
  "name": "Segment Count",
  "key": "segment_count",
  "level": "indices",
  "formula": "aD2jH5QB7KvGccywNCH6",
  "items": [
    {
      "name": "aD2jH5QB7KvGccywNCH6",
      "field": "payload.elasticsearch.index_stats.total.segments.count",
      "statistic": "max"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "number",
  "unit": "",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/aD2jH5QB7KvGccywNCH7
{
  "id": "aD2jH5QB7KvGccywNCH7",
  "name": "Segment memory",
  "key": "segment_memory",
  "level": "indices",
  "formula": "aD2jH5QB7KvGccywNCH7",
  "items": [
    {
      "name": "aD2jH5QB7KvGccywNCH7",
      "field": "payload.elasticsearch.index_stats.total.segments.memory_in_bytes",
      "statistic": "max"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "bytes",
  "unit": "",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

#node level
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/jD2jH5QB7KvGccywNCH9
{
  "id": "jD2jH5QB7KvGccywNCH9",
  "name": "Indexing Rate",
  "key": "indexing_rate",
  "level": "node",
  "formula": "jD2jH5QB7KvGccywH9/{{.bucket_size_in_second}}",
  "items": [
    {
      "name": "jD2jH5QB7KvGccywH9",
      "field": "payload.elasticsearch.node_stats.indices.indexing.index_total",
      "statistic": "derivative"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "doc/s",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}


PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/jD2jH5QB7KvGccywNCH4
{
  "id": "jD2jH5QB7KvGccywNCH4",
  "name": "Process CPU Usage",
  "key": "process_cpu_used",
  "level": "node",
  "formula": "jD2jH5QB7KvGccywNCH4",
  "items": [
    {
      "name": "jD2jH5QB7KvGccywNCH4",
      "field": "payload.elasticsearch.node_stats.process.cpu.percent",
      "statistic": "avg"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "",
  "unit": "%",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/jD2jH5QB7KvGccywNCH3
{
  "id": "jD2jH5QB7KvGccywNCH3",
  "name": "JVM Heap Usage",
  "key": "jvm_heap_used",
  "level": "node",
  "formula": "jD2jH5QB7KvGccywNCH3",
  "items": [
    {
      "name": "jD2jH5QB7KvGccywNCH3",
      "field": "payload.elasticsearch.node_stats.jvm.mem.heap_used_in_bytes",
      "statistic": "max"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "bytes",
  "unit": "",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/jD2jH5QB7KvGccywNCH1
{
  "id": "jD2jH5QB7KvGccywNCH1",
  "name": "Indexing Latency",
  "key": "indexing_latency",
  "level": "node",
  "formula": "jD2jH5QB7KvGccywNCx1/jD2jH5QB7KvGccywNCH1",
  "items": [
    {
      "name": "jD2jH5QB7KvGccywNCH1",
      "field": "payload.elasticsearch.node_stats.indices.indexing.index_total",
      "statistic": "rate"
    },
     {
      "name": "jD2jH5QB7KvGccywNCx1",
      "field": "payload.elasticsearch.node_stats.indices.indexing.index_time_in_millis",
      "statistic": "rate"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "ms",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/jD2jH5QB7KvGccywNCH0
{
  "id": "jD2jH5QB7KvGccywNCH0",
  "name": "Search Rate",
  "key": "search_rate",
  "level": "node",
  "formula": "jD2jH5QB7KvGccywH0/{{.bucket_size_in_second}}",
  "items": [
    {
      "name": "jD2jH5QB7KvGccywH0",
      "field": "payload.elasticsearch.node_stats.indices.search.query_total",
      "statistic": "derivative"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "query/s",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/jD2jH5QB7KvGccywNCH9
{
  "id": "jD2jH5QB7KvGccywNCH9",
  "name": "Indexing Rate",
  "key": "indexing_rate",
  "level": "node",
  "formula": "jD2jH5QB7KvGccywH9/{{.bucket_size_in_second}}",
  "items": [
    {
      "name": "jD2jH5QB7KvGccywH9",
      "field": "payload.elasticsearch.node_stats.indices.indexing.index_total",
      "statistic": "rate"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "doc/s",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/jD2jH5QB7KvGccywNCH5
{
  "id": "jD2jH5QB7KvGccywNCH5",
  "name": "Search Latency",
  "key": "search_latency",
  "level": "node",
  "formula": "jD2jH5QB7KvGccywNCx5/jD2jH5QB7KvGccywNCH5",
  "items": [
    {
      "name": "jD2jH5QB7KvGccywNCH5",
      "field": "payload.elasticsearch.node_stats.indices.search.query_total",
      "statistic": "rate"
    },
     {
      "name": "jD2jH5QB7KvGccywNCx5",
      "field": "payload.elasticsearch.node_stats.indices.search.query_time_in_millis",
      "statistic": "rate"
    }
  ],
  "statistics": ["rate"],
  "format": "number",
  "unit": "ms",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}

PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/jD2jH5QB7KvGccywNCH6
{
  "id": "jD2jH5QB7KvGccywNCH6",
  "name": "Indices Storage",
  "key": "indices_storage",
  "level": "node",
  "formula": "jD2jH5QB7KvGccywNCH6",
  "items": [
    {
      "name": "jD2jH5QB7KvGccywNCH6",
      "field": "payload.elasticsearch.node_stats.indices.store.size_in_bytes",
      "statistic": "max"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "bytes",
  "unit": "",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}
PUT $[[SETUP_INDEX_PREFIX]]metric/_doc/jD2jH5QB7KvGccywNCH7
{
  "id": "jD2jH5QB7KvGccywNCH7",
  "name": "Document Count",
  "key": "doc_count",
  "level": "node",
  "formula": "jD2jH5QB7KvGccywNCH7",
  "items": [
    {
      "name": "jD2jH5QB7KvGccywNCH7",
      "field": "payload.elasticsearch.node_stats.indices.docs.count",
      "statistic": "max"
    }
  ],
  "statistics": ["max", "min", "sum", "avg", "p99", "medium"],
  "format": "number",
  "unit": "",
  "builtin": true,
  "created": "2025-01-09T14:30:56.63155+08:00",
  "updated": "2025-01-09T14:30:56.63155+08:00"
}
```

{{< /details >}}

## 从 v1.7 升级至 v1.27.x

下载新版版安装包并解压覆盖旧版本，重启 Console 即可完成升级。

## 从 v1.5 升级至 v1.7

由于 Console v1.7 版本对告警模块做了改版优化，系统内置规则模板和告警渠道等，更新功能比较多，从低版本升级时，建议先自行备份低版本程序和后端存储数据，然后下载新版本安装包并解压后覆盖旧版本进行升级。

## 从 v1.0 升级至 v1.5

下载 Console v1.5 安装包并解压覆盖旧版本，重启 Console 即可完成升级，后端存储引擎无需变动。

## 从低版本升级至 v1.0

由于 Console v1.0 版本更新功能比较多，从低版本升级时，建议先自行备份低版本程序和后端存储数据，然后下载新版本安装包并解压后覆盖旧版本进行升级。

两种升级方式：

- 新环境安装部署
- 格式化覆盖升级

### 新环境安装部署

新环境是指将 Console 安装部署至新的磁盘目录，并且使用新的后端存储 Easysearch 或 Elasticsearch。部署安装说明参考：[下载安装](../getting-started/install)。

### 格式化覆盖升级

格式化覆盖升级是指在原有旧版本基础上进行覆盖升级，并删除旧版 Console 数据。

> 提示：如有重要数据请先备份，删除操作造成数据丢失后果自负，请谨慎操作。

操作步骤如下：

1、先切换到 Console 安装目录 `/xxx/console` ，请根据实际情况自行修改。

```sh
cd /xxx/console
```

2、停止 Console 服务

如果是 `-service` 方式启动，则可以通过以下方式停止。

```sh
./console -service stop
```

如果非 `-service` 方式启动，则自行解决停止服务。

3、删除 Console 数据

```sh
rm -rif data/ log/ config/
```

4、删除 Easysearch 或 Elasticsearch 中的 Console 系统索引和模板

删除 `.infini` 模板

```sh
curl -XDELETE http://localhost:9200/_template/.infini
```

删除所有 `.infini` 开头的 Console 系统索引

```sh
curl -XDELETE http://localhost:9200/.infini*
```

5、下载 Console 新版安装包并解压覆盖

此过程不再详细描述，请自行操作。

6、重新启动 Console 服务

本示例以 `-service` 启动。

```sh
./console -service install
Success
./console -service start
Success
```

7、完成

到此为止，格式化覆盖升级已完成。可以使用浏览器打开 http://localhost:9000 访问验证系统是否正常。

## 从 v0.2 升级至 v0.3

### 更新索引 `.infini` template

```
PUT _template/.infini
{
    "order": 0,
    "index_patterns": [
      ".infini_*"
    ],
    "settings": {
      "index": {
        "max_result_window": "10000000",
        "mapping": {
          "total_fields": {
            "limit": "20000"
          }
        },
        "analysis": {
          "analyzer": {
            "suggest_text_search": {
              "filter": [
                "word_delimiter"
              ],
              "tokenizer": "classic"
            }
          }
        },
        "number_of_shards": "1"
      }
    },
    "mappings": {
      "dynamic_templates": [
        {
          "strings": {
            "mapping": {
              "ignore_above": 256,
              "type": "keyword"
            },
            "match_mapping_type": "string"
          }
        }
      ]
    },
    "aliases": {}
}
```

### 关闭索引 `.infini_cluster`

```
POST .infini_cluster/_close
```

### 更新索引 `.infini_cluster` settings

```
PUT .infini_cluster/_settings
{
     "analysis": {
          "analyzer": {
            "suggest_text_search": {
              "filter": [
                "word_delimiter"
              ],
              "tokenizer": "classic"
            }
          }
        }
}
```

### 更新索引 `.infini_cluster` mappings

```
PUT .infini_cluster/_mapping
{
      "dynamic_templates": [
        {
          "strings": {
            "match_mapping_type": "string",
            "mapping": {
              "ignore_above": 256,
              "type": "keyword"
            }
          }
        }
      ],
      "properties": {
        "basic_auth": {
          "properties": {
            "password": {
              "type": "keyword"
            },
            "username": {
              "type": "keyword"
            }
          }
        },
        "created": {
          "type": "date"
        },
        "description": {
          "type": "text"
        },
        "discovery": {
          "properties": {
            "refresh": {
              "type": "object"
            }
          }
        },
        "enabled": {
          "type": "boolean"
        },
        "endpoint": {
          "type": "keyword"
        },
        "endpoints": {
          "type": "keyword"
        },
        "host": {
          "type": "keyword",
          "copy_to": [
            "search_text"
          ]
        },
        "hosts": {
          "type": "keyword"
        },
        "labels": {
          "properties": {
            "health_status": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "location": {
          "properties": {
            "dc": {
              "type": "keyword"
            },
            "provider": {
              "type": "keyword"
            },
            "rack": {
              "type": "keyword"
            },
            "region": {
              "type": "keyword"
            }
          }
        },
        "monitored": {
          "type": "boolean"
        },
        "name": {
          "type": "keyword",
          "fields": {
            "text": {
              "type": "text"
            }
          }
        },
        "order": {
          "type": "integer"
        },
        "owner": {
          "properties": {
            "department": {
              "type": "keyword",
              "copy_to": [
                "search_text"
              ]
            },
            "id": {
              "type": "keyword"
            },
            "name": {
              "type": "keyword",
              "copy_to": [
                "search_text"
              ]
            }
          }
        },
        "project": {
          "type": "keyword",
          "copy_to": [
            "search_text"
          ]
        },
        "schema": {
          "type": "keyword"
        },
        "search_text": {
          "type": "text",
          "analyzer": "suggest_text_search",
          "index_prefixes": {
            "min_chars": 2,
            "max_chars": 5
          },
          "index_phrases": true
        },
        "tags": {
          "type": "keyword",
          "copy_to": [
            "search_text"
          ]
        },
        "traffic_control": {
          "properties": {
            "max_bytes_per_node": {
              "type": "keyword"
            },
            "max_connection_per_node": {
              "type": "keyword"
            },
            "max_qps_per_node": {
              "type": "keyword"
            },
            "max_wait_time_in_ms": {
              "type": "keyword"
            }
          }
        },
        "updated": {
          "type": "date"
        },
        "version": {
          "type": "keyword",
          "copy_to": [
            "search_text"
          ]
        }
      }
}
```

### 打开索引 `.infini_cluster`

```
POST .infini_cluster/_open
```

### Update console.yml

v0.3 版本在 v0.2 版本上新增了 pipeline 配置：

```
- name: metadata_ingest
    auto_start: true
    keep_running: true
    processor:
      - metadata:
          bulk_size_in_mb: 10
          bulk_max_docs_count: 5000
          fetch_max_messages: 1000
          elasticsearch: "default"
          queues:
            type: metadata
            category: elasticsearch
          when:
            cluster_available: [ "default" ]
- name: activity_ingest
    auto_start: true
    keep_running: true
    processor:
      - activity:
          bulk_size_in_mb: 10
          bulk_max_docs_count: 5000
          fetch_max_messages: 1000
          elasticsearch: "default"
          queues:
            category: elasticsearch
            activity: true
          consumer:
            group: activity
          when:
            cluster_available: [ "default" ]
```

先停止 Console 程序，再在`console.yml` 配置文件中的 pipeline 模块下添加上面面的配置，然后再启动 Console 程序。

### 给索引 .infini_alert-history 配置生命周期

v0.3 新增了告警功能，告警功能存储执行记录的索引数据量很大，所以需要配置一下 ILM 如下：

```aidl
PUT _template/.infini_alert-history-rollover
{
    "order" : 100000,
    "index_patterns" : [
      ".infini_alert-history*"
    ],
    "settings" : {
      "index" : {
        "format" : "7",
        "lifecycle" : {
          "name" : "infini_metrics-30days-retention",
          "rollover_alias" : ".infini_alert-history"
        },
        "codec" : "best_compression",
        "number_of_shards" : "1",
        "translog.durability":"async"
      }
    },
    "mappings" : {
      "dynamic_templates" : [
        {
          "strings" : {
            "mapping" : {
              "ignore_above" : 256,
              "type" : "keyword"
            },
            "match_mapping_type" : "string"
          }
        }
      ]
    },
    "aliases" : { }
  }

DELETE .infini_alert-history

DELETE .infini_alert-history-00001
PUT .infini_alert-history-00001
{
  "settings": {
    "index.lifecycle.rollover_alias":".infini_alert-history"
    , "refresh_interval": "5s"
  },
  "aliases":{
    ".infini_alert-history":{
      "is_write_index":true
    }
  },
  "mappings": {
    "properties" : {
        "condition" : {
          "properties" : {
            "items" : {
              "properties" : {
                "expression" : {
                  "type" : "keyword",
                  "ignore_above" : 256
                },
                "minimum_period_match" : {
                  "type" : "long"
                },
                "operator" : {
                  "type" : "keyword",
                  "ignore_above" : 256
                },
                "severity" : {
                  "type" : "keyword",
                  "ignore_above" : 256
                },
                "values" : {
                  "type" : "keyword",
                  "ignore_above" : 256
                }
              }
            },
            "operator" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "condition_result" : {
          "type" : "object",
          "enabled" : false
        },
        "context" : {
          "type" : "keyword",
          "copy_to" : [
            "search_text"
          ]
        },
        "created" : {
          "type" : "date"
        },
        "expression" : {
          "type" : "keyword",
          "copy_to" : [
            "search_text"
          ]
        },
        "id" : {
          "type" : "keyword"
        },
        "is_escalated" : {
          "type" : "boolean"
        },
        "is_notified" : {
          "type" : "boolean"
        },
        "message" : {
          "type" : "keyword",
          "ignore_above" : 256
        },
        "objects" : {
          "type" : "keyword",
          "copy_to" : [
            "search_text"
          ]
        },
        "resource_id" : {
          "type" : "keyword"
        },
        "resource_name" : {
          "type" : "keyword"
        },
        "rule_id" : {
          "type" : "keyword"
        },
        "rule_name" : {
          "type" : "keyword"
        },
        "search_text" : {
          "type" : "text",
          "analyzer" : "suggest_text_search",
          "index_prefixes" : {
            "min_chars" : 2,
            "max_chars" : 5
          },
          "index_phrases" : true
        },
        "severity" : {
          "type" : "keyword"
        },
        "state" : {
          "type" : "keyword",
          "ignore_above" : 256
        },
        "title" : {
          "type" : "keyword"
        },
        "updated" : {
          "type" : "date"
        }
      }
    }
}
```

## 升级常见问题

#### 问题描述 1

重复的索引 index 数据
{{% load-img "/img/troubleshooting/v0.3_duplicated_indices.png" "重复的索引index数据" %}}

#### 解决方案

- 停止 Console
- 删除索引`.infini_index`
- 启动 Console

#### 问题描述 2

重复的节点 node 数据
{{% load-img "/img/troubleshooting/v0.3_duplicated_nodes.png" "重复的节点node数据" %}}

#### 解决方案

- 停止 Console
- 删除索引 `.infini_node`
- 启动 Console

#### 问题描述 3

data 节点有监控数据，非 data 节点（master、client 等）没有监控数据，如下图非 data 节点所示：
{{% load-img "/img/troubleshooting/v0.3_nodes_monitor_no_data.jpg" "重复的节点node数据" %}}

#### 解决方案

建议升级到最新版。

#### 问题描述 4

页面出现空白，JS 报错。

#### 解决方案

建议升级到最新版，并将具体报错信息反馈给我们。

## 反馈

如有其他任何问题和建议，请通过右侧的反馈功能或点击[这里](https://github.com/infinilabs/console/issues/new)提交给我们，我们将持续优化，感谢您的支持！
