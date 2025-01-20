---
weight: 3
title: 指标说明
---

# .infini_metrics 监控指标字段说明

## agent

| 字段名         | 说明                                            |
| -------------- | ----------------------------------------------- |
| agent.hostname | 主机名称                                        |
| agent.id       | 实例 ID                                         |
| agent.ips      | 主机 IP 列表                                    |
| agent.major_ip | 主 IP（配置文件 metrics.major_ip_pattern 指定） |

## metadata

| 字段名                            | 说明                 |
| --------------------------------- | -------------------- |
| metadata.category                 | 指标分类             |
| metadata.datatype                 | 指标数据类型         |
| metadata.name                     | 指标名称             |
| metadata.version                  | 指标所属实例的版本号 |
| metadata.labels.cluster_id        | 集群 ID              |
| metadata.labels.cluster_uuid      | 集群 UUID（ES 生成） |
| metadata.labels.index_id          | 索引 ID              |
| metadata.labels.index_name        | 索引名称             |
| metadata.labels.index_uuid        | 索引 UUID（ES 生成） |
| metadata.labels.ip                | IP                   |
| metadata.labels.id                | 实例 ID              |
| metadata.labels.name              | 实例名               |
| metadata.labels.node_id           | 节点 ID              |
| metadata.labels.node_name         | 节点名称             |
| metadata.labels.transport_address | ES 节点 TCP 监听地址 |

## payload.elasticsearch.cluster_health

| 字段名                                                                | 说明                                    |
| --------------------------------------------------------------------- | --------------------------------------- |
| payload.elasticsearch.cluster_health.active_primary_shards            | ES 集群可用的主分片数量                 |
| payload.elasticsearch.cluster_health.active_shards                    | ES 集群可用的总分片数量                 |
| payload.elasticsearch.cluster_health.active_shards_percent_as_number  | ES 集群可用的总分片数量所占百分比       |
| payload.elasticsearch.cluster_health.cluster_name                     | ES 集群名称                             |
| payload.elasticsearch.cluster_health.delayed_unassigned_shards        | ES 集群延迟未分配的分片数量             |
| payload.elasticsearch.cluster_health.initializing_shards              | ES 集群正在初始化的分片数量             |
| payload.elasticsearch.cluster_health.number_of_data_nodes             | ES 集群数据节点数                       |
| payload.elasticsearch.cluster_health.number_of_in_flight_fetch        | ES 集群未完成读取的数量                 |
| payload.elasticsearch.cluster_health.number_of_nodes                  | ES 集群总节点数                         |
| payload.elasticsearch.cluster_health.number_of_pending_tasks          | ES 集群等待执行任务数量                 |
| payload.elasticsearch.cluster_health.relocating_shards                | ES 集群正在迁移的分片数量               |
| payload.elasticsearch.cluster_health.status                           | ES 集群状态                             |
| payload.elasticsearch.cluster_health.task_max_waiting_in_queue_millis | ES 集群任务在队列中等待的最大时间(毫秒) |
| payload.elasticsearch.cluster_health.timed_out                        | ES 集群是否超时                         |
| payload.elasticsearch.cluster_health.unassigned_shards                | ES 集群未分配的分片数量                 |

## payload.elasticsearch.cluster_stats

