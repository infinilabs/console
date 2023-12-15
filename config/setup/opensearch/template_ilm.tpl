PUT _template/$[[SETUP_TEMPLATE_NAME]]
{
    "index_patterns": [
      "$[[SETUP_INDEX_PREFIX]]*"
    ],
    "order": 0,
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
DELETE _plugins/_ism/policies/ilm_$[[SETUP_INDEX_PREFIX]]metrics-30days-retention
PUT _plugins/_ism/policies/ilm_$[[SETUP_INDEX_PREFIX]]metrics-30days-retention
{
  "policy": {
    "description": "infini metrics hot delete workflow",
    "default_state": "hot",
    "ism_template": {
      "index_patterns": ["$[[SETUP_INDEX_PREFIX]]metrics*", "$[[SETUP_INDEX_PREFIX]]logs*","$[[SETUP_INDEX_PREFIX]]requests_logging*","$[[SETUP_INDEX_PREFIX]]async_bulk_results*","$[[SETUP_INDEX_PREFIX]]alert-history*","$[[SETUP_INDEX_PREFIX]]activities*"],
      "priority": 100
    },
    "states": [
      {
        "name": "hot",
        "actions": [
          {
            "rollover": {
              "min_index_age": "30d",
              "min_size": "50gb"
            }
          },
          {
            "index_priority": {
              "priority": 100
            }
          }
        ],
        "transitions": [
          {
            "state_name": "delete",
            "conditions": {
              "min_index_age": "30d"
            }
          }
        ]
      },
      {
        "name": "delete",
        "actions": [
          {
            "delete": {}
          }
        ]
      }
    ]
  }
}

PUT _template/$[[SETUP_INDEX_PREFIX]]metrics-rollover
{
  "order": 100,
  "index_patterns": ["$[[SETUP_INDEX_PREFIX]]metrics*"],
   "settings": {
    "index":{
        "codec" : "best_compression",
        "number_of_shards" : "1",
        "translog.durability":"async"
    },
    "plugins.index_state_management.rollover_alias": "$[[SETUP_INDEX_PREFIX]]metrics"
   }
}

PUT $[[SETUP_INDEX_PREFIX]]metrics-00001
{
  "settings": {
    "refresh_interval": "5s"
  },
  "aliases":{
    "$[[SETUP_INDEX_PREFIX]]metrics":{
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
POST _plugins/_ism/add/$[[SETUP_INDEX_PREFIX]]metrics-00001
{
  "policy_id": "ilm_$[[SETUP_INDEX_PREFIX]]metrics-30days-retention"
}

PUT /_template/$[[SETUP_INDEX_PREFIX]]logs-rollover
{
  "order": 100000,
  "index_patterns": [
    "$[[SETUP_INDEX_PREFIX]]logs*"
  ],
    "settings": {
      "plugins.index_state_management.rollover_alias": "$[[SETUP_INDEX_PREFIX]]logs",
      "codec": "best_compression",
      "number_of_shards": "1",
      "translog": {
        "durability": "async"
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

PUT $[[SETUP_INDEX_PREFIX]]logs-00001
{
  "settings": {
    "refresh_interval": "5s"
  },
  "aliases":{
    "$[[SETUP_INDEX_PREFIX]]logs":{
      "is_write_index":true
    }
  }
}
POST _plugins/_ism/add/$[[SETUP_INDEX_PREFIX]]logs-00001
{
  "policy_id": "ilm_$[[SETUP_INDEX_PREFIX]]metrics-30days-retention"
}


PUT _template/$[[SETUP_INDEX_PREFIX]]requests_logging-rollover
{
  "order": 100000,
  "index_patterns": [
    "$[[SETUP_INDEX_PREFIX]]requests_logging*"
  ],
    "settings": {
      "plugins.index_state_management.rollover_alias": "$[[SETUP_INDEX_PREFIX]]requests_logging",
      "codec": "best_compression",
      "number_of_shards": "1",
      "translog": {
        "durability": "async"
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

PUT $[[SETUP_INDEX_PREFIX]]requests_logging-00001
{
  "settings": {
    "refresh_interval": "5s"
  },
  "aliases":{
    "$[[SETUP_INDEX_PREFIX]]requests_logging":{
      "is_write_index":true
    }
  }
}

POST _plugins/_ism/add/$[[SETUP_INDEX_PREFIX]]requests_logging-00001
{
  "policy_id": "ilm_$[[SETUP_INDEX_PREFIX]]metrics-30days-retention"
}

PUT /_template/$[[SETUP_INDEX_PREFIX]]async_bulk_results-rollover
{
   "order": 100000,
  "index_patterns": [
    "$[[SETUP_INDEX_PREFIX]]async_bulk_results*"
  ],
      "settings": {
        "plugins.index_state_management.rollover_alias": "$[[SETUP_INDEX_PREFIX]]async_bulk_results",
        "codec": "best_compression",
        "number_of_shards": "1",
        "translog": {
          "durability": "async"
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

PUT $[[SETUP_INDEX_PREFIX]]async_bulk_results-00001
{
  "settings": {
    "refresh_interval": "5s"
  },
  "aliases":{
    "$[[SETUP_INDEX_PREFIX]]async_bulk_results":{
      "is_write_index":true
    }
  }
}
POST _plugins/_ism/add/$[[SETUP_INDEX_PREFIX]]async_bulk_results-00001
{
  "policy_id": "ilm_$[[SETUP_INDEX_PREFIX]]metrics-30days-retention"
}

PUT /_template/$[[SETUP_INDEX_PREFIX]]alert-history-rollover
{
    "order": 100000,
    "index_patterns" : [
      "$[[SETUP_INDEX_PREFIX]]alert-history*"
    ],
      "settings": {
        "plugins.index_state_management.rollover_alias": "$[[SETUP_INDEX_PREFIX]]alert-history",
        "codec": "best_compression",
        "number_of_shards": "1",
        "translog": {
          "durability": "async"
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


PUT $[[SETUP_INDEX_PREFIX]]alert-history-00001
{
  "settings": {
    "refresh_interval": "5s"
  },
  "aliases":{
    "$[[SETUP_INDEX_PREFIX]]alert-history":{
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
POST _plugins/_ism/add/$[[SETUP_INDEX_PREFIX]]alert-history-00001
{
  "policy_id": "ilm_$[[SETUP_INDEX_PREFIX]]metrics-30days-retention"
}

PUT /_template/$[[SETUP_INDEX_PREFIX]]activities-rollover
{
    "order": 100000,
    "index_patterns" : [
      "$[[SETUP_INDEX_PREFIX]]activities*"
    ],
      "settings": {
        "plugins.index_state_management.rollover_alias": "$[[SETUP_INDEX_PREFIX]]activities",
        "codec": "best_compression",
        "number_of_shards": "1",
        "translog": {
          "durability": "async"
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


PUT $[[SETUP_INDEX_PREFIX]]activities-00001
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
    "$[[SETUP_INDEX_PREFIX]]activities": {
      "is_write_index": true
    }
  }
}

POST _plugins/_ism/add/$[[SETUP_INDEX_PREFIX]]activities-00001
{
  "policy_id": "ilm_$[[SETUP_INDEX_PREFIX]]metrics-30days-retention"
}