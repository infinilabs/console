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
    "index.lifecycle.rollover_alias":"$[[INDEX_PREFIX]]metrics"
    , "refresh_interval": "5s"
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
    "index.lifecycle.rollover_alias":"$[[INDEX_PREFIX]]alert-history"
    , "refresh_interval": "5s"
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

#alerting channel
#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]channel/doc/cgnb2nt3q95nmusjl65g
{
    "id": "cgnb2nt3q95nmusjl65g",
    "created": "2023-04-06T11:47:43.104108279Z",
    "updated": "2023-08-09T22:39:50.494915568+08:00",
    "name": "[Alerting] Slack Notification",
    "type": "webhook",
    "webhook": {
    "header_params": {
      "Content-type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing !*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.trigger_at | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"*Cluster:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{ index .group_values 0}}|{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
    },
    "sub_type": "slack",
    "enabled": false
}
POST $[[INDEX_PREFIX]]channel/doc/cj8bq8d3q95ogankugqg
{
  "id": "cj8bq8d3q95ogankugqg",
  "created": "2023-08-07T17:45:05.534408059+08:00",
  "updated": "2023-08-09T22:39:56.489567891+08:00",
  "name": "[Recovery] Slack Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*ResolveAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Target:* {{.resource_name}}-{{.objects}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.trigger_at | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Duration:* {{.duration}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    },\n    {\n      \"type\": \"actions\",\n      \"elements\": [\n        {\n          \"type\": \"button\",\n          \"text\": {\n            \"type\": \"plain_text\",\n            \"text\": \"View Incident\"   \n          },\n          \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n        }\n      ]\n    }\n  ]\n}"
  },
  "sub_type": "slack",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/doc/cgnb2kt3q95nmusjl64g
{
  "id": "cgnb2kt3q95nmusjl64g",
  "created": "2023-04-06T11:47:31.161587662Z",
  "updated": "2023-08-09T22:39:51.540172306+08:00",
  "name": "[Alerting] Wechat Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.WECOM_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n      \"content\": \"**[ INFINI Platform Alerting ]**\\n🔥 Incident [#{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}) is ongoing\\n**{{.title}}**\\nPriority: {{.priority}}\\n\\nEventID: {{.event_id}}\\n\\nTarget: {{.resource_name}}-{{.objects}}\\n\\nTriggerAt: {{.trigger_at | datetime}}\\n{{.message}}\"\n  }\n}"
  },
  "sub_type": "wechat",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/doc/cgiospt3q95q49k3u00g
{
  "id": "cgiospt3q95q49k3u00g",
  "created": "2023-03-30T13:28:07.531263747Z",
  "updated": "2023-08-09T22:39:52.356059486+08:00",
  "name": "[Alerting] DingTalk Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DINGTALK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n    \"title\": \"{{.title}}\",\n    \"text\": \"![INFINI Platform Alerting](https://infinilabs.com/img/email/alert-header.png)\\n\\n🔥 Incident [{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}) is ongoing\\n\\n**{{.title}}**\\n\\nPriority: {{.priority}}\\n\\nEventID: {{.event_id}}\\n\\nTarget: {{.resource_name}}-{{.objects}}\\n\\nTriggerAt: {{.trigger_at | datetime}}\\n\\n---\\n\\n{{.message}}\"\n  }\n}"
  },
  "sub_type": "dingtalk",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/doc/cj8ctat3q95l9ebbntlg
{
  "id": "cj8ctat3q95l9ebbntlg",
  "created": "2023-08-07T18:59:55.28732241+08:00",
  "updated": "2023-08-09T22:39:58.967970184+08:00",
  "name": "[Recovery] DingTalk Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DINGTALK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n    \"title\": \"{{.title}}\",\n    \"text\": \"![INFINI Platform Alerting](https://infinilabs.com/img/email/recovery-header.png)\\n\\n**{{.title}}**\\n\\n{{.message}}\\n\\n> [View Incident]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}})\"\n  }\n}\n"
  },
  "sub_type": "dingtalk",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/doc/cj8e9gt3q95gsdbb0170
{
  "id": "cj8e9gt3q95gsdbb0170",
  "created": "2023-08-07T20:34:11.998953512+08:00",
  "updated": "2023-08-09T22:40:04.665871275+08:00",
  "name": "[Recovery] Wechat Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.WECOM_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n    \"content\": \"**[ INFINI Platform Alerting ]**\\n**{{.title}}**\\n\\n{{.message}}\\n\\n> [View Incident]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}})\"\n  }\n}\n"
  },
  "sub_type": "wechat",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/doc/cgnb2r53q95nmusjl6vg
{
  "id": "cgnb2r53q95nmusjl6vg",
  "created": "2023-04-06T11:47:56.652637309Z",
  "updated": "2023-08-10T12:04:08.046781556+08:00",
  "name": "[Alerting] Email Notification",
  "type": "email",
  "sub_type": "email",
  "email": {
    "server_id": "",
    "recipients": {
      "to": [],
      "cc": []
    },
    "subject": "[INFINI Platform Alerting] 🔥 {{.title}}",
    "body": "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:v=\"urn:schemas-microsoft-com:vml\" lang=\"en\"><head>\n      <title></title>\n      <meta property=\"og:title\" content=\"\">\n      <meta name=\"twitter:title\" content=\"\">\n  <meta name=\"x-apple-disable-message-reformatting\">\n  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">\n  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n      <!--[if gte mso 9]>\n    <xml>\n        <o:OfficeDocumentSettings>\n        <o:AllowPNG/>\n        <o:PixelsPerInch>96</o:PixelsPerInch>\n        </o:OfficeDocumentSettings>\n    </xml>\n    <style>\n      ul > li {\n        text-indent: -1em;\n      }\n    </style>\n  <![endif]-->\n  <!--[if mso]>\n  <style type=\"text/css\">\n   body, td {font-family: Arial, Helvetica, sans-serif;} \n   .hse-body-wrapper-table {background-color: #EAF0F6;padding: 20px 0 !important}\n  </style>\n  <![endif]-->\n    <meta name=\"generator\" content=\"HubSpot\">\n    <style type=\"text/css\">.moz-text-html .hse-column-container{max-width:600px !important;width:600px !important}\n  .moz-text-html .hse-column{display:table-cell;vertical-align:top}.moz-text-html .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  [owa] .hse-column-container{max-width:600px !important;width:600px !important}[owa] .hse-column{display:table-cell;vertical-align:top}\n  [owa] .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  @media only screen and (min-width:640px){.hse-column-container{max-width:600px !important;width:600px !important}\n  .hse-column{display:table-cell;vertical-align:top}.hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  }@media only screen and (max-width:639px){img.stretch-on-mobile,.hs_rss_email_entries_table img,.hs-stretch-cta .hs-cta-img{height:auto !important;width:100% !important}\n  .display_block_on_small_screens{display:block}.hs_padded{padding-left:20px !important;padding-right:20px !important}\n  }</style><!--<![endif]--><style type=\"text/css\">body[data-outlook-cycle] img.stretch-on-mobile,body[data-outlook-cycle] .hs_rss_email_entries_table img{height:auto !important;width:100% !important}\n  body[data-outlook-cycle] .hs_padded{padding-left:20px !important;padding-right:20px !important}\n  a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}\n  #outlook a{padding:0}.yshortcuts a{border-bottom:none !important}a{text-decoration:underline}\n  .ExternalClass{width:100%}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%}\n  p{margin:0}body{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;moz-osx-font-smoothing:grayscale}</style>\n  </head>\n  <body bgcolor=\"#EAF0F6\"\n    style=\"margin:0 !important; padding:0 !important; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n    <!--[if gte mso 9]>\n  <v:background xmlns:v=\"urn:schemas-microsoft-com:vml\" fill=\"t\">\n      <v:fill type=\"tile\" size=\"100%,100%\"  color=\"#ffffff\"/>\n  </v:background>\n  <![endif]-->\n    <div class=\"hse-body-background\" style=\"background-color:#eaf0f6\" bgcolor=\"#eaf0f6\">\n      <table role=\"presentation\" class=\"hse-body-wrapper-table\" cellpadding=\"0\" cellspacing=\"0\"\n        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; margin:0; padding:0; width:100% !important; min-width:200px !important; height:100% !important\"\n        width=\"100%\" height=\"100%\">\n        <tbody>\n          <tr>\n            <td class=\"hse-body-wrapper-td\" valign=\"top\"\n              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n              <div id=\"hs_cos_wrapper_main\" class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_dnd_area\"\n                style=\"color: inherit; font-size: inherit; line-height: inherit;\" data-hs-cos-general-type=\"widget\"\n                data-hs-cos-type=\"dnd_area\">\n                <div id=\"section-1\" class=\"hse-section hse-section-first\"\n                  style=\"padding-left:10px; padding-right:10px; padding-top:20px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; margin-left:auto; margin-right:auto; border-collapse:collapse; border-spacing:0; background-color:#ffffff; padding-bottom:30px;\"\n                    bgcolor=\"#ffffff\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:200px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" width=\"600\" bgcolor=\"#ffffff\">\n        <tr style=\"background-color:#ffffff;\">\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:30px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-1-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module_16873376536522\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                        <table class=\"hse-image-wrapper\" role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"\n                          style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                          <tbody>\n                            <tr>\n                              <td align=\"center\" valign=\"top\"\n                                style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; color:#23496d; word-break:break-word; text-align:center;  font-size:0px\">\n                                <img alt=\"email-header\" src=\"https://infinilabs.com/img/email/alert-header.png\"\n                                  style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; font-size:16px\"\n                                  width=\"600\" align=\"middle\">\n                              </td>\n                            </tr>\n                          </tbody>\n                        </table>\n                      </div>\n                      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"\n                        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                        <tbody>\n                          <tr>\n                            <td class=\"hs_padded\"\n                              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word; padding:10px 20px\">\n                              <div id=\"hs_cos_wrapper_module-1-0-0\"\n                                class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                                style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                                <div id=\"hs_cos_wrapper_module-1-0-0_\"\n                                  class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_rich_text\"\n                                  style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                  data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"rich_text\">\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; margin-top: 20px;margin-bottom: 20px;font-size: 24px;font-weight: 600;line-height: 29px;letter-spacing: -0.6px;color: #FF4D4F;\">{{.title}}\n                                  </p>\n                                  <div\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-bottom:20px;font-size: 14px;color: #666666;white-space: normal;font-family: PingFang SC;\">\n                                    <p>Priority: {{.priority}}</p>\n                                    <p>EventID: {{.event_id}}</p>\n                                    <p>Target: {{.resource_name}}-{{.objects}}</p>\n                                    <p style=\"margin-bottom: 20px;\">TriggerAt: {{.trigger_at | datetime}}</p>\n                                    {{.message | md_to_html}}\n                                  </div>\n                                  <p>\n                                  <div\n                                    style=\"width: 120px;height: 32px;border-radius: 5px;background-color: #1677FF;line-height: 32px;text-align: center;margin-top:0px;margin-bottom: 20px;\">\n                                    <a style=\"font-size: 14px;color: #ffffff;text-decoration: none;\" href=\"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"}}\"\n                                      target=\"_blank\">\n                                      View Detail\n                                    </a>\n                                  </div>\n                                  <div\n                                    style=\"width: 100%;height: 0px;opacity: 1;border: 1px solid #EEEEEE;margin-top: 20px;margin-bottom: 20px;\">\n                                  </div>\n                                  <div style=\"margin-top: 20px;margin-bottom: 20px;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li\n                                        style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999;\">\n                                        💡 <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_node_jvm_usage/\"\n                                          target=\"_blank\">How to monitor the JVM usage of cluster nodes </a></li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_health_change/\"\n                                          target=\"_blank\">How to monitor cluster health status </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/\"\n                                          target=\"_blank\">Learn more ... </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  <p />\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-top:30px;margin-bottom:30px;position: relative;\">\n                                  <div style=\"float: left;\">\n                                    <img alt=\"INFINI Labs\" src=\"https://www.infinilabs.com/img/header/logo.svg\"\n                                      style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; \"\n                                      width=\"160\" height=\"28\" align=\"middle\">\n                                  </div>\n                                  <div style=\"float: right;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Website\" href=\"https://infinilabs.com\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/website.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Discord\" href=\"https://discord.com/invite/4tKTMkkvVX\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/discord.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Github\" href=\"https://github.com/infinilabs\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"https://infinilabs.com/img/email/github.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  </p>\n                                </div>\n                              </div>\n                            </td>\n                          </tr>\n                        </tbody>\n                      </table>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <div id=\"section-2\" class=\"hse-section\" style=\"padding-left:10px; padding-right:10px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; width:100%; Margin-left:auto; Margin-right:auto; border-collapse:collapse; border-spacing:0; padding-bottom:20px; padding-top:20px\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:280px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\">\n        <tr>\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:20px; padding-top:20px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-2-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module-2-0-0\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                      </div>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->\n              </div>\n    </div>\n    </div>\n    </td>\n    </tr>\n    </tbody>\n    </table>\n    </div>\n  </body>\n  </html>",
    "content_type": "text/html"
  },
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/doc/cj8atf53q95lhahebg8g
{
  "id": "cj8atf53q95lhahebg8g",
  "created": "2023-08-07T16:43:40.062389175+08:00",
  "updated": "2023-08-10T12:04:42.842628127+08:00",
  "name": "[Recovery]  Email Notification",
  "type": "email",
  "sub_type": "email",
  "email": {
    "server_id": "",
    "recipients": {
      "to": [],
      "cc": []
    },
    "subject": "[INFINI Platform Alerting] {{.title}}",
    "body": "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:v=\"urn:schemas-microsoft-com:vml\" lang=\"en\"><head>\n      <title></title>\n      <meta property=\"og:title\" content=\"\">\n      <meta name=\"twitter:title\" content=\"\">\n  <meta name=\"x-apple-disable-message-reformatting\">\n  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">\n  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n      <!--[if gte mso 9]>\n    <xml>\n        <o:OfficeDocumentSettings>\n        <o:AllowPNG/>\n        <o:PixelsPerInch>96</o:PixelsPerInch>\n        </o:OfficeDocumentSettings>\n    </xml>\n    <style>\n      ul > li {\n        text-indent: -1em;\n      }\n    </style>\n  <![endif]-->\n  <!--[if mso]>\n  <style type=\"text/css\">\n   body, td {font-family: Arial, Helvetica, sans-serif;} \n   .hse-body-wrapper-table {background-color: #EAF0F6;padding: 20px 0 !important}\n  </style>\n  <![endif]-->\n    <meta name=\"generator\" content=\"HubSpot\">\n    <style type=\"text/css\">.moz-text-html .hse-column-container{max-width:600px !important;width:600px !important}\n  .moz-text-html .hse-column{display:table-cell;vertical-align:top}.moz-text-html .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  [owa] .hse-column-container{max-width:600px !important;width:600px !important}[owa] .hse-column{display:table-cell;vertical-align:top}\n  [owa] .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  @media only screen and (min-width:640px){.hse-column-container{max-width:600px !important;width:600px !important}\n  .hse-column{display:table-cell;vertical-align:top}.hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  }@media only screen and (max-width:639px){img.stretch-on-mobile,.hs_rss_email_entries_table img,.hs-stretch-cta .hs-cta-img{height:auto !important;width:100% !important}\n  .display_block_on_small_screens{display:block}.hs_padded{padding-left:20px !important;padding-right:20px !important}\n  }</style><!--<![endif]--><style type=\"text/css\">body[data-outlook-cycle] img.stretch-on-mobile,body[data-outlook-cycle] .hs_rss_email_entries_table img{height:auto !important;width:100% !important}\n  body[data-outlook-cycle] .hs_padded{padding-left:20px !important;padding-right:20px !important}\n  a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}\n  #outlook a{padding:0}.yshortcuts a{border-bottom:none !important}a{text-decoration:underline}\n  .ExternalClass{width:100%}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%}\n  p{margin:0}body{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;moz-osx-font-smoothing:grayscale}</style>\n  </head>\n  <body bgcolor=\"#EAF0F6\"\n    style=\"margin:0 !important; padding:0 !important; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n    <!--[if gte mso 9]>\n  <v:background xmlns:v=\"urn:schemas-microsoft-com:vml\" fill=\"t\">\n      <v:fill type=\"tile\" size=\"100%,100%\"  color=\"#ffffff\"/>\n  </v:background>\n  <![endif]-->\n    <div class=\"hse-body-background\" style=\"background-color:#eaf0f6\" bgcolor=\"#eaf0f6\">\n      <table role=\"presentation\" class=\"hse-body-wrapper-table\" cellpadding=\"0\" cellspacing=\"0\"\n        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; margin:0; padding:0; width:100% !important; min-width:200px !important; height:100% !important\"\n        width=\"100%\" height=\"100%\">\n        <tbody>\n          <tr>\n            <td class=\"hse-body-wrapper-td\" valign=\"top\"\n              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n              <div id=\"hs_cos_wrapper_main\" class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_dnd_area\"\n                style=\"color: inherit; font-size: inherit; line-height: inherit;\" data-hs-cos-general-type=\"widget\"\n                data-hs-cos-type=\"dnd_area\">\n                <div id=\"section-1\" class=\"hse-section hse-section-first\"\n                  style=\"padding-left:10px; padding-right:10px; padding-top:20px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; margin-left:auto; margin-right:auto; border-collapse:collapse; border-spacing:0; background-color:#ffffff; padding-bottom:30px;\"\n                    bgcolor=\"#ffffff\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:200px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" width=\"600\" bgcolor=\"#ffffff\">\n        <tr style=\"background-color:#ffffff;\">\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:30px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-1-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module_16873376536522\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                        <table class=\"hse-image-wrapper\" role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"\n                          style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                          <tbody>\n                            <tr>\n                              <td align=\"center\" valign=\"top\"\n                                style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; color:#23496d; word-break:break-word; text-align:center;  font-size:0px\">\n                                <img alt=\"email-header\" src=\"https://infinilabs.com/img/email/recovery-header.png\"\n                                  style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; font-size:16px\"\n                                  width=\"600\" align=\"middle\">\n                              </td>\n                            </tr>\n                          </tbody>\n                        </table>\n                      </div>\n                      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"\n                        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                        <tbody>\n                          <tr>\n                            <td class=\"hs_padded\"\n                              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word; padding:10px 20px\">\n                              <div id=\"hs_cos_wrapper_module-1-0-0\"\n                                class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                                style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                                <div id=\"hs_cos_wrapper_module-1-0-0_\"\n                                  class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_rich_text\"\n                                  style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                  data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"rich_text\">\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; margin-top: 20px;margin-bottom: 20px;font-size: 24px;font-weight: 600;line-height: 29px;letter-spacing: -0.6px;color: #52C41A;\">{{.title}}\n                                  </p>\n                                  <div\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-bottom:20px;font-size: 14px;color: #666666;white-space: normal;font-family: PingFang SC;\">{{.message | md_to_html}}\n                                  </div>\n                                  <p>\n                                  <div\n                                    style=\"width: 120px;height: 32px;border-radius: 5px;background-color: #1677FF;line-height: 32px;text-align: center;margin-top:0px;margin-bottom: 20px;\">\n                                    <a style=\"font-size: 14px;color: #ffffff;text-decoration: none;\" href=\"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"}}\"\n                                      target=\"_blank\">\n                                      View Detail\n                                    </a>\n                                  </div>\n                                  <div\n                                    style=\"width: 100%;height: 0px;opacity: 1;border: 1px solid #EEEEEE;margin-top: 20px;margin-bottom: 20px;\">\n                                  </div>\n                                  <div style=\"margin-top: 20px;margin-bottom: 20px;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li\n                                        style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999;\">\n                                        💡 <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_node_jvm_usage/\"\n                                          target=\"_blank\">How to monitor the JVM usage of cluster nodes </a></li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_health_change/\"\n                                          target=\"_blank\">How to monitor cluster health status </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/\"\n                                          target=\"_blank\">Learn more ... </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  <p />\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-top:30px;margin-bottom:30px;position: relative;\">\n                                  <div style=\"float: left;\">\n                                    <img alt=\"INFINI Labs\" src=\"https://www.infinilabs.com/img/header/logo.svg\"\n                                      style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; \"\n                                      width=\"160\" height=\"28\" align=\"middle\">\n                                  </div>\n                                  <div style=\"float: right;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Website\" href=\"https://infinilabs.com\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/website.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Discord\" href=\"https://discord.com/invite/4tKTMkkvVX\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/discord.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Github\" href=\"https://github.com/infinilabs\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"https://infinilabs.com/img/email/github.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  </p>\n                                </div>\n                              </div>\n                            </td>\n                          </tr>\n                        </tbody>\n                      </table>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <div id=\"section-2\" class=\"hse-section\" style=\"padding-left:10px; padding-right:10px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; width:100%; Margin-left:auto; Margin-right:auto; border-collapse:collapse; border-spacing:0; padding-bottom:20px; padding-top:20px\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:280px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\">\n        <tr>\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:20px; padding-top:20px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-2-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module-2-0-0\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                      </div>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->\n              </div>\n    </div>\n    </div>\n    </td>\n    </tr>\n    </tbody>\n    </table>\n    </div>\n  </body>\n  </html>",
    "content_type": "text/html"
  },
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/doc/ch1os6t3q95lk6lepkq0
{
   "id": "ch1os6t3q95lk6lepkq0",
   "created": "2023-04-22T07:34:51.848540351Z",
   "updated": "2023-08-10T17:18:38.592432088+08:00",
   "name": "[Alerting] Feishu Notification",
   "type": "webhook",
   "webhook": {
     "header_params": {
       "Content-Type": "application/json"
     },
     "method": "POST",
     "url": "{{$.env.FEISHU_WEBHOOK_ENDPOINT}}",
     "body": "{\n  \"msg_type\": \"interactive\",\n  \"card\": {\n      \"header\": {\n              \"title\": {\n                      \"content\": \"[ INFINI Platform Alerting ]\",\n                      \"tag\": \"plain_text\"\n              },\n              \"template\":\"{{if eq .priority \"critical\"}}red{{else if eq .priority \"high\"}}orange{{else if eq .priority \"medium\"}}yellow{{else if eq .priority \"low\"}}grey{{else}}blue{{end}}\"\n      },\n      \"elements\": [{\n              \"tag\": \"markdown\",\n              \"content\": \"🔥 Incident [#{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}) is ongoing\\n **{{.title}}**\\nPriority: {{.priority}}\\nEventID: {{.event_id}}\\nTarget: {{.resource_name}}-{{.objects}}\\nTriggerAt: {{.trigger_at | datetime}}\"\n      },{\n    \"tag\": \"hr\"\n  },\n  {\n    \"tag\": \"markdown\",\n     \"content\": \"{{ .message | str_replace \"\\n\" \"\\\\n\" }}\"\n  }\n  ]\n}\n}"
   },
   "sub_type": "feishu",
   "enabled": false
 }