| 字段名                                                                                 | 说明                                                                                                        |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| payload.elasticsearch.cluster_stats.cluster_name                                       | ES 集群名称                                                                                                 |
| payload.elasticsearch.cluster_stats.cluster_uuid                                       | ES 集群 UUID（唯一标识）                                                                                    |
| payload.elasticsearch.cluster_stats.indices.analysis.analyzer_types.count              | ES 集群索引中使用的该分析器的次数                                                                           |
| payload.elasticsearch.cluster_stats.indices.analysis.analyzer_types.index_count        | ES 集群中使用该分析器的索引数                                                                               |
| payload.elasticsearch.cluster_stats.indices.analysis.analyzer_types.name               | ES 集群索引中使用的分析器类型                                                                               |
| payload.elasticsearch.cluster_stats.indices.analysis.built_in_filters.count            | ES 集群索引中使用的该分析器的次数                                                                           |
| payload.elasticsearch.cluster_stats.indices.analysis.built_in_filters.index_count      | ES 集群中使用该分析器的索引数                                                                               |
| payload.elasticsearch.cluster_stats.indices.analysis.built_in_filters.name             | ES 集群索引中使用的分析器类型                                                                               |
| payload.elasticsearch.cluster_stats.indices.analysis.built_in_tokenizers.count         | ES 集群索引中使用的该内置标记器的次数                                                                       |
| payload.elasticsearch.cluster_stats.indices.analysis.built_in_tokenizers.index_count   | ES 集群中使用该内置标记器的索引数                                                                           |
| payload.elasticsearch.cluster_stats.indices.analysis.built_in_tokenizers.name          | ES 集群索引中使用的内置标记器类型                                                                           |
| payload.elasticsearch.cluster_stats.indices.completion.size_in_bytes                   | ES 集群索引 complete 缓存使用大小                                                                           |
| payload.elasticsearch.cluster_stats.indices.count                                      | ES 集群索引总数                                                                                             |
| payload.elasticsearch.cluster_stats.indices.docs.count                                 | ES 集群索引主分片文档数                                                                                     |
| payload.elasticsearch.cluster_stats.indices.docs.deleted                               | ES 集群索引主分片删除的文档数                                                                               |
| payload.elasticsearch.cluster_stats.indices.field_types.count                          | ES 集群中使用该数据类型的数量                                                                               |
| payload.elasticsearch.cluster_stats.indices.field_types.index_count                    | ES 集群中使用该数据类型的索引数量                                                                           |
| payload.elasticsearch.cluster_stats.indices.field_types.name                           | ES 集群索引字段数据类型                                                                                     |
| payload.elasticsearch.cluster_stats.indices.fielddata.evictions                        | ES 集群索引字段数据缓存中清除的数量（当超过堆内存阈值为了安全保护时会被驱逐，查询抛出 Data too large 异常） |
| payload.elasticsearch.cluster_stats.indices.fielddata.memory_size_in_bytes             | ES 集群索引字段数据缓存总大小                                                                               |
| payload.elasticsearch.cluster_stats.indices.query_cache.cache_count                    | ES 集群查询缓存中总的条目数包含被驱逐的（cache_size 与 evictions 之和）                                     |
| payload.elasticsearch.cluster_stats.indices.query_cache.cache_size                     | ES 集群索引查询缓存中当前总的条目总数                                                                       |
| payload.elasticsearch.cluster_stats.indices.query_cache.evictions                      | ES 集群索引查询缓存清除的总数                                                                               |
| payload.elasticsearch.cluster_stats.indices.query_cache.hit_count                      | ES 集群索引查询缓存命中的数量                                                                               |
| payload.elasticsearch.cluster_stats.indices.query_cache.memory_size_in_bytes           | ES 集群索引查询缓存总大小                                                                                   |
| payload.elasticsearch.cluster_stats.indices.query_cache.miss_count                     | ES 集群索引查询缓存未命中的数量                                                                             |
| payload.elasticsearch.cluster_stats.indices.query_cache.total_count                    | ES 集群索引查询缓存的总数量                                                                                 |
| payload.elasticsearch.cluster_stats.indices.segments.count                             | ES 集群索引 segments 总数                                                                                   |
| payload.elasticsearch.cluster_stats.indices.segments.doc_values_memory_in_bytes        | ES 集群索引 doc values 占用缓存大小                                                                         |
| payload.elasticsearch.cluster_stats.indices.segments.file_sizes                        | ES 集群有关索引文件大小的统计信息                                                                           |
| payload.elasticsearch.cluster_stats.indices.segments.fixed_bit_set_memory_in_bytes     | ES 集群索引 BitSet（带标状态的数组）占用缓存的大小                                                          |
| payload.elasticsearch.cluster_stats.indices.segments.index_writer_memory_in_bytes      | ES 集群索引 index writer 占用缓存大小                                                                       |
| payload.elasticsearch.cluster_stats.indices.segments.max_unsafe_auto_id_timestamp      | ES 集群最近重试的索引请求的 unix 时间戳（毫秒）                                                             |
| payload.elasticsearch.cluster_stats.indices.segments.memory_in_bytes                   | ES 集群索引 segments 使用的缓存总和                                                                         |
| payload.elasticsearch.cluster_stats.indices.segments.norms_memory_in_bytes             | ES 集群索引 norms（标准信息）使用的缓存大小                                                                 |
| payload.elasticsearch.cluster_stats.indices.segments.points_memory_in_bytes            | ES 集群索引 points 使用的缓存大小                                                                           |
| payload.elasticsearch.cluster_stats.indices.segments.stored_fields_memory_in_bytes     | ES 集群索引 fields 使用缓存大小                                                                             |
| payload.elasticsearch.cluster_stats.indices.segments.term_vectors_memory_in_bytes      | ES 集群索引 Term Vectors（词条向量）使用缓存大小                                                            |
| payload.elasticsearch.cluster_stats.indices.segments.terms_memory_in_bytes             | ES 集群索引 terms query 使用的缓存大小                                                                      |
| payload.elasticsearch.cluster_stats.indices.segments.version_map_memory_in_bytes       | ES 集群索引 version maps（描述 document、fields 包含的内容）占用的缓存大小                                  |
| payload.elasticsearch.cluster_stats.indices.shards.index.primaries.avg                 | ES 集群索引的平均主分片数                                                                                   |
| payload.elasticsearch.cluster_stats.indices.shards.index.primaries.max                 | ES 集群索引允许的最大主分片数                                                                               |
| payload.elasticsearch.cluster_stats.indices.shards.index.primaries.min                 | ES 集群索引允许的最小主分片数                                                                               |
| payload.elasticsearch.cluster_stats.indices.shards.index.replication.avg               | ES 集群索引的平均副本数                                                                                     |
| payload.elasticsearch.cluster_stats.indices.shards.index.replication.max               | ES 集群索引允许的最大副本数                                                                                 |
| payload.elasticsearch.cluster_stats.indices.shards.index.replication.min               | ES 集群索引允许的最小副本数                                                                                 |
| payload.elasticsearch.cluster_stats.indices.shards.index.shards.avg                    | ES 集群索引的平均分片数                                                                                     |
| payload.elasticsearch.cluster_stats.indices.shards.index.shards.max                    | ES 集群索引允许的最大分片数                                                                                 |
| payload.elasticsearch.cluster_stats.indices.shards.index.shards.min                    | ES 集群索引允许的最小分片数                                                                                 |
| payload.elasticsearch.cluster_stats.indices.shards.primaries                           | ES 集群索引主分片总数                                                                                       |
| payload.elasticsearch.cluster_stats.indices.shards.replication                         | ES 集群副本分片数/主分片数                                                                                  |
| payload.elasticsearch.cluster_stats.indices.shards.total                               | ES 集群索引分片总数                                                                                         |
| payload.elasticsearch.cluster_stats.indices.store.reserved_in_bytes                    | ES 集群预测进行对等恢复、快照恢复和类似活动，分片存储最终会增长多少                                         |
| payload.elasticsearch.cluster_stats.indices.store.size_in_bytes                        | ES 集群索引占用总大小                                                                                       |
| payload.elasticsearch.cluster_stats.nodes.count.coordinating_only                      | ES 集群协作节点（coordinating）数量                                                                         |
| payload.elasticsearch.cluster_stats.nodes.count.data                                   | ES 集群 data 节点数量                                                                                       |
| payload.elasticsearch.cluster_stats.nodes.count.data_cold                              | ES 集群 data 冷节点数量                                                                                     |
| payload.elasticsearch.cluster_stats.nodes.count.data_content                           | ES 集群 data_content 节点数量                                                                               |
| payload.elasticsearch.cluster_stats.nodes.count.data_hot                               | ES 集群 data 热节点数量                                                                                     |
| payload.elasticsearch.cluster_stats.nodes.count.data_warm                              | ES 集群 data_warm 节点数量                                                                                  |
| payload.elasticsearch.cluster_stats.nodes.count.ingest                                 | ES 集群 ingest 节点数量                                                                                     |
| payload.elasticsearch.cluster_stats.nodes.count.master                                 | ES 集群 master 节点数量                                                                                     |
| payload.elasticsearch.cluster_stats.nodes.count.ml                                     | ES 集群 ml 节点数量                                                                                         |
| payload.elasticsearch.cluster_stats.nodes.count.remote_cluster_client                  | ES 集群 remote_cluster_client 节点数量                                                                      |
| payload.elasticsearch.cluster_stats.nodes.count.total                                  | ES 集群总的节点数量                                                                                         |
| payload.elasticsearch.cluster_stats.nodes.count.transform                              | ES 集群 transform 节点数量                                                                                  |
| payload.elasticsearch.cluster_stats.nodes.count.voting_only                            | ES 集群 data_warm 节点数量                                                                                  |
| payload.elasticsearch.cluster_stats.nodes.discovery_types.某种发现类型                 | ES 集群使用某种发现类型查找其他节点的节点数                                                                 |
| payload.elasticsearch.cluster_stats.nodes.fs.available_in_bytes                        | ES 集群节点可以的磁盘空间量                                                                                 |
| payload.elasticsearch.cluster_stats.nodes.fs.free_in_bytes                             | ES 集群节点未分配的磁盘空间量                                                                               |
| payload.elasticsearch.cluster_stats.nodes.fs.total_in_bytes                            | ES 集群节点占用的磁盘空间量                                                                                 |
| payload.elasticsearch.cluster_stats.nodes.ingest.number_of_pipelines                   | ES 集群节点 ingest 管道数量                                                                                 |
| payload.elasticsearch.cluster_stats.nodes.ingest.processor_stats.gsub.count            | ES 集群节点 ingest 管道进程 gsub 总数                                                                       |
| payload.elasticsearch.cluster_stats.nodes.ingest.processor_stats.gsub.current          | ES 集群节点 ingest 管道进程 gsub 正在运行的数量                                                             |
| payload.elasticsearch.cluster_stats.nodes.ingest.processor_stats.gsub.failed           | ES 集群节点 ingest 管道进程 gsub 失败的数量                                                                 |
| payload.elasticsearch.cluster_stats.nodes.ingest.processor_stats.gsub.time_in_millis   | ES 集群节点 ingest 管道进程 gsub 花费的时间（毫秒）                                                         |
| payload.elasticsearch.cluster_stats.nodes.ingest.processor_stats.script.count          | ES 集群节点 ingest 管道进程 script 总数                                                                     |
| payload.elasticsearch.cluster_stats.nodes.ingest.processor_stats.script.current        | ES 集群节点 ingest 管道进程 script 正在运行的数量                                                           |
| payload.elasticsearch.cluster_stats.nodes.ingest.processor_stats.script.failed         | ES 集群节点 ingest 管道进程 script 失败的数量                                                               |
| payload.elasticsearch.cluster_stats.nodes.ingest.processor_stats.script.time_in_millis | ES 集群节点 ingest 管道进程 script 花费的时间（毫秒）                                                       |
| payload.elasticsearch.cluster_stats.nodes.jvm.max_uptime_in_millis                     | ES 集群节点 jvm 运行时间                                                                                    |
| payload.elasticsearch.cluster_stats.nodes.jvm.mem.heap_max_in_bytes                    | ES 集群节点最大堆内存数                                                                                     |
| payload.elasticsearch.cluster_stats.nodes.jvm.mem.heap_used_in_bytes                   | ES 集群节点已使用的堆内存数                                                                                 |
| payload.elasticsearch.cluster_stats.nodes.jvm.threads                                  | ES 集群节点 jvm 进程数                                                                                      |
| payload.elasticsearch.cluster_stats.nodes.jvm.versions.count                           | ES 集群节点使用该 jvm 的数量                                                                                |
| payload.elasticsearch.cluster_stats.nodes.jvm.versions.version                         | ES 集群节点 jvm 版本号                                                                                      |
| payload.elasticsearch.cluster_stats.nodes.jvm.versions.vm_name                         | ES 集群节点 jvm 名称                                                                                        |
| payload.elasticsearch.cluster_stats.nodes.jvm.versions.vm_vendor                       | ES 集群节点 jvm 供应商                                                                                      |
| payload.elasticsearch.cluster_stats.nodes.jvm.versions.vm_version                      | ES 集群节点 jvm 完整版本号                                                                                  |
| payload.elasticsearch.cluster_stats.nodes.network_types.http_types.security4           | ES 集群节点使用 security4 HTTP 类型的数量                                                                   |
| payload.elasticsearch.cluster_stats.nodes.network_types.transport_types.security4      | ES 集群节点使用 security4 传输类型的数量                                                                    |
| payload.elasticsearch.cluster_stats.nodes.os.allocated_processors                      | ES 集群节点已分配的处理器核数                                                                               |
| payload.elasticsearch.cluster_stats.nodes.os.available_processors                      | ES 集群节点可用的处理器核数                                                                                 |
| payload.elasticsearch.cluster_stats.nodes.os.mem.free_in_bytes                         | ES 集群节点空闲的物理内存                                                                                   |
| payload.elasticsearch.cluster_stats.nodes.os.mem.free_percent                          | ES 集群节点空闲内存百分比                                                                                   |
| payload.elasticsearch.cluster_stats.nodes.os.mem.total_in_bytes                        | ES 集群节点总的物理内存                                                                                     |
| payload.elasticsearch.cluster_stats.nodes.os.mem.used_in_bytes                         | ES 集群节点已使用的物理内存                                                                                 |
| payload.elasticsearch.cluster_stats.nodes.os.mem.used_percent                          | ES 集群节点已用内存百分比                                                                                   |
| payload.elasticsearch.cluster_stats.nodes.os.names.count                               | ES 集群节点中该操作系统类型的数量                                                                           |
| payload.elasticsearch.cluster_stats.nodes.os.names.name                                | ES 集群节点操作系统类型                                                                                     |
| payload.elasticsearch.cluster_stats.nodes.os.pretty_names.count                        | ES 集群节点中该操作系统名称的数量                                                                           |
| payload.elasticsearch.cluster_stats.nodes.os.pretty_names.pretty_name                  | ES 集群节点操作系统名称                                                                                     |
| payload.elasticsearch.cluster_stats.nodes.plugins.classname                            | 用作插件入口点的类名                                                                                        |
| payload.elasticsearch.cluster_stats.nodes.plugins.description                          | 插件的描述                                                                                                  |
| payload.elasticsearch.cluster_stats.nodes.plugins.elasticsearch_version                | 构建插件的 ES 版本                                                                                          |
| payload.elasticsearch.cluster_stats.nodes.plugins.java_version                         | 构建插件的 java 版本                                                                                        |
| payload.elasticsearch.cluster_stats.nodes.plugins.name                                 | ES 集群节点使用的插件名称                                                                                   |
| payload.elasticsearch.cluster_stats.nodes.plugins.version                              | 构建插件的 ES 版本                                                                                          |
| payload.elasticsearch.cluster_stats.nodes.process.cpu.percent                          | ES 集群节点 cpu 使用的百分比                                                                                |
| payload.elasticsearch.cluster_stats.nodes.process.open_file_descriptors.avg            | ES 集群节点打开文件描述符平均数                                                                             |
| payload.elasticsearch.cluster_stats.nodes.process.open_file_descriptors.max            | ES 集群节点打开文件描述符最大值                                                                             |
| payload.elasticsearch.cluster_stats.nodes.process.open_file_descriptors.min            | ES 集群节点打开文件描述符最小值                                                                             |
| payload.elasticsearch.cluster_stats.nodes.versions                                     | ES 集群节点使用的 elasticsearch 版本                                                                        |
| payload.elasticsearch.cluster_stats.status                                             | ES 集群健康状态                                                                                             |
| payload.elasticsearch.cluster_stats.timestamp                                          | ES 集群指标刷新的最新时间戳                                                                                 |

## payload.elasticsearch.index\*

