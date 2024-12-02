// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import fetch from 'node-fetch';
import moment from 'moment';
import {calculateTimeseriesInterval} from './calculate_timeseries_interval';
import { promises } from 'dns';
//import {formatTimestampToDuration} from './format_timestamp_to_duration';
const minIntervalSeconds = 10;

import {clusterData, clusterList} from './data/cluster';
  
  function getOverviewBody(params){
    let body =  {
      _source: [ "cluster_stats"], 
      size: 1, 
      sort: [
        {
          timestamp: {
            order: "desc"
          }
        }
      ], 
      query: {
        bool: {
          must: [
            {
              match: {
                type: "cluster_stats"
              } 
            }
          ], 
          filter: [
            {
              range: {
                timestamp: {
                  "gte": params.timeRange.min,
                  lte: params.timeRange.max
                }
              }
            }
          ]
        }
      }
    };
    return JSON.stringify(body);
  }

function getNodesStatsBody(params){
  let min = moment(params.timeRange.min).valueOf();
  let max = moment(params.timeRange.max).valueOf();
  const bucketSizeInSeconds = calculateTimeseriesInterval(min, max, minIntervalSeconds);
  console.log(bucketSizeInSeconds);
  let body = {
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
                "gte": params.timeRange.min,
                "lte": params.timeRange.max
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
              "fixed_interval": bucketSizeInSeconds + 's'
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
              "search_qps":{
                "derivative": {
                  "buckets_path": "search_query_total",
                  "gap_policy": "skip",
                  "unit": "1s"
                }
              },
              "index_qps":{
                "derivative": {
                  "buckets_path": "index_total",
                  "gap_policy": "skip",
                  "unit": "1s"
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
  };
  return JSON.stringify(body);
}

const apiUrls = {
    CLUSTER_OVERVIEW: {
      path:'/.monitoring-es-*/_search',
    },
    "GET_ES_NODE_STATS":{
        path: '/.monitoring-es-*/_search',
    }   
};
  
  const gatewayUrl = 'http://localhost:9200';

function getClusterOverview(params){
  return fetch(gatewayUrl+apiUrls.CLUSTER_OVERVIEW.path, {
    method: 'POST',
    body: getOverviewBody(params),
    headers:{
        'Content-Type': 'application/json'
    }
  }).then(esRes=>{
      return esRes.json();
  }).then(rel=>{
    //console.log(rel);
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
      return Promise.resolve(result);
  });
}

function getNodesStats(params){
  return fetch(gatewayUrl+apiUrls.GET_ES_NODE_STATS.path, {
    method: 'POST',
    body: getNodesStatsBody(params),
    headers:{
        'Content-Type': 'application/json'
    }
  }).then(esRes=>{
    return esRes.json();
     // return esRes.json();
  }).then(rel=>{
    //console.log(rel);
    if(rel.aggregations.nodes.buckets.length>0){
        var rdata = rel.aggregations.nodes.buckets;
        //console.log(rdata);
    }else{
        rdata = nodesStats;
    }
    return Promise.resolve(rdata);
  });
}

  export default {
      'POST /dashboard/cluster/overview': function(req, res){
        //console.log(1, req.body);
        // let params = req.body;
        // !params.timeRange && (params.timeRange={
        //   min: 'now-1h',
        //   max: 'now'
        // });
        // Promise.all([getClusterOverview(params),getNodesStats(params)]).then(function(values){
        //   let robj = values[0];
        //   robj = Object.assign(robj, {nodes_stats: values[1]});
        //   res.send(robj);
        // }).catch(function(err){
        //   console.log(err);
        // });
        res.send(clusterData);
      },
      'GET /dashboard/cluster/nodes_stats': function(req, res) {
        let min = moment(1607839878669 - 2592000000).valueOf();
        const max = moment(1607839878669).valueOf();
        const bucketSizeInSeconds = calculateTimeseriesInterval(min, max, minIntervalSeconds);
        const now = moment();
        const timestamp = moment(now).add(bucketSizeInSeconds, 'seconds'); // clone the `now` object

        //console.log(bucketSizeInSeconds); //, formatTimestampToDuration(timestamp, 'until', now));
  
        Promise.all([ getNodesStats()]).then((values) => {
          //console.log(values);
          res.send({
          //  elasticsearch: values[0].elasticsearch,
            nodes_stats: values[0],
          });
        }).catch(err=>{
          console.log(err);
        });
      },
      'GET /dashboard/cluster/list': function(req, res){
        res.send(clusterList);
      }
  };