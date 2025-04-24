---
weight: 2
title: 常用命令
---

# 常用命令

## 简介

常用命令用于在开发工具中将高频使用的 Elasticsearch 请求保存, 这样后续如果需要使用，
只需要在开发工具中使用 LOAD 命令加载，即可快速使用。

## 保存常用命令

打开 console 右上角的开发工具(Ctrl+shift+o)， 在开发工具中选择需要保存的 Elasticsearch 请求
（支持一次选中多个请求保存为常用命令），选中之后点击工具栏里面的 Save As Command 提交。

{{% load-img "/img/screenshot/v1.29/devtools/devtools-save-command.png" "" %}}

## 加载常用命令

在开发工具里，输入 LOAD + 保存的命令名称关键字 会自动提示相关已保存的常用命令，
选中要加载的命令后，按回车键即可自动加载相应的常用命令。

{{% load-img "/img/screenshot/v1.29/devtools/devtools-load.png" "" %}}

## 常用命令列表

在常用命令列表中可以查询已经保存的常用命令

{{% load-img "/img/screenshot/v1.29/devtools/command.png" "" %}}

点击在列表中常用命令名称一栏可以查看常用命令具体信息, 也可以修改名称和 tag 信息

{{% load-img "/img/screenshot/v1.29/devtools/command-edit.png" "" %}}

## 删除常用命令

点击常用命令列表中的删除按钮，进行二次确认，确认之后执行删除操作。
