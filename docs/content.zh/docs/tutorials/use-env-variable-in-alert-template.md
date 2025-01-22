---
weight: 62
title: 如何在 Console 告警功能中使用环境变量
asciinema: true
---

# 如何在 Console 告警功能中使用环境变量

## 简介

在 Console 中配置告警规则的时候，经常可能会遇到这样一个情况，在设置模版的时候，有些内容都是复制粘贴的。
当这部分内容需要修改时，就需要一个个规则去修改，相当的麻烦。这时候您可能会想到能不能使用一个自定义全局变量来
定义这部分内容，这样在模版中使用的地方直接引用就可以了。如果您有这种需求，那么使用 Console 1.2.0 版本就可以了。

## 准备

- 下载并安装最新版 INFINI Console (版本要求 1.2.0 及以上)

## 告警模版中使用环境变量

以下是 INFINI Conosle 内置的一个告警规则 `Shard Storage >= 55G` 配置的告警内容模版，如下图：
{{% load-img "/img/screenshot/20230525-alert-template-env-variable.jpg" "security settings" %}}

模版配置文本内容如下：

```aidl
Timestamp:{{.timestamp | datetime}}
RuleID:{{.rule_id}}
EventID:{{.event_id}}
{{range .results}}
ClusterID:{{index .group_values 0}};
ClusterName:{{lookup "category=metadata，object=cluster，property=name，default=N/A" (index .group_values 0) }};
Index: [{{index .group_values 1}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22});
Max Shard Storage：{{.result_value | format_bytes 2}};
{{end}}
```

可以看到这个模版中我们使用了环境变量 `INFINI_CONSOLE_ENDPOINT`，在模版内容中是通过 `{{$.env.INFINI_CONSOLE_ENDPOINT}}` 这种书写方式来使用的。
那么要怎么配置这个环境变量呢，有以下两种方法：

- 设置系统环境变量
- 在 Console 配置文件中设置 env 变量

> 告警模版在 range 块中，这时候如果省略 `$`，用 `{{.env.INFINI_CONSOLE_ENDPOINT}}`
> 这种写法是没法正确解析的，需要使用 `{{$.env.INFINI_CONSOLE_ENDPOINT}}` 来访问根部变量 `env`

### 设置系统环境变量

以 Macos 为例，启动 Console 时设置环境变量 `INFINI_CONSOLE_ENDPOINT="https://play.infinilabs.com:64443" ./bin/console`

### 在配置文件中设置

只需在 Console 配置文件 `console.yml` 中添加以下配置：

```yaml
env:
  INFINI_CONSOLE_ENDPOINT: "https://play.infinilabs.com:64443"
```

这中方式修改配置之后，无需重启 Console 即可生效

> 以上两种方式设置的环境变量，系统环境变量优先级会高于配置文件环境变量

设置完成之后系统触发规则告警之后，会看到如下图所示告警内容：

{{% load-img "/img/screenshot/20230525-alert-template-env-variable1.jpg" "security settings" %}}

从上图中标注部分可以看到使用的环境变量`INFINI_CONSOLE_ENDPOINT` 成功地渲染成了 `https://play.infinilabs.com:64443`。

## 小结

在 Console 告警功能可以使用系统环境变量（启动时设置）以及在配置文件中 env 配置节下定义变量 两种方式定义环境变量，并在告警模版内容中快速使用 。
