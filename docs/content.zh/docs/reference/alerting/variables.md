---
weight: 4
title: 模板变量
asciinema: true
---

# 模板变量

## 简介

自定义告警触发事件内容时，除了自己撰写的固定文案外，事件标题、事件内容等也支持模板语法。可以使用事件中的字段实现文案的渲染。

## 模板变量

用于渲染字段的语法为 `{{ .字段名 }}`，可用于模板内容渲染的变量字段如下：

| 变量字段名                 | 字段类型 | 说明                                       | 示例                                                    |
| -------------------------- | -------- | ------------------------------------------ | ------------------------------------------------------- |
| rule_id                    | string   | rule uuid                                  | c9f663tath2e5a0vksjg                                    |
| rule_name                  | string   | rule name                                  | High CPU usage                                          |
| resource_id                | string   | resource uuid                              | c9f663tath2e5a0vksjg                                    |
| resource_name              | string   | resource name                              | es-v716                                                 |
| event_id                   | string   | identifier for check details               | c9f663tath2e5a0vksjx                                    |
| timestamp                  | number   | Millisecond timestamp                      | 1654595042399                                           |
| trigger_at                 | number   | Millisecond timestamp                      | 1654595042399                                           |
| duration                   | string   | Alarm duration                             | "2m10s"                                           |
| objects                  | string array   | resource index name                         | [".infini_metrics*"]                                           |
| first_group_value          | string   | The first value of group_values in results | c9aikmhpdamkiurn1vq0                                    |
| first_threshold            | string   | The first value of threshold in results    | 90                                                      |
| priority                   | string   | The highest priority in results            | critical                                                |
| title                      | string   | event title                                | Node (`{{.first_group_value}}`) disk used >= 90%        |
| message                    | string   | event content                              | EventID：`{{.event_id}}`; Cluster：`{{.resource_name}}` |
| results                    | array    | result of groups                           |                                                         |
| results[0].threshold       | array    |                                            | ["90"]                                                  |
| results[0].priority        | string   |                                            | high                                                    |
| results[0].group_values    | array    |                                            | ["cluster-xxx", "node-xxx"]                             |
| results[0].issue_timestamp | number   | Millisecond timestamp                      | 1654595042399                                           |
| results[0].result_value    | float    |                                            | 91.2                                                    |
| results[0].relation_values | map      |                                            | {a:100, b:91.2}                                         |

### 变量使用示例

示例 1:

```
{"content":"【Alerting】Event ID: {{.event_id}}, Cluster：{{.resource_name}}"}
```

示例 2(数组遍历):

```
{{range .results}} Cluster ID: {{index .group_values 0}} {{end}}
```

## 模版中使用环境变量

告警模版中可以解析系统环境变量和配置文件中配置的环境变量，系统环境变量优先级高于配置文件环境变量，访问方式为：

```
{{$.env.VARIABLE}}
```

> INFINI Console 版本 1.2.0 及以上支持

### 系统环境变量

假如存在系统环境变量 `WECHAT_WEBHOOK_ENDPOINT=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxx`,
那么在告警模版中使用 `{{$.env.WECHAT_WEBHOOK_ENDPOINT}}` 就可以引用环境变量 `WECHAT_WEBHOOK_ENDPOINT` 了

### 配置文件中定义环境变量

假如 INFINI Console 配置文件 `console.yml` 中存在如下配置段：

```
env:
  INFINI_CONSOLE_ENDPOINT: "https://play.infinilabs.com:64443"
  WECHAT_WEBHOOK_ENDPOINT: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxyy"
```

那么在告警模版中使用 {{$.env.INFINI_CONSOLE_ENDPOINT}} 就可以访问到配置文件中的环境变量 `INFINI_CONSOLE_ENDPOINT` 了

> 告警模版在 range 块中，这时候如果省略 $，用 {{.env.INFINI_CONSOLE_ENDPOINT}} 这种写法是没法正确解析的，需要使用 {{$.env.INFINI_CONSOLE_ENDPOINT}} 来访问根部变量 `env`

## 模板函数

除了直接展示告警事件中的字段值外，还支持使用模板函数对字段值进行进一步处理，优化输出。

函数支持额外参数，当无需或不传递参数时，可以直接使用以下语法进行使用：

`{{ <模板变量> | <模板函数> }}`

具体实例如下：

模板函数不带参数：

```
告警事件触发时间：{{ .timestamp | datetime }}
```

模板函数带参数：

```
告警事件触发时间：{{ .timestamp | datetime_in_zone "Asia/Shanghai" }}
```

多个函数组合使用：

```
字节类型的数值格式化后再转位大写：{{.result_value | format_bytes 2 ｜ to_upper}}
```

完整的模板函数列表如下：

