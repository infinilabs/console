PUT _template/$[[TEMPLATE_NAME]]
{
    "order": 0,
    "template": "$[[INDEX_PREFIX]]*",
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
      "doc": {
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
      }
    },
    "aliases": {}
}

PUT _template/$[[INDEX_PREFIX]]metrics-rollover
{
    "order" : 100000,
    "template" : "$[[INDEX_PREFIX]]metrics*",
    "settings" : {
      "index" : {
        "format" : "7",
        "codec" : "best_compression",
        "number_of_shards" : "1",
        "translog.durability":"async"
      }
    },
    "mappings" : {
      "doc": {
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
      }
    },
    "aliases" : { }
  }


PUT $[[INDEX_PREFIX]]metrics-00001
{
  "settings": {
    "refresh_interval": "5s"
  },
  "aliases":{
    "$[[INDEX_PREFIX]]metrics":{
      "is_write_index":true
    }
  },
    "mappings": {
    "doc":{
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
            "timestamp": {
              "type": "date"
            }
          }
      }
    }
}

PUT _template/$[[INDEX_PREFIX]]logs-rollover
{
  "order": 100000,
  "template": "$[[INDEX_PREFIX]]logs*",
  "settings": {
    "index": {
      "format": "7",
      "codec": "best_compression",
      "number_of_shards": "1",
      "translog": {
        "durability": "async"
      }
    }
  },
  "mappings": {
    "doc": {
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
        ],
        "properties": {
          "payload.message": {
            "type": "text"
          },
          "timestamp": {
            "type": "date"
          }
        }
    }
  },
  "aliases": {}
}

PUT $[[INDEX_PREFIX]]logs-00001
{
  "settings": {
    "refresh_interval": "5s"
  },
  "aliases":{
    "$[[INDEX_PREFIX]]logs":{
      "is_write_index":true
    }
  }
}


PUT _template/$[[INDEX_PREFIX]]requests_logging-rollover
{
  "order": 100000,
  "template": "$[[INDEX_PREFIX]]requests_logging*",
  "settings": {
    "index": {
      "format": "7",
      "codec": "best_compression",
      "number_of_shards": "1",
      "translog": {
        "durability": "async"
      }
    }
  },
  "mappings": {
    "doc":{
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
        ],
        "properties": {
          "request": {
               "properties": {
                 "body": {
                   "type": "text"
                 }
               }
             },
         "response": {
           "properties": {
             "body": {
               "type": "text"
             }
           }
         },
          "timestamp": {
            "type": "date"
          }
        }
    }
  },
  "aliases": {}
}

PUT $[[INDEX_PREFIX]]requests_logging-00001
{
  "settings": {
    "refresh_interval": "5s"
  },
  "aliases":{
    "$[[INDEX_PREFIX]]requests_logging":{
      "is_write_index":true
    }
  }
}


PUT _template/$[[INDEX_PREFIX]]async_bulk_results-rollover
{
  "order": 100000,
  "template": "$[[INDEX_PREFIX]]async_bulk_results*",
  "settings": {
    "index": {
      "format": "7",
      "codec": "best_compression",
      "number_of_shards": "1",
      "translog": {
        "durability": "async"
      }
    }
  },
  "mappings": {
    "doc": {
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
        ],
        "properties": {
          "request": {
                    "properties": {
                      "body": {
                        "type": "text"
                      }
                    }
          },
          "response": {
                "properties": {
                  "body": {
                    "type": "text"
                  }
                }
           },
          "timestamp": {
            "type": "date"
          }
        }
    }
  },
  "aliases": {}
}

PUT $[[INDEX_PREFIX]]async_bulk_results-00001
{
  "settings": {
   "refresh_interval": "5s"
  },
  "aliases":{
    "$[[INDEX_PREFIX]]async_bulk_results":{
      "is_write_index":true
    }
  }
}


PUT _template/$[[INDEX_PREFIX]]alert-history-rollover
{
    "order" : 100000,
    "template" : "$[[INDEX_PREFIX]]alert-history*",
    "settings" : {
      "index" : {
        "format" : "7",
        "codec" : "best_compression",
        "number_of_shards" : "1",
        "translog.durability":"async"
      }
    },
    "mappings" : {
      "doc":{
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
      }
    },
    "aliases" : { }
  }


PUT $[[INDEX_PREFIX]]alert-history-00001
{
  "settings": {
    "refresh_interval": "5s"
  },
  "aliases":{
    "$[[INDEX_PREFIX]]alert-history":{
      "is_write_index":true
    }
  },
  "mappings": {
    "doc":{
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
              "analyzer" : "suggest_text_search"
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
}


PUT _template/$[[INDEX_PREFIX]]activities-rollover
{
    "order" : 100000,
    "template" : "$[[INDEX_PREFIX]]activities*",
    "settings" : {
      "index" : {
        "format" : "7",
        "codec" : "best_compression",
        "number_of_shards" : "1",
        "translog.durability":"async"
      }
    },
    "mappings" : {
      "doc":{
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
      }
    },
    "aliases" : { }
  }


PUT $[[INDEX_PREFIX]]activities-00001
{
  "mappings": {
  "doc":{
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
      "changelog": {
         "type": "object",
         "enabled": false
      },
      "id": {
        "type": "keyword"
      },
      "metadata": {
        "properties": {
          "category": {
            "type": "keyword",
            "ignore_above": 256
          },
          "group": {
            "type": "keyword",
            "ignore_above": 256
          },
          "name": {
            "type": "keyword",
            "ignore_above": 256
          },
          "type": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "payload": {
        "type": "object",
        "enabled": false
      },
      "timestamp": {
        "type": "date"
      }
    }
    }
  },
  "settings": {
    "index": {
      "refresh_interval": "5s",
      "mapping": {
        "total_fields": {
          "limit": "20000"
        }
      },
      "max_result_window": "10000000",
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
  },
  "aliases": {
    "$[[INDEX_PREFIX]]activities": {
      "is_write_index": true
    }
  }
}


#alerting
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-calakp97h710dpnp1fa2
{
    "id": "builtin-calakp97h710dpnp1fa2",
    "created": "2022-06-16T03:58:29.437447113Z",
    "updated": "2022-07-21T23:12:51.111569117Z",
    "creator": {
       "name": "$[[USERNAME]]",
       "id": "$[[USER_ID]]"
     },
    "name": "CPU utilization is Too High",
    "enabled": false,
    "resource": {
        "resource_id": "$[[RESOURCE_ID]]",
        "resource_name": "$[[RESOURCE_NAME]]",
        "type": "elasticsearch",
        "objects": [
            "$[[INDEX_PREFIX]]metrics*"
        ],
        "filter": {},
        "raw_filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "metadata.name": {
                                "value": "node_stats"
                            }
                        }
                    },
                    {
                        "term": {
                            "metadata.category": {
                                "value": "elasticsearch"
                            }
                        }
                    }
                ]
            }
        },
        "time_field": "timestamp",
        "context": {
            "fields": null
        }
    },
    "metrics": {
        "bucket_size": "1m",
        "groups": [
            {
                "field": "metadata.labels.cluster_id",
                "limit": 5
            },
            {
                "field": "metadata.labels.node_id",
                "limit": 300
            }
        ],
        "formula": "a",
        "items": [
            {
                "name": "a",
                "field": "payload.elasticsearch.node_stats.process.cpu.percent",
                "statistic": "avg"
            }
        ],
        "format_type": "ratio",
        "expression": "avg(payload.elasticsearch.node_stats.process.cpu.percent)"
    },
    "conditions": {
        "operator": "any",
        "items": [
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "80"
                ],
                "priority": "low"
            },
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "90"
                ],
                "priority": "medium"
            },
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "95"
                ],
                "priority": "high"
            }
        ]
    },
    "notification_config": {
        "enabled": false,
         "title": "CPU Usage of Node[s] ({{.first_group_value}} ..., {{len .results}} nodes in total) >= {{.first_threshold}}%",
         "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}};\nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nNodeID:{{index .group_values 1}}; \nCPU:{{.result_value | to_fixed 2}}%;\n{{end}}",
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
                "sub_type": "slack",
                 "enabled": true,
                "webhook": {
                    "header_params": {
                        "Content-Type": "application/json"
                    },
                    "method": "POST",
                    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
                     "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n  {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Severity:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n{\n    \"type\": \"mrkdwn\",\n    \"text\": \"*ClusterName:* {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\"\n},\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*NodeID:* {{index .group_values 1}}\"\n                        }\n                      ,\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Usage:* {{.result_value | to_fixed 2}}%\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{ index .group_values 0}}/nodes/{{ index .group_values 1}}|View Node Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
                }
            }
        ],
        "throttle_period": "6h",
        "accept_time_range": {
            "start": "00:00",
            "end": "23:59"
        }
    },
    "schedule": {
        "interval": "1m"
    }
}

