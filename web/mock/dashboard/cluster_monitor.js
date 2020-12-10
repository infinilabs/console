import fetch from 'node-fetch';

let data = JSON.parse(`{
    "cluster_stats" : {
      "indices" : {
        "completion" : {
          "size_in_bytes" : 0
        },
        "shards" : {
          "replication" : 0,
          "primaries" : 11,
          "total" : 11,
          "index" : {
            "replication" : {
              "avg" : 0,
              "min" : 0,
              "max" : 0
            },
            "shards" : {
              "min" : 1,
              "avg" : 1,
              "max" : 1
            },
            "primaries" : {
              "avg" : 1,
              "min" : 1,
              "max" : 1
            }
          }
        },
        "mappings" : {
          "field_types" : [
            {
              "name" : "alias",
              "count" : 3,
              "index_count" : 1
            },
            {
              "name" : "binary",
              "count" : 9,
              "index_count" : 1
            },
            {
              "name" : "boolean",
              "count" : 101,
              "index_count" : 6
            },
            {
              "name" : "byte",
              "count" : 1,
              "index_count" : 1
            },
            {
              "name" : "date",
              "count" : 136,
              "index_count" : 10
            },
            {
              "name" : "double",
              "count" : 103,
              "index_count" : 1
            },
            {
              "count" : 9,
              "name" : "flattened",
              "index_count" : 1
            },
            {
              "name" : "float",
              "count" : 142,
              "index_count" : 2
            },
            {
              "name" : "geo_point",
              "count" : 7,
              "index_count" : 1
            },
            {
              "name" : "half_float",
              "count" : 10,
              "index_count" : 2
            },
            {
              "name" : "integer",
              "count" : 71,
              "index_count" : 4
            },
            {
              "count" : 20,
              "name" : "ip",
              "index_count" : 1
            },
            {
              "name" : "keyword",
              "count" : 1312,
              "index_count" : 10
            },
            {
              "name" : "long",
              "count" : 2623,
              "index_count" : 8
            },
            {
              "name" : "nested",
              "count" : 14,
              "index_count" : 5
            },
            {
              "name" : "object",
              "count" : 2724,
              "index_count" : 10
            },
            {
              "count" : 121,
              "name" : "scaled_float",
              "index_count" : 1
            },
            {
              "name" : "text",
              "count" : 201,
              "index_count" : 9
            }
          ]
        },
        "query_cache" : {
          "miss_count" : 31874,
          "cache_size" : 0,
          "memory_size_in_bytes" : 0,
          "total_count" : 31874,
          "evictions" : 0,
          "hit_count" : 0,
          "cache_count" : 0
        },
        "docs" : {
          "deleted" : 692,
          "count" : 102865
        },
        "fielddata" : {
          "memory_size_in_bytes" : 1760,
          "evictions" : 0
        },
        "count" : 11,
        "store" : {
          "size_in_bytes" : 5.2982999E7,
          "reserved_in_bytes" : 0
        },
        "analysis" : {
          "built_in_filters" : [ ],
          "built_in_tokenizers" : [ ],
          "tokenizer_types" : [ ],
          "analyzer_types" : [ ],
          "filter_types" : [ ],
          "char_filter_types" : [ ],
          "built_in_char_filters" : [ ],
          "built_in_analyzers" : [ ]
        },
        "segments" : {
          "version_map_memory_in_bytes" : 0,
          "norms_memory_in_bytes" : 2496,
          "file_sizes" : { },
          "max_unsafe_auto_id_timestamp" : -1,
          "count" : 36,
          "fixed_bit_set_memory_in_bytes" : 14048,
          "term_vectors_memory_in_bytes" : 0,
          "points_memory_in_bytes" : 0,
          "index_writer_memory_in_bytes" : 0,
          "memory_in_bytes" : 332776,
          "terms_memory_in_bytes" : 109824,
          "doc_values_memory_in_bytes" : 202632,
          "stored_fields_memory_in_bytes" : 17824
        }
      },
      "nodes" : {
        "jvm" : {
          "max_uptime_in_millis" : 3.1722515E7,
          "mem" : {
            "heap_max_in_bytes" : 1.073741824E9,
            "heap_used_in_bytes" : 3.3389824E8
          },
          "versions" : [
            {
              "vm_version" : "15.0.1+9",
              "using_bundled_jdk" : true,
              "bundled_jdk" : true,
              "count" : 1,
              "vm_vendor" : "AdoptOpenJDK",
              "version" : "15.0.1",
              "vm_name" : "OpenJDK 64-Bit Server VM"
            }
          ],
          "threads" : 86
        },
        "process" : {
          "open_file_descriptors" : {
            "avg" : 402,
            "min" : 402,
            "max" : 402
          },
          "cpu" : {
            "percent" : 0
          }
        },
        "network_types" : {
          "http_types" : {
            "security4" : 1
          },
          "transport_types" : {
            "security4" : 1
          }
        },
        "os" : {
          "available_processors" : 8,
          "pretty_names" : [
            {
              "pretty_name" : "Mac OS X",
              "count" : 1
            }
          ],
          "names" : [
            {
              "name" : "Mac OS X",
              "count" : 1
            }
          ],
          "mem" : {
            "used_in_bytes" : 1.6490479616E10,
            "free_percent" : 4,
            "total_in_bytes" : 1.7179869184E10,
            "free_in_bytes" : 6.89389568E8,
            "used_percent" : 96
          },
          "allocated_processors" : 8
        },
        "versions" : [
          "7.10.0"
        ],
        "discovery_types" : {
          "zen" : 1
        },
        "plugins" : [ ],
        "count" : {
          "data_warm" : 1,
          "data" : 1,
          "data_content" : 1,
          "coordinating_only" : 0,
          "ingest" : 1,
          "master" : 1,
          "transform" : 1,
          "total" : 1,
          "remote_cluster_client" : 1,
          "data_cold" : 1,
          "voting_only" : 0,
          "ml" : 1,
          "data_hot" : 1
        },
        "packaging_types" : [
          {
            "flavor" : "default",
            "count" : 1,
            "type" : "tar"
          }
        ],
        "fs" : {
          "total_in_bytes" : 1.000240963584E12,
          "free_in_bytes" : 9.55349225472E11,
          "available_in_bytes" : 9.39232976896E11
        },
        "ingest" : {
          "number_of_pipelines" : 1,
          "processor_stats" : {
            "gsub" : {
              "current" : 0,
              "time_in_millis" : 0,
              "count" : 0,
              "failed" : 0
            },
            "script" : {
              "current" : 0,
              "time_in_millis" : 0,
              "count" : 0,
              "failed" : 0
            }
          }
        }
      },
      "cluster_uuid" : "JFpIbacZQamv9hkgQEDZ2Q",
      "timestamp" : 1.606981605839E12,
      "status" : "yellow"
    }
  }`);

  let nodesStats = JSON.parse(`[
    {
      "key" : "node-1",
      "doc_count" : 11,
      "metrics" : {
        "buckets" : [
          {
            "key_as_string" : "2020-12-04T09:40:00.000Z",
            "key" : 1607074800000,
            "doc_count" : 1,
            "heap_percent" : {
              "value" : 54.0
            },
            "heap_used" : {
              "value" : 5.84281136E8
            },
            "index_time" : {
              "value" : 5935.0
            },
            "cpu_used" : {
              "value" : 0.0
            },
            "search_query_total" : {
              "value" : 39044.0
            },
            "index_total" : {
              "value" : 5130.0
            },
            "search_query_time" : {
              "value" : 7314.0
            }
          },
          {
            "key_as_string" : "2020-12-04T09:40:30.000Z",
            "key" : 1607074830000,
            "doc_count" : 3,
            "heap_percent" : {
              "value" : 63.0
            },
            "heap_used" : {
              "value" : 6.776044E8
            },
            "index_time" : {
              "value" : 6037.0
            },
            "cpu_used" : {
              "value" : 1.0
            },
            "search_query_total" : {
              "value" : 39121.0
            },
            "index_total" : {
              "value" : 5285.0
            },
            "search_query_time" : {
              "value" : 7328.0
            },
            "ds" : {
              "value" : 77.0
            },
            "ds1" : {
              "value" : 14.0
            },
            "ds3" : {
              "value" : 155.0
            },
            "ds4" : {
              "value" : 102.0
            }
          },
          {
            "key_as_string" : "2020-12-04T09:41:00.000Z",
            "key" : 1607074860000,
            "doc_count" : 3,
            "heap_percent" : {
              "value" : 64.0
            },
            "heap_used" : {
              "value" : 6.92956392E8
            },
            "index_time" : {
              "value" : 6181.0
            },
            "cpu_used" : {
              "value" : 1.0
            },
            "search_query_total" : {
              "value" : 39231.0
            },
            "index_total" : {
              "value" : 5426.0
            },
            "search_query_time" : {
              "value" : 7343.0
            },
            "ds" : {
              "value" : 110.0
            },
            "ds1" : {
              "value" : 15.0
            },
            "ds3" : {
              "value" : 141.0
            },
            "ds4" : {
              "value" : 144.0
            }
          },
          {
            "key_as_string" : "2020-12-04T09:41:30.000Z",
            "key" : 1607074890000,
            "doc_count" : 3,
            "heap_percent" : {
              "value" : 64.0
            },
            "heap_used" : {
              "value" : 6.9177856E8
            },
            "index_time" : {
              "value" : 6304.0
            },
            "cpu_used" : {
              "value" : 1.0
            },
            "search_query_total" : {
              "value" : 39339.0
            },
            "index_total" : {
              "value" : 5582.0
            },
            "search_query_time" : {
              "value" : 7358.0
            },
            "ds" : {
              "value" : 108.0
            },
            "ds1" : {
              "value" : 15.0
            },
            "ds3" : {
              "value" : 156.0
            },
            "ds4" : {
              "value" : 123.0
            }
          },
          {
            "key_as_string" : "2020-12-04T09:42:00.000Z",
            "key" : 1607074920000,
            "doc_count" : 1,
            "heap_percent" : {
              "value" : 16.0
            },
            "heap_used" : {
              "value" : 1.81371952E8
            },
            "index_time" : {
              "value" : 6323.0
            },
            "cpu_used" : {
              "value" : 1.0
            },
            "search_query_total" : {
              "value" : 39375.0
            },
            "index_total" : {
              "value" : 5631.0
            },
            "search_query_time" : {
              "value" : 7361.0
            },
            "ds" : {
              "value" : 36.0
            },
            "ds1" : {
              "value" : 3.0
            },
            "ds3" : {
              "value" : 49.0
            },
            "ds4" : {
              "value" : 19.0
            }
          }
        ]
      }
    }
  ]`);

