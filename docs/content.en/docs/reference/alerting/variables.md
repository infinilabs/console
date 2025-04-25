---
weight: 4
title: Template variables
asciinema: true
---

# Template variables

## Introduction

When custom alerting triggers event content, in addition to the fixed copy written by yourself, the event title and event content also support template syntax. The rendering of the text can be achieved using fields in the event.

## Variables

The syntax for rendering fields is `{{ .fieldname }}`, and the variable fields that can be used for template content rendering are as follows:

| Field Name        | Type   | Descriction                                | eg                                                      |
| ----------------- | ------ | ------------------------------------------ | ------------------------------------------------------- |
| rule_id           | string | rule uuid                                  | c9f663tath2e5a0vksjg                                    |
| rule_name         | string | rule name                                  | High CPU usage                                          |
| resource_id       | string | resource uuid                              | c9f663tath2e5a0vksjg                                    |
| resource_name     | string | resource name                              | es-v716                                                 |
| event_id          | string | identifier for check details               | c9f663tath2e5a0vksjx                                    |
| timestamp         | number | Millisecond timestamp                      | 1654595042399                                           |
| first_group_value | string | The first value of group_values in results | c9aikmhpdamkiurn1vq0                                    |
| first_threshold   | string | The first value of threshold in results    | 90                                                      |
| priority          | string | The highest priority in results            | critical                                                |
| title             | string | event title                                | Node (`{{.first_group_value}}`) disk used >= 90%        |
| message           | string | event content                              | EventID：`{{.event_id}}`; Cluster：`{{.resource_name}}` |
| results           | array  | result of groups                           |                                                         |
| ┗ threshold       | array  |                                            | ["90"]                                                  |
| ┗ priority        | string |                                            | high                                                    |
| ┗ group_values    | array  |                                            | ["cluster-xxx", "node-xxx"]                             |
| ┗ issue_timestamp | number | Millisecond timestamp                      | 1654595042399                                           |
| ┗ result_value    | float  |                                            | 91.2                                                    |
| ┗ relation_values | map    |                                            | {a:100, b:91.2}                                         |

### Variable usage example

Example 1:

```
{"content":"【Alerting】Event ID: {{.event_id}}, Cluster：{{.resource_name}}"}
```

Example 2(array traversal):

```
{{range .results}} Cluster ID: {{index .group_values 0}} {{end}}
```

## Template functions

In addition to directly displaying the field value in the alerting event, it also supports the use of template functions to further process the field value to optimize the output.

Functions support extra parameters. When no parameters are required or passed, the following syntax can be used directly:

`{{ <field> | <function> }}`

Specific examples are as follows:

Functions take no parameters:

```
Alerting event trigger time:{{ .timestamp | datetime }}
```

Functions take parameters:

```
Alerting event trigger time:{{ .timestamp | datetime_in_zone "Asia/Shanghai" }}
```

Use multiple functions in combination:

```
{{.result_value | format_bytes 2 ｜ to_upper}}
```

The complete list of template functions is as follows:

| Functions        | params                         | Descriction                                                               |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| to_fixed         | fixed number of decimal places | The float type value retains N decimal places<br>Example:`{{.result_value | to_fixed 2}}`<br>Output:10.35                                     |
| format_bytes     | fixed number of decimal places | Byte type numeric formatting<br>Example:`{{.result_value                  | format_bytes 2}}`<br>Output:10.35gb                               |
| date             |                                | Convert timestamp to UTC date<br>Example:`{{.timestamp                    | date}}`<br>Output:2022-05-01                                      |
| date_in_zone     | Time zone                      | Convert timestamp to current zone date<br>Example:`{{.timestamp           | date_in_zone "Asia/Shanghai"}}`<br>Output:2022-05-01              |
| datetime         |                                | Convert timestamp to UTC time<br>Example:`{{.timestamp                    | datetime}}`<br>Output:2022-05-01 10:10:10                         |
| datetime_in_zone | Time zone                      | Convert timestamp to current zone time<br>Example:`{{.timestamp           | datetime_in_zone "Asia/Shanghai"}}`<br>Output:2022-05-01 10:10:10 |
| to_lower         |                                | Convert characters to lowercase<br>Example:`{{.resource_name              | to_lower }}`<br>Output:cluster                                    |
| to_upper         |                                | Convert characters to uppercase<br>Example:`{{.resource_name              | to_upper }}`<br>Output:CLUSTER                                    |
| add              | number                         | Example: a+b<br>`{{.result_value                                          | add 1 }}`<br>Output：2                                            |
| sub              | number                         | Example: a - b<br>`{{sub .result_value 1 }}`<br>Output：0                 |
| mul              | number                         | Example: a _ b _ c<br>`{{mul .result_value 3 2 }}`<br>Output：6           |
| div              | number                         | Example: a/b<br>`{{div .result_value 2 }}`<br>Output：0.5                 |

## Common Template Syntax

Array traversal：

```
{{range .results}} priority: {{.priority}} {{end}}
```

Get values by array subscript:

Example: group_values = ["value1","value2","value3"]

```
{{index .group_values 0}}
# output: value1
{{index .group_values 2}}
# output: value3
```

if conditional branch：

```
{{if pipeline}} T1 {{else}} T0 {{end}}
```

Example:

```
{{if eq .priority "critical"}} "#C91010" {{else if eq .priority "high"}} "#EB4C21" {{else}} "#FFB449" {{end}}
```

There is also a set of binary comparison operators defined as functions:

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

{{< details "A more complete example for Slack message" "..." >}}

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

{{< /details >}}

More template syntax[Click me](https://pkg.go.dev/text/template#pkg-overview)