#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-cal8n7p7h710dpnoaps0
{
    "id": "builtin-cal8n7p7h710dpnoaps0",
    "created": "2022-06-16T01:47:11.326727124Z",
    "updated": "2022-07-13T04:00:06.181994982Z",
    "name": "Cluster Health Change to Red",
    "enabled": false,
    "creator": {
       "name": "$[[USERNAME]]",
       "id": "$[[USER_ID]]"
     },
    "resource": {
        "resource_id": "$[[RESOURCE_ID]]",
        "resource_name": "$[[RESOURCE_NAME]]",
        "type": "elasticsearch",
        "objects": [
            "$[[INDEX_PREFIX]]metrics*"
        ],
        "filter": {},
        "raw_filter": {
            "bool": {
                "must": [
                    {
                        "match": {
                            "payload.elasticsearch.cluster_health.status": "red"
                        }
                    },
                    {
                        "term": {
                            "metadata.name": {
                                "value": "cluster_health"
                            }
                        }
                    }
                ]
            }
        },
        "time_field": "timestamp",
        "context": {
            "fields": null
        }
    },
    "metrics": {
        "bucket_size": "1m",
        "groups": [
            {
                "field": "metadata.labels.cluster_id",
                "limit": 5
            }
        ],
        "formula": "a",
        "items": [
            {
                "name": "a",
                "field": "payload.elasticsearch.cluster_health.status",
                "statistic": "count"
            }
        ],
        "format_type": "num",
        "expression": "count(payload.elasticsearch.cluster_health.status)"
    },
    "conditions": {
        "operator": "any",
        "items": [
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "1"
                ],
                "priority": "critical"
            }
        ]
    },
    "notification_config": {
        "enabled": false,
        "title": "Health of Cluster[s] ({{.first_group_value}} ..., {{len .results}} clusters in total) Changed to Red",
        "message": "Severity:{{.priority}}\nTimestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}, Name:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }} is RED now;\n{{end}}",
        "normal": [
            {
                "created": "2022-06-16T01:47:11.326727124Z",
                "updated": "2022-06-16T01:47:11.326727124Z",
                "name": "Slack webhook",
                "type": "webhook",
                "sub_type": "slack",
                "enabled": true,
                "webhook": {
                    "header_params": {
                        "Content-Type": "application/json"
                    },
                    "method": "POST",
                    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n{\n    \"type\": \"mrkdwn\",\n    \"text\": \"*ClusterName:* {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\"\n},\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Severity:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{ index .group_values 0}}|View Cluster Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
                }
            },
            {
                "created": "2022-06-16T01:47:11.326727124Z",
                "updated": "2022-06-16T01:47:11.326727124Z",
                "name": "DingTalk",
                "type": "webhook",
                "enabled": true,
                "webhook": {
                    "header_params": {
                        "Content-type": "application/json"
                    },
                    "method": "POST",
                    "url": "{{$.env.DINGTALK_WEBHOOK_ENDPOINT}}",
                    "body": "{\"msgtype\": \"text\",\"text\": {\"content\":\"Alerting: \\n{{.title}}\\n\\n{{.message}}\\nLink:{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"}}"
                }
            }
        ],
        "throttle_period": "1h",
        "accept_time_range": {
            "start": "00:00",
            "end": "23:59"
        }
    },
    "schedule": {
        "interval": "1m"
    }
}


#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-cal8n7p7h710dpnogps1
{
    "id": "builtin-cal8n7p7h710dpnogps1",
    "created": "2022-06-16T03:11:01.445958361Z",
    "updated": "2022-07-22T00:06:26.498903821Z",
    "name": "Disk utilization is Too High",
    "enabled": false,
    "creator": {
       "name": "$[[USERNAME]]",
       "id": "$[[USER_ID]]"
     },
    "resource": {
         "resource_id": "$[[RESOURCE_ID]]",
        "resource_name": "$[[RESOURCE_NAME]]",
        "type": "elasticsearch",
        "objects": [
            "$[[INDEX_PREFIX]]metrics*"
        ],
        "filter": {},
        "raw_filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "metadata.name": {
                                "value": "node_stats"
                            }
                        }
                    },
                    {
                        "term": {
                            "metadata.category": {
                                "value": "elasticsearch"
                            }
                        }
                    }
                ]
            }
        },
        "time_field": "timestamp",
        "context": {
            "fields": null
        }
    },
    "metrics": {
        "bucket_size": "1m",
        "groups": [
            {
                "field": "metadata.labels.cluster_id",
                "limit": 5
            },
            {
                "field": "metadata.labels.node_id",
                "limit": 200
            }
        ],
        "formula": "((a-b)/a)*100",
        "items": [
            {
                "name": "a",
                "field": "payload.elasticsearch.node_stats.fs.data.total_in_bytes",
                "statistic": "max"
            },
            {
                "name": "b",
                "field": "payload.elasticsearch.node_stats.fs.data.free_in_bytes",
                "statistic": "max"
            }
        ],
        "format_type": "ratio",
        "expression": "((max(payload.elasticsearch.node_stats.fs.data.total_in_bytes)-max(payload.elasticsearch.node_stats.fs.data.free_in_bytes))/max(payload.elasticsearch.node_stats.fs.data.total_in_bytes))*100"
    },
    "conditions": {
        "operator": "any",
        "items": [
            {
                "minimum_period_match": 5,
                "operator": "gte",
                "values": [
                    "85"
                ],
                "priority": "low"
            },
            {
                "minimum_period_match": 5,
                "operator": "gte",
                "values": [
                    "90"
                ],
                "priority": "medium"
            },
            {
                "minimum_period_match": 5,
                "operator": "gte",
                "values": [
                    "95"
                ],
                "priority": "high"
            }
        ]
    },
    "notification_config": {
        "enabled": false,
        "title": "Disk Utilization is Too High",
        "message": "Severity:{{.priority}}\nTimestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID：{{index .group_values 0}} ;\nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nNodeID：{{index .group_values 1}} ;\nDisk Usage:{{.result_value | to_fixed 2}}%；Free  Storage:{{.relation_values.b | format_bytes 2}}；\n{{end}}",
        "normal": [
            {
                "created": "0001-01-01T00:00:00Z",
                "updated": "0001-01-01T00:00:00Z",
                "name": "Slack",
                "type": "webhook",
                "sub_type": "slack",
                "enabled": true,
                "webhook": {
                    "header_params": {
                        "Content-Type": "application/json"
                    },
                    "method": "POST",
                    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n  {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n{\n    \"type\": \"mrkdwn\",\n    \"text\": \"*ClusterName:* {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\"\n},\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*NodeID:* {{index .group_values 1}}\"\n                        }\n                      ,\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Usage:* {{.result_value | to_fixed 2}}%\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Free:* {{.relation_values.b | format_bytes 2}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{ index .group_values 0}}/nodes/{{ index .group_values 1}}|View Node Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
                }
            }
        ],
        "throttle_period": "3h",
        "accept_time_range": {
            "start": "00:00",
            "end": "23:59"
        }
    },
    "schedule": {
        "interval": "1m"
    }
}

#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-cbp20n2anisjmu4gehc5
{
    "id": "builtin-cbp20n2anisjmu4gehc5",
    "created": "2022-08-09T08:52:44.63345561Z",
    "updated": "2022-08-09T08:52:44.633455664Z",
    "name": "Elasticsearch node left cluster",
    "enabled": false,
    "creator": {
       "name": "$[[USERNAME]]",
       "id": "$[[USER_ID]]"
     },
    "resource": {
        "resource_id": "$[[RESOURCE_ID]]",
        "resource_name": "$[[RESOURCE_NAME]]",
        "type": "elasticsearch",
        "objects": [
            "$[[INDEX_PREFIX]]node"
        ],
        "filter": {},
        "raw_filter": {
            "match_phrase": {
                "metadata.labels.status": "unavailable"
            }
        },
        "time_field": "timestamp",
        "context": {
            "fields": null
        }
    },
    "metrics": {
        "bucket_size": "1m",
        "groups": [
            {
                "field": "metadata.cluster_id",
                "limit": 5
            },
            {
                "field": "metadata.node_id",
                "limit": 50
            }
        ],
        "formula": "a",
        "items": [
            {
                "name": "a",
                "field": "metadata.labels.status",
                "statistic": "count"
            }
        ],
        "format_type": "num",
        "expression": "count(metadata.labels.status)"
    },
    "conditions": {
        "operator": "any",
        "items": [
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "1"
                ],
                "priority": "critical"
            }
        ]
    },
    "notification_config": {
        "enabled": false,
        "title": "Elasticsearch node left cluster",
        "message": "Priority:{{.priority}}\nTimestamp:{{.timestamp | datetime_in_zone \"Asia/Shanghai\"}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nClusterName: {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nNodeID:{{index .group_values 1}}; \n{{end}}",
        "normal": [
              {
                "created": "2022-08-09T08:52:44.63345561Z",
                "updated": "2022-08-09T08:52:44.63345561Z",
                "name": "Wechat",
                "type": "webhook",
                "sub_type": "wechat",
                "enabled": true,
                "webhook": {
                  "header_params": {
                    "Content-Type": "application/json"
                  },
                  "method": "POST",
                  "url": "{{$.env.WECHAT_WEBHOOK_ENDPOINT}}",
                  "body": "{\n    \"msgtype\": \"markdown\",\n    \"markdown\": {\n        \"content\": \"Incident [#{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}) is ongoing\\n{{.title}}\\n\n         {{range .results}}\n         >ClusterID:<font color=\\\"comment\\\">{{index .group_values 0}}</font>\n        >NodeID:<font color=\\\"comment\\\">{{index .group_values 1}}</font>\n         >Priority:<font color=\\\"comment\\\">{{.priority}}</font>\n         >Link:[View Cluster Monitoring]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{ index .group_values 0}}/nodes/{{ index .group_values 1}}) \n         {{end}}\"\n    }\n}\n"
                }
              }
            ],
        "throttle_period": "1h",
        "accept_time_range": {
            "start": "00:00",
            "end": "23:59"
        }
    },
    "schedule": {
        "interval": "1m"
    }
}