POST $[[INDEX_PREFIX]]channel/doc/cj8e9s53q95gsdbb054g
{
  "id": "cj8e9s53q95gsdbb054g",
  "created": "2023-08-07T20:34:56.334695598+08:00",
  "updated": "2023-08-10T17:18:36.035896482+08:00",
  "name": "[Recovery] Feishu Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.FEISHU_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msg_type\": \"interactive\",\n  \"card\": {\n      \"header\": {\n        \"title\": {\n          \"content\": \"[ INFINI Platform Alerting ]\",\n          \"tag\": \"plain_text\"\n        },\n        \"template\":\"green\"\n      },\n      \"elements\": [\n      {\n        \"tag\": \"markdown\",\n        \"content\": \"🌈 **{{.title}}**\"\n      },\n      {\n        \"tag\": \"hr\"\n      },\n      {\n        \"tag\": \"markdown\",\n        \"content\": \"{{ .message | str_replace \"\\n\" \"\\\\n\" }}\"\n      },\n      {\n        \"tag\": \"hr\"\n      },\n      {\n        \"tag\": \"markdown\",\n        \"content\": \"[View Incident]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}})\"\n      }\n    ]\n  }\n}"
  },
  "sub_type": "feishu",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/doc/cj865st3q95rega919ig
{
  "id": "cj865st3q95rega919ig",
  "created": "2023-08-07T11:20:19.223545026+08:00",
  "updated": "2023-08-10T17:18:41.92016786+08:00",
  "name": "[Alerting] Discord Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DISCORD_WEBHOOK_ENDPOINT}}",
    "body": "{\"content\": \"**[ INFINI Platform Alerting ]**\\n🔥 Incident [#{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}) is ongoing\\n**{{.title}}**\\n\\nPriority: {{.priority}}\\nEventID: {{.event_id}}\\nTarget: {{.resource_name}}-{{.objects}}\\nTriggerAt: {{.trigger_at | datetime}}\\n{{ .message | str_replace \"\\n\" \"\\\\n\" }}\"}"
  },
  "sub_type": "discord",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/doc/cj86l0l3q95rrpfea6ug
{
  "id": "cj86l0l3q95rrpfea6ug",
  "created": "2023-08-07T11:52:34.192522006+08:00",
  "updated": "2023-08-10T17:18:44.422687739+08:00",
  "name": "[Recovery] Discord Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DISCORD_WEBHOOK_ENDPOINT}}",
    "body": "{\n    \"content\": \"**[ INFINI Platform Alerting ]**\\n🌈 **{{.title}}**\\n\\n{{.message | str_replace \"\\n\" \"\\\\n\" }}\\n> [View Incident]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}})\"\n}"
  },
  "sub_type": "discord",
  "enabled": false
}

