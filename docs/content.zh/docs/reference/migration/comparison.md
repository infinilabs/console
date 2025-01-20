---
weight: 1
title: 数据比对
asciinema: true
---

# 数据比对

## 创建比对任务

点击 INFINI Console 中左侧菜单 数据工具 》数据比对，然后点击新建按钮创建比对任务，如下图所示：

{{% load-img "/img/reference/migration/comparison/1.png"%}}

### 配置比对集群

然后在源集群列表中选择集群 `opensearch-v1.0`, 在目标集群列表中选择集群 `sy_cluster`：
{{% load-img "/img/reference/migration/comparison/2.png"%}}

### 配置比对索引

点击选择比对索引按钮, 这里我们选择了索引 `tv6-migration` ,然后点击确认：

{{% load-img "/img/reference/migration/comparison/3.png"%}}

然后我们可以选择需要比对的目标索引 `tv6-sy`：

{{% load-img "/img/reference/migration/comparison/4.png"%}}

然后点击下一步。

### 配置过滤条件和分区规则

如果需要过滤源索引和目标索引的数据，可以进行数据范围的设置，过滤条件对源索引和目标索引同时生效：
{{% load-img "/img/reference/migration/comparison/5.png"%}}

我们可以对数据进行分区配置，分区比对可以方便我们后续定位差异数据的来源。分区规则也对源索引和目标索引同样生效：
{{% load-img "/img/reference/migration/comparison/6.png"%}}

然后点击下一步。

### 运行设置

我们设置任务运行的参数，通常情况下不需要调整。我们选择任务运行的节点，然后点击创建任务：
{{% load-img "/img/reference/migration/comparison/7.png"%}}

### 配置增量数据比对

如果索引内的数据是持续写入的（日志等场景），可以配置增量比对任务，持续检测源集群和目标集群的数据差异。

在配置索引时，对增量写入的索引配置增量字段（如 timestamp）和数据的写入延迟（默认 15 分钟）。配置写入延迟的目的是为了防止导出数据时有部分数据未落盘，导致数据比对异常：
{{% load-img "/img/reference/migration/comparison/incremental-1.png"%}}

创建任务时，勾选 Detect Incremental Data，并设置检测间隔（默认 15 分钟）：
{{% load-img "/img/reference/migration/comparison/incremental-2.png"%}}

任务开始后，会持续比对源集群和目标集群的增量数据。如果想要暂停数据比对，可以点击 Pause 按钮，暂停增量任务。点击 Resume 之后，任务暂停期间写入的数据会照常校验：
{{% load-img "/img/reference/migration/comparison/incremental-3.png"%}}

## 启动比对任务

创建比对任务成功后会看到任务列表，我们可以在右侧选择 Start，启动新创建的任务：
{{% load-img "/img/reference/migration/comparison/8.png"%}}

点击 Detail 按钮，我们可以查看任务的详细情况：
{{% load-img "/img/reference/migration/comparison/9.png"%}}

我们可以点击索引列表右上方的刷新按钮，这样可以持续更新进度信息：
{{% load-img "/img/reference/migration/comparison/10.png"%}}

如果数据比对成功，对应的分区方块会显示为绿色，否则为红色：
{{% load-img "/img/reference/migration/comparison/11.png"%}}

如果比对过程中有方块变成了红色，则表示比对失败，这时候可以点击任务方块进度信息里面的 `View Log` 查看错误日志，定位具体错误原因。