| 模板函数            | 参数         | 说明                                                                                                                                                                                       |
| ------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| to_fixed            | 固定小数位数 | float 类型数值保留 N 位小数位<br>示例：`{{.result_value                                                                                                                                    | to_fixed 2}}`<br>输出：10.35                                     |
| format_bytes        | 固定小数位数 | 字节类型数值格式化<br>示例：`{{.result_value                                                                                                                                               | format_bytes 2}}`<br>输出：10.35gb                               |
| date                |              | 时间戳转为 UTC 日期<br>示例：`{{.timestamp                                                                                                                                                 | date}}`<br>输出：2022-05-01                                      |
| date_in_zone        | 时区         | 时间戳转为当前区域日期<br>示例：`{{.timestamp                                                                                                                                              | date_in_zone "Asia/Shanghai"}}`<br>输出：2022-05-01              |
| datetime            |              | 时间戳转为 UTC 时间<br>示例：`{{.timestamp                                                                                                                                                 | datetime}}`<br>输出：2022-05-01 10:10:10                         |
| datetime_in_zone    | 时区         | 时间戳转为当前区域时间<br>示例：`{{.timestamp                                                                                                                                              | datetime_in_zone "Asia/Shanghai"}}`<br>输出：2022-05-01 10:10:10 |
| to_lower            |              | 英文字符转为小写<br>示例：`{{.resource_name                                                                                                                                                | to_lower }}`<br>输出：cluster                                    |
| to_upper            |              | 英文字符转为大写<br>示例：`{{.resource_name                                                                                                                                                | to_upper }}`<br>输出：CLUSTER                                    |
| add                 | 数值类型     | 数值相加<br>示例：`{{.result_value                                                                                                                                                         | add 1 }}`<br>输出：2                                             |
| sub                 | 数值类型     | 数值相减<br>示例：`{{sub .result_value 1 }}`<br>输出：0                                                                                                                                    |
| mul                 | 数值类型     | 数值相乘<br>示例：`{{mul .result_value 3 2 }}`<br>输出：6                                                                                                                                  |
| div                 | 数值类型     | 数值相除<br>示例：`{{div .result_value 2 }}`<br>输出：0.5                                                                                                                                  |
| lookup              | 字符串类型   | 通过标识字段获取相关数据其他字段信息<br>示例(根据集群 ID 获取集群名称)：`{{lookup "category=metadata, object=cluster, property=name, default=N/A" "cg84bttath2dl9gaf50g"}}`<br>输出：es710 |
| str_replace         | 字符串类型     | 字符串替换<br>示例：`{{ "hello world" | str_replace "world" "world!"}}`<br>输出：`hello world!`                                             |
| md_to_html          | 字符串类型     | markdown 转 html 格式<br>示例：`{{ "**hello world**" | md_to_html }}`<br>输出：`<p><strong>hello world</strong></p>`                       |

> 目前 lookup 函数第一个查找目录参数设置里面 `category` 仅支持 `metadata` 固定写法;`object` 可选值为 `cluster|node|index`，这三个指分别对应从
> 系统索引 `.infini_cluster|.infini_node|.infini_index` 中查找数据； `property` 指定获取哪个字段；`default` 找不到对应字段或者出错时的返回值;
> eg: 索引 .infini_node 中有如下一条数据  
> `{
"metadata": {
"cluster_name": "easysearch-7201",
"cluster_id": "cgn4f7t3q95k3acgcam0",
"host": "10.0.0.3",
"node_name": "node_1",
"category": "elasticsearch",
"node_id": "tM87zZ-3TxCCPtJeOY1hSg",
"labels": {
"ip": "10.0.0.3",
"roles": [
"data",
"ingest",
"master",
"remote_cluster_client"
],
"transport_address": "10.0.0.3:17201",
"version": "1.0.0",
"status": "unavailable"
}
},
"payload": {...}
}
`
>
> 则可以使用节点 ID `tM87zZ-3TxCCPtJeOY1hSg` 来查询节点名称，查询方法如下：  
> `{{lookup "category=metadata, object=node, property=metadata.node_name, default=N/A" "tM87zZ-3TxCCPtJeOY1hSg"}}`

## 常用模板语法

array 数组遍历：

```
{{range .results}} priority: {{.priority}} {{end}}
```

通过数组下标取值：

示例:`group_values = ["value1","value2","value3"]`

```
{{index .group_values 0}}
#输出值为：value1
{{index .group_values 2}}
输出值为：value3
```

if 条件分支：

```
{{if pipeline}} T1 {{else}} T0 {{end}}
```

示例:

```
{{if eq .priority "critical"}} "#C91010" {{else if eq .priority "high"}} "#EB4C21" {{else}} "#FFB449" {{end}}
```

完整的比较运算符用法：

```
eq
	Returns the boolean truth of arg1 == arg2
ne
	Returns the boolean truth of arg1 != arg2
lt
	Returns the boolean truth of arg1 < arg2
le
	Returns the boolean truth of arg1 <= arg2
gt
	Returns the boolean truth of arg1 > arg2
ge
	Returns the boolean truth of arg1 >= arg2
```

{{< expand "Slack message 模板完整示例" "..." >}}

```
{
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "【test201】Alerting:\n<http://localhost:8000/#/alerting/alert/{{.event_id}}|{{.title}}> <@username>"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Timestamp:* {{.issue_timestamp | datetime}}"
            }
        }
    ],
    "attachments": [
        {{range .results}}
        {
            "color": {{if eq .priority "critical"}} "#C91010" {{else if eq .priority "high"}} "#EB4C21" {{else}} "#FFB449" {{end}},
            "blocks": [
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": "*Cluster:* {{index .group_values 0}}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": "*Node:* {{index .group_values 1}}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": "*Threshold:* {{index .threshold 0}}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": "*Priority:* {{.priority}}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": "*Monitoring value:* {{.result_value}}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": "*Disk usage:* {{.relation_values.a | format_bytes 2 | to_upper}}"
                        }
                    ]
                }
            ]
        },
        {{end}}
    ]
}
```

{{< /expand >}}

更多模板语法[点击查看](https://pkg.go.dev/text/template#pkg-overview)