#alerting
#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-cal8n7p7h710dpnoaps0
{
  "id": "builtin-cal8n7p7h710dpnoaps0",
  "created": "2022-06-16T01:47:11.326727124Z",
  "updated": "2023-08-09T22:39:43.98598502+08:00",
  "name": "Cluster Health Change to Red",
  "enabled": true,
  "resource": {
    "resource_id": "$[[RESOURCE_ID]]",
    "resource_name": "$[[RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
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
    "bucket_label": {
      "enabled": false
    },
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
    "enabled": true,
    "title": "Health of Clusters ({{len .results}} clusters in total) Changed to Red",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nCluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%7D) is Red now\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-07T15:02:17.165625799+08:00",
        "name": "[Alerting] Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-Type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"*Cluster:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{ index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}> is Red now\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[USERNAME]]",
    "id": "$[[USER_ID]]"
  }
}
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-calavvp7h710dpnp32r3
{
  "id": "builtin-calavvp7h710dpnp32r3",
  "created": "2022-06-16T04:22:23.001354546Z",
  "updated": "2023-08-09T22:20:17.864619426+08:00",
  "name": "Index Health Change to Red",
  "enabled": true,
  "resource": {
    "resource_id": "$[[RESOURCE_ID]]",
    "resource_name": "$[[RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_index"
    ],
    "filter": {},
    "raw_filter": {
      "match": {
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
        "limit": 50
      },
      {
        "field": "metadata.index_name",
        "limit": 1000
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
    "bucket_label": {
      "enabled": false
    },
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
    "enabled": true,
    "title": "Health of Indices ({{len .results}} indices in total) Changed to Red",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$iu := printf \"%s/#/cluster/monitor/%s/indices/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nIndex: [{{index .group_values 1}}]({{$iu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D) is Red now\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-07T15:17:26.18861218+08:00",
        "name": "[Alerting] Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/monitor/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{ lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0)}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}> is Red now\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[USERNAME]]",
    "id": "$[[USER_ID]]"
  }
}
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-cbp20n2anisjmu4gehc5
{
  "id": "builtin-cbp20n2anisjmu4gehc5",
  "created": "2022-08-09T08:52:44.63345561Z",
  "updated": "2023-08-09T22:11:45.679048697+08:00",
  "name": "Elasticsearch node left cluster",
  "enabled": true,
  "resource": {
    "resource_id": "$[[RESOURCE_ID]]",
    "resource_name": "$[[RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_node"
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
    "bucket_label": {
      "enabled": false
    },
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
    "enabled": true,
    "title": "Elasticsearch node left cluster",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$nn := lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}\n{{$nu := printf \"%s/#/cluster/monitor/%s/nodes/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nNode: [{{$nn}}]({{$nu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%2C%22node_name%22:%22{{$nn}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), Left: {{.result_value}}\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-07T10:42:17.686776304+08:00",
        "name": "Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Left: {{.result_value}}\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[USERNAME]]",
    "id": "$[[USER_ID]]"
  }
}
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-cb34sfl6psfiqtovhpt4
{
  "id": "builtin-cb34sfl6psfiqtovhpt4",
  "created": "2022-07-07T03:08:46.297166036Z",
  "updated": "2023-08-09T22:38:41.764325087+08:00",
  "name": "Too Many Deleted Documents",
  "enabled": true,
  "resource": {
    "resource_id": "$[[RESOURCE_ID]]",
    "resource_name": "$[[RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
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
        "limit": 20
      },
      {
        "field": "metadata.labels.index_name",
        "limit": 10
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
    "bucket_label": {
      "enabled": false
    },
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
      },
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "55"
        ],
        "priority": "low"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "Too Many Deleted Documents (>30%)",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$iu := printf \"%s/#/cluster/monitor/%s/indices/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nIndex: [{{index .group_values 1}}]({{$iu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), Deleted: {{.result_value | to_fixed 2}}%\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "name": "",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/monitor/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{ lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0)}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Deleted ratio: {{.result_value | to_fixed 2}}%\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "24h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[USERNAME]]",
    "id": "$[[USER_ID]]"
  }
}
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-cbp2e4ianisjmu4giqs7
{
  "id": "builtin-cbp2e4ianisjmu4giqs7",
  "created": "2022-06-16T04:11:10.242061032Z",
  "updated": "2023-08-09T22:39:15.339913317+08:00",
  "name": "Search latency is great than 500ms",
  "enabled": true,
  "resource": {
    "resource_id": "$[[RESOURCE_ID]]",
    "resource_name": "$[[RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
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
        "limit": 50
      },
      {
        "field": "metadata.labels.index_name",
        "limit": 10
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
    "bucket_label": {
      "enabled": false
    },
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
      },
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "300"
        ],
        "priority": "low"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "Search latency is great than 500ms",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$iu := printf \"%s/#/cluster/monitor/%s/indices/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nIndex: [{{index .group_values 1}}]({{$iu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), Latency: {{.result_value | to_fixed 2}}ms\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-06T15:46:34.404507399+08:00",
        "name": "Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "\n{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/monitor/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{ lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0)}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Search latency: {{.result_value | to_fixed 2}}ms\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[USERNAME]]",
    "id": "$[[USER_ID]]"
  }
}
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-calaqnh7h710dpnp2bm8
{
  "id": "builtin-calaqnh7h710dpnp2bm8",
  "created": "2022-06-16T04:11:10.242061032Z",
  "updated": "2023-08-09T22:38:55.677122718+08:00",
  "name": "JVM utilization is Too High",
  "enabled": true,
  "resource": {
    "resource_id": "$[[RESOURCE_ID]]",
    "resource_name": "$[[RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
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
    "bucket_label": {
      "enabled": false
    },
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
    "enabled": true,
    "title": "JVM Usage of Nodes ({{len .results}} nodes in total) >= {{.first_threshold}}%",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$nn := lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}\n{{$nu := printf \"%s/#/cluster/monitor/%s/nodes/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nNode: [{{$nn}}]({{$nu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%2C%22node_name%22:%22{{$nn}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), JVM Usage: {{.result_value | to_fixed 2}}%\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-06T15:46:34.404507399+08:00",
        "name": "Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, JVM Usage: {{.result_value | to_fixed 2}}%\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[USERNAME]]",
    "id": "$[[USER_ID]]"
  }
}
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-calakp97h710dpnp1fa2
{
  "id": "builtin-calakp97h710dpnp1fa2",
  "created": "2022-06-16T03:58:29.437447113Z",
  "updated": "2023-08-09T22:33:25.692835454+08:00",
  "name": "CPU utilization is Too High",
  "enabled": true,
  "resource": {
    "resource_id": "$[[RESOURCE_ID]]",
    "resource_name": "$[[RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
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
    "bucket_label": {
      "enabled": false
    },
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
    "enabled": true,
    "title": "CPU Usage of Nodes ({{len .results}} nodes in total) >= {{.first_threshold}}%",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$nn := lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}\n{{$nu := printf \"%s/#/cluster/monitor/%s/nodes/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nNode: [{{$nn}}]({{$nu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%2C%22node_name%22:%22{{$nn}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), CPU Usage: {{.result_value | to_fixed 2}}%\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-07T15:17:26.18861218+08:00",
        "name": "[Alerting] Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, CPU Usage: {{.result_value | to_fixed 2}}%\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "6h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[USERNAME]]",
    "id": "$[[USER_ID]]"
  }
}
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-calgapp7h710dpnpbeb6
{
  "id": "builtin-calgapp7h710dpnpbeb6",
  "created": "2022-06-16T10:26:47.360988761Z",
  "updated": "2023-08-09T22:37:44.038127695+08:00",
  "name": "Shard Storage >= 55G",
  "enabled": true,
  "resource": {
    "resource_id": "$[[RESOURCE_ID]]",
    "resource_name": "$[[RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
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
    "bucket_label": {
      "enabled": false
    },
    "expression": "max(payload.elasticsearch.index_stats.shard_info.store_in_bytes)"
  },
  "conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "59055800320"
        ],
        "priority": "high"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "Shard Storage >55GB in ({{len .results}} indices in total)",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$iu := printf \"%s/#/cluster/monitor/%s/indices/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nIndex: [{{index .group_values 1}}]({{$iu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), Max Shard Storage: {{.result_value | format_bytes 2}}\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-07T14:02:53.734855705+08:00",
        "name": "[Alerting] Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/monitor/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{ lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0)}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Max shard storage: {{.result_value | format_bytes 2}}\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "- EventID: {{.event_id}}\n- Target: {{.resource_name}}-{{.objects}}\n- TriggerAt: {{.trigger_at | datetime}}\n- ResolveAt: {{.timestamp | datetime}}\n- Duration: {{.duration}}",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[USERNAME]]",
    "id": "$[[USER_ID]]"
  }
}
POST $[[INDEX_PREFIX]]alert-rule/doc/builtin-cal8n7p7h710dpnogps1
{
  "id": "builtin-cal8n7p7h710dpnogps1",
  "created": "2022-06-16T03:11:01.445958361Z",
  "updated": "2023-08-10T17:16:34.900352415+08:00",
  "name": "Disk utilization is Too High",
  "enabled": true,
  "resource": {
    "resource_id": "$[[RESOURCE_ID]]",
    "resource_name": "$[[RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
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
    "bucket_label": {
      "enabled": false
    },
    "expression": "((max(payload.elasticsearch.node_stats.fs.data.total_in_bytes)-max(payload.elasticsearch.node_stats.fs.data.free_in_bytes))/max(payload.elasticsearch.node_stats.fs.data.total_in_bytes))*100"
  },
  "conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 5,
        "operator": "gte",
        "values": [
          "80"
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
    "enabled": true,
    "title": "Disk Usage of Nodes ({{len .results}} nodes in total) >= {{.first_threshold}}%",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$nn := lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}\n{{$nu := printf \"%s/#/cluster/monitor/%s/nodes/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nNode: [{{$nn}}]({{$nu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%2C%22node_name%22:%22{{$nn}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), Usage: {{.result_value | to_fixed 2}}% / Free: {{.relation_values.b | format_bytes 2}}\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "name": "",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Disk Usage: {{.result_value | to_fixed 2}}%, Free: {{.relation_values.b | format_bytes 2}}\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            },\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Document\"   \n              },\n              \"style\": \"primary\",\n              \"url\": \"https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-cluster.html#disk-based-shard-allocation\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "6h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[USERNAME]]",
    "id": "$[[USER_ID]]"
  }
}

