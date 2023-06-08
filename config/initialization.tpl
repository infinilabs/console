PUT _template/$[[TEMPLATE_NAME]]
{
    "order": 0,
    "index_patterns": [
      "$[[INDEX_PREFIX]]*"
    ],
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
    },
    "aliases": {}
}

PUT _ilm/policy/ilm_$[[INDEX_PREFIX]]metrics-30days-retention
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "30d",
            "max_size": "50gb"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {
          }
        }
      }
    }
  }
}

PUT _template/$[[INDEX_PREFIX]]metrics-rollover
{
    "order" : 100000,
    "index_patterns" : [
      "$[[INDEX_PREFIX]]metrics*"
    ],
    "settings" : {
      "index" : {
        "format" : "7",
        "lifecycle" : {
          "name" : "ilm_$[[INDEX_PREFIX]]metrics-30days-retention",
          "rollover_alias" : "$[[INDEX_PREFIX]]metrics"
        },
        "codec" : "best_compression",
        "number_of_shards" : "1",
        "translog.durability":"async"
      }
    },
    "mappings" : {
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
    },
    "aliases" : { }
  }


PUT $[[INDEX_PREFIX]]metrics-00001
{
  "settings": {
    "index.lifecycle.rollover_alias":"$[[INDEX_PREFIX]]metrics"
    , "refresh_interval": "5s"
  },
  "aliases":{
    "$[[INDEX_PREFIX]]metrics":{
      "is_write_index":true
    }
  },
    "mappings": {
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

PUT _template/$[[INDEX_PREFIX]]logs-rollover
{
  "order": 100000,
  "index_patterns": [
    "$[[INDEX_PREFIX]]logs*"
  ],
  "settings": {
    "index": {
      "format": "7",
      "lifecycle": {
          "name" : "ilm_$[[INDEX_PREFIX]]metrics-30days-retention",
          "rollover_alias" : "$[[INDEX_PREFIX]]logs"
      },
      "codec": "best_compression",
      "number_of_shards": "1",
      "translog": {
        "durability": "async"
      }
    }
  },
  "mappings": {
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
  },
  "aliases": {}
}

PUT $[[INDEX_PREFIX]]logs-00001
{
  "settings": {
    "index.lifecycle.rollover_alias":"$[[INDEX_PREFIX]]logs"
    , "refresh_interval": "5s"
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
  "index_patterns": [
    "$[[INDEX_PREFIX]]requests_logging*"
  ],
  "settings": {
    "index": {
      "format": "7",
      "lifecycle": {
          "name" : "ilm_$[[INDEX_PREFIX]]metrics-30days-retention",
          "rollover_alias" : "$[[INDEX_PREFIX]]requests_logging"
      },
      "codec": "best_compression",
      "number_of_shards": "1",
      "translog": {
        "durability": "async"
      }
    }
  },
  "mappings": {
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
  },
  "aliases": {}
}

PUT $[[INDEX_PREFIX]]requests_logging-00001
{
  "settings": {
    "index.lifecycle.rollover_alias":"$[[INDEX_PREFIX]]requests_logging"
    , "refresh_interval": "5s"
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
  "index_patterns": [
    "$[[INDEX_PREFIX]]async_bulk_results*"
  ],
  "settings": {
    "index": {
      "format": "7",
      "lifecycle": {
          "name" : "ilm_$[[INDEX_PREFIX]]metrics-30days-retention",
          "rollover_alias" : "$[[INDEX_PREFIX]]async_bulk_results"
      },
      "codec": "best_compression",
      "number_of_shards": "1",
      "translog": {
        "durability": "async"
      }
    }
  },
  "mappings": {
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
  },
  "aliases": {}
}

PUT $[[INDEX_PREFIX]]async_bulk_results-00001
{
  "settings": {
    "index.lifecycle.rollover_alias":"$[[INDEX_PREFIX]]async_bulk_results"
    , "refresh_interval": "5s"
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
    "index_patterns" : [
      "$[[INDEX_PREFIX]]alert-history*"
    ],
    "settings" : {
      "index" : {
        "format" : "7",
        "lifecycle" : {
          "name" : "ilm_$[[INDEX_PREFIX]]metrics-30days-retention",
          "rollover_alias" : "$[[INDEX_PREFIX]]alert-history"
        },
        "codec" : "best_compression",
        "number_of_shards" : "1",
        "translog.durability":"async"
      }
    },
    "mappings" : {
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
    },
    "aliases" : { }
  }


PUT $[[INDEX_PREFIX]]alert-history-00001
{
  "settings": {
    "index.lifecycle.rollover_alias":"$[[INDEX_PREFIX]]alert-history"
    , "refresh_interval": "5s"
  },
  "aliases":{
    "$[[INDEX_PREFIX]]alert-history":{
      "is_write_index":true
    }
  },
  "mappings": {
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
          "analyzer" : "suggest_text_search",
          "index_prefixes" : {
            "min_chars" : 2,
            "max_chars" : 5
          },
          "index_phrases" : true
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


PUT _template/$[[INDEX_PREFIX]]activities-rollover
{
    "order" : 100000,
    "index_patterns" : [
      "$[[INDEX_PREFIX]]activities*"
    ],
    "settings" : {
      "index" : {
        "format" : "7",
        "lifecycle" : {
          "name" : "ilm_$[[INDEX_PREFIX]]metrics-30days-retention",
          "rollover_alias" : "$[[INDEX_PREFIX]]activities"
        },
        "codec" : "best_compression",
        "number_of_shards" : "1",
        "translog.durability":"async"
      }
    },
    "mappings" : {
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
    },
    "aliases" : { }
  }


PUT $[[INDEX_PREFIX]]activities-00001
{
  "mappings": {
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
  },
  "settings": {
    "index": {
      "lifecycle.rollover_alias": "$[[INDEX_PREFIX]]activities",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-calakp97h710dpnp1fa2
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
        "expression": "avg(payload.elasticsearch.node_stats.process.cpu.percent)",
         "title": "CPU Usage of Node[s] ({{.first_group_value}} ..., {{len .results}} nodes in total) >= {{.first_threshold}}%",
         "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}};\nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nNodeID:{{index .group_values 1}}; \nCPU:{{.result_value | to_fixed 2}}%;\n{{end}}"
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
    "channels": {
        "enabled": false,
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-cal8n7p7h710dpnoaps0
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
        "expression": "count(payload.elasticsearch.cluster_health.status)",
        "title": "Health of Cluster[s] ({{.first_group_value}} ..., {{len .results}} clusters in total) Changed to Red",
        "message": "Severity:{{.priority}}\nTimestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}, Name:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }} is RED now;\n{{end}}"
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
    "channels": {
        "enabled": false,
        "normal": [
            {
                "created": "2022-06-16T01:47:11.326727124Z",
                "updated": "2022-06-16T01:47:11.326727124Z",
                "name": "Slack webhook",
                "type": "webhook",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-cal8n7p7h710dpnogps1
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
        "expression": "((max(payload.elasticsearch.node_stats.fs.data.total_in_bytes)-max(payload.elasticsearch.node_stats.fs.data.free_in_bytes))/max(payload.elasticsearch.node_stats.fs.data.total_in_bytes))*100",
        "title": "Disk Utilization is Too High",
        "message": "Severity:{{.priority}}\nTimestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID：{{index .group_values 0}} ;\nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nNodeID：{{index .group_values 1}} ;\nDisk Usage:{{.result_value | to_fixed 2}}%；Free  Storage:{{.relation_values.b | format_bytes 2}}；\n{{end}}"
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
    "channels": {
        "enabled": false,
        "normal": [
            {
                "created": "0001-01-01T00:00:00Z",
                "updated": "0001-01-01T00:00:00Z",
                "name": "Slack",
                "type": "webhook",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-cbp20n2anisjmu4gehc5
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
        "expression": "count(metadata.labels.status)",
        "title": "Elasticsearch node left cluster",
        "message": "Priority:{{.priority}}\nTimestamp:{{.timestamp | datetime_in_zone \"Asia/Shanghai\"}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nClusterName: {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nNodeID:{{index .group_values 1}}; \n{{end}}"
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
    "channels": {
        "enabled": false,
        "normal": [
              {
                "created": "2022-08-09T08:52:44.63345561Z",
                "updated": "2022-08-09T08:52:44.63345561Z",
                "name": "Wechat",
                "type": "webhook",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-calavvp7h710dpnp32r3
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
        "expression": "count(metadata.index_name)",
        "title": "Health of Indices ({{.first_group_value}} ..., {{len .results}} indices in total) Changed to Red",
        "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nIndex name:{{index .group_values 1}}; {{end}}"
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
    "channels": {
        "enabled": false,
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-calaqnh7h710dpnp2bm8
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
        "expression": "p90(payload.elasticsearch.node_stats.jvm.mem.heap_used_percent)",
        "title": "JVM Usage of Node[s] ({{.first_group_value}} ..., {{len .results}} nodes in total) >= {{.first_threshold}}%",
        "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nNode name:{{index .group_values 1}};  memory used percent：{{.result_value | to_fixed 2}}%;{{end}}"
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
    "channels": {
        "enabled": false,
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-cbp2e4ianisjmu4giqs7
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
        "expression": "rate(payload.elasticsearch.index_stats.total.search.query_time_in_millis)/rate(payload.elasticsearch.index_stats.primaries.search.query_total)",
        "title": "Search latency is great than 500ms",
        "message": "Priority:{{.priority}}\nTimestamp:{{.timestamp | datetime_in_zone \"Asia/Shanghai\"}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nClusterName: {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nIndex Name:{{index .group_values 1}}; \nCurrent Value:{{.result_value | to_fixed 2}}ms;\n{{end}}"
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
    "channels": {
        "enabled": false,
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-calgapp7h710dpnpbeb6
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
        "expression": "max(payload.elasticsearch.index_stats.shard_info.store_in_bytes)",
        "title": "Shard Storage >55GB in ({{.first_group_value}} ..., {{len .results}} indices in total)",
        "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}};\nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }};\nIndex: [{{index .group_values 1}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22});\nMax Shard Storage：{{.result_value | format_bytes 2}};\n{{end}}"
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
    "channels": {
        "enabled": false,
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/cb34sfl6psfiqtovhpt4
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
        "expression": "(max(payload.elasticsearch.index_stats.primaries.docs.deleted)/(max(payload.elasticsearch.index_stats.primaries.docs.deleted)+max(payload.elasticsearch.index_stats.primaries.docs.count)))*100",
        "title": "Too Many Deleted Documents (>30%)",
        "message": "Priority:{{.priority}}\nTimestamp:{{.timestamp | datetime_in_zone \"Asia/Shanghai\"}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nClusterName:{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\nIndex:{{index .group_values 0}}; \nRatio of Deleted Documents:{{.result_value}};\n{{end}}"
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
    "channels": {
        "enabled": false,
        "normal": [
            {
                "created": "2022-06-16T04:11:10.242061032Z",
                "updated": "2022-06-16T04:11:10.242061032Z",
                "name": "Slack",
                "type": "webhook",
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
POST $[[INDEX_PREFIX]]view/_doc/cb34sfl6psfiqtovhpt4
{
    "id": "cb34sfl6psfiqtovhpt4",
    "cluster_id": "$[[RESOURCE_ID]]",
    "title": ".infini_metrics",
    "viewName": "gateway",
    "timeFieldName": "timestamp",
    "fields": "[{\"count\":0,\"name\":\"_id\",\"type\":\"string\",\"esTypes\":[\"_id\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_index\",\"type\":\"string\",\"esTypes\":[\"_index\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_source\",\"type\":\"_source\",\"esTypes\":[\"_source\"],\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_type\",\"type\":\"string\",\"esTypes\":[\"_type\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"count\":0,\"name\":\"agent.hostname\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"agent.id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"agent.ips\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"agent.major_ip\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.category\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.datatype\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.labels.cluster_id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.labels.id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.labels.index_id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.labels.index_name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.labels.index_uuid\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.labels.ip\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.labels.name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.labels.node_id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.labels.node_name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.labels.transport_address\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"metadata.name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.active_primary_shards\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.active_shards\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.active_shards_percent_as_number\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.cluster_name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.delayed_unassigned_shards\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.initializing_shards\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.number_of_data_nodes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.number_of_in_flight_fetch\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.number_of_nodes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.number_of_pending_tasks\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.relocating_shards\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.status\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.task_max_waiting_in_queue_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.timed_out\",\"type\":\"boolean\",\"esTypes\":[\"boolean\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_health.unassigned_shards\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.cluster_name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.cluster_uuid\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.completion.size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.docs.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.docs.deleted\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.fielddata.evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.fielddata.memory_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.query_cache.cache_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.query_cache.cache_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.query_cache.evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.query_cache.hit_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.query_cache.memory_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.query_cache.miss_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.query_cache.total_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.doc_values_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.fixed_bit_set_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.index_writer_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.max_unsafe_auto_id_timestamp\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.norms_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.points_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.stored_fields_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.term_vectors_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.terms_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.segments.version_map_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.index.primaries.avg\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.index.primaries.max\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.index.primaries.min\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.index.replication.avg\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.index.replication.max\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.index.replication.min\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.index.shards.avg\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.index.shards.max\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.index.shards.min\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.primaries\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.replication\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.shards.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.indices.store.size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.count.coordinating_only\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.count.data\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.count.ingest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.count.master\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.count.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.count.voting_only\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.discovery_types.zen\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.fs.available_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.fs.free_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.fs.total_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.jvm.max_uptime_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.jvm.mem.heap_max_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.jvm.mem.heap_used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.jvm.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.jvm.versions.bundled_jdk\",\"type\":\"boolean\",\"esTypes\":[\"boolean\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.jvm.versions.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.jvm.versions.using_bundled_jdk\",\"type\":\"boolean\",\"esTypes\":[\"boolean\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.jvm.versions.version\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.jvm.versions.vm_name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.jvm.versions.vm_vendor\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.jvm.versions.vm_version\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.network_types.http_types.netty4\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.network_types.transport_types.netty4\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.os.allocated_processors\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.os.available_processors\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.os.mem.free_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.os.mem.free_percent\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.os.mem.total_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.os.mem.used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.os.mem.used_percent\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.os.names.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.os.names.name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.os.pretty_names.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.os.pretty_names.pretty_name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.packaging_types.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.packaging_types.flavor\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.packaging_types.type\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.process.cpu.percent\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.process.open_file_descriptors.avg\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.process.open_file_descriptors.max\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.process.open_file_descriptors.min\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.nodes.versions\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.status\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.cluster_stats.timestamp\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.allocation_id.id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.index\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.node\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.primary\",\"type\":\"boolean\",\"esTypes\":[\"boolean\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.recovery_source.type\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.shard\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.state\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.unassigned_info.allocation_status\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.unassigned_info.at\",\"type\":\"date\",\"esTypes\":[\"date\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.unassigned_info.delayed\",\"type\":\"boolean\",\"esTypes\":[\"boolean\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.unassigned_info.reason\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_routing_table.shards.0.version\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.index_info.docs_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.index_info.docs_deleted\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.index_info.health\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.index_info.id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.index_info.index\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.index_info.pri_store_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.index_info.replicas\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.index_info.segments_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.index_info.shards\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.index_info.status\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.index_info.store_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.completion.size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.docs.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.docs.deleted\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.fielddata.evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.fielddata.memory_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.flush.periodic\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.flush.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.flush.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.get.current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.get.exists_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.get.exists_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.get.missing_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.get.missing_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.get.time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.get.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.indexing.delete_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.indexing.delete_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.indexing.delete_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.indexing.index_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.indexing.index_failed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.indexing.index_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.indexing.index_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.indexing.is_throttled\",\"type\":\"boolean\",\"esTypes\":[\"boolean\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.indexing.noop_update_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.indexing.throttle_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.merges.current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.merges.current_docs\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.merges.current_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.merges.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.merges.total_auto_throttle_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.merges.total_docs\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.merges.total_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.merges.total_stopped_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.merges.total_throttled_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.merges.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.query_cache.cache_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.query_cache.cache_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.query_cache.evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.query_cache.hit_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.query_cache.memory_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.query_cache.miss_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.query_cache.total_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.recovery.current_as_source\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.recovery.current_as_target\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.recovery.throttle_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.refresh.external_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.refresh.external_total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.refresh.listeners\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.refresh.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.refresh.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.request_cache.evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.request_cache.hit_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.request_cache.memory_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.request_cache.miss_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.fetch_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.fetch_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.fetch_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.open_contexts\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.query_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.query_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.query_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.scroll_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.scroll_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.scroll_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.suggest_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.suggest_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.search.suggest_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.doc_values_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.fixed_bit_set_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.index_writer_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.max_unsafe_auto_id_timestamp\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.norms_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.points_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.stored_fields_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.term_vectors_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.terms_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.segments.version_map_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.store.reserved_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.store.size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.store.total_data_set_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.translog.earliest_last_modified_age\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.translog.operations\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.translog.size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.translog.uncommitted_operations\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.translog.uncommitted_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.warmer.current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.warmer.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.primaries.warmer.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.shard_info.docs\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.shard_info.id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.shard_info.index\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.shard_info.ip\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.shard_info.node\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.shard_info.prirep\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.shard_info.shard\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.shard_info.state\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.shard_info.store\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.shard_info.store_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.completion.size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.docs.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.docs.deleted\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.fielddata.evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.fielddata.memory_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.flush.periodic\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.flush.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.flush.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.get.current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.get.exists_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.get.exists_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.get.missing_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.get.missing_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.get.time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.get.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.indexing.delete_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.indexing.delete_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.indexing.delete_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.indexing.index_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.indexing.index_failed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.indexing.index_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.indexing.index_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.indexing.is_throttled\",\"type\":\"boolean\",\"esTypes\":[\"boolean\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.indexing.noop_update_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.indexing.throttle_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.merges.current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.merges.current_docs\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.merges.current_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.merges.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.merges.total_auto_throttle_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.merges.total_docs\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.merges.total_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.merges.total_stopped_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.merges.total_throttled_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.merges.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.query_cache.cache_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.query_cache.cache_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.query_cache.evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.query_cache.hit_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.query_cache.memory_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.query_cache.miss_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.query_cache.total_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.recovery.current_as_source\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.recovery.current_as_target\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.recovery.throttle_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.refresh.external_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.refresh.external_total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.refresh.listeners\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.refresh.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.refresh.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.request_cache.evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.request_cache.hit_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.request_cache.memory_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.request_cache.miss_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.fetch_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.fetch_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.fetch_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.open_contexts\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.query_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.query_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.query_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.scroll_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.scroll_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.scroll_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.suggest_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.suggest_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.search.suggest_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.doc_values_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.fixed_bit_set_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.index_writer_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.max_unsafe_auto_id_timestamp\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.norms_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.points_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.stored_fields_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.term_vectors_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.terms_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.segments.version_map_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.store.reserved_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.store.size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.store.total_data_set_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.translog.earliest_last_modified_age\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.translog.operations\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.translog.size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.translog.uncommitted_operations\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.translog.uncommitted_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.warmer.current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.warmer.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.index_stats.total.warmer.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.allocation_id.id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.index\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.node\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.primary\",\"type\":\"boolean\",\"esTypes\":[\"boolean\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.recovery_source.type\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.shard\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.state\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.unassigned_info.allocation_status\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.unassigned_info.at\",\"type\":\"date\",\"esTypes\":[\"date\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.unassigned_info.delayed\",\"type\":\"boolean\",\"esTypes\":[\"boolean\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.unassigned_info.reason\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_routing_table.version\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.attributes.ml.machine_memory\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.attributes.ml.max_open_jobs\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.attributes.rack\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.attributes.xpack.installed\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.accounting.estimated_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.accounting.estimated_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.accounting.limit_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.accounting.limit_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.accounting.overhead\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.accounting.tripped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.fielddata.estimated_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.fielddata.estimated_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.fielddata.limit_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.fielddata.limit_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.fielddata.overhead\",\"type\":\"number\",\"esTypes\":[\"float\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.fielddata.tripped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.in_flight_requests.estimated_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.in_flight_requests.estimated_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.in_flight_requests.limit_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.in_flight_requests.limit_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.in_flight_requests.overhead\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.in_flight_requests.tripped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.parent.estimated_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.parent.estimated_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.parent.limit_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.parent.limit_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.parent.overhead\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.parent.tripped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.request.estimated_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.request.estimated_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.request.limit_size\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.request.limit_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.request.overhead\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.breakers.request.tripped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.discovery.cluster_state_queue.committed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.discovery.cluster_state_queue.pending\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.discovery.cluster_state_queue.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.discovery.published_cluster_states.compatible_diffs\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.discovery.published_cluster_states.full_states\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.discovery.published_cluster_states.incompatible_diffs\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.data.available_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.data.free_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.data.mount\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.data.path\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.data.total_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.data.type\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.least_usage_estimate.available_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.least_usage_estimate.path\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.least_usage_estimate.total_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.least_usage_estimate.used_disk_percent\",\"type\":\"number\",\"esTypes\":[\"float\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.most_usage_estimate.available_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.most_usage_estimate.path\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.most_usage_estimate.total_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.most_usage_estimate.used_disk_percent\",\"type\":\"number\",\"esTypes\":[\"float\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.timestamp\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.total.available_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.total.free_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.fs.total.total_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.host\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.http.current_open\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.http.total_opened\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.completion.size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.docs.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.docs.deleted\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.fielddata.evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.fielddata.memory_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.flush.periodic\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.flush.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.flush.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.get.current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.get.exists_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.get.exists_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.get.missing_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.get.missing_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.get.time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.get.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.indexing.delete_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.indexing.delete_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.indexing.delete_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.indexing.index_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.indexing.index_failed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.indexing.index_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.indexing.index_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.indexing.is_throttled\",\"type\":\"boolean\",\"esTypes\":[\"boolean\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.indexing.noop_update_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.indexing.throttle_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.merges.current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.merges.current_docs\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.merges.current_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.merges.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.merges.total_auto_throttle_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.merges.total_docs\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.merges.total_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.merges.total_stopped_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.merges.total_throttled_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.merges.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.query_cache.cache_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.query_cache.cache_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.query_cache.evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.query_cache.hit_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.query_cache.memory_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.query_cache.miss_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.query_cache.total_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.recovery.current_as_source\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.recovery.current_as_target\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.recovery.throttle_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.refresh.external_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.refresh.external_total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.refresh.listeners\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.refresh.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.refresh.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.request_cache.evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.request_cache.hit_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.request_cache.memory_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.request_cache.miss_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.fetch_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.fetch_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.fetch_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.open_contexts\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.query_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.query_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.query_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.scroll_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.scroll_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.scroll_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.suggest_current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.suggest_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.search.suggest_total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.segments.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.segments.doc_values_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.segments.fixed_bit_set_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.segments.index_writer_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.segments.memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.segments.norms_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.segments.points_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.segments.stored_fields_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.segments.term_vectors_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.segments.terms_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.segments.version_map_memory_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.store.size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.translog.earliest_last_modified_age\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.translog.operations\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.translog.size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.translog.uncommitted_operations\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.translog.uncommitted_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.warmer.current\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.warmer.total\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.indices.warmer.total_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.ip\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.buffer_pools.direct.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.buffer_pools.direct.total_capacity_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.buffer_pools.direct.used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.buffer_pools.mapped.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.buffer_pools.mapped.total_capacity_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.buffer_pools.mapped.used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.classes.current_loaded_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.classes.total_loaded_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.classes.total_unloaded_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.gc.collectors.old.collection_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.gc.collectors.old.collection_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.gc.collectors.young.collection_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.gc.collectors.young.collection_time_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.heap_committed_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.heap_max_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.heap_used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.heap_used_percent\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.non_heap_committed_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.non_heap_used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.old.max_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.old.peak_max_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.old.peak_used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.old.used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.survivor.max_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.survivor.peak_max_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.survivor.peak_used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.survivor.used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.young.max_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.young.peak_max_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.young.peak_used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.mem.pools.young.used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.threads.count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.threads.peak_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.timestamp\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.jvm.uptime_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.os.cpu.percent\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.os.mem.free_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.os.mem.free_percent\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.os.mem.total_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.os.mem.used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.os.mem.used_percent\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.os.swap.free_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.os.swap.total_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.os.swap.used_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.os.timestamp\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.process.cpu.percent\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.process.cpu.total_in_millis\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.process.max_file_descriptors\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.process.mem.total_virtual_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.process.open_file_descriptors\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.process.timestamp\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.roles\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.script.cache_evictions\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.script.compilation_limit_triggered\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.script.compilations\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.indices_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.replicas_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.shard_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.shards.docs\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.shards.id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.shards.index\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.shards.ip\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.shards.node\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.shards.prirep\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.shards.shard\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.shards.state\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.shards.store\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.shard_info.shards.store_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.analyze.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.analyze.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.analyze.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.analyze.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.analyze.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.analyze.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ccr.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ccr.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ccr.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ccr.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ccr.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ccr.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.data_frame_indexing.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.data_frame_indexing.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.data_frame_indexing.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.data_frame_indexing.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.data_frame_indexing.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.data_frame_indexing.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_started.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_started.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_started.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_started.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_started.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_started.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_store.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_store.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_store.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_store.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_store.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.fetch_shard_store.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.flush.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.flush.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.flush.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.flush.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.flush.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.flush.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.force_merge.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.force_merge.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.force_merge.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.force_merge.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.force_merge.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.force_merge.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.generic.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.generic.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.generic.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.generic.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.generic.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.generic.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.get.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.get.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.get.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.get.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.get.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.get.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.listener.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.listener.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.listener.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.listener.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.listener.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.listener.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.management.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.management.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.management.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.management.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.management.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.management.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_datafeed.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_datafeed.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_datafeed.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_datafeed.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_datafeed.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_datafeed.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_job_comms.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_job_comms.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_job_comms.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_job_comms.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_job_comms.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_job_comms.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_utility.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_utility.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_utility.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_utility.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_utility.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.ml_utility.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.refresh.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.refresh.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.refresh.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.refresh.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.refresh.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.refresh.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.rollup_indexing.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.rollup_indexing.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.rollup_indexing.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.rollup_indexing.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.rollup_indexing.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.rollup_indexing.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search_throttled.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search_throttled.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search_throttled.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search_throttled.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search_throttled.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.search_throttled.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.snapshot.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.snapshot.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.snapshot.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.snapshot.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.snapshot.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.snapshot.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.warmer.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.warmer.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.warmer.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.warmer.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.warmer.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.warmer.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.watcher.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.watcher.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.watcher.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.watcher.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.watcher.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.watcher.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.write.active\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.write.completed\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.write.largest\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.write.queue\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.write.rejected\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.thread_pool.write.threads\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.timestamp\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.transport.rx_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.transport.rx_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.transport.server_open\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.transport.tx_count\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.transport.tx_size_in_bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.elasticsearch.node_stats.transport_address\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.host.network_summary.in.bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.host.network_summary.in.dropped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.host.network_summary.in.errors\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.host.network_summary.in.packets\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.host.network_summary.out.bytes\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.host.network_summary.out.dropped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.host.network_summary.out.errors\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.host.network_summary.out.packets\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.entry.my_es_entry.open_connections\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.goroutine.bulk_indexing.blocking\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.goroutine.bulk_indexing.capacity\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.goroutine.bulk_indexing.running\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.goroutine.tasks.blocking\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.goroutine.tasks.capacity\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.goroutine.tasks.running\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_buffer.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_buffer.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_buffer.inuse\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_buffer.pool_items\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_buffer.pool_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_buffer.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_processing_request.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_processing_request.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_processing_request.inuse\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_processing_request.pool_items\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_processing_request.pool_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_processing_request.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_processing_response.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_processing_response.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_processing_response.pool_items\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_processing_response.pool_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.bulk_processing_response.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_request_body.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_request_body.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_request_body.dropped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_request_body.inuse\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_request_body.pool_items\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_request_body.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_response_body.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_response_body.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_response_body.dropped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_response_body.pool_items\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_response_body.pool_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.default_response_body.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.fasthttp_router.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.fasthttp_router.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.fasthttp_router.dropped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.fasthttp_router.pool_items\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.fasthttp_router.pool_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.fasthttp_router.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.fasthttp_stackless.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.fasthttp_stackless.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.fasthttp_stackless.pool_items\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.fasthttp_stackless.pool_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.fasthttp_stackless.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.index_merge_docs.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.index_merge_docs.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.index_merge_docs.inuse\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.index_merge_docs.pool_items\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.index_merge_docs.pool_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.index_merge_main.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.index_merge_main.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.index_merge_main.inuse\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.index_merge_main.pool_items\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.index_merge_main.pool_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.proxy_response.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.proxy_response.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.proxy_response.dropped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.proxy_response.pool_items\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.proxy_response.pool_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.proxy_response.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.template.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.template.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.template.dropped\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.template.pool_items\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.template.pool_size\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.bytes.template.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.objects.bulk_buffer_objects.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.objects.bulk_buffer_objects.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.objects.bulk_buffer_objects.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.objects.request.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.objects.request.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.objects.request.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.objects.response.acquired\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.objects.response.allocated\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.pool.objects.response.returned\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.elasticsearch.bulk.submit\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.metrics.save.elasticsearch.cluster_health\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.metrics.save.elasticsearch.cluster_stats\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.metrics.save.elasticsearch.index_routing_table\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.metrics.save.elasticsearch.index_stats\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.metrics.save.elasticsearch.node_routing_table\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.metrics.save.elasticsearch.node_stats\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.metrics.save.host.network_summary\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.metrics.save.instance.console\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.metrics.save.instance.gateway\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cfvsvdi8go5hju61vrc0.push\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cfvsvdi8go5hju61vrd0.pop\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cfvsvdi8go5hju61vrd0.push\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cfvsvdi8go5hju61vrf0.consume\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cfvsvdi8go5hju61vrf0.push\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cg0qc328go5kbu0g3nhg.push\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cg0qcfq8go5k9m4hvkbg.pop\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cg0qcfq8go5k9m4hvkbg.push\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cg0qco28go5kf75ucsa0.pop\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cg0qco28go5kf75ucsa0.push\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cg0qcoq8go5kf75ucsag.pop\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cg0qcoq8go5kf75ucsag.push\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cg0qqkq8go5j0a2hsk70.push\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cg0qqkq8go5j0a2hsk7g.push\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.queue.cg0rf528go5j084cjkhg.push\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.stats.reverse_proxy.backend_failure\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.system.cgo_calls\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.system.cpu\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.system.goroutines\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.system.mem\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"payload.instance.system.uptime_in_ms\",\"type\":\"number\",\"esTypes\":[\"long\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"count\":0,\"name\":\"timestamp\",\"type\":\"date\",\"esTypes\":[\"date\"],\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true}]",
    "fieldFormatMap": "",
    "updated_at": "2023-03-06T06:28:59.7280082+08:00",
    "default_layout_id": "cg2qqh28go5jqa6vvk70"
 }

 #The `id` value is consistent with the `_id` value
 POST $[[INDEX_PREFIX]]layout/_doc/cg2qqh28go5jqa6vvk70
 {
     "id": "cg2qqh28go5jqa6vvk70",
     "created": "2023-03-06T17:07:16.1879266+08:00",
     "updated": "2023-03-07T08:33:16.1732009+08:00",
     "name": "Gateway Metrics",
     "description": "",
     "creator": {
       "name": "$[[USERNAME]]",
       "id": "$[[USER_ID]]"
     },
     "view_id": "cb34sfl6psfiqtovhpt4",
     "config":{
         "cols": 12,
         "row_height": 60,
         "widgets": [{
           "formatter": "bytes",
           "position": {
             "h": 4,
             "w": 4,
             "x": 4,
             "y": 0
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "metadata.labels.name",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.instance.system.mem",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Memory"
         }, {
           "formatter": "percent",
           "position": {
             "h": 4,
             "w": 4,
             "x": 0,
             "y": 0
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "metadata.labels.name",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.instance.system.cpu",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "CPU"
         }, {
           "formatter": "number",
           "position": {
             "h": 4,
             "w": 4,
             "x": 8,
             "y": 0
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "metadata.labels.name",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.instance.entry.my_es_entry.open_connections",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Connections"
         }, {
           "formatter": "bytes",
           "position": {
             "h": 4,
             "w": 4,
             "x": 0,
             "y": 8
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "metadata.labels.name",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.instance.pool.bytes.bulk_processing_request.pool_size",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Request Pools Size"
         }, {
           "formatter": "bytes",
           "position": {
             "h": 4,
             "w": 4,
             "x": 0,
             "y": 12
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "metadata.labels.name",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.instance.pool.bytes.bulk_processing_response.pool_size",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Response Pools Size"
         }, {
           "formatter": "number",
           "position": {
             "h": 4,
             "w": 4,
             "x": 0,
             "y": 4
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "metadata.labels.name",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.instance.system.goroutines",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Goroutines"
         }, {
           "formatter": "bytes",
           "position": {
             "h": 4,
             "w": 4,
             "x": 8,
             "y": 8
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "agent.major_ip",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.host.network_summary.in.bytes",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Network Traffics (In)"
         }, {
           "formatter": "bytes",
           "position": {
             "h": 4,
             "w": 4,
             "x": 8,
             "y": 12
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "agent.major_ip",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.host.network_summary.out.bytes",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Network Traffics (Out)"
         }, {
           "formatter": "number",
           "position": {
             "h": 4,
             "w": 4,
             "x": 8,
             "y": 4
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "metadata.labels.name",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.instance.goroutine.bulk_indexing.running",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Task Goroutines"
         }, {
           "formatter": "number",
           "position": {
             "h": 4,
             "w": 4,
             "x": 4,
             "y": 4
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "metadata.labels.name",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.instance.goroutine.bulk_indexing.running",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Bulk Goroutines"
         }, {
           "formatter": "number",
           "position": {
             "h": 5,
             "w": 6,
             "x": 0,
             "y": 16
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "agent.major_ip",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.host.network_summary.in.errors",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Network Error (In)"
         }, {
           "formatter": "number",
           "position": {
             "h": 5,
             "w": 6,
             "x": 0,
             "y": 21
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "agent.major_ip",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.host.network_summary.out.errors",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Network Error (Out)"
         }, {
           "formatter": "number",
           "position": {
             "h": 4,
             "w": 4,
             "x": 4,
             "y": 8
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "agent.major_ip",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.host.network_summary.in.packets",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Network Packets (In)"
         }, {
           "formatter": "number",
           "position": {
             "h": 4,
             "w": 4,
             "x": 4,
             "y": 12
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "agent.major_ip",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.host.network_summary.out.packets",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Network Packets (Out)"
         }, {
           "formatter": "number",
           "position": {
             "h": 5,
             "w": 6,
             "x": 6,
             "y": 16
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "agent.major_ip",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.host.network_summary.in.dropped",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Network Dropped (In)"
         }, {
           "formatter": "number",
           "position": {
             "h": 5,
             "w": 6,
             "x": 6,
             "y": 21
           },
           "series": [{
             "metric": {
               "bucket_size": "1m",
               "format_type": "num",
               "formula": "a",
               "groups": [{
                 "field": "agent.major_ip",
                 "limit": 5
               }],
               "items": [{
                 "field": "payload.host.network_summary.out.dropped",
                 "name": "a",
                 "statistic": "max"
               }]
             },
             "queries": {
               "cluster_id": "$[[RESOURCE_ID]]",
               "indices": [".infini_metrics"],
               "query": "{\n\t\"bool\": {\n\t\t\"should\": [{\n\t\t\t\"match_phrase\": {\n\t\t\t\t\"metadata.name\": \"gateway\"\n\t\t\t}\n\t\t}],\n\t\t\"minimum_should_match\": 1\n\t}\n}",
               "time_field": "timestamp"
             },
             "type": "area"
           }],
           "title": "Network Dropped (Out)"
         }]
   }

 }

POST $[[INDEX_PREFIX]]layout/_doc/cgjoqud3q95rinbbe1l0
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

POST $[[INDEX_PREFIX]]layout/_doc/cgjpvt53q95r17vbdteg
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

POST $[[INDEX_PREFIX]]layout/_doc/cgjqcg53q95r17vbfo10
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
POST $[[INDEX_PREFIX]]layout/_doc/ch0u5d53q95poj13629g
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
POST $[[INDEX_PREFIX]]layout/_doc/cgjqcg53q95r17vbfo10
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


