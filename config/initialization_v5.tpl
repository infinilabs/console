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
  "index_patterns": [
    "$[[INDEX_PREFIX]]requests_logging*"
  ],
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
}


PUT _template/$[[INDEX_PREFIX]]activities-rollover
{
    "order" : 100000,
    "index_patterns" : "$[[INDEX_PREFIX]]activities*",
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
    "name": "CPU utilization is Too High",
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
                "field": "payload.elasticsearch.node_stats.process.cpu.percent",
                "statistic": "avg"
            }
        ],
        "format_type": "ratio",
        "expression": "avg(payload.elasticsearch.node_stats.process.cpu.percent)",
        "title": "CPU Usage of Node[s] ({{.first_group_value}} ..., {{len .results}} nodes in total) >= {{.first_threshold}}%",
        "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}};NodeID:{{index .group_values 1}}; CPU:{{.result_value | to_fixed 2}}%;\n{{end}}"
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
        "enabled": true,
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
                    "url": "${SLACK_WEBHOOK_ENDPOINT}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <${INFINI_CONSOLE_ENDPOINT}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n  {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*NodeID:* {{index .group_values 1}}\"\n                        }\n                      ,\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Usage:* {{.result_value | to_fixed 2}}%\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <${INFINI_CONSOLE_ENDPOINT}/#/cluster/overview/{{ index .group_values 0}}/nodes/{{ index .group_values 1}}|View Node Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
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
        "expression": "count(payload.elasticsearch.cluster_health.status)",
        "title": "Health of Cluster[s] ({{.first_group_value}} ..., {{len .results}} clusters in total) Changed to Red",
        "message": "Priority:{{.priority}}\nTimestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}} is red now;\n{{end}}"
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
        "enabled": true,
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
                    "url": "${SLACK_WEBHOOK_ENDPOINT}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <${INFINI_CONSOLE_ENDPOINT}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"high\"}} \"#EB4C21\" {{else if eq .priority \"medium\"}} \"#FFB449\" {{else if eq .priority \"low\"}} \"#87d068\" {{else}} \"#2db7f5\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <${INFINI_CONSOLE_ENDPOINT}/#/cluster/monitor/elasticsearch/{{ index .group_values 0}}|View Cluster Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
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
                    "url": "${DINGTALK_WEBHOOK_ENDPOINT}",
                    "body": "{\"msgtype\": \"text\",\"text\": {\"content\":\"Alerting: \\n{{.title}}\\n\\n{{.message}}\\nLink:${INFINI_CONSOLE_ENDPOINT}/#/alerting/alert/{{.event_id}}\"}}"
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
        "expression": "((max(payload.elasticsearch.node_stats.fs.data.total_in_bytes)-max(payload.elasticsearch.node_stats.fs.data.free_in_bytes))/max(payload.elasticsearch.node_stats.fs.data.total_in_bytes))*100",
        "title": "Disk Utilization is Too High",
        "message": "Priority:{{.priority}}\nTimestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID：{{index .group_values 0}} ;\nNodeID：{{index .group_values 1}} ;\nDisk Usage:{{.result_value | to_fixed 2}}%；Free  Storage:{{.relation_values.b | format_bytes 2}}；\n{{end}}"
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
        "enabled": true,
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
                    "url": "${SLACK_WEBHOOK_ENDPOINT}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <${INFINI_CONSOLE_ENDPOINT}#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n  {\n                            \"type\": \"mrkdwn\",\n                         \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*NodeID:* {{index .group_values 1}}\"\n                        }\n                      ,\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Usage:* {{.result_value | to_fixed 2}}%\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Free:* {{.relation_values.b | format_bytes 2}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <${INFINI_CONSOLE_ENDPOINT}#/cluster/overview/{{ index .group_values 0}}/nodes/{{ index .group_values 1}}|View Node Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
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
        "expression": "count(metadata.labels.status)",
        "title": "Elasticsearch node left cluster",
        "message": "Priority:{{.priority}}\nTimestamp:{{.timestamp | datetime_in_zone \"Asia/Shanghai\"}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nNodeID:{{index .group_values 1}}; \n{{end}}"
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
        "enabled": true,
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
                  "url": "${WECHAT_WEBHOOK_ENDPOINT}",
                  "body": "{\n    \"msgtype\": \"markdown\",\n    \"markdown\": {\n        \"content\": \"Incident [#{{.event_id}}](${INFINI_CONSOLE_ENDPOINT}/#/alerting/alert/{{.event_id}}) is ongoing\\n{{.title}}\\n\n         {{range .results}}\n         >ClusterID:<font color=\\\"comment\\\">{{index .group_values 0}}</font>\n        >NodeID:<font color=\\\"comment\\\">{{index .group_values 1}}</font>\n         >Priority:<font color=\\\"comment\\\">{{.priority}}</font>\n         >Link:[View Cluster Monitoring](${INFINI_CONSOLE_ENDPOINT}/#/cluster/overview/{{ index .group_values 0}}/nodes/{{ index .group_values 1}}) \n         {{end}}\"\n    }\n}\n"
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
        "expression": "count(metadata.index_name)",
        "title": "Health of Indices ({{.first_group_value}} ..., {{len .results}} indices in total) Changed to Red",
        "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; Index name:{{index .group_values 1}}; {{end}}"
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
        "enabled": true,
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
                    "url": "${SLACK_WEBHOOK_ENDPOINT}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <${INFINI_CONSOLE_ENDPOINT}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n   {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Index:* {{index .group_values 1}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <${INFINI_CONSOLE_ENDPOINT}/#/cluster/monitor/elasticsearch/{{ index .group_values 0}}?_g=%7B%22tab%22%3A%22indices%22%7D|View Index Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
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
        "expression": "p90(payload.elasticsearch.node_stats.jvm.mem.heap_used_percent)",
        "title": "JVM Usage of Node[s] ({{.first_group_value}} ..., {{len .results}} nodes in total) >= {{.first_threshold}}%",
        "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; Node name:{{index .group_values 1}};  memory used percent：{{.result_value | to_fixed 2}}%;{{end}}"
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
        "enabled": true,
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
                    "url": "${SLACK_WEBHOOK_ENDPOINT}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <${INFINI_CONSOLE_ENDPOINT}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n  {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*NodeID:* {{index .group_values 1}}\"\n                        }\n                      ,\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Usage:* {{.result_value | to_fixed 2}}%\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <${INFINI_CONSOLE_ENDPOINT}/#/cluster/overview/{{ index .group_values 0}}/nodes/{{ index .group_values 1}}|View Node Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
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
        "expression": "rate(payload.elasticsearch.index_stats.total.search.query_time_in_millis)/rate(payload.elasticsearch.index_stats.primaries.search.query_total)",
        "title": "Search latency is great than 500ms",
        "message": "Priority:{{.priority}}\nTimestamp:{{.timestamp | datetime_in_zone \"Asia/Shanghai\"}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nIndex name:{{index .group_values 1}}; \nCurrent value:{{.result_value | to_fixed 2}}ms;\n{{end}}"
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
        "enabled": true,
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
                    "url": "${SLACK_WEBHOOK_ENDPOINT}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <${INFINI_CONSOLE_ENDPOINT}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n  {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Index:* {{index .group_values 1}}\"\n                        },\n  {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Latency:* {{.result_value | to_fixed 2}}ms\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <${INFINI_CONSOLE_ENDPOINT}/#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}|View Index Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
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
        "expression": "max(payload.elasticsearch.index_stats.shard_info.store_in_bytes)",
        "title": "Shard Storage >55GB in ({{.first_group_value}} ..., {{len .results}} indices in total)",
        "message": "Timestamp:{{.timestamp | datetime}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; Index:{{index .group_values 1}};  Max Shard Storage：{{.result_value | format_bytes 2}};{{end}}"
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
        "enabled": true,
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
                    "url": "${SLACK_WEBHOOK_ENDPOINT}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <${INFINI_CONSOLE_ENDPOINT}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n  {\n                            \"type\": \"mrkdwn\",\n                        \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n   {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Index:* {{index .group_values 1}}\"\n                        },\n  {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Max Shard Storage:* {{.result_value | format_bytes 2}}\"\n                        },\n                      \n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <${INFINI_CONSOLE_ENDPOINT}/#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22}|View Index Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
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
        "expression": "(max(payload.elasticsearch.index_stats.primaries.docs.deleted)/(max(payload.elasticsearch.index_stats.primaries.docs.deleted)+max(payload.elasticsearch.index_stats.primaries.docs.count)))*100",
        "title": "Too Many Deleted Documents (>30%)",
        "message": "Priority:{{.priority}}\nTimestamp:{{.timestamp | datetime_in_zone \"Asia/Shanghai\"}}\nRuleID:{{.rule_id}}\nEventID:{{.event_id}}\n{{range .results}}\nClusterID:{{index .group_values 0}}; \nIndex:{{index .group_values 0}}; \nRatio of Deleted Documents:{{.result_value}};\n{{end}}"
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
        "enabled": true,
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
                    "url": "${SLACK_WEBHOOK_ENDPOINT}",
                    "body": "{\n    \"blocks\": [\n        {\n            \"type\": \"section\",\n            \"text\": {\n                \"type\": \"mrkdwn\",\n                \"text\": \"Incident <${INFINI_CONSOLE_ENDPOINT}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing\\n{{.title}}\"\n            }\n        }\n    ],\n    \"attachments\": [\n        {{range .results}}\n        {\n            \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n            \"blocks\": [\n                {\n                    \"type\": \"section\",\n                    \"fields\": [\n  {\n                            \"type\": \"mrkdwn\",\n                             \"text\": \"*Priority:* {{.priority}}\"\n                        },\n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*ClusterID:* {{index .group_values 0}}\"\n                        },\n   {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Index:* {{index .group_values 1}}\"\n                        },\n     {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Deleted:* {{.result_value | to_fixed 2}}%\"\n                        },\n                      \n                        {\n                            \"type\": \"mrkdwn\",\n                            \"text\": \"*Link:* <${INFINI_CONSOLE_ENDPOINT}/#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22}|View Index Monitoring>\"\n                        }\n                    ]\n                }\n            ]\n        },\n        {{end}}\n    ]\n}"
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


GET /