# widget
POST $[[INDEX_PREFIX]]widget/doc/cji1sc28go5i051pl1i0
{
  "id": "cji1sc28go5i051pl1i0",
  "created": "2023-08-22T10:32:16.8356774+08:00",
  "updated": "2023-08-22T10:32:16.8356774+08:00",
  "title": "Alert Heatmap",
  "config": {
    "bucket_size": "1d",
    "color": ["#f6f7f8", "#FFC9C9", "#EB0000"],
    "series": [
      {
        "metric": {
          "formula": "a",
          "items": [
            {
              "field": "*",
              "name": "a",
              "statistic": "count"
            }
          ],
          "sort": [
            {
              "direction": "desc",
              "key": "_count"
            }
          ]
        },
        "queries": {
          "cluster_id": "infini_default_system_cluster",
          "indices": [".infini_alert-message"],
          "time_field": "created"
        },
        "type": "calendar-heatmap"
      }
    ]
  }
}
POST $[[INDEX_PREFIX]]widget/doc/cji1ttq8go5i051pl1t2
{
  "id": "cji1ttq8go5i051pl1t2",
  "created": "2023-08-22T10:35:35.5825083+08:00",
  "updated": "2023-08-22T10:35:35.5825083+08:00",
  "title": "Alert History",
  "config": {
    "bucket_size": "auto",
    "is_stack": true,
    "series": [
      {
        "metric": {
          "formula": "a",
          "items": [
            {
              "field": "*",
              "name": "a",
              "statistic": "count"
            }
          ],
          "sort": [
            {
              "direction": "desc",
              "key": "_count"
            }
          ]
        },
        "queries": {
          "cluster_id": "infini_default_system_cluster",
          "indices": [".infini_alert-history"],
          "time_field": "created"
        },
        "type": "date-histogram"
      }
    ]
  }
}
POST $[[INDEX_PREFIX]]widget/doc/cji1ttq8go5i051pl1t1
{
  "id": "cji1ttq8go5i051pl1t1",
  "created": "2023-08-22T10:35:35.5825083+08:00",
  "updated": "2023-08-22T10:35:35.5825083+08:00",
  "title": "Alert History",
  "config": {
    "bucket_size": "auto",
    "is_stack": true,
    "series": [
      {
        "metric": {
          "formula": "a",
          "groups": [
            {
              "field": "priority",
              "limit": 10
            }
          ],
          "items": [
            {
              "field": "*",
              "name": "a",
              "statistic": "count"
            }
          ],
          "sort": [
            {
              "direction": "desc",
              "key": "_count"
            }
          ]
        },
        "queries": {
          "cluster_id": "infini_default_system_cluster",
          "indices": [".infini_alert-history"],
          "time_field": "created"
        },
        "type": "date-histogram"
      }
    ]
  }
}
POST $[[INDEX_PREFIX]]widget/doc/cji1ttq8go5i051pl1t0
{
  "id": "cji1ttq8go5i051pl1t0",
  "created": "2023-08-22T10:35:35.5825083+08:00",
  "updated": "2023-08-22T10:35:35.5825083+08:00",
  "title": "Alert Timeseries",
  "config": {
    "bucket_size": "auto",
    "is_stack": true,
    "series": [
      {
        "metric": {
          "formula": "a",
          "groups": [
            {
              "field": "priority",
              "limit": 10
            }
          ],
          "items": [
            {
              "field": "*",
              "name": "a",
              "statistic": "count"
            }
          ],
          "sort": [
            {
              "direction": "desc",
              "key": "_count"
            }
          ]
        },
        "queries": {
          "cluster_id": "infini_default_system_cluster",
          "indices": [".infini_alert-message"],
          "time_field": "updated"
        },
        "type": "date-histogram"
      }
    ]
  }
}

