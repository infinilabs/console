---
weight: 2
title: 别名管理
asciinema: true
---

# 别名管理

## 别名列表

别名列表包括对别名的增删改查操作。

{{% load-img "/img/screenshot/data/alias-list.jpg" "Alias management" %}}

## 新建别名

{{% load-img "/img/screenshot/data/alias-create.jpg" "Alias management" %}}

- 别名：输入别名名称
- 索引：选择别名对应的目标索引，支持使用 (\*) 来绑定多个索引。
- 是否为写索引：指定选择的索引是否可写，如果别名只绑定一个索引，则默认该索引可写；如果是通过 (\*) 绑定多个索引，最需要指定其中一个索引为可写。

## 别名与索引关系列表

点开别名列表行首的`+`号按钮，会展开显示该别名对应绑定的索引列表，同时可以对索引进行关系绑定更新设置和删除。

{{% load-img "/img/screenshot/data/alias-sub-list.jpg" "Alias management" %}}