| 字段名                                                                             | 说明                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| payload.elasticsearch.index_routing_table                                          | 索引路由信息表                                        |
| payload.elasticsearch.index_stats.index_info                                       | 索引信息列表                                          |
| payload.elasticsearch.index_stats.shard_info                                       | 索引分片信息列表                                      |
| payload.elasticsearch.index_stats.primaries.completion.size_in_bytes               | 索引主分片 completion 缓存大小（字节）                |
| payload.elasticsearch.index_stats.primaries.docs.count                             | 索引主分片的文档数                                    |
| payload.elasticsearch.index_stats.primaries.docs.deleted                           | 索引主分片的删除文档数                                |
| payload.elasticsearch.index_stats.primaries.fielddata.evictions                    | 索引主分片字段数据缓存中清除的数量                    |
| payload.elasticsearch.index_stats.primaries.fielddata.memory_size_in_bytes         | 索引主分片字段数据缓存大小（字节）                    |
| payload.elasticsearch.index_stats.primaries.flush.periodic                         | 索引主分片 flush 操作定时执行的次数                   |
| payload.elasticsearch.index_stats.primaries.flush.total                            | 索引主分片 flush 操作的总数                           |
| payload.elasticsearch.index_stats.primaries.flush.total_time_in_millis             | 索引主分片 flush 操作的总耗时（毫秒）                 |
| payload.elasticsearch.index_stats.primaries.get.current                            | 索引主分片当前正在进行 get 操作的次数                 |
| payload.elasticsearch.index_stats.primaries.get.exists_time_in_millis              | 索引主分片 get 操作成功的总耗时（毫秒）               |
| payload.elasticsearch.index_stats.primaries.get.exists_total                       | 索引主分片 get 操作成功的总次数                       |
| payload.elasticsearch.index_stats.primaries.get.missing_time_in_millis             | 索引主分片 get 操作失败的总耗时（毫秒）               |
| payload.elasticsearch.index_stats.primaries.get.missing_total                      | 索引主分片 get 操作失败的总次数                       |
| payload.elasticsearch.index_stats.primaries.get.time_in_millis                     | 索引主分片 get 操作的总耗时（毫秒）                   |
| payload.elasticsearch.index_stats.primaries.get.total                              | 索引主分片 get 操作的总次数                           |
| payload.elasticsearch.index_stats.primaries.indexing.delete_current                | 索引主分片当前正在进行删除操作的次数                  |
| payload.elasticsearch.index_stats.primaries.indexing.delete_time_in_millis         | 索引主分片删除操作的总耗时（毫秒）                    |
| payload.elasticsearch.index_stats.primaries.indexing.delete_total                  | 索引主分片删除操作的总次数                            |
| payload.elasticsearch.index_stats.primaries.indexing.index_current                 | 索引主分片当前正在进行操作的次数                      |
| payload.elasticsearch.index_stats.primaries.indexing.index_failed                  | 索引主分片操作失败的次数                              |
| payload.elasticsearch.index_stats.primaries.indexing.index_time_in_millis          | 索引主分片操作消耗的时间（毫秒）                      |
| payload.elasticsearch.index_stats.primaries.indexing.index_total                   | 索引主分片操作的总次数                                |
| payload.elasticsearch.index_stats.primaries.indexing.is_throttled                  | 索引主分片操作是否被限流                              |
| payload.elasticsearch.index_stats.primaries.indexing.noop_update_total             | 索引主分片空更新的次数                                |
| payload.elasticsearch.index_stats.primaries.indexing.throttle_time_in_millis       | 索引主分片限流操作所花费的时间（毫秒）                |
| payload.elasticsearch.index_stats.primaries.merges.current                         | 索引主分片正在进行 merge 操作的数量                   |
| payload.elasticsearch.index_stats.primaries.merges.current_docs                    | 索引主分片正在进行 merge 操作的文档数                 |
| payload.elasticsearch.index_stats.primaries.merges.current_size_in_bytes           | 索引主分片正在进行 merge 操作所占用的内存大小（字节） |
| payload.elasticsearch.index_stats.primaries.merges.total                           | 索引主分片 merge 操作的总数                           |
| payload.elasticsearch.index_stats.primaries.merges.total_auto_throttle_in_bytes    | 索引主分片自动触发限流操作的阈值（字节）              |
| payload.elasticsearch.index_stats.primaries.merges.total_docs                      | 索引主分片 merge 操作的文档总数                       |
| payload.elasticsearch.index_stats.primaries.merges.total_size_in_bytes             | 索引主分片 merge 操作的总大小                         |
| payload.elasticsearch.index_stats.primaries.merges.total_stopped_time_in_millis    | 索引主分片 merge 操作停止的总耗时（毫秒）             |
| payload.elasticsearch.index_stats.primaries.merges.total_throttled_time_in_millis  | 索引主分片 merge 操作限流的总耗时（毫秒）             |
| payload.elasticsearch.index_stats.primaries.merges.total_time_in_millis            | 索引主分片 merge 操作的总耗时（毫秒）                 |
| payload.elasticsearch.index_stats.primaries.query_cache.cache_count                | 索引主分片当前查询缓存中的文档数量                    |
| payload.elasticsearch.index_stats.primaries.query_cache.cache_size                 | 索引主分片当前查询缓存中的文档大小                    |
| payload.elasticsearch.index_stats.primaries.query_cache.evictions                  | 索引主分片查询缓存中清除的数量                        |
| payload.elasticsearch.index_stats.primaries.query_cache.hit_count                  | 索引主分片查询缓存命中的次数                          |
| payload.elasticsearch.index_stats.primaries.query_cache.memory_size_in_bytes       | 索引主分片查询缓存占用的内存大小（字节）              |
| payload.elasticsearch.index_stats.primaries.query_cache.miss_count                 | 索引主分片查询缓存未命中的次数                        |
| payload.elasticsearch.index_stats.primaries.query_cache.total_count                | 索引主分片查询缓存的总次数                            |
| payload.elasticsearch.index_stats.primaries.recovery.current_as_source             | 索引主分片当前作为恢复源的数量                        |
| payload.elasticsearch.index_stats.primaries.recovery.current_as_target             | 索引主分片当前作为恢复目标的数量                      |
| payload.elasticsearch.index_stats.primaries.recovery.throttle_time_in_millis       | 索引主分片恢复操作的延迟时长                          |
| payload.elasticsearch.index_stats.primaries.refresh.external_total                 | 索引主分片外部 refresh 操作的总数                     |
| payload.elasticsearch.index_stats.primaries.refresh.external_total_time_in_millis  | 索引主分片外部 refresh 操作的总耗时（毫秒）           |
| payload.elasticsearch.index_stats.primaries.refresh.listeners                      | 索引主分片 refresh listeners 的数量                   |
| payload.elasticsearch.index_stats.primaries.refresh.total                          | 索引主分片 refresh 操作的总数                         |
| payload.elasticsearch.index_stats.primaries.refresh.total_time_in_millis           | 索引主分片 refresh 操作的总耗时（毫秒）               |
| payload.elasticsearch.index_stats.primaries.request_cache.evictions                | 索引主分片请求缓存中清除的数量                        |
| payload.elasticsearch.index_stats.primaries.request_cache.hit_count                | 索引主分片请求缓存的命中数量                          |
| payload.elasticsearch.index_stats.primaries.request_cache.memory_size_in_bytes     | 索引主分片请求缓存占用的内存大小（字节）              |
| payload.elasticsearch.index_stats.primaries.request_cache.miss_count               | 索引主分片请求缓存的未命中数量                        |
| payload.elasticsearch.index_stats.primaries.search.fetch_current                   | 索引主分片当前正在进行 fetch 操作的总数量             |
| payload.elasticsearch.index_stats.primaries.search.fetch_time_in_millis            | 索引主分片 fetch 操作的总耗时（毫秒）                 |
| payload.elasticsearch.index_stats.primaries.search.fetch_total                     | 索引主分片 fetch 操作的总数量                         |
| payload.elasticsearch.index_stats.primaries.search.open_contexts                   | 索引主分片打开查询上下文的总数量                      |
| payload.elasticsearch.index_stats.primaries.search.query_current                   | 索引主分片当前正在进行 query 操作的总数量             |
| payload.elasticsearch.index_stats.primaries.search.query_time_in_millis            | 索引主分片 query 操作的总耗时（毫秒）                 |
| payload.elasticsearch.index_stats.primaries.search.query_total                     | 索引主分片 query 操作的总数量                         |
| payload.elasticsearch.index_stats.primaries.search.scroll_current                  | 索引主分片当前正在进行 scroll 操作的总数量            |
| payload.elasticsearch.index_stats.primaries.search.scroll_time_in_millis           | 索引主分片 scroll 操作的总耗时（毫秒）                |
| payload.elasticsearch.index_stats.primaries.search.scroll_total                    | 索引主分片 scroll 操作的总数量                        |
| payload.elasticsearch.index_stats.primaries.search.suggest_current                 | 索引主分片当前正在进行 suggest 操作的总数量           |
| payload.elasticsearch.index_stats.primaries.search.suggest_time_in_millis          | 索引主分片 suggest 操作的总耗时（毫秒）               |
| payload.elasticsearch.index_stats.primaries.search.suggest_total                   | 索引主分片 suggest 操作的总数量                       |
| payload.elasticsearch.index_stats.primaries.segments.count                         | 索引主分片 segments 的数量                            |
| payload.elasticsearch.index_stats.primaries.segments.doc_values_memory_in_bytes    | 索引主分片 doc values 占用的内存大小（字节）          |
| payload.elasticsearch.index_stats.primaries.segments.file_sizes                    | 有关索引主分片文件大小的统计信息                      |
| payload.elasticsearch.index_stats.primaries.segments.fixed_bit_set_memory_in_bytes | 索引主分片 BitSet 占用的内存大小（字节）              |
| payload.elasticsearch.index_stats.primaries.segments.index_writer_memory_in_bytes  | 索引主分片 index writer 占用的内存大小（字节）        |
| payload.elasticsearch.index_stats.primaries.segments.max_unsafe_auto_id_timestamp  | 索引主分片自动生成 ID 的最新时间戳                    |
| payload.elasticsearch.index_stats.primaries.segments.memory_in_bytes               | 索引主分片 segments 占用的内存大小（字节）            |
| payload.elasticsearch.index_stats.primaries.segments.norms_memory_in_bytes         | 索引主分片 norms 占用的内存大小（字节）               |
| payload.elasticsearch.index_stats.primaries.segments.points_memory_in_bytes        | 索引主分片 points 占用的内存大小（字节）              |
| payload.elasticsearch.index_stats.primaries.segments.stored_fields_memory_in_bytes | 索引主分片存储字段占用的内存大小（字节）              |
| payload.elasticsearch.index_stats.primaries.segments.term_vectors_memory_in_bytes  | 索引主分片 term vectors 占用的内存大小（字节）        |
| payload.elasticsearch.index_stats.primaries.segments.terms_memory_in_bytes         | 索引主分片 terms 查询占用的内存大小（字节）           |
| payload.elasticsearch.index_stats.primaries.segments.version_map_memory_in_bytes   | 索引主分片 version map 占用的内存大小（字节）         |
| payload.elasticsearch.index_stats.primaries.store.reserved_in_bytes                | 索引主分片快照恢复预计的大小（字节）                  |
| payload.elasticsearch.index_stats.primaries.store.size_in_bytes                    | 索引主分片存储大小（字节）                            |
| payload.elasticsearch.index_stats.primaries.store.total_data_set_size_in_bytes     | 索引主分片数据集的总大小（字节）                      |
| payload.elasticsearch.index_stats.primaries.translog.earliest_last_modified_age    | 索引主分片事务日志最后的修改时间                      |
| payload.elasticsearch.index_stats.primaries.translog.operations                    | 索引主分片 translog 操作的数量                        |
| payload.elasticsearch.index_stats.primaries.translog.size_in_bytes                 | 索引主分片 translog 的大小（字节）                    |
| payload.elasticsearch.index_stats.primaries.translog.uncommitted_operations        | 索引主分片 translog 中未提交操作的数量                |
| payload.elasticsearch.index_stats.primaries.translog.uncommitted_size_in_bytes     | 索引主分片 translog 中未提交操作的大小（字节）        |
| payload.elasticsearch.index_stats.primaries.warmer.current                         | 索引主分片正在运行预热的数量                          |
| payload.elasticsearch.index_stats.primaries.warmer.total                           | 索引主分片运行预热的总量                              |
| payload.elasticsearch.index_stats.primaries.warmer.total_time_in_millis            | 索引主分片运行预热的总耗时（毫秒）                    |
| payload.elasticsearch.index_stats.total.completion.size_in_bytes                   | 索引 completion 缓存大小（字节）                      |
| payload.elasticsearch.index_stats.total.docs.count                                 | 索引的文档数                                          |
| payload.elasticsearch.index_stats.total.docs.deleted                               | 索引的删除文档数                                      |
| payload.elasticsearch.index_stats.total.fielddata.evictions                        | 索引字段数据缓存中清除的数量                          |
| payload.elasticsearch.index_stats.total.fielddata.memory_size_in_bytes             | 索引字段数据缓存大小（字节）                          |
| payload.elasticsearch.index_stats.total.flush.periodic                             | 索引 flush 操作定时执行的次数                         |
| payload.elasticsearch.index_stats.total.flush.total                                | 索引 flush 操作的总数                                 |
| payload.elasticsearch.index_stats.total.flush.total_time_in_millis                 | 索引 flush 操作的总耗时（毫秒）                       |
| payload.elasticsearch.index_stats.total.get.current                                | 索引当前正在进行 get 操作的次数                       |
| payload.elasticsearch.index_stats.total.get.exists_time_in_millis                  | 索引 get 操作成功的总耗时（毫秒）                     |
| payload.elasticsearch.index_stats.total.get.exists_total                           | 索引 get 操作成功的总次数                             |
| payload.elasticsearch.index_stats.total.get.missing_time_in_millis                 | 索引 get 操作失败的总耗时（毫秒）                     |
| payload.elasticsearch.index_stats.total.get.missing_total                          | 索引 get 操作失败的总次数                             |
| payload.elasticsearch.index_stats.total.get.time_in_millis                         | 索引 get 操作的总耗时（毫秒）                         |
| payload.elasticsearch.index_stats.total.get.total                                  | 索引 get 操作的总次数                                 |
| payload.elasticsearch.index_stats.total.indexing.delete_current                    | 索引当前正在进行删除操作的次数                        |
| payload.elasticsearch.index_stats.total.indexing.delete_time_in_millis             | 索引删除操作的总耗时（毫秒）                          |
| payload.elasticsearch.index_stats.total.indexing.delete_total                      | 索引删除操作的总次数                                  |
| payload.elasticsearch.index_stats.total.indexing.index_current                     | 索引当前正在进行操作的次数                            |
| payload.elasticsearch.index_stats.total.indexing.index_failed                      | 索引操作失败的次数                                    |
| payload.elasticsearch.index_stats.total.indexing.index_time_in_millis              | 索引操作消耗的时间（毫秒）                            |
| payload.elasticsearch.index_stats.total.indexing.index_total                       | 索引操作的总次数                                      |
| payload.elasticsearch.index_stats.total.indexing.is_throttled                      | 索引操作是否被限流                                    |
| payload.elasticsearch.index_stats.total.indexing.noop_update_total                 | 索引空更新的次数                                      |
| payload.elasticsearch.index_stats.total.indexing.throttle_time_in_millis           | 索引限流操作所花费的时间（毫秒）                      |
| payload.elasticsearch.index_stats.total.merges.current                             | 索引正在进行 merge 操作的数量                         |
| payload.elasticsearch.index_stats.total.merges.current_docs                        | 索引正在进行 merge 操作的文档数                       |
| payload.elasticsearch.index_stats.total.merges.current_size_in_bytes               | 索引正在进行 merge 操作所占用的内存大小（字节）       |
| payload.elasticsearch.index_stats.total.merges.total                               | 索引 merge 操作的总数                                 |
| payload.elasticsearch.index_stats.total.merges.total_auto_throttle_in_bytes        | 索引自动触发限流操作的阈值（字节）                    |
| payload.elasticsearch.index_stats.total.merges.total_docs                          | 索引 merge 操作的文档总数                             |
| payload.elasticsearch.index_stats.total.merges.total_size_in_bytes                 | 索引 merge 操作的总大小                               |
| payload.elasticsearch.index_stats.total.merges.total_stopped_time_in_millis        | 索引 merge 操作停止的总耗时（毫秒）                   |
| payload.elasticsearch.index_stats.total.merges.total_throttled_time_in_millis      | 索引 merge 操作限流的总耗时（毫秒）                   |
| payload.elasticsearch.index_stats.total.merges.total_time_in_millis                | 索引 merge 操作的总耗时（毫秒）                       |
| payload.elasticsearch.index_stats.total.query_cache.cache_count                    | 索引当前查询缓存中的文档数量                          |
| payload.elasticsearch.index_stats.total.query_cache.cache_size                     | 索引当前查询缓存中的文档大小                          |
| payload.elasticsearch.index_stats.total.query_cache.evictions                      | 索引查询缓存中清除的数量                              |
| payload.elasticsearch.index_stats.total.query_cache.hit_count                      | 索引查询缓存命中的次数                                |
| payload.elasticsearch.index_stats.total.query_cache.memory_size_in_bytes           | 索引查询缓存占用的内存大小（字节）                    |
| payload.elasticsearch.index_stats.total.query_cache.miss_count                     | 索引查询缓存未命中的次数                              |
| payload.elasticsearch.index_stats.total.query_cache.total_count                    | 索引查询缓存的总次数                                  |
| payload.elasticsearch.index_stats.total.recovery.current_as_source                 | 索引当前作为恢复源的数量                              |
| payload.elasticsearch.index_stats.total.recovery.current_as_target                 | 索引当前作为恢复目标的数量                            |
| payload.elasticsearch.index_stats.total.recovery.throttle_time_in_millis           | 索引恢复操作的延迟时长                                |
| payload.elasticsearch.index_stats.total.refresh.external_total                     | 索引外部 refresh 操作的总数                           |
| payload.elasticsearch.index_stats.total.refresh.external_total_time_in_millis      | 索引外部 refresh 操作的总耗时（毫秒）                 |
| payload.elasticsearch.index_stats.total.refresh.listeners                          | 索引 refresh listeners 的数量                         |
| payload.elasticsearch.index_stats.total.refresh.total                              | 索引 refresh 操作的总数                               |
| payload.elasticsearch.index_stats.total.refresh.total_time_in_millis               | 索引 refresh 操作的总耗时（毫秒）                     |
| payload.elasticsearch.index_stats.total.request_cache.evictions                    | 索引请求缓存中清除的数量                              |
| payload.elasticsearch.index_stats.total.request_cache.hit_count                    | 索引请求缓存的命中数量                                |
| payload.elasticsearch.index_stats.total.request_cache.memory_size_in_bytes         | 索引请求缓存占用的内存大小（字节）                    |
| payload.elasticsearch.index_stats.total.request_cache.miss_count                   | 索引请求缓存的未命中数量                              |
| payload.elasticsearch.index_stats.total.search.fetch_current                       | 索引当前正在进行 fetch 操作的总数量                   |
| payload.elasticsearch.index_stats.total.search.fetch_time_in_millis                | 索引 fetch 操作的总耗时（毫秒）                       |
| payload.elasticsearch.index_stats.total.search.fetch_total                         | 索引 fetch 操作的总数量                               |
| payload.elasticsearch.index_stats.total.search.open_contexts                       | 索引打开查询上下文的总数量                            |
| payload.elasticsearch.index_stats.total.search.query_current                       | 索引当前正在进行 query 操作的总数量                   |
| payload.elasticsearch.index_stats.total.search.query_time_in_millis                | 索引 query 操作的总耗时（毫秒）                       |
| payload.elasticsearch.index_stats.total.search.query_total                         | 索引 query 操作的总数量                               |
| payload.elasticsearch.index_stats.total.search.scroll_current                      | 索引当前正在进行 scroll 操作的总数量                  |
| payload.elasticsearch.index_stats.total.search.scroll_time_in_millis               | 索引 scroll 操作的总耗时（毫秒）                      |
| payload.elasticsearch.index_stats.total.search.scroll_total                        | 索引 scroll 操作的总数量                              |
| payload.elasticsearch.index_stats.total.search.suggest_current                     | 索引当前正在进行 suggest 操作的总数量                 |
| payload.elasticsearch.index_stats.total.search.suggest_time_in_millis              | 索引 suggest 操作的总耗时（毫秒）                     |
| payload.elasticsearch.index_stats.total.search.suggest_total                       | 索引 suggest 操作的总数量                             |
| payload.elasticsearch.index_stats.total.segments.count                             | 索引 segments 的数量                                  |
| payload.elasticsearch.index_stats.total.segments.doc_values_memory_in_bytes        | 索引 doc values 占用的内存大小（字节）                |
| payload.elasticsearch.index_stats.total.segments.file_sizes                        | 有关索引文件大小的统计信息                            |
| payload.elasticsearch.index_stats.total.segments.fixed_bit_set_memory_in_bytes     | 索引 BitSet 占用的内存大小（字节）                    |
| payload.elasticsearch.index_stats.total.segments.index_writer_memory_in_bytes      | 索引 index writer 占用的内存大小（字节）              |
| payload.elasticsearch.index_stats.total.segments.max_unsafe_auto_id_timestamp      | 索引自动生成 ID 的最新时间戳                          |
| payload.elasticsearch.index_stats.total.segments.memory_in_bytes                   | 索引 segments 占用的内存大小（字节）                  |
| payload.elasticsearch.index_stats.total.segments.norms_memory_in_bytes             | 索引 norms 占用的内存大小（字节）                     |
| payload.elasticsearch.index_stats.total.segments.points_memory_in_bytes            | 索引 points 占用的内存大小（字节）                    |
| payload.elasticsearch.index_stats.total.segments.stored_fields_memory_in_bytes     | 索引存储字段占用的内存大小（字节）                    |
| payload.elasticsearch.index_stats.total.segments.term_vectors_memory_in_bytes      | 索引 term vectors 占用的内存大小（字节）              |
| payload.elasticsearch.index_stats.total.segments.terms_memory_in_bytes             | 索引 terms 查询占用的内存大小（字节）                 |
| payload.elasticsearch.index_stats.total.segments.version_map_memory_in_bytes       | 索引 version map 占用的内存大小（字节）               |
| payload.elasticsearch.index_stats.total.store.reserved_in_bytes                    | 索引快照恢复预计的大小（字节）                        |
| payload.elasticsearch.index_stats.total.store.size_in_bytes                        | 索引存储大小（字节）                                  |
| payload.elasticsearch.index_stats.total.store.total_data_set_size_in_bytes         | 索引数据集的总大小（字节）                            |
| payload.elasticsearch.index_stats.total.translog.earliest_last_modified_age        | 索引事务日志最后的修改时间                            |
| payload.elasticsearch.index_stats.total.translog.operations                        | 索引 translog 操作的数量                              |
| payload.elasticsearch.index_stats.total.translog.size_in_bytes                     | 索引 translog 的大小（字节）                          |
| payload.elasticsearch.index_stats.total.translog.uncommitted_operations            | 索引 translog 中未提交操作的数量                      |
| payload.elasticsearch.index_stats.total.translog.uncommitted_size_in_bytes         | 索引 translog 中未提交操作的大小（字节）              |
| payload.elasticsearch.index_stats.total.warmer.current                             | 索引正在运行预热的数量                                |
| payload.elasticsearch.index_stats.total.warmer.total                               | 索引运行预热的总量                                    |
| payload.elasticsearch.index_stats.total.warmer.total_time_in_millis                | 索引运行预热的总耗时（毫秒）                          |