#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]layout/doc/cg2qqh28go5jqa6vvk70
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
POST $[[INDEX_PREFIX]]layout/doc/cjo2taju2gvbh7bbsa1g
{
    "id": "cjo2taju2gvbh7bbsa1g",
    "created": "2023-06-01T14:09:46.107630717+08:00",
    "updated": "2023-08-31T15:14:55.235272773+08:00",
    "name": "🚦 Platform Overview",
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
                "drilling": {},
                "format": {},
                "group_labels": [],
                "position": {
                    "h": 4,
                    "w": 3,
                    "x": 0,
                    "y": 0
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics"
                            ],
                            "kql_filters": [],
                            "time_field": "timestamp"
                        },
                        "type": "pie"
                    }
                ],
                "title": "Health"
            },
            {
                "drilling": {},
                "format": {},
                "group_labels": [],
                "position": {
                    "h": 4,
                    "w": 3,
                    "x": 3,
                    "y": 0
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_cluster"
                            ],
                            "kql_filters": []
                        },
                        "type": "pie"
                    }
                ],
                "title": "Engines"
            },
            {
                "drilling": {},
                "format": {},
                "group_labels": [],
                "position": {
                    "h": 4,
                    "w": 3,
                    "x": 6,
                    "y": 0
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_cluster"
                            ],
                            "kql_filters": []
                        },
                        "type": "pie"
                    }
                ],
                "title": "Providers"
            },
            {
                "drilling": {},
                "format": {},
                "group_labels": [],
                "position": {
                    "h": 4,
                    "w": 3,
                    "x": 9,
                    "y": 0
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics"
                            ],
                            "kql_filters": [],
                            "time_field": "timestamp"
                        },
                        "type": "pie"
                    }
                ],
                "title": "JDK"
            },
            {
                "drilling": {},
                "format": {
                    "pattern": "0.00%",
                    "type": "percent"
                },
                "group_labels": [
                    {
                        "enabled": true,
                        "template": "[{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}] [{{index .group_values 1}}]"
                    }
                ],
                "is_layered": false,
                "is_stack": false,
                "order": "desc",
                "position": {
                    "h": 5,
                    "w": 6,
                    "x": 0,
                    "y": 4
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "name": "Disk Utilization",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics"
                            ],
                            "kql_filters": [],
                            "time_field": "timestamp"
                        },
                        "type": "column"
                    }
                ],
                "size": 10,
                "title": "Disk Utilization (Top10)"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {},
                "group_labels": [
                    {
                        "enabled": true,
                        "template": "[{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}] [{{index .group_values 1}}]"
                    }
                ],
                "is_layered": false,
                "is_percent": false,
                "position": {
                    "h": 5,
                    "w": 6,
                    "x": 6,
                    "y": 4
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics"
                            ],
                            "kql_filters": [],
                            "time_field": "timestamp"
                        },
                        "type": "area"
                    }
                ],
                "title": "JVM Utilization (Top10)"
            },
            {
                "drilling": {},
                "format": {
                    "pattern": "0.00b",
                    "type": "bytes"
                },
                "group_labels": [
                    {
                        "enabled": true,
                        "template": "[{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}] [{{index .group_values 1}}]"
                    }
                ],
                "is_layered": false,
                "is_stack": false,
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
                            ],
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics"
                            ],
                            "kql_filters": [],
                            "time_field": "timestamp"
                        },
                        "type": "column"
                    }
                ],
                "size": 10,
                "title": "Index Size (Top10)"
            },
            {
                "drilling": {},
                "format": {},
                "group_labels": [
                    {
                        "enabled": true,
                        "template": "[{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 1) }}] [{{lookup \"category=metadata, object=node, property= metadata.node_name, default=N/A\" (index .group_values 0) }}]"
                    }
                ],
                "is_layered": false,
                "is_stack": false,
                "order": "desc",
                "position": {
                    "h": 5,
                    "w": 6,
                    "x": 6,
                    "y": 9
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "groups": [
                                {
                                    "field": "metadata.labels.node_id",
                                    "limit": 50
                                },
                                {
                                    "field": "metadata.labels.cluster_id",
                                    "limit": 5
                                }
                            ],
                            "items": [
                                {
                                    "field": "payload.elasticsearch.node_stats.os.cpu.load_average.15m",
                                    "name": "a",
                                    "statistic": "max"
                                }
                            ],
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics"
                            ],
                            "kql_filters": [],
                            "time_field": "timestamp"
                        },
                        "type": "column"
                    }
                ],
                "size": 10,
                "title": "CPU Load (Top10)"
            },
            {
                "drilling": {},
                "format": {},
                "group_labels": [],
                "is_layered": false,
                "position": {
                    "h": 10,
                    "w": 12,
                    "x": 0,
                    "y": 14
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "groups": [
                                {
                                    "field": "metadata.labels.cluster_id",
                                    "limit": 50
                                },
                                {
                                    "field": "metadata.labels.index_name",
                                    "limit": 100
                                }
                            ],
                            "items": [
                                {
                                    "field": "payload.elasticsearch.index_stats.total.store.size_in_bytes",
                                    "name": "a",
                                    "statistic": "latest"
                                }
                            ],
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics"
                            ],
                            "kql_filters": [],
                            "time_field": "timestamp"
                        },
                        "type": "treemap"
                    }
                ],
                "title": "Indices Size"
            },
            {
                "drilling": {},
                "position": {
                    "h": 18,
                    "w": 12,
                    "x": 0,
                    "y": 24
                },
                "series": [
                    {
                        "type": "iframe"
                    }
                ],
                "title": "New Widget",
                "url": "https://infinilabs.com/en/"
            }
        ]
    },
    "type": "workspace",
    "is_fixed": true
}

