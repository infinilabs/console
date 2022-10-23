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
"settings": {
  "index.lifecycle.rollover_alias":"$[[INDEX_PREFIX]]activities"
  , "refresh_interval": "5s"
},
"aliases":{
  "$[[INDEX_PREFIX]]activities":{
    "is_write_index":true
  }
}
}