#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-calavvp7h710dpnp32r3
{
    "id": "builtin-calavvp7h710dpnp32r3",
    "created": "2022-06-16T04:22:23.001354546Z",
    "updated": "2022-07-21T23:10:36.70696738Z",
    "name": "Index Health Change to Red",
    "enabled": false,
    "creator": {
       "name": "$[[USERNAME]]",
       "id": "$[[USER_ID]]"
     },
    "resource": {
        "resource_id": "$[[RESOURCE_ID]]",
        "resource_name": "$[[RESOURCE_NAME]]",
        "type": "elasticsearch",
        "objects": [
            "$[[INDEX_PREFIX]]index"
        ],
        "filter": {},
        "raw_filter": {
            "match_phrase": {
                "metadata.labels.health_status": "red"
            }
        },
        "time_field": "timestamp",
        "context": {
            "fields": null
        }
    },
    "metrics": {
        "bucket_size": "1m",
        "groups": [
            {
                "field": "metadata.cluster_id",
                "limit": 5
            },
            {
                "field": "metadata.index_name",
                "limit": 5
            }
        ],
        "formula": "a",
        "items": [
            {
                "name": "a",
                "field": "metadata.index_name",
                "statistic": "count"
            }
        ],
        "format_type": "num",
        "expression": "count(metadata.index_name)"
    },
    "conditions": {
        "operator": "any",
        "items": [
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "1"
                ],
                "priority": "high"
            }
        ]
    },
    "notification_config": {
        "enabled": false,
         "title": "Health of Indices ({{.first_group_value}} ..., {{len .results}} indices in total) Changed to Red",
         "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nIndex name:{{index .group_values 1}}; {{end}}",
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
                "sub_type": "slack",
                "enabled": true,
                "webhook": {
                    "header_params": {
                        "Content-Type": "application/json"
                    },
                    "method": "POST",
                    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n{\n    \"type\": \"mrkdwn\",\n    \"text\": \"*ClusterName:* {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\"\n},\n   {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Index:* {{index .group_values 1}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Severity:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{ index .group_values 0}}?_g=%7B%22tab%22%3A%22indices%22%7D|View Index Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
                }
            }
        ],
        "throttle_period": "1h",
        "accept_time_range": {
            "start": "00:00",
            "end": "23:59"
        }
    },
    "schedule": {
        "interval": "1m"
    }
}


#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-calaqnh7h710dpnp2bm8
{
    "id": "builtin-calaqnh7h710dpnp2bm8",
    "created": "2022-06-16T04:11:10.242061032Z",
    "updated": "2022-07-21T23:12:07.142532243Z",
    "name": "JVM utilization is Too High",
    "enabled": false,
    "creator": {
       "name": "$[[USERNAME]]",
       "id": "$[[USER_ID]]"
     },
    "resource": {
        "resource_id": "$[[RESOURCE_ID]]",
        "resource_name": "$[[RESOURCE_NAME]]",
        "type": "elasticsearch",
        "objects": [
            "$[[INDEX_PREFIX]]metrics*"
        ],
        "filter": {},
        "raw_filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "metadata.name": {
                                "value": "node_stats"
                            }
                        }
                    },
                    {
                        "term": {
                            "metadata.category": {
                                "value": "elasticsearch"
                            }
                        }
                    }
                ]
            }
        },
        "time_field": "timestamp",
        "context": {
            "fields": null
        }
    },
    "metrics": {
        "bucket_size": "1m",
        "groups": [
            {
                "field": "metadata.labels.cluster_id",
                "limit": 5
            },
            {
                "field": "metadata.labels.node_id",
                "limit": 300
            }
        ],
        "formula": "a",
        "items": [
            {
                "name": "a",
                "field": "payload.elasticsearch.node_stats.jvm.mem.heap_used_percent",
                "statistic": "p90"
            }
        ],
        "format_type": "ratio",
        "expression": "p90(payload.elasticsearch.node_stats.jvm.mem.heap_used_percent)"
    },
    "conditions": {
        "operator": "any",
        "items": [
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "80"
                ],
                "priority": "low"
            },
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "90"
                ],
                "priority": "medium"
            },
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "95"
                ],
                "priority": "high"
            }
        ]
    },
    "notification_config": {
        "enabled": false,
        "title": "JVM Usage of Node[s] ({{.first_group_value}} ..., {{len .results}} nodes in total) >= {{.first_threshold}}%",
        "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nNode name:{{index .group_values 1}};  memory used percent：{{.result_value | to_fixed 2}}%;{{end}}",
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
                "sub_type": "slack",
                "enabled": true,
                "webhook": {
                    "header_params": {
                        "Content-Type": "application/json"
                    },
                    "method": "POST",
                    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n  {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Severity:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n{\n    \"type\": \"mrkdwn\",\n    \"text\": \"*ClusterName:* {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\"\n},\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*NodeID:* {{index .group_values 1}}\"\n                        }\n                      ,\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Usage:* {{.result_value | to_fixed 2}}%\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{ index .group_values 0}}/nodes/{{ index .group_values 1}}|View Node Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
                }
            }
        ],
        "throttle_period": "3h",
        "accept_time_range": {
            "start": "00:00",
            "end": "23:59"
        }
    },
    "schedule": {
        "interval": "1m"
    }
}