## payload.elasticsearch.node\*

| 字段名                                                                                                       | 说明                                                                                 |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| payload.elasticsearch.node_routing_table                                                                     | 节点路由信息列表                                                                     |
| payload.elasticsearch.node_stats.timestamp                                                                   | 节点当前时间戳（毫秒）                                                               |
| payload.elasticsearch.node_stats.name                                                                        | 节点名称                                                                             |
| payload.elasticsearch.node_stats.transport_address                                                           | 节点传输层的主机和端口，用于集群中节点之间的内部通信                                 |
| payload.elasticsearch.node_stats.host                                                                        | 节点所在的网络主机                                                                   |
| payload.elasticsearch.node_stats.ip                                                                          | 节点 IP 地址和端口                                                                   |
| payload.elasticsearch.node_stats.roles                                                                       | 节点角色                                                                             |
| payload.elasticsearch.node_stats.attributes                                                                  | 节点属性列表                                                                         |
| payload.elasticsearch.node_stats.indices.docs.count                                                          | 节点索引文档数                                                                       |
| payload.elasticsearch.node_stats.indices.docs.deleted                                                        | 节点索引删除的文档数                                                                 |
| payload.elasticsearch.node_stats.indices.store.size_in_bytes                                                 | 节点索引分片的总大小(字节)                                                           |
| payload.elasticsearch.node_stats.indices.store.reserved_in_bytes                                             | 预测因正在进行的对等恢复、恢复快照和类似活动，节点上的分片存储最终将增长多少（字节） |
| payload.elasticsearch.node_stats.indices.indexing.index_total                                                | 节点索引操作的总数                                                                   |
| payload.elasticsearch.node_stats.indices.indexing.index_time_in_millis                                       | 节点执行索引操作所花费的总时间（毫秒）                                               |
| payload.elasticsearch.node_stats.indices.indexing.index_current                                              | 节点当前正在运行的索引操作数                                                         |
| payload.elasticsearch.node_stats.indices.indexing.index_failed                                               | 节点索引操作失败的次数                                                               |
| payload.elasticsearch.node_stats.indices.indexing.delete_total                                               | 节点索引删除操作的总数                                                               |
| payload.elasticsearch.node_stats.indices.indexing.delete_time                                                | 节点执行索引删除操作所花费的时间                                                     |
| payload.elasticsearch.node_stats.indices.indexing.delete_time_in_millis                                      | 节点执行索引删除操作花费的时间(毫秒)                                                 |
| payload.elasticsearch.node_stats.indices.indexing.delete_current                                             | 节点当前正在运行的删除索引操作数                                                     |
| payload.elasticsearch.node_stats.indices.indexing.noop_update_total                                          | 节点索引 noop 操作的总次数                                                           |
| payload.elasticsearch.node_stats.indices.indexing.is_throttled                                               | 节点索引是否限制操作                                                                 |
| payload.elasticsearch.node_stats.indices.indexing.throttle_time_in_millis                                    | 节点索引限制操作的总时间(毫秒)。                                                     |
| payload.elasticsearch.node_stats.indices.get.total                                                           | 节点索引 get 操作的总次数                                                            |
| payload.elasticsearch.node_stats.indices.get.time_in_millis                                                  | 节点执行索引 get 操作花费的时间（毫秒）                                              |
| payload.elasticsearch.node_stats.indices.get.exists_total                                                    | 节点索引 get 操作成功的总次数                                                        |
| payload.elasticsearch.node_stats.indices.get.exists_time_in_millis                                           | 节点索引 get 操作成功花费的时间（毫秒）                                              |
| payload.elasticsearch.node_stats.indices.get.missing_total                                                   | 节点索引 get 操作失败的总次数                                                        |
| payload.elasticsearch.node_stats.indices.get.missing_time_in_millis                                          | 节点索引 get 操作失败花费的时间（毫秒）                                              |
| payload.elasticsearch.node_stats.indices.get.current                                                         | 节点当前正在运行的索引 get 操作数                                                    |
| payload.elasticsearch.node_stats.indices.search.open_contexts                                                | 节点索引打开的搜索上下文的数目                                                       |
| payload.elasticsearch.node_stats.indices.search.query_total                                                  | 节点索引查询操作总数                                                                 |
| payload.elasticsearch.node_stats.indices.search.query_time_in_millis                                         | 节点索引查询花费的时间（毫秒）                                                       |
| payload.elasticsearch.node_stats.indices.search.query_current                                                | 节点当前正在运行的索引查询操作数                                                     |
| payload.elasticsearch.node_stats.indices.search.fetch_total                                                  | 节点索引读取操作总数                                                                 |
| payload.elasticsearch.node_stats.indices.search.fetch_time_in_millis                                         | 节点索引读取操作花费的时间（毫秒）                                                   |
| payload.elasticsearch.node_stats.indices.search.fetch_current                                                | 节点当前正在运行的索引读取操作数                                                     |
| payload.elasticsearch.node_stats.indices.search.scroll_total                                                 | 节点索引滚动操作总数                                                                 |
| payload.elasticsearch.node_stats.indices.search.scroll_time_in_millis                                        | 节点索引滚动操作花费的时间（毫秒）                                                   |
| payload.elasticsearch.node_stats.indices.search.scroll_current                                               | 节点当前正在运行的索引滚动操作数                                                     |
| payload.elasticsearch.node_stats.indices.search.suggest_total                                                | 节点索引推荐操作总数                                                                 |
| payload.elasticsearch.node_stats.indices.search.suggest_time_in_millis                                       | 节点索引推荐操作花费的时间（毫秒）                                                   |
| payload.elasticsearch.node_stats.indices.search.suggest_current                                              | 节点当前正在运行的索引推荐操作数                                                     |
| payload.elasticsearch.node_stats.indices.merges.current                                                      | 节点当前正在运行的索引合并操作数                                                     |
| payload.elasticsearch.node_stats.indices.merges.current_docs                                                 | 节点当前正在运行索引合并的文档数                                                     |
| payload.elasticsearch.node_stats.indices.merges.current_size_in_bytes                                        | 节点当前执行索引文档合并的内存（字节）                                               |
| payload.elasticsearch.node_stats.indices.merges.total                                                        | 节点索引合并操作总数                                                                 |
| payload.elasticsearch.node_stats.indices.merges.total_time_in_millis                                         | 节点索引合并操作花费的总时间（毫秒）                                                 |
| payload.elasticsearch.node_stats.indices.merges.total_docs                                                   | 节点索引合并文档总数                                                                 |
| payload.elasticsearch.node_stats.indices.merges.total_size_in_bytes                                          | 节点索引合并文档总大小（字节）                                                       |
| payload.elasticsearch.node_stats.indices.merges.total_stopped_time_in_millis                                 | 节点停止索引合并操作的总时间（毫秒）                                                 |
| payload.elasticsearch.node_stats.indices.merges.total_throttled_time_in_millis                               | 节点限制索引合并操作的总时间（毫秒）                                                 |
| payload.elasticsearch.node_stats.indices.merges.total_auto_throttle_in_bytes                                 | 节点自动节流索引合并操作的大小（字节）                                               |
| payload.elasticsearch.node_stats.indices.refresh.total                                                       | 节点索引 refresh 操作总数                                                            |
| payload.elasticsearch.node_stats.indices.refresh.total_time_in_millis                                        | 节点索引 refresh 操作花费的总时间（毫秒）                                            |
| payload.elasticsearch.node_stats.indices.refresh.external_total                                              | 节点索引外部 refresh 操作总数                                                        |
| payload.elasticsearch.node_stats.indices.refresh.external_total_time_in_millis                               | 节点索引外部 refresh 操作花费的总时间（毫秒）                                        |
| payload.elasticsearch.node_stats.indices.refresh.listeners                                                   | 节点索引 refresh 监听器的数量                                                        |
| payload.elasticsearch.node_stats.indices.flush.total                                                         | 节点索引 flush 操作总数                                                              |
| payload.elasticsearch.node_stats.indices.flush.periodic                                                      | 节点索引定时 flush 操作总数                                                          |
| payload.elasticsearch.node_stats.indices.flush.total_time_in_millis                                          | 节点索引 flush 操作花费的总时间（毫秒）                                              |
| payload.elasticsearch.node_stats.indices.warmer.current                                                      | 节点活跃索引回暖器数量                                                               |
| payload.elasticsearch.node_stats.indices.warmer.total                                                        | 节点索引回暖器总数                                                                   |
| payload.elasticsearch.node_stats.indices.warmer.total_time_in_millis                                         | 节点执行索引回暖操作花费的总时间（毫秒）                                             |
| payload.elasticsearch.node_stats.indices.query_cache.memory_size_in_bytes                                    | 节点索引查询缓存的总内存量（字节）                                                   |
| payload.elasticsearch.node_stats.indices.query_cache.total_count                                             | 节点索引查询缓存中查询命中、未命中和缓存的总数                                       |
| payload.elasticsearch.node_stats.indices.query_cache.hit_count                                               | 节点索引查询缓存命中数                                                               |
| payload.elasticsearch.node_stats.indices.query_cache.miss_count                                              | 节点索引查询缓存未命中数                                                             |
| payload.elasticsearch.node_stats.indices.query_cache.cache_size                                              | 节点索引查询缓存大小（字节）                                                         |
| payload.elasticsearch.node_stats.indices.query_cache.cache_count                                             | 节点索引查询缓存中查询计数                                                           |
| payload.elasticsearch.node_stats.indices.query_cache.evictions                                               | 节点索引查询缓存清除的数量                                                           |
| payload.elasticsearch.node_stats.indices.fielddata.memory_size_in_bytes                                      | 节点用于索引字段数据缓存的内存大小（字节）                                           |
| payload.elasticsearch.node_stats.indices.fielddata.evictions                                                 | 节点索引字段数据缓存中清除的数量                                                     |
| payload.elasticsearch.node_stats.indices.completion.size_in_bytes                                            | 节点用于索引完成的总内存量（字节）                                                   |
| payload.elasticsearch.node_stats.indices.segments.count                                                      | 节点索引段数量                                                                       |
| payload.elasticsearch.node_stats.indices.segments.memory_in_bytes                                            | 节点索引段所使用的总内存（字节）                                                     |
| payload.elasticsearch.node_stats.indices.segments.terms_memory_in_bytes                                      | 节点用于索引段 terms 的总内存量（字节）                                              |
| payload.elasticsearch.node_stats.indices.segments.stored_fields_memory_in_bytes                              | 节点用于存储索引字段的总内存量（字节）                                               |
| payload.elasticsearch.node_stats.indices.segments.term_vectors_memory_in_bytes                               | 节点用于索引段检索词向量的总内存量（字节）                                           |
| payload.elasticsearch.node_stats.indices.segments.norms_memory_in_bytes                                      | 节点用于索引段规范化因子的总内存量（字节）                                           |
| payload.elasticsearch.node_stats.indices.segments.points_memory_in_bytes                                     | 节点用于索引段 points 的总内存量（字节）                                             |
| payload.elasticsearch.node_stats.indices.segments.doc_values_memory_in_bytes                                 | 节点用于存放索引段文档值的总内存量（字节）                                           |
| payload.elasticsearch.node_stats.indices.segments.index_writer_memory_in_bytes                               | 节点用于索引写入器的总内存量（字节）                                                 |
| payload.elasticsearch.node_stats.indices.segments.version_map_memory_in_bytes                                | 节点用于索引段版本映射的总内存量（字节）                                             |
| payload.elasticsearch.node_stats.indices.segments.fixed_bit_set_memory_in_bytes                              | 节点用于索引段固定位集的总内存量（字节）                                             |
| payload.elasticsearch.node_stats.indices.segments.file_sizes                                                 | 节点有关索引段文件大小的统计信息                                                     |
| payload.elasticsearch.node_stats.indices.translog.operations                                                 | 节点索引事务日志操作次数                                                             |
| payload.elasticsearch.node_stats.indices.translog.size_in_bytes                                              | 节点索引事务日志大小（字节）                                                         |
| payload.elasticsearch.node_stats.indices.translog.uncommitted_operations                                     | 节点索引未提交的事务日志操作数                                                       |
| payload.elasticsearch.node_stats.indices.translog.uncommitted_size_in_bytes                                  | 节点索引未提交的事务日志大小（字节）                                                 |
| payload.elasticsearch.node_stats.indices.translog.earliest_last_modified_age                                 | 节点索引事务日志最后的修改时间                                                       |
| payload.elasticsearch.node_stats.indices.request_cache.memory_size_in_bytes                                  | 节点索引请求缓存的内存大小（字节）                                                   |
| payload.elasticsearch.node_stats.indices.request_cache.evictions                                             | 节点索引请求缓存操作次数                                                             |
| payload.elasticsearch.node_stats.indices.request_cache.hit_count                                             | 节点索引请求缓存命中次数                                                             |
| payload.elasticsearch.node_stats.indices.request_cache.miss_count                                            | 节点索引请求缓存未命中次数                                                           |
| payload.elasticsearch.node_stats.indices.recovery.current_as_source                                          | 以节点索引分片为源的恢复次数                                                         |
| payload.elasticsearch.node_stats.indices.recovery.current_as_target                                          | 以节点索引分片为目标的恢复次数                                                       |
| payload.elasticsearch.node_stats.indices.recovery.throttle_time_in_millis                                    | 节点索引由于节流导致恢复操作延迟的时间（毫秒）                                       |
| payload.elasticsearch.node_stats.os.timestamp                                                                | 节点系统指标刷新的最新时间戳（毫秒）                                                 |
| payload.elasticsearch.node_stats.os.cpu.percent                                                              | 节点系统 CPU 使用率                                                                  |
| payload.elasticsearch.node_stats.os.cpu.load_average.1m                                                      | 节点系统 1 分钟平均负载                                                              |
| payload.elasticsearch.node_stats.os.mem.total_in_bytes                                                       | 节点系统物理内存大小（字节）                                                         |
| payload.elasticsearch.node_stats.os.mem.free_in_bytes                                                        | 节点系统空闲物理内存大小（字节）                                                     |
| payload.elasticsearch.node_stats.os.mem.used_in_bytes                                                        | 节点系统已使用物理内存大小（字节）                                                   |
| payload.elasticsearch.node_stats.os.mem.free_percent                                                         | 节点系统空闲内存百分比                                                               |
| payload.elasticsearch.node_stats.os.mem.used_percent                                                         | 节点系统已使用内存百分比                                                             |
| payload.elasticsearch.node_stats.os.swap.total_in_bytes                                                      | 节点系统 swap 大小（字节）                                                           |
| payload.elasticsearch.node_stats.os.swap.free_in_bytes                                                       | 节点系统空闲 swap 大小（字节）                                                       |
| payload.elasticsearch.node_stats.os.swap.used_in_bytes                                                       | 节点系统已使用 swap 大小（字节）                                                     |
| payload.elasticsearch.node_stats.process.timestamp                                                           | 节点进程指标刷新的最新时间戳（毫秒）                                                 |
| payload.elasticsearch.node_stats.process.open_file_descriptors                                               | 节点进程打开的文件描述符的数量                                                       |
| payload.elasticsearch.node_stats.process.max_file_descriptors                                                | 节点进程可以打开的文件描述符的最大数量                                               |
| payload.elasticsearch.node_stats.process.cpu.percent                                                         | 节点进程 CPU 使用率                                                                  |
| payload.elasticsearch.node_stats.process.cpu.total_in_millis                                                 | 节点 Java 虚拟机进程占用的 CPU 时间（毫秒）                                          |
| payload.elasticsearch.node_stats.process.mem.total_virtual_in_bytes                                          | 节点保证进程可以正常运行的虚拟内存大小（字节）                                       |
| payload.elasticsearch.node_stats.jvm.timestamp                                                               | 节点 JVM 最新指标刷新时间                                                            |
| payload.elasticsearch.node_stats.jvm.uptime_in_millis                                                        | 节点 JVM 运行的时间（毫秒）                                                          |
| payload.elasticsearch.node_stats.jvm.mem.heap_used_in_bytes                                                  | 节点 JVM 堆当前使用的内存大小（字节）                                                |
| payload.elasticsearch.node_stats.jvm.mem.heap_used_percent                                                   | 节点 JVM 堆当前使用的内存百分比                                                      |
| payload.elasticsearch.node_stats.jvm.mem.heap_committed_in_bytes                                             | 节点 JVM 堆可用的内存大小（字节）                                                    |
| payload.elasticsearch.node_stats.jvm.mem.heap_max_in_bytes                                                   | 节点 JVM 堆可用的最大内存量（字节）                                                  |
| payload.elasticsearch.node_stats.jvm.mem.non_heap_used_in_bytes                                              | 节点 JVM 非堆使用的内存大小（字节）                                                  |
| payload.elasticsearch.node_stats.jvm.mem.non_heap_committed_in_bytes                                         | 节点 JVM 非堆可用的内存大小（字节）                                                  |
| payload.elasticsearch.node_stats.jvm.mem.pools.young.used_in_bytes                                           | 节点 JVM 年轻代堆已用的内存量（字节）                                                |
| payload.elasticsearch.node_stats.jvm.mem.pools.young.max_in_bytes                                            | 节点 JVM 年轻代堆可用的最大内存量（字节）                                            |
| payload.elasticsearch.node_stats.jvm.mem.pools.young.peak_used_in_bytes                                      | 节点 JVM 年轻代堆历史上使用的最大内存量（字节）                                      |
| payload.elasticsearch.node_stats.jvm.mem.pools.young.peak_max_in_bytes                                       | 节点 JVM 年轻代堆历史上使用的最大内存量（字节）                                      |
| payload.elasticsearch.node_stats.jvm.mem.pools.survivor.used_in_bytes                                        | 节点 JVM 幸存者空间已用的内存量（字节）                                              |
| payload.elasticsearch.node_stats.jvm.mem.pools.survivor.max_in_bytes                                         | 节点 JVM 幸存者空间可用的最大内存量（字节）                                          |
| payload.elasticsearch.node_stats.jvm.mem.pools.survivor.peak_used_in_bytes                                   | 节点 JVM 幸存者空间历史上使用的最大内存量（字节）                                    |
| payload.elasticsearch.node_stats.jvm.mem.pools.survivor.peak_max_in_bytes                                    | 节点 JVM 幸存者空间历史上使用的最大内存量（字节）                                    |
| payload.elasticsearch.node_stats.jvm.mem.pools.old.used_in_bytes                                             | 节点 JVM 老年代堆已用的内存量（字节）                                                |
| payload.elasticsearch.node_stats.jvm.mem.pools.old.max_in_bytes                                              | 节点 JVM 老年代堆可用的最大内存量（字节）                                            |
| payload.elasticsearch.node_stats.jvm.mem.pools.old.peak_used_in_bytes                                        | 节点 JVM 老年代堆历史上使用的最大内存量（字节）                                      |
| payload.elasticsearch.node_stats.jvm.mem.pools.old.peak_max_in_bytes                                         | 节点 JVM 老年代堆历史上使用的最高内存限制（字节）                                    |
| payload.elasticsearch.node_stats.jvm.threads.count                                                           | 节点 JVM 正在使用的活跃线程数                                                        |
| payload.elasticsearch.node_stats.jvm.threads.peak_count                                                      | 节点 JVM 可用的最大线程数                                                            |
| payload.elasticsearch.node_stats.jvm.gc.collectors.young.collection_count                                    | 节点收集年轻代对象的 JVM 垃圾收集器数量                                              |
| payload.elasticsearch.node_stats.jvm.gc.collectors.young.collection_time_in_millis                           | 节点 JVM 收集年轻代对象花费的总时间（毫秒）                                          |
| payload.elasticsearch.node_stats.jvm.gc.collectors.old.collection_count                                      | 节点收集老年代对象的 JVM 垃圾收集器数量                                              |
| payload.elasticsearch.node_stats.jvm.gc.collectors.old.collection_time_in_millis                             | 节点 JVM 收集老年代对象花费的总时间（毫秒）                                          |
| payload.elasticsearch.node_stats.jvm.buffer_pools.mapped.count                                               | 节点 JVM 映射缓存池数量                                                              |
| payload.elasticsearch.node_stats.jvm.buffer_pools.mapped.used_in_bytes                                       | 节点 JVM 映射缓存池大小（字节）                                                      |
| payload.elasticsearch.node_stats.jvm.buffer_pools.mapped.total_capacity_in_bytes                             | 节点 JVM 映射缓存池总量（字节）                                                      |
| payload.elasticsearch.node_stats.jvm.buffer_pools.direct.count                                               | 节点 JVM 直接缓存池数量                                                              |
| payload.elasticsearch.node_stats.jvm.buffer_pools.direct.used_in_bytes                                       | 节点 JVM 直接缓存池大小（字节）                                                      |
| payload.elasticsearch.node_stats.jvm.buffer_pools.direct.total_capacity_in_bytes                             | 节点 JVM 直接缓存池总量（字节）                                                      |
| payload.elasticsearch.node_stats.jvm.classes.current_loaded_count                                            | 节点 JVM 当前加载的类数量                                                            |
| payload.elasticsearch.node_stats.jvm.classes.total_loaded_count                                              | 节点从 JVM 启动开始加载类的总数                                                      |
| payload.elasticsearch.node_stats.jvm.classes.total_unloaded_count                                            | 节点从 JVM 启动开始未加载类的总数                                                    |
| payload.elasticsearch.node_stats.thread_pool.某线程池.threads                                                | 节点某线程池里的线程数                                                               |
| payload.elasticsearch.node_stats.thread_pool.某线程池.queue                                                  | 节点某线程池队列里的任务数                                                           |
| payload.elasticsearch.node_stats.thread_pool.某线程池.active                                                 | 节点某线程池里的活跃线程数                                                           |
| payload.elasticsearch.node_stats.thread_pool.某线程池.rejected                                               | 节点某线程池执行器拒绝的任务数                                                       |
| payload.elasticsearch.node_stats.thread_pool.某线程池.largest                                                | 节点某线程池中活动线程的最大数目                                                     |
| payload.elasticsearch.node_stats.thread_pool.某线程池.completed                                              | 节点某线程池执行器完成的任务数                                                       |
| payload.elasticsearch.node_stats.fs.timestamp                                                                | 节点文件存储统计信息刷新的最新时间（毫秒）                                           |
| payload.elasticsearch.node_stats.fs.total.total_in_bytes                                                     | 节点文件存储总量（字节）                                                             |
| payload.elasticsearch.node_stats.fs.total.free_in_bytes                                                      | 节点文件存储未分配的大小（字节）                                                     |
| payload.elasticsearch.node_stats.fs.total.available_in_bytes                                                 | 节点 Java 虚拟机在所有文件存储上可用的总量（字节）                                   |
| payload.elasticsearch.node_stats.fs.data.path                                                                | 节点某个文件存储路径                                                                 |
| payload.elasticsearch.node_stats.fs.data.mount                                                               | 节点该文件存储挂载点                                                                 |
| payload.elasticsearch.node_stats.fs.data.type                                                                | 节点该文件存储类型                                                                   |
| payload.elasticsearch.node_stats.fs.data.total_in_bytes                                                      | 节点该文件存储总量（字节）                                                           |
| payload.elasticsearch.node_stats.fs.data.free_in_bytes                                                       | 节点该文件存储未分配的磁盘空间总量（字节）                                           |
| payload.elasticsearch.node_stats.fs.data.available_in_bytes                                                  | 节点 Java 虚拟机在该文件存储上可用的总量（字节）                                     |
| payload.elasticsearch.node_stats.transport.server_open                                                       | 节点用于内部通信的入方向 TCP 连接数                                                  |
| payload.elasticsearch.node_stats.transport.total_outbound_connections                                        | 节点自启动以来已打开的出站传输连接的累积数量                                         |
| payload.elasticsearch.node_stats.transport.rx_count                                                          | 集群内部通信时，节点接收到的 RX (receive)报文总数                                    |
| payload.elasticsearch.node_stats.transport.rx_size_in_bytes                                                  | 集群内部通信时，节点接收到的 RX (receive)报文大小（字节）                            |
| payload.elasticsearch.node_stats.transport.tx_count                                                          | 集群内部通信时，节点发送的 TX (transmit)报文总数                                     |
| payload.elasticsearch.node_stats.transport.tx_size_in_bytes                                                  | 集群内部通信时，节点发送的 TX (transmit)报文大小（字节）                             |
| payload.elasticsearch.node_stats.http.current_open                                                           | 节点当前打开的 HTTP 连接数                                                           |
| payload.elasticsearch.node_stats.http.total_opened                                                           | 节点打开的 HTTP 连接总数                                                             |
| payload.elasticsearch.node_stats.breakers.某断路器.limit_size_in_bytes                                       | 节点某断路器的内存限制（字节）                                                       |
| payload.elasticsearch.node_stats.breakers.某断路器.limit_size                                                | 节点某断路器的内存限制                                                               |
| payload.elasticsearch.node_stats.breakers.某断路器.estimated_size_in_bytes                                   | 节点某断路器操作预估使用的内存值（字节）                                             |
| payload.elasticsearch.node_stats.breakers.某断路器.estimated_size                                            | 节点某断路器操作预估使用的内存值                                                     |
| payload.elasticsearch.node_stats.breakers.某断路器.overhead                                                  | 一个常数，某断路器的所有估计值与之相乘以计算最终估计值                               |
| payload.elasticsearch.node_stats.breakers.某断路器.tripped                                                   | 节点某断路器被触发并防止内存不足错误的总次数                                         |
| payload.elasticsearch.node_stats.script.compilations                                                         | 节点执行内联脚本编译的总次数                                                         |
| payload.elasticsearch.node_stats.script.cache_evictions                                                      | 节点脚本缓存清除旧数据的总次数                                                       |
| payload.elasticsearch.node_stats.script.compilation_limit_triggered                                          | 节点脚本编译断路器限制内联脚本编译的总次数                                           |
| payload.elasticsearch.node_stats.discovery.cluster_state_queue.total                                         | 节点的集群状态队列里的总数                                                           |
| payload.elasticsearch.node_stats.discovery.cluster_state_queue.pending                                       | 节点的集群状态队列里挂起的数量                                                       |
| payload.elasticsearch.node_stats.discovery.cluster_state_queue.committed                                     | 节点的集群状态队列里已提交的数量                                                     |
| payload.elasticsearch.node_stats.discovery.published_cluster_states.full_states                              | 节点发布的集群状态数                                                                 |
| payload.elasticsearch.node_stats.discovery.published_cluster_states.incompatible_diffs                       | 节点发布的集群状态之间不兼容差异数                                                   |
| payload.elasticsearch.node_stats.discovery.published_cluster_states.compatible_diffs                         | 节点发布的集群状态之间兼容差异数                                                     |
| payload.elasticsearch.node_stats.indexing_pressure.memory.current.combined_coordinating_and_primary_in_bytes | 节点当前在协调或主阶段索引请求所消耗的内存（字节）                                   |
| payload.elasticsearch.node_stats.indexing_pressure.memory.current.coordinating_in_bytes                      | 节点当前在协调阶段索引请求所消耗的内存（字节）                                       |
| payload.elasticsearch.node_stats.indexing_pressure.memory.current.primary_in_bytes                           | 节点当前在主阶段索引请求所消耗的内存（字节）                                         |
| payload.elasticsearch.node_stats.indexing_pressure.memory.current.replica_in_bytes                           | 节点当前在复制阶段索引请求所消耗的内存（字节）                                       |
| payload.elasticsearch.node_stats.indexing_pressure.memory.current.all_in_bytes                               | 节点当前在协调、主或复制阶段索引请求所消耗的内存（字节）                             |
| payload.elasticsearch.node_stats.indexing_pressure.memory.total.combined_coordinating_and_primary_in_bytes   | 节点自启动以来在协调或主阶段索引请求所消耗的内存（字节）                             |
| payload.elasticsearch.node_stats.indexing_pressure.memory.total.coordinating_in_bytes                        | 节点自启动以来在协调阶段索引请求所消耗的内存（字节）                                 |
| payload.elasticsearch.node_stats.indexing_pressure.memory.total.primary_in_bytes                             | 节点自启动以来在主阶段索引请求所消耗的内存（字节）                                   |
| payload.elasticsearch.node_stats.indexing_pressure.memory.total.replica_in_bytes                             | 节点自启动以来在复制阶段索引请求所消耗的内存（字节）                                 |
| payload.elasticsearch.node_stats.indexing_pressure.memory.total.all_in_bytes                                 | 节点自启动以来在协调、主或复制阶段索引请求所消耗的内存（字节）                       |
| payload.elasticsearch.node_stats.indexing_pressure.memory.total.coordinating_rejections                      | 节点自启动以来在协调阶段被拒绝的索引请求数                                           |
| payload.elasticsearch.node_stats.indexing_pressure.memory.total.primary_rejections                           | 节点自启动以来在主阶段被拒绝的索引请求数                                             |
| payload.elasticsearch.node_stats.indexing_pressure.memory.total.replica_rejections                           | 节点自启动以来在复制阶段被拒绝的索引请求数                                           |
| payload.elasticsearch.node_stats.indexing_pressure.memory.limit_in_bytes                                     | 节点索引请求的内存限制                                                               |
| payload.elasticsearch.node_stats.shard_info                                                                  | 节点分片信息列表                                                                     |

