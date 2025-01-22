---
weight: 1
title: 数据迁移
asciinema: true
---

# 数据迁移

## 创建迁移任务

点击 INFINI Console 中左侧菜单 数据工具 》数据迁移，然后点击新建按钮创建迁移任务，如下图所示：

### 配置迁移集群

{{% load-img "/img/screenshot/migration/20221025-migration-step1-1.jpg"%}}
在源集群列表中选择集群 es-v5616, 在目标集群列表中选择集群 es-v710

### 配置迁移索引

点击选择迁移索引按钮, 如下图：

{{% load-img "/img/screenshot/migration/20230420-create-migration3.jpg"%}}

这里我们选择了索引 test ,然后点击确认

{{% load-img "/img/screenshot/migration/20230420-create-migration4.jpg"%}}

> test 索引包含两个 type，系统自动按 type 拆分成两个索引

表格右方可以设置目标索引名称和文档 type，按需修改即可。
选择完索引之后，点击下一步，进行索引的初始化操作，如下图：
{{% load-img "/img/screenshot/migration/20230420-create-migration5.jpg"%}}

点击展开后，可以看到有 mappings 和 settings 设置，如图所示，
mappings 设置左侧显示的是源集群索引的 mappings， 可以点击中间按钮复制到右侧，
然后点击 `Auto Optimize` 自动优化（兼容性优化）。设置完成后点击 `Start`
执行初始化 mappings 和 settings 操作，若没有设置，则自动跳过。

> 如果已通过其他方式初始化索引 settings 和 mappings， 这里可以直接点击下一步跳过

完成索引初始化之后，点击下一步，进行迁移任务的数据范围设置和分区设置，如下图：
{{% load-img "/img/screenshot/migration/20230420-create-migration6.jpg"%}}

### 配置数据范围

如果需要过滤数据迁移，可以进行数据范围的设置，这里我们进行全量的数据迁移，就不设置了
{{% load-img "/img/screenshot/migration/20230420-create-migration7.jpg"%}}

### 配置数据分区

如果一个索引数据量特别大，可以进行数据分区的设置。数据分区根据设置的字段，以及分区步长将数据拆成多段，系统最终会将一个分段的数据作为一个子任务去运行，迁移数据，
这样的话即使，一个分段迁移过程出现异常，只需要重跑这个子任务。

{{% load-img "/img/screenshot/migration/20230420-create-migration8.jpg"%}}

数据分区设置目前支持按照日期类型字段（date）, 和数字类型 (number) 拆分分区，如上图所示，我们选择日期类型字段 now_widh_format 进行拆分分区，分区步长设置为 5 分钟(5m), 然后点击预览按钮，可以看到根据设置拆分可以得到 8 个分区（文档数为 0 的分区最终不会生成子任务）。
根据预览信息确认分区设置无误之后，点击保存关闭分区设置并保存，然后点击下一步进行运行设置。

### 运行设置

{{% load-img "/img/screenshot/migration/20230420-create-migration9.jpg"%}}

一般情况下使用默认设置，然后执行节点选择先前注册的网关实例 Nebula，然后点击创建任务。

### 配置增量数据迁移

如果索引内的数据是持续写入的（日志等场景），可以配置增量迁移，持续检测并迁移源集群数据，确保目标集群数据同步。

在配置索引时，对增量写入的索引配置增量字段（如 timestamp）和数据的写入延迟（默认 15 分钟）。配置写入延迟的目的是为了防止从源集群导出数据时部分数据未落盘，导致目标集群数据缺失：
{{% load-img "/img/screenshot/migration/20230608-migration-incremental-1.png"%}}

创建任务时，勾选 Detect Incremental Data，并设置检测间隔（默认 15 分钟）：
{{% load-img "/img/screenshot/migration/20230608-migration-incremental-2.png"%}}

点击开始后，任务每间隔 15 分钟就会导入一次增量数据到目标集群。如果想要暂停增量迁移，可以点击 Pause 按钮，暂停增量任务。点击 Resume 之后，暂停期间源集群写入的数据会照常导入目标集群：

{{% load-img "/img/screenshot/migration/20230608-migration-incremental-3.png"%}}

## 启动迁移任务

创建迁移任务成功后会看到任务列表，如下图：

{{% load-img "/img/screenshot/migration/20230420-migration10.jpg"%}}
可以看到，最近一条任务就是我们刚创建的，然后在表格右侧操作栏中点击 start 开始任务

> 任务开始之前，需要确认如果迁移索引涉及到 ILM 配置，需要确认目标集群中相关索引模版，ILM 别名是否配置好。

点击开始按钮 启动迁移任务。

## 查看迁移任务进度

任务启动成功之，点击详情进入任务详情页查看任务执行状态。点击 `Refresh` 按钮开启自动刷新之后，我们可以看到任务详情有如下变化：

{{% load-img "/img/screenshot/migration/20230420-migration11.jpg"%}}

图中蓝色方块表示，子任务（分区任务）已经在运行，灰色表示任务还没有开始

{{% load-img "/img/screenshot/migration/20230420-migration12.jpg"%}}

上图中可以看到方块变成了绿色，表示子任务（分区任务）已经数据迁移完成，索引 test-doc 的迁移进度是 100%, 索引 test-doc1 迁移进度是 21.11

{{% load-img "/img/screenshot/migration/20230420-migration13.jpg"%}}

上图中可以看到所有方块变成了绿色，索引迁移进度都是 100%, 表示数据已经迁移完成。
如果迁移过程中有方块变成了红色，则表示迁移过程出现了错误，这时候可以点击任务方块进度信息里面的 `View Log` 查看错误日志，定位具体错误原因。