#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-cbp2e4ianisjmu4giqs7
{
    "id": "builtin-cbp2e4ianisjmu4giqs7",
    "created": "2022-06-16T04:11:10.242061032Z",
    "updated": "2022-08-09T09:39:29.604751601Z",
    "name": "Search latency is great than 500ms",
    "enabled": false,
    "creator": {
       "name": "$[[USERNAME]]",
       "id": "$[[USER_ID]]"
     },
    "resource": {
        "resource_id": "$[[RESOURCE_ID]]",
        "resource_name": "$[[RESOURCE_NAME]]",
        "type": "elasticsearch",
        "objects": [
            "$[[INDEX_PREFIX]]metrics*"
        ],
        "filter": {},
        "raw_filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "metadata.name": {
                                "value": "index_stats"
                            }
                        }
                    },
                    {
                        "term": {
                            "metadata.category": {
                                "value": "elasticsearch"
                            }
                        }
                    }
                ],
                "must_not": [
                    {
                        "term": {
                            "metadata.labels.index_name": {
                                "value": "_all"
                            }
                        }
                    }
                ]
            }
        },
        "time_field": "timestamp",
        "context": {
            "fields": null
        }
    },
    "metrics": {
        "bucket_size": "1m",
        "groups": [
            {
                "field": "metadata.labels.cluster_id",
                "limit": 5
            },
            {
                "field": "metadata.labels.index_name",
                "limit": 500
            }
        ],
        "formula": "a/b",
        "items": [
            {
                "name": "a",
                "field": "payload.elasticsearch.index_stats.total.search.query_time_in_millis",
                "statistic": "rate"
            },
            {
                "name": "b",
                "field": "payload.elasticsearch.index_stats.primaries.search.query_total",
                "statistic": "rate"
            }
        ],
        "format_type": "num",
        "expression": "rate(payload.elasticsearch.index_stats.total.search.query_time_in_millis)/rate(payload.elasticsearch.index_stats.primaries.search.query_total)"
    },
    "conditions": {
        "operator": "any",
        "items": [
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "500"
                ],
                "priority": "medium"
            }
        ]
    },
    "notification_config": {
        "enabled": false,
        "title": "Search latency is great than 500ms",
        "message": "Priority:{{.priority}}\nTimestamp:{{.timestamp | datetime_in_zone \"Asia/Shanghai\"}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nClusterName: {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nIndex Name:{{index .group_values 1}}; \nCurrent Value:{{.result_value | to_fixed 2}}ms;\n{{end}}",
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
                "sub_type": "slack",
                "enabled": true,
                "webhook": {
                    "header_params": {
                        "Content-Type": "application/json"
                    },
                    "method": "POST",
                    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n   {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterName:* {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\"\n                        },\n  {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Index:* {{index .group_values 1}}\"\n                        },\n  {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Latency:* {{.result_value | to_fixed 2}}ms\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}|View Index Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
                }
            }
        ],
        "throttle_period": "1h",
        "accept_time_range": {
            "start": "00:00",
            "end": "23:59"
        }
    },
    "schedule": {
        "interval": "1m"
    }
}

#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-calgapp7h710dpnpbeb6
{
    "id": "builtin-calgapp7h710dpnpbeb6",
    "created": "2022-06-16T10:26:47.360988761Z",
    "updated": "2022-07-22T00:03:34.044562893Z",
    "name": "Shard Storage >= 55G",
    "enabled": false,
    "creator": {
       "name": "$[[USERNAME]]",
       "id": "$[[USER_ID]]"
     },
    "resource": {
        "resource_id": "$[[RESOURCE_ID]]",
        "resource_name": "$[[RESOURCE_NAME]]",
        "type": "elasticsearch",
        "objects": [
            "$[[INDEX_PREFIX]]metrics*"
        ],
        "filter": {},
        "raw_filter": {
            "range": {
                "payload.elasticsearch.index_stats.shard_info.store_in_bytes": {
                    "gte": 59055800320
                }
            }
        },
        "time_field": "timestamp",
        "context": {
            "fields": null
        }
    },
    "metrics": {
        "bucket_size": "1m",
        "groups": [
            {
                "field": "metadata.labels.cluster_id",
                "limit": 5
            },
            {
                "field": "metadata.labels.index_name",
                "limit": 500
            }
        ],
        "formula": "a",
        "items": [
            {
                "name": "a",
                "field": "payload.elasticsearch.index_stats.shard_info.store_in_bytes",
                "statistic": "max"
            }
        ],
        "format_type": "bytes",
        "expression": "max(payload.elasticsearch.index_stats.shard_info.store_in_bytes)"
    },
    "conditions": {
        "operator": "any",
        "items": [
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "53687091200"
                ],
                "priority": "high"
            }
        ]
    },
    "notification_config": {
        "enabled": false,
        "title": "Shard Storage >55GB in ({{.first_group_value}} ..., {{len .results}} indices in total)",
        "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}};\nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }};\nIndex: [{{index .group_values 1}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22});\nMax Shard Storage：{{.result_value | format_bytes 2}};\n{{end}}",
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
                "sub_type": "slack",
                "enabled": true,
                "webhook": {
                    "header_params": {
                        "Content-Type": "application/json"
                    },
                    "method": "POST",
                    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n  {\n                            \"type\": \"mrkdwn\",\n                             \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterName:* {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\"\n                        },\n   {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Index:* {{index .group_values 1}}\"\n                        },\n  {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Max Shard Storage:* {{.result_value | format_bytes 2}}\"\n                        },\n                      \n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22}|View Index Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
                }
            }
        ],
        "throttle_period": "24h",
        "accept_time_range": {
            "start": "00:00",
            "end": "23:59"
        }
    },
    "schedule": {
        "interval": "1m"
    }
}

#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]alert-rule/doc/cb34sfl6psfiqtovhpt4
{
    "id": "cb34sfl6psfiqtovhpt4",
    "created": "2022-07-07T03:08:46.297166036Z",
    "updated": "2022-08-09T08:40:05.323148338Z",
    "name": "Too Many Deleted Documents",
    "enabled": false,
    "creator": {
       "name": "$[[USERNAME]]",
       "id": "$[[USER_ID]]"
     },
    "resource": {
        "resource_id": "$[[RESOURCE_ID]]",
        "resource_name": "$[[RESOURCE_NAME]]",
        "type": "elasticsearch",
        "objects": [
            "$[[INDEX_PREFIX]]metrics*"
        ],
        "filter": {},
        "raw_filter": {
            "range": {
                "payload.elasticsearch.cluster_stats.indices.store.size_in_bytes": {
                    "gte": 32212254720
                }
            }
        },
        "time_field": "timestamp",
        "context": {
            "fields": null
        }
    },
    "metrics": {
        "bucket_size": "1m",
        "groups": [
            {
                "field": "metadata.labels.cluster_id",
                "limit": 5
            },
            {
                "field": "metadata.labels.index_name",
                "limit": 300
            }
        ],
        "formula": "(a/(a+b))*100",
        "items": [
            {
                "name": "a",
                "field": "payload.elasticsearch.index_stats.primaries.docs.deleted",
                "statistic": "max"
            },
            {
                "name": "b",
                "field": "payload.elasticsearch.index_stats.primaries.docs.count",
                "statistic": "max"
            }
        ],
        "format_type": "ratio",
        "expression": "(max(payload.elasticsearch.index_stats.primaries.docs.deleted)/(max(payload.elasticsearch.index_stats.primaries.docs.deleted)+max(payload.elasticsearch.index_stats.primaries.docs.count)))*100"
    },
    "conditions": {
        "operator": "any",
        "items": [
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "30"
                ],
                "priority": "medium"
            },
            {
                "minimum_period_match": 1,
                "operator": "gte",
                "values": [
                    "40"
                ],
                "priority": "high"
            }
        ]
    },
    "notification_config": {
        "enabled": false,
         "title": "Too Many Deleted Documents (>30%)",
         "message": "Priority:{{.priority}}\nTimestamp:{{.timestamp | datetime_in_zone \"Asia/Shanghai\"}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nIndex:{{index .group_values 0}}; \nRatio of Deleted Documents:{{.result_value}};\n{{end}}",
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
                "sub_type": "slack",
                "enabled": true,
                "webhook": {
                    "header_params": {
                        "Content-Type": "application/json"
                    },
                    "method": "POST",
                    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n  {\n                            \"type\": \"mrkdwn\",\n                             \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n{\n    \"type\": \"mrkdwn\",\n    \"text\": \"*ClusterName:* {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\"\n},\n   {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Index:* {{index .group_values 1}}\"\n                        },\n     {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Deleted:* {{.result_value | to_fixed 2}}%\"\n                        },\n                      \n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22}|View Index Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
                }
            }
        ],
        "throttle_period": "24h",
        "accept_time_range": {
            "start": "00:00",
            "end": "23:59"
        }
    },
    "schedule": {
        "interval": "1m"
    }
}