const apiUrls = {
    CLUSTER_OVERVIEW: {
      path:'/.monitoring-es-*/_search',
      body: `{
        "_source": [ "cluster_stats"], 
        "size": 1, 
        "sort": [
          {
            "timestamp": {
              "order": "desc"
            }
          }
        ], 
        "query": {
          "bool": {
            "must": [
              {
                "match": {
                  "type": "cluster_stats"
                } 
              }
            ], 
            "filter": [
              {
                "range": {
                  "timestamp": {
                    "gte": "now-1h",
                    "lte": "now"
                  }
                }
              }
            ]
          }
        }
      }`
    },
    "GET_ES_NODE_STATS":{
        path: '/.monitoring-es-*/_search',
        body: `{
            "size": 0,
            "query": {
              "bool": {
                "must": [
                  {
                    "match": {
                      "type": "node_stats"
                    }
                  }
                ],
                "filter": [
                  {
                    "range": {
                      "timestamp": {
                        "gte": "now-1h",
                        "lte": "now"
                      }
                    }
                  }
                ]
              }
            },
            "aggs": {
              "nodes": {
                "terms": {
                  "field": "source_node.name",
                  "size": 10
                },
                "aggs": {
                  "metrics": {
                    "date_histogram": {
                      "field": "timestamp",
                      "fixed_interval": "30s"
                    },
                    "aggs": {
                      "cpu_used": {
                        "max": {
                          "field": "node_stats.process.cpu.percent"
                        }
                      },
                      "heap_used": {
                        "max": {
                          "field": "node_stats.jvm.mem.heap_used_in_bytes"
                        }
                      },
                      "heap_percent": {
                        "max": {
                          "field": "node_stats.jvm.mem.heap_used_percent"
                        }
                      },
                      "search_query_total": {
                        "max": {
                          "field": "node_stats.indices.search.query_total"
                        }
                      },
                      "search_query_time": {
                        "max": {
                          "field": "node_stats.indices.search.query_time_in_millis"
                        }
                      },
                      "ds": {
                        "derivative": {
                          "buckets_path": "search_query_total"
                        }
                      },
                      "ds1": {
                        "derivative": {
                          "buckets_path": "search_query_time"
                        }
                      },
                      "index_total": {
                        "max": {
                          "field": "node_stats.indices.indexing.index_total"
                        }
                      },
                      "index_time": {
                        "max": {
                          "field": "node_stats.indices.indexing.index_time_in_millis"
                        }
                      },
                      "ds3": {
                        "derivative": {
                          "buckets_path": "index_total"
                        }
                      },
                      "ds4": {
                        "derivative": {
                          "buckets_path": "index_time"
                        }
                      },
                      "read_threads_queue":{
                        "max": {
                          "field": "node_stats.thread_pool.get.queue"
                        }
                      },
                      "write_threads_queue":{
                        "max": {
                          "field": "node_stats.thread_pool.write.queue"
                        }
                      }
                    }
                  }
                }
              }
            }
          }`
    }   
};
  
  const gatewayUrl = 'http://localhost:8001';