## payload.host

| 字段名                                                 | 说明                                 |
| ------------------------------------------------------ | ------------------------------------ |
| payload.host.cpu.idle                                  | 主机 CPU idle 占用百分比             |
| payload.host.cpu.iowait                                | 主机 CPU iowait 占用百分比           |
| payload.host.cpu.system                                | 主机 CPU 系统占用百分比              |
| payload.host.cpu.user                                  | 主机 CPU 用户占用百分比              |
| payload.host.cpu.used_percent                          | 主机 CPU 已使用百分比                |
| payload.host.cpu.load.load1                            | 主机 CPU 1 分钟负载值                |
| payload.host.cpu.load.load15                           | 主机 CPU 15 分钟负载值               |
| payload.host.cpu.load.load5                            | 主机 CPU 5 分钟负载值                |
| payload.host.diskio.read.bytes                         | 主机磁盘 IO 读取数据量               |
| payload.host.diskio.read.time_in_ms                    | 主机磁盘 IO 读取数据所用时间         |
| payload.host.diskio_summary.read.bytes                 | 主机所有磁盘 IO 读取数据量汇总       |
| payload.host.diskio_summary.read.time_in_ms            | 主机所有磁盘 IO 读取数据所用时间汇总 |
| payload.host.diskio.write.bytes                        | 主机磁盘 IO 写入数据量               |
| payload.host.diskio.write.time_in_ms                   | 主机磁盘 IO 写入数据所用时间         |
| payload.host.diskio_summary.write.bytes                | 主机所有磁盘 IO 写入数据量汇总       |
| payload.host.diskio_summary.write.time_in_ms           | 主机所有磁盘 IO 写入数据所用时间汇总 |
| payload.host.filesystem.mount_point                    | 主机磁盘挂载点（按分区）             |
| payload.host.filesystem.total.bytes                    | 主机磁盘总空间量（按分区）           |
| payload.host.filesystem.used.bytes                     | 主机磁盘空间使用量（按分区）         |
| payload.host.filesystem.used.percent                   | 主机磁盘空间使用百分比（按分区）     |
| payload.host.filesystem.free.bytes                     | 主机磁盘剩余空间（按分区）           |
| payload.host.filesystem_summary.mount_point            | 主机磁盘挂载点（/）                  |
| payload.host.filesystem_summary.total.bytes            | 主机所有磁盘总空间量汇总             |
| payload.host.filesystem_summary.used.bytes             | 主机所有磁盘空间使用量汇总           |
| payload.host.filesystem_summary.used.percent           | 主机所有磁盘空间使用百分比汇总       |
| payload.host.filesystem_summary.free.bytes             | 主机所有磁盘剩余空间总量             |
| payload.host.memory.available.bytes                    | 主机内存可用量                       |
| payload.host.memory.cached.bytes                       | 主机内存 cache 量                    |
| payload.host.memory.free.bytes                         | 主机内存空闲量                       |
| payload.host.memory.total.bytes                        | 主机内存总量                         |
| payload.host.memory.used.bytes                         | 主机内存使用量                       |
| payload.host.memory.used.percent                       | 主机内存使用百分比                   |
| payload.host.swap.total.bytes                          | 主机 swap 总量                       |
| payload.host.swap.used.bytes                           | 主机 swap 使用量                     |
| payload.host.swap.used.percent                         | 主机 swap 使用百分比                 |
| payload.host.swap.free.bytes                           | 主机 swap 空闲量                     |
| payload.host.network.in.bytes                          | 主机网络接口接收的流量               |
| payload.host.network.in.dropped                        | 主机网络接口接收时丢弃的流量         |
| payload.host.network.in.errors                         | 主机网络接口接收时异常的流量         |
| payload.host.network.in.packets                        | 主机网络接口接收包的数量             |
| payload.host.network.name                              | 主机网络接口名                       |
| payload.host.network.out.bytes                         | 主机网络接口发送的流量               |
| payload.host.network.out.dropped                       | 主机网络接口发送时丢弃的流量         |
| payload.host.network.out.errors                        | 主机网络接口发送时异常的流量         |
| payload.host.network.out.packets                       | 主机网络接口发送包的数量             |
| payload.host.network_summary.in.bytes                  | 主机网络所有接口接收的流量汇总       |
| payload.host.network_summary.in.dropped                | 主机网络所有接口接收时丢弃的流量汇总 |
| payload.host.network_summary.in.errors                 | 主机网络所有接口接收时异常的流量汇总 |
| payload.host.network_summary.in.packets                | 主机网络所有接口接收包的数量汇总     |
| payload.host.network_summary.out.bytes                 | 主机网络所有接口发送的流量汇总       |
| payload.host.network_summary.out.dropped               | 主机网络所有接口发送时丢弃的流量汇总 |
| payload.host.network_summary.out.errors                | 主机网络所有接口发送时异常的流量汇总 |
| payload.host.network_summary.out.packets               | 主机网络所有接口发送包的数量汇总     |
| payload.host.network_sockets.all.connections           | 主机网络所有 sockets 连接总数        |
| payload.host.network_sockets.all.established           | 主机网络所有 sockets 已建立连接总数  |
| payload.host.network_sockets.all.listening             | 主机网络所有 sockets listening 总数  |
| payload.host.network_sockets.all.orphan                | 主机网络所有 sockets orphan 总数     |
| payload.host.network_sockets.all.udp                   | 主机网络所有 sockets udp 总数        |
| payload.host.network_sockets.memory.tcp                | 主机网络 tcp sockets 内存使用量      |
| payload.host.network_sockets.memory.udp                | 主机网络 udp sockets 内存使用量      |
| payload.host.network_sockets.tcp.IPV4/IPV6.connections | 主机网络 sockets 连接总数            |
| payload.host.network_sockets.tcp.IPV4/IPV6.established | 主机网络 sockets 已建立连接数据      |
| payload.host.network_sockets.tcp.IPV4/IPV6.close_wait  | 主机网络 sockets close_wait 数       |
| payload.host.network_sockets.tcp.IPV4/IPV6.closing     | 主机网络 sockets closing 数          |
| payload.host.network_sockets.tcp.IPV4/IPV6.fin_wait1   | 主机网络 sockets fin_wait1 数        |
| payload.host.network_sockets.tcp.IPV4/IPV6.fin_wait2   | 主机网络 sockets fin_wait2 数        |
| payload.host.network_sockets.tcp.IPV4/IPV6.last_ack    | 主机网络 sockets last_ack 数         |
| payload.host.network_sockets.tcp.IPV4/IPV6.listening   | 主机网络 sockets listening 数        |
| payload.host.network_sockets.tcp.IPV4/IPV6.sync_recv   | 主机网络 sockets sync_recv 数        |
| payload.host.network_sockets.tcp.IPV4/IPV6.sync_sent   | 主机网络 sockets sync_sent 数        |
| payload.host.network_sockets.tcp.IPV4/IPV6.time_wait   | 主机网络 sockets time_wait 数        |

