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

#alerting channel
#The `id` value is consistent with the `_id` value
POST $[[INDEX_PREFIX]]channel/_doc/cj865st3q95rega919ig
{
  "id": "cj865st3q95rega919ig",
  "created": "2023-08-07T11:20:19.223545026+08:00",
  "updated": "2023-08-08T18:42:26.506499014+08:00",
  "name": "[Alerting] Discord",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DISCORD_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"content\": \"Hello Alerting\"\n}"
  },
  "sub_type": "discord",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/_doc/cj86l0l3q95rrpfea6ug
{
  "id": "cj86l0l3q95rrpfea6ug",
  "created": "2023-08-07T11:52:34.192522006+08:00",
  "updated": "2023-08-08T18:42:30.162079286+08:00",
  "name": "[Recovery] Discord\t",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DISCORD_WEBHOOK_ENDPOINT}}",
    "body": "{\n\n}"
  },
  "sub_type": "discord",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/_doc/cgnb2nt3q95nmusjl65g
{
  "id": "cgnb2nt3q95nmusjl65g",
  "created": "2023-04-06T11:47:43.104108279Z",
  "updated": "2023-08-08T22:19:08.601341574+08:00",
  "name": "[Alerting] Slack Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing !*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.trigger_at | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"*Cluster:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{ index .group_values 0}}|{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
  },
  "sub_type": "slack",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/_doc/cj8bq8d3q95ogankugqg
{
  "id": "cj8bq8d3q95ogankugqg",
  "created": "2023-08-07T17:45:05.534408059+08:00",
  "updated": "2023-08-08T19:26:34.009668892+08:00",
  "name": "[Recovery] Slack Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*:rainbow: Alert [{{.rule_name}}] Resolved*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*ResolveAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Target:* {{.resource_name}}-{{.objects}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.trigger_at | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Duration:* {{.duration}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    },\n    {\n      \"type\": \"actions\",\n      \"elements\": [\n        {\n          \"type\": \"button\",\n          \"text\": {\n            \"type\": \"plain_text\",\n            \"text\": \"View Incident\"   \n          },\n          \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"\n        }\n      ]\n    }\n  ]\n}"
  },
  "sub_type": "slack",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/_doc/cgiospt3q95q49k3u00g
{
  "id": "cgiospt3q95q49k3u00g",
  "created": "2023-03-30T13:28:07.531263747Z",
  "updated": "2023-08-08T22:19:07.545051029+08:00",
  "name": "[Alerting] DingTalk Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DINGTALK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n    \"title\": \"{{.title}}\",\n    \"text\": \"![INFINI Platform Alerting](https://infinilabs.com/img/email/alert-header.png)\\n\\n🔥 **{{.title}}**\\n\\nIncident [{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}) is ongoing !\\n\\nPriority: {{.priority}}\\n\\nEventID: {{.event_id}}\\n\\nTarget: {{.resource_name}}-{{.objects}}\\n\\nTriggerAt: {{.trigger_at | datetime}}\\n\\n---\\n\\n{{.message}}\"\n  }\n}"
  },
  "sub_type": "dingtalk",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/_doc/cgnb2r53q95nmusjl6vg
{
  "id": "cgnb2r53q95nmusjl6vg",
  "created": "2023-04-06T11:47:56.652637309Z",
  "updated": "2023-08-08T19:49:20.312590885+08:00",
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
    "body": "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:v=\"urn:schemas-microsoft-com:vml\" lang=\"en\"><head>\n      <title></title>\n      <meta property=\"og:title\" content=\"\">\n      <meta name=\"twitter:title\" content=\"\">\n  <meta name=\"x-apple-disable-message-reformatting\">\n  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">\n  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n      <!--[if gte mso 9]>\n    <xml>\n        <o:OfficeDocumentSettings>\n        <o:AllowPNG/>\n        <o:PixelsPerInch>96</o:PixelsPerInch>\n        </o:OfficeDocumentSettings>\n    </xml>\n    <style>\n      ul > li {\n        text-indent: -1em;\n      }\n    </style>\n  <![endif]-->\n  <!--[if mso]>\n  <style type=\"text/css\">\n   body, td {font-family: Arial, Helvetica, sans-serif;} \n   .hse-body-wrapper-table {background-color: #EAF0F6;padding: 20px 0 !important}\n  </style>\n  <![endif]-->\n    <meta name=\"generator\" content=\"HubSpot\">\n    <style type=\"text/css\">.moz-text-html .hse-column-container{max-width:600px !important;width:600px !important}\n  .moz-text-html .hse-column{display:table-cell;vertical-align:top}.moz-text-html .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  [owa] .hse-column-container{max-width:600px !important;width:600px !important}[owa] .hse-column{display:table-cell;vertical-align:top}\n  [owa] .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  @media only screen and (min-width:640px){.hse-column-container{max-width:600px !important;width:600px !important}\n  .hse-column{display:table-cell;vertical-align:top}.hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  }@media only screen and (max-width:639px){img.stretch-on-mobile,.hs_rss_email_entries_table img,.hs-stretch-cta .hs-cta-img{height:auto !important;width:100% !important}\n  .display_block_on_small_screens{display:block}.hs_padded{padding-left:20px !important;padding-right:20px !important}\n  }</style><!--<![endif]--><style type=\"text/css\">body[data-outlook-cycle] img.stretch-on-mobile,body[data-outlook-cycle] .hs_rss_email_entries_table img{height:auto !important;width:100% !important}\n  body[data-outlook-cycle] .hs_padded{padding-left:20px !important;padding-right:20px !important}\n  a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}\n  #outlook a{padding:0}.yshortcuts a{border-bottom:none !important}a{text-decoration:underline}\n  .ExternalClass{width:100%}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%}\n  p{margin:0}body{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;moz-osx-font-smoothing:grayscale}</style>\n  </head>\n  <body bgcolor=\"#EAF0F6\"\n    style=\"margin:0 !important; padding:0 !important; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n    <!--[if gte mso 9]>\n  <v:background xmlns:v=\"urn:schemas-microsoft-com:vml\" fill=\"t\">\n      <v:fill type=\"tile\" size=\"100%,100%\"  color=\"#ffffff\"/>\n  </v:background>\n  <![endif]-->\n    <div class=\"hse-body-background\" style=\"background-color:#eaf0f6\" bgcolor=\"#eaf0f6\">\n      <table role=\"presentation\" class=\"hse-body-wrapper-table\" cellpadding=\"0\" cellspacing=\"0\"\n        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; margin:0; padding:0; width:100% !important; min-width:200px !important; height:100% !important\"\n        width=\"100%\" height=\"100%\">\n        <tbody>\n          <tr>\n            <td class=\"hse-body-wrapper-td\" valign=\"top\"\n              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n              <div id=\"hs_cos_wrapper_main\" class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_dnd_area\"\n                style=\"color: inherit; font-size: inherit; line-height: inherit;\" data-hs-cos-general-type=\"widget\"\n                data-hs-cos-type=\"dnd_area\">\n                <div id=\"section-1\" class=\"hse-section hse-section-first\"\n                  style=\"padding-left:10px; padding-right:10px; padding-top:20px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; margin-left:auto; margin-right:auto; border-collapse:collapse; border-spacing:0; background-color:#ffffff; padding-bottom:30px;\"\n                    bgcolor=\"#ffffff\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:200px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" width=\"600\" bgcolor=\"#ffffff\">\n        <tr style=\"background-color:#ffffff;\">\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:30px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-1-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module_16873376536522\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                        <table class=\"hse-image-wrapper\" role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"\n                          style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                          <tbody>\n                            <tr>\n                              <td align=\"center\" valign=\"top\"\n                                style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; color:#23496d; word-break:break-word; text-align:center;  font-size:0px\">\n                                <img alt=\"email-header\" src=\"https://infinilabs.com/img/email/alert-header.png\"\n                                  style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; font-size:16px\"\n                                  width=\"600\" align=\"middle\">\n                              </td>\n                            </tr>\n                          </tbody>\n                        </table>\n                      </div>\n                      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"\n                        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                        <tbody>\n                          <tr>\n                            <td class=\"hs_padded\"\n                              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word; padding:10px 20px\">\n                              <div id=\"hs_cos_wrapper_module-1-0-0\"\n                                class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                                style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                                <div id=\"hs_cos_wrapper_module-1-0-0_\"\n                                  class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_rich_text\"\n                                  style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                  data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"rich_text\">\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; margin-top: 20px;margin-bottom: 20px;font-size: 24px;font-weight: 600;line-height: 29px;letter-spacing: -0.6px;color: #FF4D4F;\">{{.title}}\n                                  </p>\n                                  <div\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-bottom:20px;font-size: 14px;color: #666666;white-space: normal;font-family: PingFang SC;\">\n                                    <p>Priority: {{.priority}}</p>\n                                    <p>EventID: {{.event_id}}</p>\n                                    <p>Target: {{.resource_name}}-{{.objects}}</p>\n                                    <p style=\"margin-bottom: 20px;\">TriggerAt: {{.trigger_at | datetime}}</p>\n                                    {{.message | md_to_html}}\n                                  </div>\n                                  <p>\n                                  <div\n                                    style=\"width: 120px;height: 32px;border-radius: 5px;background-color: #1677FF;line-height: 32px;text-align: center;margin-top:0px;margin-bottom: 20px;\">\n                                    <a style=\"font-size: 14px;color: #ffffff;text-decoration: none;\" href=\"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"}}\"\n                                      target=\"_blank\">\n                                      View Detail\n                                    </a>\n                                  </div>\n                                  <div\n                                    style=\"width: 100%;height: 0px;opacity: 1;border: 1px solid #EEEEEE;margin-top: 20px;margin-bottom: 20px;\">\n                                  </div>\n                                  <div style=\"margin-top: 20px;margin-bottom: 20px;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li\n                                        style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999;\">\n                                        💡 <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_node_jvm_usage/\"\n                                          target=\"_blank\">How to monitor the JVM usage of cluster nodes </a></li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_health_change/\"\n                                          target=\"_blank\">How to monitor cluster health status </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/\"\n                                          target=\"_blank\">Learn more ... </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  <p />\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-top:30px;margin-bottom:30px;position: relative;\">\n                                  <div style=\"float: left;\">\n                                    <img alt=\"INFINI Labs\" src=\"https://www.infinilabs.com/img/header/logo.svg\"\n                                      style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; \"\n                                      width=\"160\" height=\"28\" align=\"middle\">\n                                  </div>\n                                  <div style=\"float: right;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Website\" href=\"https://infinilabs.com\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/website.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Discord\" href=\"https://discord.com/invite/4tKTMkkvVX\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/discord.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Github\" href=\"https://github.com/infinilabs\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"https://infinilabs.com/img/email/github.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  </p>\n                                </div>\n                              </div>\n                            </td>\n                          </tr>\n                        </tbody>\n                      </table>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <div id=\"section-2\" class=\"hse-section\" style=\"padding-left:10px; padding-right:10px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; width:100%; Margin-left:auto; Margin-right:auto; border-collapse:collapse; border-spacing:0; padding-bottom:20px; padding-top:20px\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:280px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\">\n        <tr>\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:20px; padding-top:20px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-2-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module-2-0-0\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                      </div>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->\n              </div>\n    </div>\n    </div>\n    </td>\n    </tr>\n    </tbody>\n    </table>\n    </div>\n  </body>\n  </html>",
     "content_type": "text/html"
  },
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/_doc/ch1os6t3q95lk6lepkq0
{
  "id": "ch1os6t3q95lk6lepkq0",
  "created": "2023-04-22T07:34:51.848540351Z",
  "updated": "2023-08-09T09:29:26.412223281+08:00",
  "name": "[Alerting] Feishu Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.FEISHU_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msg_type\": \"interactive\",\n  \"card\": {\n      \"header\": {\n              \"title\": {\n                      \"content\": \"[ INFINI Platform Alerting ]\",\n                      \"tag\": \"plain_text\"\n              },\n              \"template\":\"{{if eq .priority \"critical\"}}red{{else if eq .priority \"high\"}}orange{{else if eq .priority \"medium\"}}yellow{{else if eq .priority \"low\"}}grey{{else}}blue{{end}}\"\n      },\n      \"elements\": [{\n              \"tag\": \"markdown\",\n              \"content\": \"🔥 Incident [#{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}) is ongoing ! \\n **{{.title}}**\\nPriority: {{.priority}}\\nEventID: {{.event_id}}\\nTarget: {{.resource_name}}-{{.objects}}\\nTriggerAt: {{.trigger_at | datetime}}\"\n      },{\n    \"tag\": \"hr\"\n  },\n  {\n    \"tag\": \"markdown\",\n     \"content\": \"{{ .message | str_replace \"\\n\" \"\\\\n\" }}\"\n  }\n  ]\n}\n}"
  },
  "sub_type": "feishu",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/_doc/cj8e9s53q95gsdbb054g
{
  "id": "cj8e9s53q95gsdbb054g",
  "created": "2023-08-07T20:34:56.334695598+08:00",
  "updated": "2023-08-08T21:34:50.261294305+08:00",
  "name": "[Recovery] Feishu Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.FEISHU_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msg_type\": \"interactive\",\n  \"card\": {\n      \"header\": {\n              \"title\": {\n                      \"content\": \"[ INFINI Platform Alerting ]\",\n                      \"tag\": \"plain_text\"\n              },\n              \"template\":\"green\"\n      },\n      \"elements\": [\n                  {\n                  \"tag\": \"markdown\",\n                  \"content\": \"🌈 **{{.title}}**\"\n                  },\n                  {\n                  \"tag\": \"hr\"\n                  },\n                  {\n                    \"tag\": \"markdown\",\n                     \"content\": \"{{ .message | str_replace \"\\n\" \"\\\\n\" }}\"\n                  }\n              ]\n          }\n}"
  },
  "sub_type": "feishu",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/_doc/cj8ctat3q95l9ebbntlg
 {
  "id": "cj8ctat3q95l9ebbntlg",
  "created": "2023-08-07T18:59:55.28732241+08:00",
  "updated": "2023-08-08T19:46:30.557046793+08:00",
  "name": "[Recovery] DingTalk Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DINGTALK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n    \"title\": \"{{.title}}\",\n    \"text\": \"![INFINI Platform Alerting](https://infinilabs.com/img/email/recovery-header.png)\\n\\n🌈 **{{.title}}**\\n\\n{{.message}}\\n\\n> [View Incident]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}})\"\n  }\n}\n"
  },
  "sub_type": "dingtalk",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/_doc/cgnb2kt3q95nmusjl64g
{
  "id": "cgnb2kt3q95nmusjl64g",
  "created": "2023-04-06T11:47:31.161587662Z",
  "updated": "2023-08-08T22:19:06.712911427+08:00",
  "name": "[Alerting] Wechat Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.WECOM_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n      \"content\": \"**[ INFINI Platform Alerting ]**\\n🔥 Incident [#{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}) is ongoing !\\n**{{.title}}**\\nPriority: {{.priority}}\\n\\nEventID: {{.event_id}}\\n\\nTarget: {{.resource_name}}-{{.objects}}\\n\\nTriggerAt: {{.trigger_at | datetime}}\\n{{.message}}\"\n  }\n}"
  },
  "sub_type": "wechat",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/_doc/cj8e9gt3q95gsdbb0170
{
  "id": "cj8e9gt3q95gsdbb0170",
  "created": "2023-08-07T20:34:11.998953512+08:00",
  "updated": "2023-08-08T19:47:08.270014715+08:00",
  "name": "[Recovery] Wechat Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.WECOM_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n    \"content\": \"**[ INFINI Platform Alerting ]**\\n🌈 **{{.title}}**\\n\\n{{.message}}\\n\\n> [View Incident]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}})\"\n  }\n}\n"
  },
  "sub_type": "wechat",
  "enabled": false
}
POST $[[INDEX_PREFIX]]channel/_doc/cj8atf53q95lhahebg8g
{
  "id": "cj8atf53q95lhahebg8g",
  "created": "2023-08-07T16:43:40.062389175+08:00",
  "updated": "2023-08-08T19:50:15.803258835+08:00",
  "name": "[Recovery]  Email Notification",
  "type": "email",
  "sub_type": "email",
  "email": {
    "server_id": "",
    "recipients": {
      "to": [],
      "cc": []
    },
    "subject": "[INFINI Platform Alerting] 🌈 {{.title}}",
    "body": "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:v=\"urn:schemas-microsoft-com:vml\" lang=\"en\"><head>\n      <title></title>\n      <meta property=\"og:title\" content=\"\">\n      <meta name=\"twitter:title\" content=\"\">\n  <meta name=\"x-apple-disable-message-reformatting\">\n  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">\n  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n      <!--[if gte mso 9]>\n    <xml>\n        <o:OfficeDocumentSettings>\n        <o:AllowPNG/>\n        <o:PixelsPerInch>96</o:PixelsPerInch>\n        </o:OfficeDocumentSettings>\n    </xml>\n    <style>\n      ul > li {\n        text-indent: -1em;\n      }\n    </style>\n  <![endif]-->\n  <!--[if mso]>\n  <style type=\"text/css\">\n   body, td {font-family: Arial, Helvetica, sans-serif;} \n   .hse-body-wrapper-table {background-color: #EAF0F6;padding: 20px 0 !important}\n  </style>\n  <![endif]-->\n    <meta name=\"generator\" content=\"HubSpot\">\n    <style type=\"text/css\">.moz-text-html .hse-column-container{max-width:600px !important;width:600px !important}\n  .moz-text-html .hse-column{display:table-cell;vertical-align:top}.moz-text-html .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  [owa] .hse-column-container{max-width:600px !important;width:600px !important}[owa] .hse-column{display:table-cell;vertical-align:top}\n  [owa] .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  @media only screen and (min-width:640px){.hse-column-container{max-width:600px !important;width:600px !important}\n  .hse-column{display:table-cell;vertical-align:top}.hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  }@media only screen and (max-width:639px){img.stretch-on-mobile,.hs_rss_email_entries_table img,.hs-stretch-cta .hs-cta-img{height:auto !important;width:100% !important}\n  .display_block_on_small_screens{display:block}.hs_padded{padding-left:20px !important;padding-right:20px !important}\n  }</style><!--<![endif]--><style type=\"text/css\">body[data-outlook-cycle] img.stretch-on-mobile,body[data-outlook-cycle] .hs_rss_email_entries_table img{height:auto !important;width:100% !important}\n  body[data-outlook-cycle] .hs_padded{padding-left:20px !important;padding-right:20px !important}\n  a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}\n  #outlook a{padding:0}.yshortcuts a{border-bottom:none !important}a{text-decoration:underline}\n  .ExternalClass{width:100%}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%}\n  p{margin:0}body{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;moz-osx-font-smoothing:grayscale}</style>\n  </head>\n  <body bgcolor=\"#EAF0F6\"\n    style=\"margin:0 !important; padding:0 !important; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n    <!--[if gte mso 9]>\n  <v:background xmlns:v=\"urn:schemas-microsoft-com:vml\" fill=\"t\">\n      <v:fill type=\"tile\" size=\"100%,100%\"  color=\"#ffffff\"/>\n  </v:background>\n  <![endif]-->\n    <div class=\"hse-body-background\" style=\"background-color:#eaf0f6\" bgcolor=\"#eaf0f6\">\n      <table role=\"presentation\" class=\"hse-body-wrapper-table\" cellpadding=\"0\" cellspacing=\"0\"\n        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; margin:0; padding:0; width:100% !important; min-width:200px !important; height:100% !important\"\n        width=\"100%\" height=\"100%\">\n        <tbody>\n          <tr>\n            <td class=\"hse-body-wrapper-td\" valign=\"top\"\n              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n              <div id=\"hs_cos_wrapper_main\" class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_dnd_area\"\n                style=\"color: inherit; font-size: inherit; line-height: inherit;\" data-hs-cos-general-type=\"widget\"\n                data-hs-cos-type=\"dnd_area\">\n                <div id=\"section-1\" class=\"hse-section hse-section-first\"\n                  style=\"padding-left:10px; padding-right:10px; padding-top:20px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; margin-left:auto; margin-right:auto; border-collapse:collapse; border-spacing:0; background-color:#ffffff; padding-bottom:30px;\"\n                    bgcolor=\"#ffffff\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:200px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" width=\"600\" bgcolor=\"#ffffff\">\n        <tr style=\"background-color:#ffffff;\">\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:30px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-1-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module_16873376536522\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                        <table class=\"hse-image-wrapper\" role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"\n                          style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                          <tbody>\n                            <tr>\n                              <td align=\"center\" valign=\"top\"\n                                style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; color:#23496d; word-break:break-word; text-align:center;  font-size:0px\">\n                                <img alt=\"email-header\" src=\"https://infinilabs.com/img/email/recovery-header.png\"\n                                  style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; font-size:16px\"\n                                  width=\"600\" align=\"middle\">\n                              </td>\n                            </tr>\n                          </tbody>\n                        </table>\n                      </div>\n                      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"\n                        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                        <tbody>\n                          <tr>\n                            <td class=\"hs_padded\"\n                              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word; padding:10px 20px\">\n                              <div id=\"hs_cos_wrapper_module-1-0-0\"\n                                class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                                style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                                <div id=\"hs_cos_wrapper_module-1-0-0_\"\n                                  class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_rich_text\"\n                                  style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                  data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"rich_text\">\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; margin-top: 20px;margin-bottom: 20px;font-size: 24px;font-weight: 600;line-height: 29px;letter-spacing: -0.6px;color: #52C41A;\">🌈 {{.title}}\n                                  </p>\n                                  <div\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-bottom:20px;font-size: 14px;color: #666666;white-space: normal;font-family: PingFang SC;\">{{.message | md_to_html}}\n                                  </div>\n                                  <p>\n                                  <div\n                                    style=\"width: 120px;height: 32px;border-radius: 5px;background-color: #1677FF;line-height: 32px;text-align: center;margin-top:0px;margin-bottom: 20px;\">\n                                    <a style=\"font-size: 14px;color: #ffffff;text-decoration: none;\" href=\"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"}}\"\n                                      target=\"_blank\">\n                                      View Detail\n                                    </a>\n                                  </div>\n                                  <div\n                                    style=\"width: 100%;height: 0px;opacity: 1;border: 1px solid #EEEEEE;margin-top: 20px;margin-bottom: 20px;\">\n                                  </div>\n                                  <div style=\"margin-top: 20px;margin-bottom: 20px;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li\n                                        style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999;\">\n                                        💡 <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_node_jvm_usage/\"\n                                          target=\"_blank\">How to monitor the JVM usage of cluster nodes </a></li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_health_change/\"\n                                          target=\"_blank\">How to monitor cluster health status </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/\"\n                                          target=\"_blank\">Learn more ... </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  <p />\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-top:30px;margin-bottom:30px;position: relative;\">\n                                  <div style=\"float: left;\">\n                                    <img alt=\"INFINI Labs\" src=\"https://www.infinilabs.com/img/header/logo.svg\"\n                                      style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; \"\n                                      width=\"160\" height=\"28\" align=\"middle\">\n                                  </div>\n                                  <div style=\"float: right;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Website\" href=\"https://infinilabs.com\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/website.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Discord\" href=\"https://discord.com/invite/4tKTMkkvVX\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/discord.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Github\" href=\"https://github.com/infinilabs\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"https://infinilabs.com/img/email/github.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  </p>\n                                </div>\n                              </div>\n                            </td>\n                          </tr>\n                        </tbody>\n                      </table>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <div id=\"section-2\" class=\"hse-section\" style=\"padding-left:10px; padding-right:10px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; width:100%; Margin-left:auto; Margin-right:auto; border-collapse:collapse; border-spacing:0; padding-bottom:20px; padding-top:20px\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:280px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\">\n        <tr>\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:20px; padding-top:20px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-2-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module-2-0-0\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                      </div>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->\n              </div>\n    </div>\n    </div>\n    </td>\n    </tr>\n    </tbody>\n    </table>\n    </div>\n  </body>\n  </html>",
    "content_type": "text/html"
  },
  "enabled": false
}

