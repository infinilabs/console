---
weight: 3
title: 数据视图
asciinema: true
---

# 数据视图

## 视图列表

创建和管理数据视图可以帮助您更好地从 Elasticsearch 获取数据。

{{% load-img "/img/screenshot/v1.29/datamanage/view.png" "" %}}

## 创建视图

### 步骤 1 定义数据视图

{{% load-img "/img/screenshot/v1.29/datamanage/view-create.png" "" %}}

- 输入数据视图名称
- 匹配规则：匹配相应索引，也可以使用 (\*) 来匹配多个索引。

### 步骤 2 配置

{{% load-img "/img/screenshot/v1.29/datamanage/view-create-configuration.png" "" %}}

- 为数据视图索引选择时间字段作为时间过滤

- 创建完成

## 编辑数据视图

{{% load-img "/img/screenshot/v1.29/datamanage/view-edit.png" "" %}}

页面列出匹配索引的所有字段，可以对字段的 Format、Popularity 等做相关设置。