## payload.instance

| 字段名                                              | 说明                                       |
| --------------------------------------------------- | ------------------------------------------ |
| payload.instance.entry.my_es_entry.open_connections | 网关客户端连接数                           |
| payload.instance.goroutine.任务池名称.blocking      | blocked 的任务数量（后台任务统计）         |
| payload.instance.goroutine.任务池名称.capacity      | 任务池的容量                               |
| payload.instance.goroutine.任务池名称.running       | 运行中的任务数量                           |
| payload.instance.pool.bytes.名称.acquired           | 获取 buffer 次数（buffer pool 的统计信息） |
| payload.instance.pool.bytes.名称.allocated          | 创建 buffer 次数                           |
| payload.instance.pool.bytes.名称.dropped            | 被丢弃的 buffer 数量                       |
| payload.instance.pool.bytes.名称.inuse              | 被占用的 buffer 数量                       |
| payload.instance.pool.bytes.名称.pool_items         | pool 里的 buffer 数量                      |
| payload.instance.pool.bytes.名称.pool_size          | pool 的 buffer 总大小                      |
| payload.instance.pool.bytes.名称.returned           | 被回收的 buffer 数量                       |
| payload.instance.pool.objects.名称.acquired         | 获取 buffer objects 数量                   |
| payload.instance.pool.objects.名称.allocated        | 创建 buffer objects 数量                   |
| payload.instance.pool.objects.名称.returned         | 被回收的 buffer objects 数量               |
| payload.instance.stats.elasticsearch.bulk.submit    | bulk_processor.Bulk 调用次数               |
| payload.instance.stats.metrics.save.CATEGORY.NAME   | metrics.Save 调用次数                      |
| payload.instance.stats.queue.队列名.pop             | 队列 pop 次数                              |
| payload.instance.stats.queue.队列名.push            | 队列 push 次数                             |
| payload.instance.system.cgo_calls                   | CGO 调用次数                               |
| payload.instance.system.cpu                         | CPU 利用率                                 |
| payload.instance.system.gc                          | gc 数                                      |
| payload.instance.system.goroutines                  | goroutines 数                              |
| payload.instance.system.mem                         | 实际内存使用量                             |
| payload.instance.system.mspan                       | mspan 总大小（heap）                       |
| payload.instance.system.objects                     | heap object 数量                           |
| payload.instance.system.stack                       | stack 总大小                               |
| payload.instance.system.uptime_in_ms                | 进程运行时间                               |