#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]channnel/doc/builtin-cgnb2nt3q95nmusjl65g
{
  "id": "builtin-cgnb2nt3q95nmusjl65g",
  "created": "2023-04-06T11:47:43.104108279Z",
  "updated": "2023-08-04T10:34:29.112776+08:00",
  "name": "Slack Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json",
      "Content-type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"【Demo】Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"high\"}} \"#EB4C21\" {{else if eq .priority \"medium\"}} \"#FFB449\" {{else if eq .priority \"low\"}} \"#87d068\" {{else}} \"#2db7f5\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterName:* {{index .group_values 0 | lookup \"category=metadata, object=cluster, property=name, default=N/A\"}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{ index .group_values 0}}|View Cluster Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
  },
  "sub_type": "slack"
}
POST $[[INDEX_PREFIX]]channnel/doc/builtin-cgiospt3q95q49k3u00g
{
  "id": "builtin-cgiospt3q95q49k3u00g",
  "created": "2023-03-30T13:28:07.531263747Z",
  "updated": "2023-08-04T11:13:51.608186+08:00",
  "name": "DingTalk",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json",
      "Content-type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DINGTALK_WEBHOOK_ENDPOINT}}",
    "body": "{\"msgtype\": \"text\",\"text\": {\"content\":\"------------------------------------\\n【 INFINI Platform Alerting 】\\n{{.title}}\\n------------------------------------\\n{{.message}}\\nLink:{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"}}"
  },
  "sub_type": "dingtalk"
}
POST $[[INDEX_PREFIX]]channnel/doc/builtin-ch1os6t3q95lk6lepkq0
{
  "id": "builtin-ch1os6t3q95lk6lepkq0",
  "created": "2023-04-22T07:34:51.848540351Z",
  "updated": "2023-08-04T10:34:13.937983+08:00",
  "name": "Feishu Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json",
      "Content-type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.FEISHU_WEBHOOK_ENDPOINT}}",
    "body": "{\n    \"msg_type\": \"text\",\n    \"content\": \"{\\\"text\\\":\\\"Alerting: {{.title}} \\\\n Link:{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\\\"}\"\n}"
  },
  "sub_type": "feishu"
}
POST $[[INDEX_PREFIX]]channnel/doc/builtin-cgnb2kt3q95nmusjl64g
{
  "id": "builtin-cgnb2kt3q95nmusjl64g",
  "created": "2023-04-06T11:47:31.161587662Z",
  "updated": "2023-08-04T10:33:54.594583+08:00",
  "name": "Wechat Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.WECHAT_WEBHOOK_ENDPOINT}}",
    "body": "{\n    \"msgtype\": \"markdown\",\n    \"markdown\": {\n        \"content\": \"Incident [#{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}) is ongoing\\n{{.title}}\\n{{.message}}\"\n    }\n}"
  },
  "sub_type": "wechat"
}
POST $[[INDEX_PREFIX]]channnel/doc/builtin-cgnb2r53q95nmusjl6vg
{
  "id": "builtin-cgnb2r53q95nmusjl6vg",
  "created": "2023-04-06T11:47:56.652637309Z",
  "updated": "2023-08-04T10:12:44.675016+08:00",
  "name": "SMS Notification",
  "type": "email",
  "sub_type": "email",
  "email": {
    "server_id": "",
    "recipients": {
      "to": []
    },
    "subject": "{{.title}}",
    "body": "Incident [#{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}) is ongoing\n{{.message}}"
  }
}

