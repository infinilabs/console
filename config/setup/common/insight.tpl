# widget
POST $[[SETUP_INDEX_PREFIX]]widget/$[[SETUP_DOC_TYPE]]/cji1sc28go5i051pl1i0
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
POST $[[SETUP_INDEX_PREFIX]]widget/$[[SETUP_DOC_TYPE]]/cji1ttq8go5i051pl1t2
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
POST $[[SETUP_INDEX_PREFIX]]widget/$[[SETUP_DOC_TYPE]]/cji1ttq8go5i051pl1t1
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
POST $[[SETUP_INDEX_PREFIX]]widget/$[[SETUP_DOC_TYPE]]/cji1ttq8go5i051pl1t0
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
PUT $[[SETUP_INDEX_PREFIX]]widget/$[[SETUP_DOC_TYPE]]/cji1sc28go5i051pl1i1
{
  "id": "cji1sc28go5i051pl1i1",
  "created": "2023-09-20T10:32:16.8356774+08:00",
  "updated": "2023-08-20T10:32:16.8356774+08:00",
  "title": "Source Cluster Query QPS",
  "config": {
    "bucket_size": "auto",
    "format": {
      "pattern": "0.00",
      "type": "number"
    },
    "series": [
      {
        "metric": {
          "formula": "a/{{.bucket_size_in_second}}",
          "name": "Total Query",
          "items": [
            {
              "field": "payload.elasticsearch.index_stats.total.search.query_total",
              "name": "a",
              "statistic": "derivative"
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
          "time_field": "timestamp"
        },
        "type": "line"
      }
    ]
  }
}


PUT $[[SETUP_INDEX_PREFIX]]widget/$[[SETUP_DOC_TYPE]]/cji1sc28go5i051pl1i2
{
  "id": "cji1sc28go5i051pl1i2",
  "created": "2023-09-20T10:32:16.8356774+08:00",
  "updated": "2023-08-20T10:32:16.8356774+08:00",
  "title": "Source Cluster Search Latency",
  "config": {
    "bucket_size": "auto",
    "format": {
      "pattern": "0.00",
      "type": "number"
    },
    "series": [
      {
        "metric": {
          "formula": "a/b",
          "name": "Query Latency",
          "items": [
            {
              "field": "payload.elasticsearch.index_stats.total.search.query_time_in_millis",
              "name": "a",
              "statistic": "derivative"
            },
            {
              "field": "payload.elasticsearch.index_stats.total.search.query_total",
              "name": "b",
              "statistic": "derivative"
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
          "time_field": "timestamp"
        },
        "type": "line"
      },
      {
        "metric": {
          "formula": "a/b",
          "items": [
            {
              "field": "payload.elasticsearch.index_stats.total.search.scroll_time_in_millis",
              "name": "a",
              "statistic": "derivative"
            },
            {
              "field": "payload.elasticsearch.index_stats.total.search.scroll_total",
              "name": "b",
              "statistic": "derivative"
            }
          ],
          "name": "Scroll Latency",
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
          "time_field": "timestamp"
        },
        "type": "line"
      }
    ]
  }
}

PUT $[[SETUP_INDEX_PREFIX]]widget/$[[SETUP_DOC_TYPE]]/cji1sc28go5i051pl1i3
{
  "id": "cji1sc28go5i051pl1i3",
  "created": "2023-09-20T10:32:16.8356774+08:00",
  "updated": "2023-08-20T10:32:16.8356774+08:00",
  "title": "Target Cluster Index QPS",
  "config": {
    "bucket_size": "auto",
    "format": {
      "pattern": "0.00",
      "type": "number"
    },
    "series": [
      {
        "metric": {
          "formula": "a/{{.bucket_size_in_second}}",
          "name": "Total Indexing",
          "items": [
            {
              "field": "payload.elasticsearch.index_stats.total.indexing.index_total",
              "name": "a",
              "statistic": "derivative"
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
          "time_field": "timestamp"
        },
        "type": "line"
      },
      {
        "metric": {
          "formula": "a/{{.bucket_size_in_second}}",
          "name": "Primary Indexing",
          "items": [
            {
              "field": "payload.elasticsearch.index_stats.primaries.indexing.index_total",
              "name": "a",
              "statistic": "derivative"
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
          "time_field": "timestamp"
        },
        "type": "line"
      }
    ]
  }
}

PUT $[[SETUP_INDEX_PREFIX]]widget/$[[SETUP_DOC_TYPE]]/cji1sc28go5i051pl1i4
{
  "id": "cji1sc28go5i051pl1i4",
  "created": "2023-09-20T10:32:16.8356774+08:00",
  "updated": "2023-08-20T10:32:16.8356774+08:00",
  "title": "Target Cluster Index Latency",
  "config": {
    "bucket_size": "auto",
    "format": {
      "pattern": "0.00",
      "type": "number"
    },
    "series": [
      {
        "metric": {
          "formula": "a/b",
          "name": "Indexing Latency",
          "items": [
            {
              "field": "payload.elasticsearch.index_stats.primaries.indexing.index_time_in_millis",
              "name": "a",
              "statistic": "derivative"
            },
            {
              "field": "payload.elasticsearch.index_stats.primaries.indexing.index_total",
              "name": "b",
              "statistic": "derivative"
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
          "time_field": "timestamp"
        },
        "type": "line"
      }
    ]
  }
}

#The `id` value is consistent with the `_id` value
POST $[[SETUP_INDEX_PREFIX]]layout/$[[SETUP_DOC_TYPE]]/cg2qqh28go5jqa6vvk70
 {
     "id": "cg2qqh28go5jqa6vvk70",
     "created": "2023-03-06T17:07:16.1879266+08:00",
     "updated": "2023-03-07T08:33:16.1732009+08:00",
     "name": "Gateway Metrics",
     "description": "",
     "creator": {
       "name": "$[[SETUP_USERNAME]]",
       "id": "$[[SETUP_USER_ID]]"
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
               "cluster_id": "$[[SETUP_RESOURCE_ID]]",
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
POST $[[SETUP_INDEX_PREFIX]]layout/$[[SETUP_DOC_TYPE]]/cjo2taju2gvbh7bbsa1g
{
    "id": "cjo2taju2gvbh7bbsa1g",
    "created": "2023-06-01T14:09:46.107630717+08:00",
    "updated": "2023-08-31T15:14:55.235272773+08:00",
    "name": "🚦 Platform Overview",
    "description": "",
    "creator": {
        "name": "$[[SETUP_USERNAME]]",
        "id": "$[[SETUP_USER_ID]]"
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

POST $[[SETUP_INDEX_PREFIX]]layout/$[[SETUP_DOC_TYPE]]/cicmg153q95ich72lo3g
{
    "id": "cicmg153q95ich72lo3g",
    "created": "2023-06-26T10:27:16.69035743Z",
    "updated": "2023-08-31T15:57:17.40068358+08:00",
    "name": "🧭 Metrics&Logging Overview ",
    "description": "",
    "creator": {
        "name": "$[[SETUP_USERNAME]]",
        "id": "$[[SETUP_USER_ID]]"
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
POST $[[SETUP_INDEX_PREFIX]]layout/$[[SETUP_DOC_TYPE]]/cicmgqt3q95ich72lppg
{
    "id": "cicmgqt3q95ich72lppg",
    "created": "2023-06-26T10:28:59.145415161Z",
    "updated": "2023-08-31T16:07:52.267467029+08:00",
    "name": "🌈 INFINI Gateway",
    "description": "",
    "creator": {
        "name": "$[[SETUP_USERNAME]]",
        "id": "$[[SETUP_USER_ID]]"
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
POST $[[SETUP_INDEX_PREFIX]]layout/$[[SETUP_DOC_TYPE]]/cicmh5t3q95ich72lre0
{
    "id": "cicmh5t3q95ich72lre0",
    "created": "2023-06-26T10:29:43.918937055Z",
    "updated": "2023-08-31T16:12:34.571279181+08:00",
    "name": "🎯 Cluster Overview",
    "description": "",
    "creator": {
        "name": "$[[SETUP_USERNAME]]",
        "id": "$[[SETUP_USER_ID]]"
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
POST $[[SETUP_INDEX_PREFIX]]layout/$[[SETUP_DOC_TYPE]]/cicmhbt3q95ich72lrvg
{
    "id": "cicmhbt3q95ich72lrvg",
    "created": "2023-06-26T10:30:07.498236965Z",
    "updated": "2023-08-31T16:24:17.071274052+08:00",
    "name": "⛺️ Request Analysis",
    "description": "",
    "creator": {
        "name": "$[[SETUP_USERNAME]]",
        "id": "$[[SETUP_USER_ID]]"
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