POST $[[INDEX_PREFIX]]layout/doc/cicmg153q95ich72lo3g
{
    "id": "cicmg153q95ich72lo3g",
    "created": "2023-06-26T10:27:16.69035743Z",
    "updated": "2023-08-31T15:57:17.40068358+08:00",
    "name": "🧭 Metrics&Logging Overview ",
    "description": "",
    "creator": {
        "name": "$[[USERNAME]]",
        "id": "$[[USER_ID]]"
    },
    "view_id": "",
    "config": {
        "cols": 12,
        "globalQueries": {
            "cluster_id": "infini_default_system_cluster",
            "indices": ".infini_metrics*",
            "time_field": "timestamp"
        },
        "global_queries": {
            "cluster_id": "infini_default_system_cluster"
        },
        "row_height": 60,
        "widgets": [
            {
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "number",
                "group_mapping": {},
                "position": {
                    "h": 5,
                    "w": 12,
                    "x": 0,
                    "y": 8
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "groups": [
                                {
                                    "field": "agent.major_ip",
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
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics"
                            ],
                            "time_field": "timestamp"
                        },
                        "type": "treemap"
                    }
                ],
                "title": "Agents"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "0.00b",
                    "type": "bytes"
                },
                "group_labels": [],
                "is_percent": false,
                "position": {
                    "h": 4,
                    "w": 6,
                    "x": 0,
                    "y": 13
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "name": "In",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"host\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"network_summary\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "area"
                    },
                    {
                        "metric": {
                            "formula": "a*(-1)",
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
                            ],
                            "name": "Out",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"host\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"network_summary\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "area"
                    }
                ],
                "title": "Network Traffics"
            },
            {
                "bucket_size": "auto",
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
                            "formula": "a",
                            "items": [
                                {
                                    "field": "*",
                                    "name": "a",
                                    "statistic": "count"
                                }
                            ],
                            "name": ""
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "time_field": "timestamp"
                        },
                        "type": "line"
                    }
                ],
                "title": "Event Rates"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "0a",
                    "type": "number"
                },
                "group_labels": [],
                "position": {
                    "h": 4,
                    "w": 6,
                    "x": 6,
                    "y": 17
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "time_field": "timestamp"
                        },
                        "type": "line"
                    }
                ],
                "title": "Num of TCP Connections (Established)"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "0a",
                    "type": "number"
                },
                "group_labels": [],
                "is_percent": false,
                "position": {
                    "h": 4,
                    "w": 6,
                    "x": 0,
                    "y": 17
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "time_field": "timestamp"
                        },
                        "type": "area"
                    }
                ],
                "title": "Num of TCP Connections (All)"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {},
                "group_labels": [
                    {
                        "enabled": true,
                        "template": "[{{index .group_values 0}}] [{{index .group_values 1}}]"
                    }
                ],
                "is_layered": false,
                "is_percent": false,
                "is_stack": true,
                "position": {
                    "h": 4,
                    "w": 12,
                    "x": 0,
                    "y": 4
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "kql_filters": [],
                            "time_field": "timestamp"
                        },
                        "type": "date-histogram"
                    }
                ],
                "title": "Event Distribution"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "0.00b",
                    "type": "bytes"
                },
                "group_labels": [],
                "is_percent": false,
                "position": {
                    "h": 4,
                    "w": 6,
                    "x": 6,
                    "y": 13
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "groups": [
                                {
                                    "field": "agent.major_ip",
                                    "limit": 50
                                }
                            ],
                            "items": [
                                {
                                    "field": "payload.host.network_summary.in.dropped",
                                    "name": "a",
                                    "statistic": "derivative"
                                }
                            ],
                            "name": "Dropped (In)",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"host\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"network_summary\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "area"
                    },
                    {
                        "metric": {
                            "formula": "a*(-1)",
                            "groups": [
                                {
                                    "field": "agent.major_ip",
                                    "limit": 50
                                }
                            ],
                            "items": [
                                {
                                    "field": "payload.host.network_summary.out.dropped",
                                    "name": "a",
                                    "statistic": "derivative"
                                }
                            ],
                            "name": "Dropped (Out)",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"host\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"network_summary\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "area"
                    },
                    {
                        "metric": {
                            "formula": "a",
                            "groups": [
                                {
                                    "field": "agent.major_ip",
                                    "limit": 50
                                }
                            ],
                            "items": [
                                {
                                    "field": "payload.host.network_summary.in.errors",
                                    "name": "a",
                                    "statistic": "derivative"
                                }
                            ],
                            "name": "Error (In)",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"host\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"network_summary\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "area"
                    },
                    {
                        "metric": {
                            "formula": "a*(-1)",
                            "groups": [
                                {
                                    "field": "agent.major_ip",
                                    "limit": 50
                                }
                            ],
                            "items": [
                                {
                                    "field": "payload.host.network_summary.out.errors",
                                    "name": "a",
                                    "statistic": "derivative"
                                }
                            ],
                            "name": "Error (Out)",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"host\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"network_summary\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "area"
                    }
                ],
                "title": "Network Errors"
            }
        ]
    },
    "type": "workspace",
    "is_fixed": true
}
POST $[[INDEX_PREFIX]]layout/doc/cicmgqt3q95ich72lppg
{
    "id": "cicmgqt3q95ich72lppg",
    "created": "2023-06-26T10:28:59.145415161Z",
    "updated": "2023-08-31T16:07:52.267467029+08:00",
    "name": "🌈 INFINI Gateway",
    "description": "",
    "creator": {
        "name": "$[[USERNAME]]",
        "id": "$[[USER_ID]]"
    },
    "view_id": "",
    "config": {
        "cols": 12,
        "globalQueries": {
            "cluster_id": "infini_default_system_cluster",
            "indices": ".infini_metrics*",
            "time_field": "timestamp",
            "time_range": {
                "from": "now-30m",
                "to": "now"
            }
        },
        "global_queries": {
            "cluster_id": "infini_default_system_cluster"
        },
        "row_height": 60,
        "widgets": [
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "0a",
                    "type": "number"
                },
                "group_labels": [],
                "position": {
                    "h": 4,
                    "w": 4,
                    "x": 0,
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
                                    "field": "payload.instance.entry.my_es_entry.open_connections",
                                    "name": "a",
                                    "statistic": "max"
                                }
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"instance\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"gateway\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "line"
                    }
                ],
                "title": "Num of Connections"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "0%",
                    "type": "percent"
                },
                "group_labels": [],
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
                            "name": "Overall CPU",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
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
                            "formula": "(a + b) / c ",
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
                            "name": "Real-Time CPU",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"instance\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"gateway\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "line"
                    }
                ],
                "title": "CPU Usage"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "0.00b",
                    "type": "bytes"
                },
                "group_labels": [],
                "position": {
                    "h": 4,
                    "w": 4,
                    "x": 8,
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
                                    "field": "payload.instance.system.mem",
                                    "name": "a",
                                    "statistic": "max"
                                }
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"instance\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"gateway\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "line"
                    }
                ],
                "title": "Memory Usage"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "0a",
                    "type": "number"
                },
                "group_labels": [],
                "position": {
                    "h": 5,
                    "w": 12,
                    "x": 0,
                    "y": 4
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
                                    "field": "payload.instance.system.goroutines",
                                    "name": "a",
                                    "statistic": "max"
                                }
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"instance\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"gateway\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "line"
                    }
                ],
                "title": "Num of Goroutines"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "0a",
                    "type": "number"
                },
                "group_labels": [],
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
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"must\": [\n        {\n          \"term\": {\n            \"metadata.category\": {\n              \"value\": \"instance\"\n            }\n          }\n        },{\n          \"term\": {\n            \"metadata.name\": {\n              \"value\": \"gateway\"\n            }\n          }\n        }\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "line"
                    }
                ],
                "title": "Num of Objects"
            }
        ]
    },
    "type": "workspace",
    "is_fixed": true
}
POST $[[INDEX_PREFIX]]layout/doc/cicmh5t3q95ich72lre0
{
    "id": "cicmh5t3q95ich72lre0",
    "created": "2023-06-26T10:29:43.918937055Z",
    "updated": "2023-08-31T16:12:34.571279181+08:00",
    "name": "🎯 Cluster Overview",
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
                "drilling": {},
                "page_size": 20,
                "position": {
                    "h": 5,
                    "w": 12,
                    "x": 0,
                    "y": 10
                },
                "series": [
                    {
                        "columns": [
                            {
                                "name": "metadata.labels.cluster_name",
                                "type": "string"
                            },
                            {
                                "name": "metadata.labels.node_name",
                                "type": "string"
                            },
                            {
                                "name": "metadata.labels.index_name",
                                "type": "string"
                            },
                            {
                                "name": "metadata.labels.from",
                                "type": "string"
                            },
                            {
                                "name": "metadata.category",
                                "type": "string"
                            },
                            {
                                "name": "metadata.group",
                                "type": "string"
                            }
                        ],
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_activities"
                            ],
                            "time_field": "timestamp"
                        },
                        "type": "table"
                    }
                ],
                "title": "Activity"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {},
                "is_stack": false,
                "position": {
                    "h": 2,
                    "w": 12,
                    "x": 0,
                    "y": 8
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "items": [
                                {
                                    "field": "*",
                                    "name": "a",
                                    "statistic": "count"
                                }
                            ],
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_activities"
                            ],
                            "time_field": "timestamp"
                        },
                        "type": "date-histogram"
                    }
                ],
                "title": "Activity"
            },
            {
                "bucket_size": "auto",
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
                            "formula": "a",
                            "items": [
                                {
                                    "field": "metadata.labels.cluster_id",
                                    "name": "a",
                                    "statistic": "cardinality"
                                }
                            ],
                            "name": ""
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "time_field": "timestamp"
                        },
                        "type": "number"
                    }
                ],
                "title": "Num of Clusters"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
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
                            "formula": "a",
                            "items": [
                                {
                                    "field": "agent.major_ip",
                                    "name": "a",
                                    "statistic": "cardinality"
                                }
                            ],
                            "name": ""
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "time_field": "timestamp"
                        },
                        "type": "number"
                    }
                ],
                "title": "Num of Hosts"
            },
            {
                "drilling": {},
                "page_size": 10,
                "position": {
                    "h": 5,
                    "w": 12,
                    "x": 0,
                    "y": 3
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
                            "cluster_id": "infini_default_system_cluster",
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
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "number",
                "position": {
                    "h": 3,
                    "w": 3,
                    "x": 6,
                    "y": 0
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "items": [
                                {
                                    "field": "metadata.labels.node_id",
                                    "name": "a",
                                    "statistic": "cardinality"
                                }
                            ],
                            "name": ""
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "time_field": "timestamp"
                        },
                        "type": "number"
                    }
                ],
                "title": "Num of Nodes"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "number",
                "position": {
                    "h": 3,
                    "w": 3,
                    "x": 9,
                    "y": 0
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "items": [
                                {
                                    "field": "metadata.labels.index_name",
                                    "name": "a",
                                    "statistic": "cardinality"
                                }
                            ],
                            "name": ""
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_metrics*"
                            ],
                            "time_field": "timestamp"
                        },
                        "type": "number"
                    }
                ],
                "title": "Num of Indices"
            }
        ]
    },
    "type": "workspace",
    "is_fixed": true
}
POST $[[INDEX_PREFIX]]layout/doc/cicmhbt3q95ich72lrvg
{
    "id": "cicmhbt3q95ich72lrvg",
    "created": "2023-06-26T10:30:07.498236965Z",
    "updated": "2023-08-31T16:24:17.071274052+08:00",
    "name": "⛺️ Request Analysis",
    "description": "",
    "creator": {
        "name": "$[[USERNAME]]",
        "id": "$[[USER_ID]]"
    },
    "view_id": "",
    "config": {
        "cols": 12,
        "global_queries": {
            "cluster_id": "infini_default_system_cluster",
            "indices": [
                ".infini_requests_logging*"
            ],
            "time_field": "timestamp"
        },
        "row_height": 60,
        "widgets": [
            {
                "bucket_size": "auto",
                "data_type": "normal",
                "drilling": {},
                "formatter": "number",
                "page_size": 20,
                "position": {
                    "h": 5,
                    "w": 6,
                    "x": 6,
                    "y": 24
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "groups": [
                                {
                                    "field": "flow.from",
                                    "limit": 20
                                }
                            ],
                            "items": [
                                {
                                    "field": "*",
                                    "name": "a",
                                    "statistic": "count"
                                }
                            ],
                            "name": "Counts"
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "agg-table"
                    }
                ],
                "title": "Top Clients"
            },
            {
                "bucket_size": "auto",
                "data_type": "normal",
                "drilling": {},
                "formatter": "number",
                "page_size": 20,
                "position": {
                    "h": 5,
                    "w": 6,
                    "x": 0,
                    "y": 24
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "groups": [
                                {
                                    "field": "request.path",
                                    "limit": 20
                                }
                            ],
                            "items": [
                                {
                                    "field": "*",
                                    "name": "a",
                                    "statistic": "count"
                                }
                            ],
                            "name": "Counts"
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "agg-table"
                    }
                ],
                "title": "Top Requests"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "number",
                "position": {
                    "h": 2,
                    "w": 2,
                    "x": 6,
                    "y": 5
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "items": [
                                {
                                    "field": "*",
                                    "name": "a",
                                    "statistic": "count"
                                }
                            ],
                            "name": ""
                        },
                        "queries": {
                            "cluster_id": "infini_default_system_cluster",
                            "indices": [
                                ".infini_requests_logging*"
                            ],
                            "query": "{\n    \"bool\": {\n      \"should\": [\n        {    \"range\": {\n      \"response.status_code\": {\n        \"lt\": 200\n      }\n    }\n},   {    \"range\": {\n      \"response.status_code\": {\n        \"gte\": 400\n      }\n    }\n}\n      ]\n    }\n  }",
                            "time_field": "timestamp"
                        },
                        "type": "number"
                    }
                ],
                "title": "Invalid Requests"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "group_labels": [],
                "is_percent": true,
                "is_stack": true,
                "position": {
                    "h": 4,
                    "w": 6,
                    "x": 0,
                    "y": 11
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "groups": [
                                {
                                    "field": "response.status_code",
                                    "limit": 20
                                }
                            ],
                            "items": [
                                {
                                    "field": "*",
                                    "name": "a",
                                    "statistic": "count"
                                }
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "date-histogram"
                    }
                ],
                "title": "Response Status Codes"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "group_labels": [],
                "is_percent": true,
                "is_stack": true,
                "position": {
                    "h": 4,
                    "w": 6,
                    "x": 6,
                    "y": 11
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "groups": [
                                {
                                    "field": "response.cached",
                                    "limit": 5
                                }
                            ],
                            "items": [
                                {
                                    "field": "*",
                                    "name": "a",
                                    "statistic": "count"
                                }
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "date-histogram"
                    }
                ],
                "title": "Cache Ratio"
            },
            {
                "drilling": {},
                "formatter": "number",
                "position": {
                    "h": 2,
                    "w": 2,
                    "x": 0,
                    "y": 5
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
                "format": {
                    "pattern": "0a",
                    "type": "number"
                },
                "position": {
                    "h": 4,
                    "w": 12,
                    "x": 0,
                    "y": 15
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
                            "name": "P99",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
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
                            "name": "AVG",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
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
                            "name": "P50",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "line"
                    }
                ],
                "title": "Request Latency (ms)"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {},
                "is_stack": false,
                "position": {
                    "h": 4,
                    "w": 12,
                    "x": 0,
                    "y": 7
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "items": [
                                {
                                    "field": "*",
                                    "name": "a",
                                    "statistic": "count"
                                }
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "date-histogram"
                    }
                ],
                "title": "Request Rate"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "group_labels": [],
                "is_percent": true,
                "is_stack": true,
                "position": {
                    "h": 5,
                    "w": 12,
                    "x": 0,
                    "y": 29
                },
                "series": [
                    {
                        "metric": {
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
                                    "statistic": "avg"
                                }
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "date-histogram"
                    }
                ],
                "title": "Request Latency (group by path in ms)"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "number",
                "position": {
                    "h": 5,
                    "w": 12,
                    "x": 0,
                    "y": 19
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "groups": [
                                {
                                    "field": "request.path",
                                    "limit": 8
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
                        "type": "area"
                    }
                ],
                "title": "Request Rate (group by path)"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "number",
                "position": {
                    "h": 4,
                    "w": 2,
                    "x": 0,
                    "y": 38
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "name": ""
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "pie"
                    }
                ],
                "title": "Response Code"
            },
            {
                "drilling": {},
                "formatter": "number",
                "position": {
                    "h": 2,
                    "w": 2,
                    "x": 2,
                    "y": 5
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
                            "cluster_id": "infini_default_system_cluster",
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
                    "h": 6,
                    "w": 12,
                    "x": 0,
                    "y": 42
                },
                "series": [
                    {
                        "columns": [
                            {
                                "display": "From",
                                "name": "flow.from",
                                "type": "string"
                            },
                            {
                                "display": "Relay",
                                "name": "flow.relay",
                                "type": "string"
                            },
                            {
                                "display": "To",
                                "name": "flow.to",
                                "type": "string"
                            },
                            {
                                "display": "Method",
                                "name": "request.method",
                                "type": "string"
                            },
                            {
                                "display": "Path",
                                "name": "request.path",
                                "type": "string"
                            },
                            {
                                "display": "Status",
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
                "title": "Request Detail"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "0.00b",
                    "type": "bytes"
                },
                "is_stack": false,
                "position": {
                    "h": 4,
                    "w": 5,
                    "x": 7,
                    "y": 34
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "items": [
                                {
                                    "field": "response.body_length",
                                    "name": "a",
                                    "statistic": "sum"
                                }
                            ],
                            "name": "Sum",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "date-histogram"
                    },
                    {
                        "metric": {
                            "formula": "a",
                            "items": [
                                {
                                    "field": "response.body_length",
                                    "name": "a",
                                    "statistic": "max"
                                }
                            ],
                            "name": "Max",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "date-histogram"
                    }
                ],
                "title": "Response Size"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "0.00b",
                    "type": "bytes"
                },
                "is_stack": false,
                "position": {
                    "h": 4,
                    "w": 5,
                    "x": 2,
                    "y": 34
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "items": [
                                {
                                    "field": "request.body_length",
                                    "name": "a",
                                    "statistic": "sum"
                                }
                            ],
                            "name": "Sum",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "date-histogram"
                    },
                    {
                        "metric": {
                            "formula": "a",
                            "items": [
                                {
                                    "field": "request.body_length",
                                    "name": "a",
                                    "statistic": "max"
                                }
                            ],
                            "name": "Max",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "date-histogram"
                    }
                ],
                "title": "Request Size"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "format": {
                    "pattern": "",
                    "type": "default"
                },
                "group_labels": [],
                "is_stack": false,
                "position": {
                    "h": 4,
                    "w": 5,
                    "x": 2,
                    "y": 38
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "date-histogram"
                    }
                ],
                "title": "Request Upstreams"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "group_labels": [],
                "is_percent": true,
                "is_stack": true,
                "position": {
                    "h": 4,
                    "w": 5,
                    "x": 7,
                    "y": 38
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "date-histogram"
                    }
                ],
                "title": "Request Methods"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "number",
                "position": {
                    "h": 4,
                    "w": 2,
                    "x": 0,
                    "y": 34
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "name": ""
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "pie"
                    }
                ],
                "title": "Clients IP"
            },
            {
                "drilling": {},
                "format": {
                    "pattern": "0.00b",
                    "type": "bytes"
                },
                "position": {
                    "h": 2,
                    "w": 2,
                    "x": 10,
                    "y": 5
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "items": [
                                {
                                    "field": "response.body_length",
                                    "name": "a",
                                    "statistic": "sum"
                                }
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "number"
                    }
                ],
                "title": "Response Traffic"
            },
            {
                "drilling": {},
                "format": {
                    "pattern": "0.00b",
                    "type": "bytes"
                },
                "position": {
                    "h": 2,
                    "w": 2,
                    "x": 8,
                    "y": 5
                },
                "series": [
                    {
                        "metric": {
                            "formula": "a",
                            "items": [
                                {
                                    "field": "request.body_length",
                                    "name": "a",
                                    "statistic": "sum"
                                }
                            ],
                            "name": "",
                            "sort": [
                                {
                                    "direction": "desc",
                                    "key": "_count"
                                }
                            ]
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "number"
                    }
                ],
                "title": "Request Traffic"
            },
            {
                "drilling": {},
                "formatter": "number",
                "position": {
                    "h": 2,
                    "w": 2,
                    "x": 4,
                    "y": 5
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