POST $[[INDEX_PREFIX]]layout/doc/cgjoqud3q95rinbbe1l0
{
     "id": "cgjoqud3q95rinbbe1l0",
     "created": "2023-04-01T01:48:41.54255458Z",
     "updated": "2023-05-11T03:15:45.877680081Z",
     "name": "Platform Overview",
     "description": "",
     "creator": {
       "name": "admin",
       "id": "cft0jdtath25bt7npsgg"
     },
     "view_id": "",
     "config": {
       "cols": 12,
       "globalQueries": {
         "cluster_id": "$[[RESOURCE_ID]]",
         "indices": ".infini_metrics*",
         "time_field": "timestamp",
         "time_range": {
           "from": "now-30m",
           "to": "now"
         }
       },
       "global_queries": {},
       "row_height": 60,
       "widgets": [
         {
           "formatter": "number",
           "position": {
             "h": 4,
             "w": 3,
             "x": 9,
             "y": 5
           },
           "series": [
             {
               "metric": {
                 "bucket_size": "1m",
                 "format_type": "num",
                 "formula": "a",
                 "groups": [
                   {
                     "field": "payload.elasticsearch.cluster_stats.nodes.jvm.versions.version",
                     "limit": 5
                   }
                 ],
                 "items": [
                   {
                     "field": "*",
                     "name": "a",
                     "statistic": "count"
                   }
                 ]
               },
               "queries": {
                 "cluster_id": "$[[RESOURCE_ID]]",
                 "indices": [
                   ".infini_metrics"
                 ],
                 "time_field": "timestamp"
               },
               "type": "pie"
             }
           ],
           "title": "JDK Version Distribution"
         },
         {
           "formatter": "number",
           "position": {
             "h": 4,
             "w": 3,
             "x": 6,
             "y": 5
           },
           "series": [
             {
               "metric": {
                 "bucket_size": "1m",
                 "format_type": "num",
                 "formula": "a",
                 "groups": [
                   {
                     "field": "payload.elasticsearch.cluster_health.status",
                     "limit": 5
                   }
                 ],
                 "items": [
                   {
                     "field": "metadata.labels.cluster_id",
                     "name": "a",
                     "statistic": "cardinality"
                   }
                 ]
               },
               "queries": {
                 "cluster_id": "$[[RESOURCE_ID]]",
                 "indices": [
                   ".infini_metrics"
                 ],
                 "time_field": "timestamp"
               },
               "type": "pie"
             }
           ],
           "title": "Health Status"
         },
         {
           "formatter": "number",
           "position": {
             "h": 4,
             "w": 3,
             "x": 0,
             "y": 5
           },
           "series": [
             {
               "metric": {
                 "bucket_size": "1m",
                 "format_type": "num",
                 "formula": "a",
                 "groups": [
                   {
                     "field": "location.provider",
                     "limit": 5
                   }
                 ],
                 "items": [
                   {
                     "field": "*",
                     "name": "a",
                     "statistic": "count"
                   }
                 ]
               },
               "queries": {
                 "cluster_id": "$[[RESOURCE_ID]]",
                 "indices": [
                   ".infini_cluster"
                 ]
               },
               "type": "pie"
             }
           ],
           "title": "Service Provider"
         },
         {
           "formatter": "number",
           "position": {
             "h": 4,
             "w": 3,
             "x": 3,
             "y": 5
           },
           "series": [
             {
               "metric": {
                 "bucket_size": "1m",
                 "format_type": "num",
                 "formula": "a",
                 "groups": [
                   {
                     "field": "distribution",
                     "limit": 5
                   }
                 ],
                 "items": [
                   {
                     "field": "*",
                     "name": "a",
                     "statistic": "count"
                   }
                 ]
               },
               "queries": {
                 "cluster_id": "$[[RESOURCE_ID]]",
                 "indices": [
                   ".infini_cluster"
                 ]
               },
               "type": "pie"
             }
           ],
           "title": "Search Engine Distribution"
         },
         {
           "data_type": "normal",
           "formatter": "number",
           "order": "desc",
           "position": {
             "h": 5,
             "w": 6,
             "x": 6,
             "y": 14
           },
           "series": [
             {
               "metric": {
                 "bucket_size": "1m",
                 "format_type": "num",
                 "formula": "a",
                 "groups": [
                   {
                     "field": "metadata.labels.node_id",
                     "limit": 50
                   }
                 ],
                 "items": [
                   {
                     "field": "payload.elasticsearch.node_stats.os.cpu.load_average.15m",
                     "name": "a",
                     "statistic": "max"
                   }
                 ]
               },
               "queries": {
                 "cluster_id": "$[[RESOURCE_ID]]",
                 "indices": [
                   ".infini_metrics*"
                 ],
                 "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"node_stats\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                 "time_field": "timestamp"
               },
               "type": "column"
             }
           ],
           "size": 10,
           "title": "Node CPU Load TOP10"
         },
         {
           "data_type": "normal",
           "formatter": "percent",
           "order": "desc",
           "position": {
             "h": 5,
             "w": 6,
             "x": 0,
             "y": 9
           },
           "series": [
             {
               "metric": {
                 "bucket_size": "1m",
                 "format_type": "num",
                 "formula": "(b-a)/b*100",
                 "groups": [
                   {
                     "field": "metadata.labels.cluster_id",
                     "limit": 50
                   },
                   {
                     "field": "metadata.labels.node_name",
                     "limit": 500
                   }
                 ],
                 "items": [
                   {
                     "field": "payload.elasticsearch.node_stats.fs.total.available_in_bytes",
                     "name": "a",
                     "statistic": "max"
                   },
                   {
                     "field": "payload.elasticsearch.node_stats.fs.total.total_in_bytes",
                     "name": "b",
                     "statistic": "max"
                   }
                 ]
               },
               "queries": {
                 "cluster_id": "$[[RESOURCE_ID]]",
                 "indices": [
                   ".infini_metrics*"
                 ],
                 "time_field": "timestamp"
               },
               "type": "column"
             }
           ],
           "size": 10,
           "title": "Node Disk Usage TOP10"
         },
         {
           "data_type": "timeseries",
           "formatter": "percent",
           "position": {
             "h": 5,
             "w": 6,
             "x": 6,
             "y": 9
           },
           "series": [
             {
               "metric": {
                 "bucket_size": "auto",
                 "formula": "a",
                 "groups": [
                   {
                     "field": "metadata.labels.cluster_id",
                     "limit": 50
                   },
                   {
                     "field": "metadata.labels.node_name",
                     "limit": 500
                   }
                 ],
                 "items": [
                   {
                     "field": "metadata.datatype",
                     "name": "a",
                     "statistic": "count"
                   }
                 ]
               },
               "queries": {
                 "cluster_id": "$[[RESOURCE_ID]]",
                 "indices": [
                   ".infini_metrics*"
                 ],
                 "time_field": "timestamp"
               },
               "type": "column"
             }
           ],
           "title": "Node JVM Heap Usage TOP10"
         },
         {
           "data_type": "normal",
           "formatter": "bytes",
           "order": "desc",
           "position": {
             "h": 5,
             "w": 6,
             "x": 0,
             "y": 14
           },
           "series": [
             {
               "metric": {
                 "bucket_size": "1m",
                 "format_type": "num",
                 "formula": "a",
                 "groups": [
                   {
                     "field": "metadata.labels.cluster_id",
                     "limit": 50
                   },
                   {
                     "field": "metadata.labels.index_name",
                     "limit": 1000
                   }
                 ],
                 "items": [
                   {
                     "field": "payload.elasticsearch.index_stats.shard_info.store_in_bytes",
                     "name": "a",
                     "statistic": "max"
                   }
                 ]
               },
               "queries": {
                 "cluster_id": "$[[RESOURCE_ID]]",
                 "indices": [
                   ".infini_metrics*"
                 ],
                 "time_field": "timestamp"
               },
               "type": "column"
             }
           ],
           "size": 10,
           "title": "Index Shard Size TOP10"
         }
       ]
     },
     "type": "workspace",
     "is_fixed": true
}