#alerting
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-calgapp7h710dpnpbeb6
{
  "id": "builtin-calgapp7h710dpnpbeb6",
  "created": "2022-06-16T10:26:47.360988761Z",
  "updated": "2023-08-09T09:44:58.584645596+08:00",
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
    "message": "{{range .results}}\nIndex: [{{index .group_values 1}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22}) of Cluster: [{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}), Max Shard Storage: {{.result_value | format_bytes 2}}\n{{end}}",
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
          "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Max shard storage: {{.result_value | format_bytes 2}}\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
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
  "recovery_notification_config": {
    "enabled": true,
    "title": "Alert [{{.rule_name}}] Resolved",
    "message": "- EventID: {{.event_id}}\n- Target: {{.resource_name}}-{{.objects}}\n- TriggerAt: {{.trigger_at}}\n- ResolveAt: {{.timestamp | datetime}}\n- Duration: {{.duration}}",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-cb34sfl6psfiqtovhpt4
{
  "id": "builtin-cb34sfl6psfiqtovhpt4",
  "created": "2022-07-07T03:08:46.297166036Z",
  "updated": "2023-08-09T09:45:34.123901475+08:00",
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
    "message": "{{range .results}}\nIndex: [{{index .group_values 1}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22}) of Cluster: [{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}/), Deleted: {{.result_value | to_fixed 2}}%\n{{end}}",
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
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Deleted ratio: {{.result_value | to_fixed 2}}%\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
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
  "recovery_notification_config": {
    "enabled": true,
    "title": "Alert [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
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

POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-cbp20n2anisjmu4gehc5
{
  "id": "builtin-cbp20n2anisjmu4gehc5",
  "created": "2022-08-09T08:52:44.63345561Z",
  "updated": "2023-08-09T09:43:37.945659792+08:00",
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
    "message": "{{range .results}}\nNode: [{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22}) of Cluster:  [{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}/), Left: {{.result_value}}\n{{end}}",
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
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Left: {{.result_value}}\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
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
  "recovery_notification_config": {
    "enabled": true,
    "title": "Alert [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-calavvp7h710dpnp32r3
{
  "id": "builtin-calavvp7h710dpnp32r3",
  "created": "2022-06-16T04:22:23.001354546Z",
  "updated": "2023-08-09T09:43:58.551403706+08:00",
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
    "message": "{{range .results}}\nIndex: [{{index .group_values 1}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22}) of Cluster: [{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}) is Red now\n{{end}}",
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
          "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}> is Red now\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
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
  "recovery_notification_config": {
    "enabled": true,
    "title": "Alert [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-cbp2e4ianisjmu4giqs7
{
  "id": "builtin-cbp2e4ianisjmu4giqs7",
  "created": "2022-06-16T04:11:10.242061032Z",
  "updated": "2023-08-09T09:44:31.495696286+08:00",
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
    "message": "{{range .results}}\nIndex: [{{index .group_values 1}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22}) of Cluster: [{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}), Latency: {{.result_value | to_fixed 2}}ms\n{{end}}",
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
          "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
          "body": "\n{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/overview/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22cluster_name%22:%22{{ index .group_values 0}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Search latency: {{.result_value | to_fixed 2}}ms\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
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
  "recovery_notification_config": {
    "enabled": true,
    "title": "Alert [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-calaqnh7h710dpnp2bm8
{
  "id": "builtin-calaqnh7h710dpnp2bm8",
  "created": "2022-06-16T04:11:10.242061032Z",
  "updated": "2023-08-09T09:46:34.428920151+08:00",
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
    "message": "{{range .results}}\nNode: [{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{index .group_values 0}}/nodes/{{index .group_values 1}}) of Cluster:  [{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}/), JVM Usage: {{.result_value | to_fixed 2}}%\n{{end}}",
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
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, JVM Usage: {{.result_value | to_fixed 2}}%\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
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
  "recovery_notification_config": {
    "enabled": true,
    "title": "Alert [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-calakp97h710dpnp1fa2
{
  "id": "builtin-calakp97h710dpnp1fa2",
  "created": "2022-06-16T03:58:29.437447113Z",
  "updated": "2023-08-09T09:42:57.901272952+08:00",
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
          "85"
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
    "message": "{{range .results}}\nNode: [{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22}) of Cluster:  [{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}/), CPU Usage: {{.result_value | to_fixed 2}}%\n{{end}}",
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
          "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, CPU Usage: {{.result_value | to_fixed 2}}%\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
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
  "recovery_notification_config": {
    "enabled": true,
    "title": "Alert [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-cal8n7p7h710dpnogps1
{
  "id": "builtin-cal8n7p7h710dpnogps1",
  "created": "2022-06-16T03:11:01.445958361Z",
  "updated": "2023-08-09T09:43:16.31964237+08:00",
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
    "message": "{{range .results}}\nNode: [{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22}) of Cluster:  [{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}/), Usage: {{.result_value | to_fixed 2}}% / Free: {{.relation_values.b | format_bytes 2}}\n{{end}}",
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
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Disk Usage: {{.result_value | to_fixed 2}}%, Free: {{.relation_values.b | format_bytes 2}}\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"\n            },\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Document\"   \n              },\n              \"style\": \"primary\",\n              \"url\": \"https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-cluster.html#disk-based-shard-allocation\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
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
  "recovery_notification_config": {
    "enabled": true,
    "title": "Alert [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
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
POST $[[INDEX_PREFIX]]alert-rule/_doc/builtin-cal8n7p7h710dpnoaps0
{
  "id": "builtin-cal8n7p7h710dpnoaps0",
  "created": "2022-06-16T01:47:11.326727124Z",
  "updated": "2023-08-09T09:50:05.833535441+08:00",
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
    "message": "{{range .results}}\nCluster: [{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}/) is Red now\n{{end}}",
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
          "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"*Cluster:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{ index .group_values 0}}|{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}> is Red now\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/alert/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
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
  "recovery_notification_config": {
    "enabled": true,
    "title": "Alert [{{.rule_name}}] Resolved",
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

POST $[[INDEX_PREFIX]]layout/_doc/cgjqcg53q95r17vbfo10
{
    "id": "cgjqcg53q95r17vbfo10",
    "created": "2023-04-01T03:34:24.919282378Z",
    "updated": "2023-06-09T04:22:26.203616458Z",
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
                "bucket_size": "auto",
                "drilling": {},
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
                            "name": ""
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
                "title": "Num of Connections"
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
                "title": "CPU Usage"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
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
                            "name": ""
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
                "title": "Memory Usage"
            },
            {
                "bucket_size": "auto",
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
                            "name": ""
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
                "title": "Num of Goroutines"
            },
            {
                "bucket_size": "auto",
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
                            "name": ""
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
                "title": "Num of Objects"
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
    "updated": "2023-06-09T04:24:25.571565005Z",
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
            "cluster_id": "$[[RESOURCE_ID]]",
            "indices": ".infini_metrics*",
            "time_field": "timestamp"
        },
        "global_queries": {},
        "row_height": 60,
        "widgets": [
            {
                "bucket_size": "auto",
                "drilling": {},
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
                            "name": "In"
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
                            "name": "Out"
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
                            "cluster_id": "$[[RESOURCE_ID]]",
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
                "formatter": "number",
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
                            "name": ""
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
                "title": "Num of TCP Connections (Established)"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
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
                            "name": ""
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
                "title": "Num of TCP Connections (All)"
            },
            {
                "bucket_size": "auto",
                "data_type": "timeseries",
                "drilling": {},
                "formatter": "number",
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
                            "name": ""
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
                "title": "Event Distribution"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "bytes",
                "position": {
                    "h": 4,
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
                            "name": "Dropped (In)"
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
                            "name": "Dropped (Out)"
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
                            "name": "Error (In)"
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
                            "name": "Error (Out)"
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
                "title": "Network Errors"
            }
        ]
    },
    "type": "workspace",
    "is_fixed": true
}

POST $[[INDEX_PREFIX]]layout/_doc/cgjoqud3q95rinbbe1l0
{
    "id": "cgjoqud3q95rinbbe1l0",
    "created": "2023-04-01T01:48:41.54255458Z",
    "updated": "2023-06-09T10:29:40.625629191Z",
    "name": "🚦 Platform Overview",
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
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "number",
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
                            "name": ""
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
                "title": "JDK"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "number",
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
                            "name": ""
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
                "title": "Health"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "number",
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
                            "name": ""
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
                "title": "Providers"
            },
            {
                "bucket_size": "auto",
                "drilling": {},
                "formatter": "number",
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
                            "name": ""
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
                "title": "Engines"
            },
            {
                "bucket_size": "auto",
                "data_type": "normal",
                "drilling": {},
                "formatter": "number",
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
                                }
                            ],
                            "items": [
                                {
                                    "field": "payload.elasticsearch.node_stats.os.cpu.load_average.15m",
                                    "name": "a",
                                    "statistic": "max"
                                }
                            ],
                            "name": ""
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
                "title": "CPU Load (Top10)"
            },
            {
                "bucket_size": "auto",
                "data_type": "normal",
                "drilling": {},
                "formatter": "percent",
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
                            "name": ""
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
                "title": "Disk Utilization (Top10)"
            },
            {
                "bucket_size": "auto",
                "data_type": "timeseries",
                "drilling": {},
                "formatter": "percent",
                "is_stack": false,
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
                            "name": ""
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
                "title": "JVM Utilization (Top10)"
            },
            {
                "bucket_size": "auto",
                "data_type": "normal",
                "drilling": {},
                "formatter": "bytes",
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
                            "name": ""
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
                "title": "Index Size (Top10)"
            }
        ]
    },
    "type": "workspace",
    "is_fixed": true
}

POST $[[INDEX_PREFIX]]layout/_doc/chnmaht3q95ph02nfpsg
{
    "id": "chnmaht3q95ph02nfpsg",
    "created": "2023-05-25T13:40:23.821091313Z",
    "updated": "2023-06-09T04:24:11.554550142Z",
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
                "title": "Request Latency (ms)"
            },
            {
                "bucket_size": "auto",
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
                            "indices": []
                        },
                        "type": "area"
                    }
                ],
                "title": "Request Rate"
            },
            {
                "bucket_size": "auto",
                "data_type": "timeseries",
                "drilling": {},
                "formatter": "number",
                "is_stack": false,
                "position": {
                    "h": 5,
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
                            "name": ""
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "column"
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
                    "y": 9
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
                "bucket_size": "auto",
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
                "title": "Request Detail"
            },
            {
                "bucket_size": "auto",
                "data_type": "timeseries",
                "drilling": {},
                "formatter": "bytes",
                "is_stack": false,
                "position": {
                    "h": 4,
                    "w": 5,
                    "x": 7,
                    "y": 19
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "name": ""
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "column"
                    }
                ],
                "title": "Response Size"
            },
            {
                "bucket_size": "auto",
                "data_type": "timeseries",
                "drilling": {},
                "formatter": "bytes",
                "is_stack": false,
                "position": {
                    "h": 4,
                    "w": 5,
                    "x": 2,
                    "y": 19
                },
                "series": [
                    {
                        "metric": {
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
                            ],
                            "name": ""
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "column"
                    }
                ],
                "title": "Request Size"
            },
            {
                "bucket_size": "auto",
                "data_type": "timeseries",
                "drilling": {},
                "formatter": "number",
                "is_stack": false,
                "position": {
                    "h": 4,
                    "w": 5,
                    "x": 2,
                    "y": 23
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
                            "name": ""
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "column"
                    }
                ],
                "title": "Request Upstreams"
            },
            {
                "bucket_size": "auto",
                "data_type": "timeseries",
                "drilling": {},
                "formatter": "number",
                "is_stack": false,
                "position": {
                    "h": 4,
                    "w": 5,
                    "x": 7,
                    "y": 23
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
                            "name": ""
                        },
                        "queries": {
                            "indices": []
                        },
                        "type": "column"
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
                    "y": 19
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
                "bucket_size": "auto",
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
                            "formula": "a",
                            "items": [
                                {
                                    "field": "response.body_length",
                                    "name": "a",
                                    "statistic": "sum"
                                }
                            ],
                            "name": ""
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
                "bucket_size": "auto",
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
                            "formula": "a",
                            "items": [
                                {
                                    "field": "request.body_length",
                                    "name": "a",
                                    "statistic": "sum"
                                }
                            ],
                            "name": ""
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