function getClusterOverview(){
  return fetch(gatewayUrl+apiUrls.CLUSTER_OVERVIEW.path, {
    method: 'POST',
    body: apiUrls.CLUSTER_OVERVIEW.body,
    headers:{
        'Content-Type': 'application/json'
    }
  }).then(esRes=>{
      return esRes.json();
  }).then(rel=>{
      if(rel.hits.hits.length>0){
          var rdata = rel.hits.hits[0]._source;
      }else{
          rdata = data;
      }
      let cluster_stats = rdata.cluster_stats;
      let result = {
          elasticsearch:{
              cluster_stats:{
                  status: cluster_stats.status,
                  indices: {
                      count: cluster_stats.indices.count,
                      docs: cluster_stats.indices.docs,
                      shards: cluster_stats.indices.shards,
                      store: cluster_stats.indices.store,
                  },
                  nodes: {
                      count:{
                          total: cluster_stats.nodes.count.total,
                      },
                      fs: cluster_stats.nodes.fs,
                      jvm: {
                          max_uptime_in_millis: cluster_stats.nodes.jvm.max_uptime_in_millis,
                          mem: cluster_stats.nodes.jvm.mem,
                      }
                  }
              }
          }
      };
      return result;
  });
}

function getNodesStats(){
  return fetch(gatewayUrl+apiUrls.GET_ES_NODE_STATS.path, {
    method: 'POST',
    body: apiUrls.GET_ES_NODE_STATS.body,
    headers:{
        'Content-Type': 'application/json'
    }
  }).then(esRes=>{
      return esRes.json();
  }).then(rel=>{
    //console.log(rel);
    if(rel.aggregations.nodes.buckets.length>0){
        var rdata = rel.aggregations.nodes.buckets;
        //console.log(rdata);
    }else{
        rdata = nodesStats;
    }
    return rdata;
  });
}

  export default {
      'GET /dashboard/cluster/overview': function(req, res){
        //console.log(typeof fetch);
        getClusterOverview().then((result)=>{
            //console.log(result);
            res.send(result);
        }).catch(err=>{
            console.log(err);
        });
      },
      'GET /dashboard/cluster/nodes_stats': function(req, res) {
        Promise.all([ getNodesStats()]).then((values) => {
          //console.log(values);
          res.send({
          //  elasticsearch: values[0].elasticsearch,
            nodes_stats: values[0],
          });
        }).catch(err=>{
          console.log(err);
        });
        // getNodesStats().then((rdata)=>{
        //   res.send({
        //     nodes_stats: rdata
        //   });
        // }).catch(err=>{
        //     console.log(err);
        // })
      },
  };