POST $[[INDEX_PREFIX]]layout/doc/cgjpvt53q95r17vbdteg
{
    "id": "cgjpvt53q95r17vbdteg",
    "created": "2023-04-01T03:07:32.165611988Z",
    "updated": "2023-05-25T07:57:44.860138405Z",
    "name": "Metrics&Logging Overview",
    "description": "",
    "creator": {
      "name": "$[[USERNAME]]",
      "id": "$[[USER_ID]]"
    },
    "view_id": "",
    "config": {
      "cols": 12,
      "globalQueries": {
        "cluster_id": "$[[RESOURCE_ID]]",
        "indices": ".infini_metrics*",
        "time_field": "timestamp"
      },
      "global_queries": {},
      "row_height": 60,
      "widgets": [
        {
          "drilling": {
            "new_tab_switch": false,
            "url": ""
          },
          "formatter": "number",
          "position": {
            "h": 4,
            "w": 12,
            "x": 0,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "items": [
                  {
                    "field": "payload.elasticsearch.cluster_stats.indices.docs.deleted",
                    "name": "a",
                    "statistic": "count"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "time_field": "timestamp"
              },
              "type": "line"
            }
          ],
          "title": "Log Collection"
        },
        {
          "formatter": "number",
          "position": {
            "h": 4,
            "w": 6,
            "x": 6,
            "y": 8
          },
          "series": [
            {
              "metric": {
                "bucket_size": "1m",
                "format_type": "num",
                "formula": "a",
                "groups": [
                  {
                    "field": "agent.major_ip",
                    "limit": 5
                  }
                ],
                "items": [
                  {
                    "field": "payload.host.network_sockets.all.established",
                    "name": "a",
                    "statistic": "p99"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "time_field": "timestamp"
              },
              "type": "line"
            }
          ],
          "title": "TCP Connection"
        },
        {
          "formatter": "number",
          "position": {
            "h": 4,
            "w": 6,
            "x": 0,
            "y": 12
          },
          "series": [
            {
              "metric": {
                "bucket_size": "30s",
                "format_type": "num",
                "formula": "a",
                "groups": [
                  {
                    "field": "agent.major_ip",
                    "limit": 5
                  }
                ],
                "items": [
                  {
                    "field": "payload.host.network_sockets.all.connections",
                    "name": "a",
                    "statistic": "min"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "time_field": "timestamp"
              },
              "type": "area"
            }
          ],
          "title": "TCP Connections"
        },
        {
          "data_type": "timeseries",
          "formatter": "number",
          "position": {
            "h": 4,
            "w": 12,
            "x": 0,
            "y": 4
          },
          "series": [
            {
              "metric": {
                "bucket_size": "1m",
                "format_type": "num",
                "formula": "a",
                "groups": [
                  {
                    "field": "metadata.category",
                    "limit": 50
                  },
                  {
                    "field": "metadata.name",
                    "limit": 50
                  }
                ],
                "items": [
                  {
                    "field": "*",
                    "name": "a",
                    "statistic": "count"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "time_field": "timestamp"
              },
              "type": "column"
            }
          ],
          "title": "Log Data Distribution"
        },
        {
          "formatter": "bytes",
          "position": {
            "h": 4,
            "w": 6,
            "x": 0,
            "y": 8
          },
          "series": [
            {
              "metric": {
                "bucket_size": "1m",
                "format_type": "num",
                "formula": "a",
                "groups": [
                  {
                    "field": "agent.major_ip",
                    "limit": 50
                  }
                ],
                "items": [
                  {
                    "field": "payload.host.network_summary.in.bytes",
                    "name": "a",
                    "statistic": "derivative"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"host\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"network_summary\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                "time_field": "timestamp"
              },
              "type": "area"
            }
          ],
          "title": "Network Traffic (In)"
        },
        {
          "formatter": "bytes",
          "position": {
            "h": 4,
            "w": 6,
            "x": 6,
            "y": 12
          },
          "series": [
            {
              "metric": {
                "bucket_size": "1m",
                "format_type": "num",
                "formula": "a",
                "groups": [
                  {
                    "field": "agent.major_ip",
                    "limit": 50
                  }
                ],
                "items": [
                  {
                    "field": "payload.host.network_summary.out.bytes",
                    "name": "a",
                    "statistic": "derivative"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"host\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"network_summary\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                "time_field": "timestamp"
              },
              "type": "line"
            }
          ],
          "title": "Network Traffic (Out)"
        }
      ]
    },
    "type": "workspace",
    "is_fixed": true
  }

POST $[[INDEX_PREFIX]]layout/doc/cgjqcg53q95r17vbfo10
{
    "id": "cgjqcg53q95r17vbfo10",
    "created": "2023-04-01T03:34:24.919282378Z",
    "updated": "2023-06-07T07:54:46.991959699Z",
    "name": "INFINI Gateway",
    "description": "",
    "creator": {
      "name": "$[[USERNAME]]",
      "id": "$[[USER_ID]]"
    },
    "view_id": "",
    "config": {
      "cols": 12,
      "globalQueries": {
        "cluster_id": "$[[RESOURCE_ID]]",
        "indices": ".infini_metrics*",
        "time_field": "timestamp",
        "time_range": {
          "from": "now-30m",
          "to": "now"
        }
      },
      "global_queries": {},
      "row_height": 60,
      "widgets": [
        {
          "formatter": "number",
          "position": {
            "h": 4,
            "w": 4,
            "x": 0,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "bucket_size": "10s",
                "format_type": "num",
                "formula": "a",
                "groups": [
                  {
                    "field": "metadata.labels.name",
                    "limit": 50
                  }
                ],
                "items": [
                  {
                    "field": "payload.instance.entry.my_es_entry.open_connections",
                    "name": "a",
                    "statistic": "max"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"instance\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"gateway\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                "time_field": "timestamp"
              },
              "type": "line"
            }
          ],
          "title": "Gateway Client Connections"
        },
        {
          "bucket_size": "auto",
          "drilling": {},
          "formatter": "percent",
          "position": {
            "h": 4,
            "w": 4,
            "x": 4,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "formula": "a",
                "groups": [
                  {
                    "field": "metadata.labels.name",
                    "limit": 50
                  }
                ],
                "items": [
                  {
                    "field": "payload.instance.system.cpu",
                    "name": "a",
                    "statistic": "max"
                  }
                ],
                "name": "Overall CPU"
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"instance\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"gateway\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                "time_field": "timestamp"
              },
              "type": "line"
            },
            {
              "metric": {
                "formula": "(a + b) / c * 100",
                "groups": [
                  {
                    "field": "metadata.labels.name",
                    "limit": 50
                  }
                ],
                "items": [
                  {
                    "field": "payload.instance.system.sys_in_ms",
                    "name": "a",
                    "statistic": "derivative"
                  },
                  {
                    "field": "payload.instance.system.user_in_ms",
                    "name": "b",
                    "statistic": "derivative"
                  },
                  {
                    "field": "timestamp",
                    "name": "c",
                    "statistic": "derivative"
                  }
                ],
                "name": "Real-Time CPU"
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"instance\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"gateway\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                "time_field": "timestamp"
              },
              "type": "line"
            }
          ],
          "title": "Gateway CPU Utilization"
        },
        {
          "formatter": "bytes",
          "position": {
            "h": 4,
            "w": 4,
            "x": 8,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "bucket_size": "10s",
                "format_type": "num",
                "formula": "a",
                "groups": [
                  {
                    "field": "metadata.labels.name",
                    "limit": 50
                  }
                ],
                "items": [
                  {
                    "field": "payload.instance.system.mem",
                    "name": "a",
                    "statistic": "max"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"instance\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"gateway\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                "time_field": "timestamp"
              },
              "type": "line"
            }
          ],
          "title": "Gateway Memory Usage"
        },
        {
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 5,
            "w": 12,
            "x": 0,
            "y": 4
          },
          "series": [
            {
              "metric": {
                "bucket_size": "10s",
                "formula": "a",
                "groups": [
                  {
                    "field": "metadata.labels.name",
                    "limit": 50
                  }
                ],
                "items": [
                  {
                    "field": "payload.instance.system.goroutines",
                    "name": "a",
                    "statistic": "max"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"instance\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"gateway\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                "time_field": "timestamp"
              },
              "type": "line"
            }
          ],
          "title": "Gateway Goroutine"
        },
        {
          "formatter": "number",
          "position": {
            "h": 5,
            "w": 12,
            "x": 0,
            "y": 9
          },
          "series": [
            {
              "metric": {
                "bucket_size": "10s",
                "format_type": "num",
                "formula": "a",
                "groups": [
                  {
                    "field": "metadata.labels.name",
                    "limit": 50
                  }
                ],
                "items": [
                  {
                    "field": "payload.instance.system.objects",
                    "name": "a",
                    "statistic": "max"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"instance\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"gateway\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                "time_field": "timestamp"
              },
              "type": "line"
            }
          ],
          "title": "Gateway Active Objects"
        }
      ]
    },
    "type": "workspace",
    "is_fixed": true
 }
POST $[[INDEX_PREFIX]]layout/doc/ch0u5d53q95poj13629g
{
    "id": "ch0u5d53q95poj13629g",
    "created": "2023-04-21T01:11:16.129965374Z",
    "updated": "2023-05-25T12:23:10.993444364Z",
    "name": "Clusters Overview",
    "description": "",
    "creator": {
      "name": "$[[USERNAME]]",
      "id": "$[[USER_ID]]"
    },
    "view_id": "",
    "config": {
      "cols": 12,
      "global_queries": {},
      "row_height": 60,
      "widgets": [
        {
          "formatter": "number",
          "position": {
            "h": 3,
            "w": 3,
            "x": 3,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "bucket_size": "1m",
                "format_type": "num",
                "formula": "a",
                "items": [
                  {
                    "field": "agent.major_ip",
                    "name": "a",
                    "statistic": "cardinality"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "time_field": "timestamp"
              },
              "type": "number"
            }
          ],
          "title": "Number Of Hosts"
        },
        {
          "drilling": {},
          "page_size": 10,
          "position": {
            "h": 5,
            "w": 12,
            "x": 0,
            "y": 4
          },
          "series": [
            {
              "columns": [
                {
                  "display": "ClusterName",
                  "name": "name",
                  "type": "string"
                },
                {
                  "name": "distribution",
                  "type": "string"
                },
                {
                  "name": "endpoint",
                  "type": "string"
                },
                {
                  "display": "Time",
                  "formatter": "time",
                  "name": "created",
                  "type": "date"
                }
              ],
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_cluster"
                ]
              },
              "type": "table"
            }
          ],
          "title": "Cluster List"
        },
        {
          "formatter": "number",
          "position": {
            "h": 3,
            "w": 3,
            "x": 6,
            "y": 1
          },
          "series": [
            {
              "metric": {
                "bucket_size": "1m",
                "format_type": "num",
                "formula": "a",
                "items": [
                  {
                    "field": "metadata.labels.node_id",
                    "name": "a",
                    "statistic": "cardinality"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "time_field": "timestamp"
              },
              "type": "number"
            }
          ],
          "title": "Number Of Nodes"
        },
        {
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 3,
            "w": 3,
            "x": 0,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "items": [
                  {
                    "field": "metadata.labels.cluster_id",
                    "name": "a",
                    "statistic": "cardinality"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_metrics*"
                ],
                "time_field": "timestamp"
              },
              "type": "number"
            }
          ],
          "title": "Number of Clusters"
        }
      ]
    },
    "type": "workspace",
    "is_fixed": true
}
POST $[[INDEX_PREFIX]]layout/doc/cgjqcg53q95r17vbfo10
{
    "id": "chnmaht3q95ph02nfpsg",
    "created": "2023-05-25T13:40:23.821091313Z",
    "updated": "2023-06-08T03:49:09.247667399Z",
    "name": "Requests-analysis",
    "description": "",
    "creator": {
      "name": "$[[USERNAME]]",
      "id": "$[[USER_ID]]"
    },
    "view_id": "",
    "config": {
      "cols": 12,
      "global_queries": {
        "cluster_id": "$[[RESOURCE_ID]]",
        "indices": [
          ".infini_requests_logging*"
        ],
        "time_field": "timestamp"
      },
      "row_height": 60,
      "widgets": [
        {
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 2,
            "w": 2,
            "x": 0,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "items": [
                  {
                    "field": "*",
                    "name": "a",
                    "statistic": "count"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "number"
            }
          ],
          "title": "Total Requests"
        },
        {
          "bucket_size": "auto",
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 4,
            "w": 12,
            "x": 0,
            "y": 5
          },
          "series": [
            {
              "metric": {
                "formula": "a",
                "items": [
                  {
                    "field": "response.elapsed",
                    "name": "a",
                    "statistic": "p99"
                  }
                ],
                "name": "P99"
              },
              "queries": {
                "indices": []
              },
              "type": "line"
            },
            {
              "metric": {
                "formula": "a",
                "items": [
                  {
                    "field": "response.elapsed",
                    "name": "a",
                    "statistic": "avg"
                  }
                ],
                "name": "AVG"
              },
              "queries": {
                "indices": []
              },
              "type": "line"
            },
            {
              "metric": {
                "formula": "a",
                "items": [
                  {
                    "field": "response.elapsed",
                    "name": "a",
                    "statistic": "p50"
                  }
                ],
                "name": "P50"
              },
              "queries": {
                "indices": []
              },
              "type": "line"
            }
          ],
          "title": "Request Latency"
        },
        {
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 3,
            "w": 12,
            "x": 0,
            "y": 2
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "items": [
                  {
                    "field": "*",
                    "name": "a",
                    "statistic": "count"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "area"
            }
          ],
          "title": "Request rate"
        },
        {
          "data_type": "timeseries",
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 5,
            "w": 12,
            "x": 0,
            "y": 14
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "groups": [
                  {
                    "field": "request.path",
                    "limit": 5
                  }
                ],
                "items": [
                  {
                    "field": "response.elapsed",
                    "name": "a",
                    "statistic": "p95"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "column"
            }
          ],
          "title": "wrong"
        },
        {
          "bucket_size": "auto",
          "data_type": "timeseries",
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 5,
            "w": 12,
            "x": 0,
            "y": 9
          },
          "series": [
            {
              "metric": {
                "formula": "a",
                "groups": [
                  {
                    "field": "request.path",
                    "limit": 6
                  }
                ],
                "items": [
                  {
                    "field": "request.path",
                    "name": "a",
                    "statistic": "count"
                  }
                ],
                "name": ""
              },
              "queries": {
                "indices": []
              },
              "type": "column"
            }
          ],
          "title": "Request rate group by path"
        },
        {
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 2,
            "w": 2,
            "x": 2,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "items": [
                  {
                    "field": "*",
                    "name": "a",
                    "statistic": "count"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_requests_logging*"
                ],
                "query": "{\n    \"bool\": {\n      \"filter\": [\n        {\"term\": {\"response.cached\": {\"value\": \"true\" } }}\n\n      ]\n    }\n  }",
                "time_field": "timestamp"
              },
              "type": "number"
            }
          ],
          "title": "Cached Requests"
        },
        {
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 4,
            "w": 2,
            "x": 0,
            "y": 23
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "groups": [
                  {
                    "field": "response.status_code",
                    "limit": 5
                  }
                ],
                "items": [
                  {
                    "field": "*",
                    "name": "a",
                    "statistic": "count"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "pie"
            }
          ],
          "title": "Response code"
        },
        {
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 2,
            "w": 2,
            "x": 10,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "items": [
                  {
                    "field": "*",
                    "name": "a",
                    "statistic": "count"
                  }
                ]
              },
              "queries": {
                "cluster_id": "$[[RESOURCE_ID]]",
                "indices": [
                  ".infini_requests_logging*"
                ],
                "query": "{\n    \"range\": {\n      \"response.elapsed\": {\n        \"gte\": 1000\n      }\n    }\n  }",
                "time_field": "timestamp"
              },
              "type": "number"
            }
          ],
          "title": "Slow Queries"
        },
        {
          "drilling": {},
          "page_size": 10,
          "position": {
            "h": 5,
            "w": 12,
            "x": 0,
            "y": 27
          },
          "series": [
            {
              "columns": [
                {
                  "name": "flow.from",
                  "type": "string"
                },
                {
                  "name": "flow.relay",
                  "type": "string"
                },
                {
                  "name": "flow.to",
                  "type": "string"
                },
                {
                  "name": "request.method",
                  "type": "string"
                },
                {
                  "name": "request.path",
                  "type": "string"
                },
                {
                  "name": "response.status_code",
                  "type": "number"
                }
              ],
              "queries": {
                "indices": []
              },
              "type": "table"
            }
          ],
          "title": "Request detail"
        },
        {
          "data_type": "timeseries",
          "drilling": {},
          "formatter": "bytes",
          "position": {
            "h": 4,
            "w": 5,
            "x": 7,
            "y": 19
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "groups": [
                  {
                    "field": "remote_ip",
                    "limit": 5
                  }
                ],
                "items": [
                  {
                    "field": "response.body_length",
                    "name": "a",
                    "statistic": "sum"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "column"
            }
          ],
          "title": "Response size"
        },
        {
          "data_type": "timeseries",
          "drilling": {},
          "formatter": "bytes",
          "position": {
            "h": 4,
            "w": 5,
            "x": 2,
            "y": 19
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "groups": [
                  {
                    "field": "remote_ip",
                    "limit": 5
                  }
                ],
                "items": [
                  {
                    "field": "request.body_length",
                    "name": "a",
                    "statistic": "sum"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "column"
            }
          ],
          "title": "Request size"
        },
        {
          "data_type": "timeseries",
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 4,
            "w": 5,
            "x": 2,
            "y": 23
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "groups": [
                  {
                    "field": "flow.to",
                    "limit": 5
                  }
                ],
                "items": [
                  {
                    "field": "*",
                    "name": "a",
                    "statistic": "count"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "column"
            }
          ],
          "title": "Request upstreams"
        },
        {
          "data_type": "timeseries",
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 4,
            "w": 5,
            "x": 7,
            "y": 23
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "groups": [
                  {
                    "field": "request.method",
                    "limit": 5
                  }
                ],
                "items": [
                  {
                    "field": "*",
                    "name": "a",
                    "statistic": "count"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "column"
            }
          ],
          "title": "Request methods"
        },
        {
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 4,
            "w": 2,
            "x": 0,
            "y": 19
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "groups": [
                  {
                    "field": "flow.from",
                    "limit": 5
                  }
                ],
                "items": [
                  {
                    "field": "*",
                    "name": "a",
                    "statistic": "count"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "pie"
            }
          ],
          "title": "Clients ip"
        },
        {
          "drilling": {},
          "formatter": "bytes",
          "position": {
            "h": 2,
            "w": 2,
            "x": 8,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "items": [
                  {
                    "field": "response.body_length",
                    "name": "a",
                    "statistic": "sum"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "number"
            }
          ],
          "title": "Response traffic"
        },
        {
          "drilling": {},
          "formatter": "bytes",
          "position": {
            "h": 2,
            "w": 2,
            "x": 6,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "items": [
                  {
                    "field": "request.body_length",
                    "name": "a",
                    "statistic": "sum"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "number"
            }
          ],
          "title": "Request traffic"
        },
        {
          "drilling": {},
          "formatter": "number",
          "position": {
            "h": 2,
            "w": 2,
            "x": 4,
            "y": 0
          },
          "series": [
            {
              "metric": {
                "bucket_size": "auto",
                "formula": "a",
                "items": [
                  {
                    "field": "remote_ip",
                    "name": "a",
                    "statistic": "cardinality"
                  }
                ]
              },
              "queries": {
                "indices": []
              },
              "type": "number"
            }
          ],
          "title": "Clients"
        }
      ]
    },
    "type": "workspace",
    "is_fixed": true
}

GET /


